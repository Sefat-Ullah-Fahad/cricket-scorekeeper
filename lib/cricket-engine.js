/**
 * Production Cricket Scoring Engine
 * Authoritative, immutable state transitions for professional cricket scoring
 */

// Helper: Deep clone state
export function cloneState(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Format balls to cricket overs string (e.g., 23 balls -> "3.5" overs)
export function formatOvers(legalBalls) {
  const overs = Math.floor(legalBalls / 6);
  const balls = legalBalls % 6;
  return `${overs}.${balls}`;
}

// Calculate Run Rate
export function calculateRunRate(runs, legalBalls) {
  if (!legalBalls || legalBalls === 0) return '0.00';
  const overs = legalBalls / 6;
  return (runs / overs).toFixed(2);
}

// Calculate Required Run Rate
export function calculateRequiredRunRate(runsNeeded, ballsRemaining) {
  if (runsNeeded <= 0) return '0.00';
  if (ballsRemaining <= 0) return '99.99';
  const oversRemaining = ballsRemaining / 6;
  return (runsNeeded / oversRemaining).toFixed(2);
}

// Initialize a new innings
export function createInningsState(battingTeam, bowlingTeam, totalOvers, strikerName, nonStrikerName, bowlerName) {
  return {
    battingTeam,
    bowlingTeam,
    totalOvers: Number(totalOvers) || 20,
    score: 0,
    wickets: 0,
    legalBalls: 0,
    striker: strikerName,
    nonStriker: nonStrikerName,
    currentBowler: bowlerName,
    needsNewBowler: false,
    batters: [
      {
        name: strikerName,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        strikeRate: '0.00',
        status: 'batting', // 'batting', 'not_out', 'out'
        dismissal: '',
      },
      {
        name: nonStrikerName,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        strikeRate: '0.00',
        status: 'batting',
        dismissal: '',
      }
    ],
    bowlers: [
      {
        name: bowlerName,
        overs: '0.0',
        legalBalls: 0,
        maidens: 0,
        runsConceded: 0,
        wickets: 0,
        economy: '0.00',
        wides: 0,
        noBalls: 0,
        currentOverRuns: 0,
      }
    ],
    extras: {
      wides: 0,
      noBalls: 0,
      byes: 0,
      legByes: 0,
      penalty: 0,
      total: 0,
    },
    fallOfWickets: [],
    ballHistory: [],
    recentBalls: [],
    currentOverBalls: [], // Display recent balls for the current over
    isCompleted: false,
  };
}

/**
 * Core scoring transition function
 * Action types:
 * - { type: 'RUNS', runs: 0 | 1 | 2 | 3 | 4 | 6 }
 * - { type: 'EXTRA', extraType: 'WD' | 'NB' | 'BYE' | 'LB', additionalRuns: 0 }
 * - { type: 'WICKET', wicketType, outBatter, newBatter, runsCompleted }
 * - { type: 'CHANGE_BOWLER', bowlerName }
 * - { type: 'SWAP_STRIKE' }
 */
export function processScoringAction(match, action) {
  if (match.status === 'COMPLETED') {
    throw new Error('Match is already completed. No further scoring allowed.');
  }

  if (match.status === 'PAUSED' || match.status === 'INTERVAL') {
    throw new Error(`Match is currently on break (${match.currentInterval?.note || 'Paused'}). Resume match to continue scoring.`);
  }

  // Save current state into history for deep UNDO capability
  const historySnapshot = {
    currentInnings: match.currentInnings,
    status: match.status,
    result: match.result,
    target: match.target,
    innings1: cloneState(match.innings1),
    innings2: match.innings2 ? cloneState(match.innings2) : null,
    timestamp: new Date().toISOString()
  };

  const nextMatch = cloneState(match);
  if (!nextMatch.stateHistory) nextMatch.stateHistory = [];
  nextMatch.stateHistory.push(historySnapshot);
  // Cap history to 50 snapshots
  if (nextMatch.stateHistory.length > 50) {
    nextMatch.stateHistory.shift();
  }

  const inn = nextMatch.currentInnings === 1 ? nextMatch.innings1 : nextMatch.innings2;
  if (!inn) throw new Error('Active innings not found');

  // Handle bowler selection if needed
  if (action.type === 'CHANGE_BOWLER') {
    if (!action.bowlerName || action.bowlerName.trim() === '') {
      throw new Error('Bowler name is required');
    }
    const bName = action.bowlerName.trim();
    inn.currentBowler = bName;
    inn.needsNewBowler = false;

    // Check if bowler already exists in list, else add
    let bRecord = inn.bowlers.find(b => b.name === bName);
    if (!bRecord) {
      inn.bowlers.push({
        name: bName,
        overs: '0.0',
        legalBalls: 0,
        maidens: 0,
        runsConceded: 0,
        wickets: 0,
        economy: '0.00',
        wides: 0,
        noBalls: 0,
        currentOverRuns: 0,
      });
    } else {
      bRecord.currentOverRuns = 0;
    }
    inn.currentOverBalls = [];
    return evaluateMatchStatus(nextMatch);
  }

  // Handle manual strike swap
  if (action.type === 'SWAP_STRIKE') {
    const temp = inn.striker;
    inn.striker = inn.nonStriker;
    inn.nonStriker = temp;
    return evaluateMatchStatus(nextMatch);
  }

  // Ensure bowler record exists
  let bowler = inn.bowlers.find(b => b.name === inn.currentBowler);
  if (!bowler) {
    bowler = {
      name: inn.currentBowler,
      overs: '0.0',
      legalBalls: 0,
      maidens: 0,
      runsConceded: 0,
      wickets: 0,
      economy: '0.00',
      wides: 0,
      noBalls: 0,
      currentOverRuns: 0,
    };
    inn.bowlers.push(bowler);
  }

  // Ensure striker batter record exists
  let striker = inn.batters.find(b => b.name === inn.striker);
  if (!striker) {
    striker = {
      name: inn.striker,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      strikeRate: '0.00',
      status: 'batting',
      dismissal: '',
    };
    inn.batters.push(striker);
  }

  let nonStriker = inn.batters.find(b => b.name === inn.nonStriker);

  let runsScored = 0;
  let isLegalBall = false;
  let ballBadge = '';
  let ballDescription = '';
  let shouldSwapStrike = false;

  // 1. STANDARD RUNS (0, 1, 2, 3, 4, 6)
  if (action.type === 'RUNS' || action.type === 'RUN') {
    const runs = Number(action.runs);
    if (![0, 1, 2, 3, 4, 6].includes(runs)) {
      throw new Error(`Invalid runs action: ${runs}`);
    }

    runsScored = runs;
    isLegalBall = true;
    ballBadge = `${runs}`;
    ballDescription = runs === 0 ? 'Dot ball' : `${runs} run${runs > 1 ? 's' : ''}`;

    // Update Batter
    striker.runs += runs;
    striker.balls += 1;
    if (runs === 4) striker.fours += 1;
    if (runs === 6) striker.sixes += 1;

    // Update Bowler
    bowler.runsConceded += runs;
    bowler.legalBalls += 1;
    bowler.currentOverRuns += runs;

    // Strike swap rule
    if (runs === 1 || runs === 3) {
      shouldSwapStrike = true;
    }
  }

  // 2. EXTRAS (WD, NB, BYE, LB)
  else if (action.type === 'EXTRA' || ['WD', 'NB', 'BYE', 'LB'].includes(action.type)) {
    const extraType = action.extraType || action.type; // 'WD', 'NB', 'BYE', 'LB'
    const additional = Number(action.additionalRuns || 0);

    if (extraType === 'WD') {
      // Wide: +1 plus any extras run. Does NOT count as legal ball.
      const totalRuns = 1 + additional;
      runsScored = totalRuns;
      isLegalBall = false;
      inn.extras.wides += totalRuns;
      inn.extras.total += totalRuns;
      bowler.runsConceded += totalRuns;
      bowler.wides += 1;
      bowler.currentOverRuns += totalRuns;
      ballBadge = additional > 0 ? `Wd+${additional}` : 'Wd';
      ballDescription = `Wide delivery (${totalRuns} runs)`;

      // Strike swap if odd additional runs were run by batters
      if (additional % 2 === 1) {
        shouldSwapStrike = true;
      }
    } else if (extraType === 'NB') {
      // No-ball: +1 penalty plus bat runs. Does NOT count as legal ball.
      const totalRuns = 1 + additional;
      runsScored = totalRuns;
      isLegalBall = false;
      inn.extras.noBalls += 1;
      inn.extras.total += 1;
      bowler.runsConceded += totalRuns;
      bowler.noBalls += 1;
      bowler.currentOverRuns += totalRuns;

      // Runs off the bat
      if (additional > 0) {
        striker.runs += additional;
        if (additional === 4) striker.fours += 1;
        if (additional === 6) striker.sixes += 1;
      }
      striker.balls += 1;

      ballBadge = additional > 0 ? `Nb+${additional}` : 'Nb';
      ballDescription = `No-ball (${totalRuns} runs)`;

      if (additional % 2 === 1) {
        shouldSwapStrike = true;
      }
    } else if (extraType === 'BYE') {
      // Bye: Legal delivery. Runs not charged to bowler. Batter ball faced +1.
      runsScored = additional || 1;
      isLegalBall = true;
      inn.extras.byes += runsScored;
      inn.extras.total += runsScored;
      bowler.legalBalls += 1;
      striker.balls += 1;

      ballBadge = `B${runsScored}`;
      ballDescription = `${runsScored} Bye run${runsScored > 1 ? 's' : ''}`;

      if (runsScored % 2 === 1) {
        shouldSwapStrike = true;
      }
    } else if (extraType === 'LB') {
      // Leg-bye: Legal delivery. Runs not charged to bowler. Batter ball faced +1.
      runsScored = additional || 1;
      isLegalBall = true;
      inn.extras.legByes += runsScored;
      inn.extras.total += runsScored;
      bowler.legalBalls += 1;
      striker.balls += 1;

      ballBadge = `Lb${runsScored}`;
      ballDescription = `${runsScored} Leg bye run${runsScored > 1 ? 's' : ''}`;

      if (runsScored % 2 === 1) {
        shouldSwapStrike = true;
      }
    } else {
      throw new Error(`Unknown extra type: ${extraType}`);
    }
  }

  // 3. WICKET (Bowled, Caught, LBW, Run Out, Stumped, Hit Wicket, Retired, Other)
  else if (action.type === 'WICKET') {
    const { outBatter, newBatter, runsCompleted = 0 } = action;
    const rawWicketType = action.wicketType || 'Bowled';
    const normalizedWicketMap = {
      'bowled': 'Bowled',
      'caught': 'Caught',
      'lbw': 'LBW',
      'run out': 'Run Out',
      'run_out': 'Run Out',
      'stumped': 'Stumped',
      'hit wicket': 'Hit Wicket',
      'hit_wicket': 'Hit Wicket',
      'retired': 'Retired',
      'retired out': 'Retired',
      'other': 'Other',
    };
    const wicketType = normalizedWicketMap[rawWicketType.toLowerCase().trim()] || rawWicketType;

    if (!wicketType) throw new Error('Wicket type is required');
    if (!newBatter && inn.wickets < 9) {
      throw new Error('New batter name is required');
    }

    const runsDone = Number(runsCompleted || 0);
    runsScored = runsDone;
    isLegalBall = true;

    // Determine which batter was out
    const dismissedBatterName = outBatter || inn.striker;
    const dismissedBatter = inn.batters.find(b => b.name === dismissedBatterName) || striker;

    dismissedBatter.status = 'out';
    dismissedBatter.balls += 1;
    if (runsDone > 0 && dismissedBatterName === inn.striker) {
      dismissedBatter.runs += runsDone;
    }

    // Dismissal string
    let dismissalText = wicketType;
    if (wicketType === 'Bowled') dismissalText = `b ${bowler.name}`;
    else if (wicketType === 'Caught') dismissalText = `c Fielder b ${bowler.name}`;
    else if (wicketType === 'LBW') dismissalText = `lbw b ${bowler.name}`;
    else if (wicketType === 'Stumped') dismissalText = `st Wicketkeeper b ${bowler.name}`;
    else if (wicketType === 'Run Out') dismissalText = `run out`;
    else if (wicketType === 'Hit Wicket') dismissalText = `hit wicket b ${bowler.name}`;
    else if (wicketType === 'Retired') dismissalText = `retired`;
    dismissedBatter.dismissal = dismissalText;

    // Bowler stats
    bowler.legalBalls += 1;
    bowler.runsConceded += runsDone;
    bowler.currentOverRuns += runsDone;
    // Bowler gets wicket credit EXCEPT for Run Out and Retired
    if (wicketType !== 'Run Out' && wicketType !== 'Retired') {
      bowler.wickets += 1;
    }

    // Update team score & wickets
    inn.wickets += 1;

    // Fall of Wicket record
    inn.fallOfWickets.push({
      wicket: inn.wickets,
      score: inn.score + runsDone,
      overs: formatOvers(inn.legalBalls + (isLegalBall ? 1 : 0)),
      player: dismissedBatterName
    });

    ballBadge = 'W';
    ballDescription = `WICKET! ${dismissedBatterName} (${dismissalText})`;

    // Replace dismissed batter with new batter
    if (newBatter && inn.wickets < 10) {
      const existingNew = inn.batters.find(b => b.name === newBatter.trim());
      if (!existingNew) {
        inn.batters.push({
          name: newBatter.trim(),
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          strikeRate: '0.00',
          status: 'batting',
          dismissal: '',
        });
      } else {
        existingNew.status = 'batting';
      }

      if (dismissedBatterName === inn.striker) {
        inn.striker = newBatter.trim();
      } else {
        inn.nonStriker = newBatter.trim();
      }
    }

    // If runs were completed before run out
    if (runsDone % 2 === 1) {
      shouldSwapStrike = true;
    }
  } else {
    throw new Error(`Unsupported scoring action: ${action.type}`);
  }

  // Update total innings score
  inn.score += runsScored;

  // Increment legal deliveries
  if (isLegalBall) {
    inn.legalBalls += 1;
  }

  // Update Batter strike rates
  inn.batters.forEach(b => {
    b.strikeRate = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.00';
  });

  // Update Bowler overs & economy
  bowler.overs = formatOvers(bowler.legalBalls);
  bowler.economy = bowler.legalBalls > 0 ? (bowler.runsConceded / (bowler.legalBalls / 6)).toFixed(2) : '0.00';

  // Add ball to history
  const ballRecord = {
    id: `${inn.legalBalls}_${Date.now()}`,
    overNumber: Math.floor((inn.legalBalls - (isLegalBall ? 1 : 0)) / 6) + 1,
    ballNumberInOver: isLegalBall ? ((inn.legalBalls - 1) % 6) + 1 : (inn.legalBalls % 6),
    runs: runsScored,
    isLegal: isLegalBall,
    badge: ballBadge,
    label: ballBadge,
    description: ballDescription,
    action: action.type === 'RUNS' ? 'RUN' : action.type,
    striker: inn.striker,
    bowler: bowler.name,
    teamScore: inn.score,
    teamWickets: inn.wickets,
    timestamp: new Date().toISOString(),
  };
  inn.ballHistory.unshift(ballRecord);
  inn.currentOverBalls.push(ballBadge);
  inn.recentBalls = inn.ballHistory.slice(0, 25);

  // Check strike swap from odd runs
  if (shouldSwapStrike) {
    const temp = inn.striker;
    inn.striker = inn.nonStriker;
    inn.nonStriker = temp;
  }

  // Check Over Completion (6 legal balls bowled in the over)
  if (isLegalBall && inn.legalBalls % 6 === 0) {
    // Check maiden over for bowler
    if (bowler.currentOverRuns === 0) {
      bowler.maidens += 1;
    }
    bowler.currentOverRuns = 0;

    // Swap striker and non-striker at end of over
    const temp = inn.striker;
    inn.striker = inn.nonStriker;
    inn.nonStriker = temp;

    // Flag that a new bowler needs to be chosen
    inn.needsNewBowler = true;
    inn.currentOverBalls = [];
  }

  // Evaluate whether innings or match ended
  return evaluateMatchStatus(nextMatch);
}

/**
 * Checks rules for innings completion, targets reached, and match victory
 */
export function evaluateMatchStatus(match) {
  const inn1 = match.innings1;
  const inn2 = match.innings2;
  const maxOvers = match.overs || 20;
  const maxLegalBalls = maxOvers * 6;

  // Innings 1 check
  if (match.currentInnings === 1) {
    const isAllOut = inn1.wickets >= 10;
    const isOversFinished = inn1.legalBalls >= maxLegalBalls;

    if (isAllOut || isOversFinished) {
      inn1.isCompleted = true;
      match.target = inn1.score + 1;
      match.status = 'INNINGS_BREAK';
      console.log(`[ENGINE] Innings 1 finished! Target: ${match.target}`);
    } else if (match.status !== 'PAUSED' && match.status !== 'INTERVAL') {
      match.status = 'LIVE';
    }
    return match;
  }

  // Innings 2 check
  if (match.currentInnings === 2 && inn2) {
    const target = match.target || (inn1.score + 1);
    const runsNeeded = target - inn2.score;
    const isAllOut = inn2.wickets >= 10;
    const isOversFinished = inn2.legalBalls >= maxLegalBalls;

    // Case A: Chasing team reached the target -> Chasing team wins!
    if (inn2.score >= target) {
      inn2.isCompleted = true;
      match.status = 'COMPLETED';
      const wicketsLeft = 10 - inn2.wickets;
      match.result = `${inn2.battingTeam} won by ${wicketsLeft} wicket${wicketsLeft > 1 ? 's' : ''}`;
      return match;
    }

    // Case B: Chasing team all out or overs complete
    if (isAllOut || isOversFinished) {
      inn2.isCompleted = true;
      match.status = 'COMPLETED';

      if (inn2.score === target - 1) {
        match.result = 'Match Tied';
      } else if (inn2.score < target - 1) {
        const runsWonBy = (target - 1) - inn2.score;
        match.result = `${inn2.bowlingTeam} won by ${runsWonBy} run${runsWonBy > 1 ? 's' : ''}`;
      }
      return match;
    }

    if (match.status !== 'PAUSED' && match.status !== 'INTERVAL') {
      match.status = 'LIVE';
    }
    return match;
  }

  return match;
}

/**
 * Start the 2nd Innings
 */
export function startSecondInnings(match, strikerName, nonStrikerName, bowlerName) {
  if (match.currentInnings !== 1 || match.status !== 'INNINGS_BREAK') {
    throw new Error('Match is not at innings break');
  }

  const inn2 = createInningsState(
    match.innings1.bowlingTeam, // Batting in 2nd innings
    match.innings1.battingTeam, // Bowling in 2nd innings
    match.overs,
    strikerName,
    nonStrikerName,
    bowlerName
  );

  match.currentInnings = 2;
  match.innings2 = inn2;
  match.status = 'LIVE';
  return match;
}

/**
 * Restores the previous match state from deep snapshot history
 */
export function undoLastScoringAction(match) {
  if (!match.stateHistory || match.stateHistory.length === 0) {
    throw new Error('No scoring actions available to undo');
  }

  const previousSnapshot = match.stateHistory.pop();

  match.currentInnings = previousSnapshot.currentInnings;
  match.status = previousSnapshot.status;
  match.result = previousSnapshot.result;
  match.target = previousSnapshot.target;
  match.innings1 = previousSnapshot.innings1;
  match.innings2 = previousSnapshot.innings2;

  console.log('[ENGINE] Reverted match state to snapshot successfully');
  return match;
}

/**
 * Pause match for an interval (Lunch, Tea, Stumps, Rain, etc.)
 */
export function setMatchInterval(match, intervalType, customNote) {
  if (match.status === 'COMPLETED') {
    throw new Error('Cannot pause a completed match');
  }
  const nextMatch = cloneState(match);
  const now = new Date().toISOString();
  const inn = nextMatch.currentInnings === 1 ? nextMatch.innings1 : nextMatch.innings2;
  const scoreSummary = inn ? `${inn.score}/${inn.wickets} (${formatOvers(inn.legalBalls)} ov)` : '';

  const labelMap = {
    LUNCH: 'Lunch Break',
    TEA: 'Tea Break',
    STUMPS: 'Stumps',
    RAIN: 'Rain Delay',
    DRINKS: 'Drinks Break',
    INNINGS_BREAK: 'Innings Break',
    CUSTOM: 'Match Paused',
  };
  const note = customNote || labelMap[intervalType] || 'Match Paused';

  const intervalRecord = {
    type: intervalType,
    note,
    startedAt: now,
    endedAt: null,
    scoreAtInterval: scoreSummary,
  };

  if (!nextMatch.intervals) nextMatch.intervals = [];
  nextMatch.intervals.push(intervalRecord);
  nextMatch.currentInterval = intervalRecord;
  nextMatch.status = 'PAUSED';

  return nextMatch;
}

/**
 * Resume a paused match
 */
export function resumeMatch(match) {
  if (match.status === 'COMPLETED') {
    throw new Error('Cannot resume a completed match');
  }
  const nextMatch = cloneState(match);
  const now = new Date().toISOString();
  if (nextMatch.currentInterval) {
    nextMatch.currentInterval.endedAt = now;
    if (nextMatch.intervals && nextMatch.intervals.length > 0) {
      nextMatch.intervals[nextMatch.intervals.length - 1].endedAt = now;
    }
    nextMatch.currentInterval = null;
  }
  nextMatch.status = 'LIVE';
  return nextMatch;
}

/**
 * Conclude match manually (e.g. End Match / Forfeit)
 */
export function concludeMatch(match, customResult) {
  const nextMatch = cloneState(match);
  nextMatch.status = 'COMPLETED';
  nextMatch.result = customResult || 'Match concluded by scorer';
  if (nextMatch.currentInterval) {
    nextMatch.currentInterval.endedAt = new Date().toISOString();
    nextMatch.currentInterval = null;
  }
  return nextMatch;
}
