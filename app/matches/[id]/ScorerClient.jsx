'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '../../../components/LanguageThemeContext';
import { useToast } from '../../../components/Toast';
import { MdSportsCricket } from 'react-icons/md';
import {
  FiArrowLeft,
  FiRepeat,
  FiShare2,
  FiRotateCw,
  FiUserCheck,
  FiClock,
  FiCheckCircle,
  FiCopy,
  FiCheck,
  FiX,
  FiPlay,
  FiList,
  FiActivity,
  FiExternalLink,
  FiPauseCircle,
  FiPlayCircle,
  FiAlertTriangle,
  FiChevronDown
} from 'react-icons/fi';

export default function ScorerClient({ initialMatch, user }) {
  const [match, setMatch] = useState(initialMatch);
  const [loadingAction, setLoadingAction] = useState(false);
  const [activeTab, setActiveTab] = useState('PAD'); // 'PAD', 'SCORECARD', 'TIMELINE'

  // Modals
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [wicketType, setWicketType] = useState('Bowled');
  const [outBatter, setOutBatter] = useState('');
  const [newBatterSelect, setNewBatterSelect] = useState('');
  const [customNewBatter, setCustomNewBatter] = useState('');
  const [runOutRuns, setRunOutRuns] = useState(0);

  const [showBowlerModal, setShowBowlerModal] = useState(false);
  const [newBowlerSelect, setNewBowlerSelect] = useState('');
  const [customNewBowler, setCustomNewBowler] = useState('');

  const [showSecondInningsModal, setShowSecondInningsModal] = useState(false);
  const [secondInnStriker, setSecondInnStriker] = useState('');
  const [secondInnNonStriker, setSecondInnNonStriker] = useState('');
  const [secondInnBowler, setSecondInnBowler] = useState('');
  const [customSecondStriker, setCustomSecondStriker] = useState('');
  const [customSecondNonStriker, setCustomSecondNonStriker] = useState('');
  const [customSecondBowler, setCustomSecondBowler] = useState('');

  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Extras modal
  const [pendingExtraType, setPendingExtraType] = useState(null); // 'WD', 'NB', 'BYE', 'LB'
  const [extraRunsInput, setExtraRunsInput] = useState(0);

  // Interval / Pause modal
  const [showIntervalModal, setShowIntervalModal] = useState(false);
  const [intervalType, setIntervalType] = useState('LUNCH');
  const [customIntervalNote, setCustomIntervalNote] = useState('');

  // Conclude match modal
  const [showConcludeModal, setShowConcludeModal] = useState(false);
  const [concludeResult, setConcludeResult] = useState('');

  const { t, language } = useApp();
  const toast = useToast();

  const activeInningsNumber = match.currentInnings;
  const currentInnings = activeInningsNumber === 1 ? match.innings1 : match.innings2;

  // Determine batting and bowling squads
  const isTeamABatting = currentInnings?.battingTeam === match.teamA;
  const battingSquad = useMemo(() => {
    const raw = isTeamABatting ? match.teamAPlayers : match.teamBPlayers;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    // Fallback: collect known batters
    const known = currentInnings?.batters?.map(b => b.name) || [];
    return known.length > 0 ? known : ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6', 'Player 7', 'Player 8', 'Player 9', 'Player 10', 'Player 11'];
  }, [isTeamABatting, match.teamAPlayers, match.teamBPlayers, currentInnings?.batters]);

  const bowlingSquad = useMemo(() => {
    const raw = isTeamABatting ? match.teamBPlayers : match.teamAPlayers;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    // Fallback: collect known bowlers
    const known = currentInnings?.bowlers?.map(b => b.name) || [];
    return known.length > 0 ? known : ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6', 'Player 7', 'Player 8', 'Player 9', 'Player 10', 'Player 11'];
  }, [isTeamABatting, match.teamAPlayers, match.teamBPlayers, currentInnings?.bowlers]);

  // Eligible batters for next wicket
  const dismissedBatterNames = useMemo(() => {
    return (currentInnings?.batters || [])
      .filter(b => b.status === 'out')
      .map(b => b.name);
  }, [currentInnings?.batters]);

  const currentlyBattingNames = useMemo(() => {
    return [currentInnings?.striker, currentInnings?.nonStriker].filter(Boolean);
  }, [currentInnings?.striker, currentInnings?.nonStriker]);

  const eligibleNewBatters = useMemo(() => {
    return battingSquad.filter(
      p => !dismissedBatterNames.includes(p) && !currentlyBattingNames.includes(p)
    );
  }, [battingSquad, dismissedBatterNames, currentlyBattingNames]);

  // Eligible bowlers for next over (excluding current bowler who just bowled)
  const eligibleBowlers = useMemo(() => {
    return bowlingSquad.filter(p => p !== currentInnings?.currentBowler);
  }, [bowlingSquad, currentInnings?.currentBowler]);

  // 2nd innings squads
  const secondInnBattingSquad = useMemo(() => {
    return match.innings1?.bowlingTeam === match.teamA ? (match.teamAPlayers || []) : (match.teamBPlayers || []);
  }, [match.innings1?.bowlingTeam, match.teamA, match.teamAPlayers, match.teamBPlayers]);

  const secondInnBowlingSquad = useMemo(() => {
    return match.innings1?.battingTeam === match.teamA ? (match.teamAPlayers || []) : (match.teamBPlayers || []);
  }, [match.innings1?.battingTeam, match.teamA, match.teamAPlayers, match.teamBPlayers]);

  // Format overs (e.g. 15.4)
  const legalBalls = currentInnings?.legalBalls || 0;
  const currentOversFormatted = `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;

  // Current run rate (CRR)
  const runs = currentInnings?.score || 0;
  const crr = useMemo(() => {
    return legalBalls > 0 ? ((runs / legalBalls) * 6).toFixed(2) : '0.00';
  }, [runs, legalBalls]);

  // Required Run Rate (RRR)
  const { rrr, ballsRemaining, runsNeeded } = useMemo(() => {
    if (match.currentInnings === 2 && match.target) {
      const totalMatchBalls = match.overs * 6;
      const bRemaining = Math.max(0, totalMatchBalls - legalBalls);
      const rNeeded = Math.max(0, match.target - runs);
      const reqRate = bRemaining > 0 ? ((rNeeded / bRemaining) * 6).toFixed(2) : '0.00';
      return { rrr: reqRate, ballsRemaining: bRemaining, runsNeeded: rNeeded };
    }
    return { rrr: null, ballsRemaining: null, runsNeeded: null };
  }, [match.currentInnings, match.target, match.overs, legalBalls, runs]);

  // Active striker and non-striker objects
  const strikerStat = useMemo(() => {
    return currentInnings?.batters?.find(b => b.name === currentInnings.striker) || {
      name: currentInnings?.striker || 'Striker',
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      strikeRate: '0.00',
    };
  }, [currentInnings?.batters, currentInnings?.striker]);

  const nonStrikerStat = useMemo(() => {
    return currentInnings?.batters?.find(b => b.name === currentInnings.nonStriker) || {
      name: currentInnings?.nonStriker || 'Non-Striker',
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      strikeRate: '0.00',
    };
  }, [currentInnings?.batters, currentInnings?.nonStriker]);

  // Active bowler
  const bowlerStat = useMemo(() => {
    return currentInnings?.bowlers?.find(b => b.name === currentInnings.currentBowler) || {
      name: currentInnings?.currentBowler || 'Bowler',
      legalBalls: 0,
      maidens: 0,
      runsConceded: 0,
      wickets: 0,
      economy: '0.00',
    };
  }, [currentInnings?.bowlers, currentInnings?.currentBowler]);

  const bowlerOvers = `${Math.floor((bowlerStat.legalBalls || 0) / 6)}.${(bowlerStat.legalBalls || 0) % 6}`;
  const bowlerEconomy = bowlerStat.economy || (bowlerStat.legalBalls > 0 ? ((bowlerStat.runsConceded / bowlerStat.legalBalls) * 6).toFixed(2) : '0.00');

  // Trigger bowler change modal if needsNewBowler
  useEffect(() => {
    if (match.status === 'LIVE' && currentInnings?.needsNewBowler) {
      setShowBowlerModal(true);
    }
  }, [currentInnings?.needsNewBowler, match.status]);

  // Generic scoring API caller
  const executeScoringAction = useCallback(async (action) => {
    if (loadingAction || match.status === 'COMPLETED' || match.status === 'INNINGS_BREAK' || match.status === 'PAUSED') return;

    setLoadingAction(true);
    try {
      const res = await fetch(`/api/matches/${match.id}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Scoring action failed');
      } else {
        setMatch(data.match);
        if (data.match.status === 'INNINGS_BREAK' && match.status !== 'INNINGS_BREAK') {
          toast.success(t('inningsBreak'));
        } else if (data.match.status === 'COMPLETED' && match.status !== 'COMPLETED') {
          toast.success(data.match.result || t('completed'));
        }
      }
    } catch (err) {
      console.error('[SCORING ERROR]', err);
      toast.error('Network error during scoring');
    } finally {
      setLoadingAction(false);
    }
  }, [loadingAction, match.status, match.id, t, toast]);

  // Execute undo action
  const handleUndo = useCallback(async () => {
    if (loadingAction) return;
    if (!match.stateHistory || match.stateHistory.length === 0) {
      toast.error(language === 'bn' ? 'পূর্ববর্তী কোন বল পাওয়া যায়নি।' : 'No previous actions to undo.');
      return;
    }

    setLoadingAction(true);
    try {
      const res = await fetch(`/api/matches/${match.id}/undo`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Undo failed');
      } else {
        setMatch(data.match);
        toast.success(t('undoSuccess'));
      }
    } catch (err) {
      console.error('[UNDO ERROR]', err);
      toast.error('Network error during undo');
    } finally {
      setLoadingAction(false);
    }
  }, [loadingAction, match.stateHistory, match.id, language, t, toast]);

  // Swap strike
  const handleSwapStrike = useCallback(() => {
    executeScoringAction({ type: 'SWAP_STRIKE' });
  }, [executeScoringAction]);

  // Submit Wicket dismissal
  const handleWicketSubmit = async (e) => {
    e.preventDefault();
    const finalNewBatter = newBatterSelect === '__CUSTOM__' ? customNewBatter.trim() : newBatterSelect.trim();

    if (!finalNewBatter && currentInnings?.wickets < 9) {
      toast.error(language === 'bn' ? 'নতুন ব্যাটারের নাম নির্বাচন করুন।' : 'Please select or enter new batter name.');
      return;
    }

    await executeScoringAction({
      type: 'WICKET',
      wicketType,
      outBatter: outBatter || currentInnings.striker,
      newBatter: finalNewBatter,
      runsCompleted: Number(runOutRuns) || 0,
    });

    setShowWicketModal(false);
    setNewBatterSelect('');
    setCustomNewBatter('');
    setRunOutRuns(0);
  };

  // Submit Bowler Change
  const handleBowlerChangeSubmit = async (e) => {
    e.preventDefault();
    const finalBowler = newBowlerSelect === '__CUSTOM__' ? customNewBowler.trim() : newBowlerSelect.trim();

    if (!finalBowler) {
      toast.error(language === 'bn' ? 'বোলারের নাম নির্বাচন করুন।' : 'Please select or enter bowler name.');
      return;
    }

    await executeScoringAction({
      type: 'CHANGE_BOWLER',
      bowlerName: finalBowler,
    });

    setShowBowlerModal(false);
    setNewBowlerSelect('');
    setCustomNewBowler('');
  };

  // Start 2nd Innings
  const handleStartSecondInnings = async (e) => {
    e.preventDefault();
    const finalStriker = secondInnStriker === '__CUSTOM__' ? customSecondStriker.trim() : secondInnStriker.trim();
    const finalNonStriker = secondInnNonStriker === '__CUSTOM__' ? customSecondNonStriker.trim() : secondInnNonStriker.trim();
    const finalBowler = secondInnBowler === '__CUSTOM__' ? customSecondBowler.trim() : secondInnBowler.trim();

    if (!finalStriker || !finalNonStriker || !finalBowler) {
      toast.error(language === 'bn' ? 'সকল খেলোয়াড়ের নাম আবশ্যক।' : 'All player names are required.');
      return;
    }

    if (finalStriker.toLowerCase() === finalNonStriker.toLowerCase()) {
      toast.error(language === 'bn' ? 'উদ্বোধনী দুই ব্যাটার ভিন্ন হতে হবে।' : 'Opening batters must be different.');
      return;
    }

    setLoadingAction(true);
    try {
      const res = await fetch(`/api/matches/${match.id}/innings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          striker: finalStriker,
          nonStriker: finalNonStriker,
          bowler: finalBowler,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to start 2nd innings');
      } else {
        setMatch(data.match);
        setShowSecondInningsModal(false);
        toast.success(language === 'bn' ? 'দ্বিতীয় ইনিংস শুরু হয়েছে!' : 'Second innings started!');
      }
    } catch (err) {
      toast.error('Network error starting 2nd innings');
    } finally {
      setLoadingAction(false);
    }
  };

  // Submit Extra with runs
  const handleExtraSubmit = async (e) => {
    e.preventDefault();
    if (!pendingExtraType) return;

    await executeScoringAction({
      type: 'EXTRA',
      extraType: pendingExtraType,
      additionalRuns: Number(extraRunsInput) || 0,
    });

    setPendingExtraType(null);
    setExtraRunsInput(0);
  };

  // Pause Match / Set Interval
  const handleSetInterval = async (e) => {
    e?.preventDefault();
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/matches/${match.id}/interval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PAUSE',
          intervalType,
          note: customIntervalNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to pause match');
      } else {
        setMatch(data.match);
        setShowIntervalModal(false);
        setCustomIntervalNote('');
        toast.success(language === 'bn' ? 'ম্যাচ বিরতিতে রয়েছে।' : 'Match paused for interval.');
      }
    } catch (err) {
      toast.error('Network error pausing match');
    } finally {
      setLoadingAction(false);
    }
  };

  // Resume Match
  const handleResumeMatch = async () => {
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/matches/${match.id}/interval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESUME' }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to resume match');
      } else {
        setMatch(data.match);
        toast.success(language === 'bn' ? 'ম্যাচ পুনরায় শুরু হয়েছে!' : 'Match resumed!');
      }
    } catch (err) {
      toast.error('Network error resuming match');
    } finally {
      setLoadingAction(false);
    }
  };

  // Conclude Match manually
  const handleConcludeMatch = async (e) => {
    e?.preventDefault();
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/matches/${match.id}/interval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CONCLUDE',
          result: concludeResult.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to conclude match');
      } else {
        setMatch(data.match);
        setShowConcludeModal(false);
        toast.success(language === 'bn' ? 'ম্যাচ সমাপ্ত ঘোষণা করা হয়েছে।' : 'Match concluded.');
      }
    } catch (err) {
      toast.error('Network error concluding match');
    } finally {
      setLoadingAction(false);
    }
  };

  // Live Share toggle
  const handleToggleShare = async () => {
    const nextState = !match.shareEnabled;
    try {
      const res = await fetch(`/api/matches/${match.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareEnabled: nextState }),
      });
      if (res.ok) {
        setMatch(prev => ({ ...prev, shareEnabled: nextState }));
        toast.success(nextState ? 'Live sharing enabled.' : 'Live sharing disabled.');
      }
    } catch (err) {
      toast.error('Failed to toggle live sharing');
    }
  };

  const getPublicShareUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/live/${match.shareToken}`;
    }
    return `/live/${match.shareToken}`;
  };

  const handleCopyLink = () => {
    const url = getPublicShareUrl();
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(language === 'bn' ? 'লিংক কপি করা হয়েছে!' : 'Share link copied!');
    });
  };

  // Keyboard Shortcuts for quick scoring
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        showWicketModal ||
        showBowlerModal ||
        showSecondInningsModal ||
        pendingExtraType ||
        showShareModal ||
        showIntervalModal ||
        showConcludeModal ||
        match.status !== 'LIVE' ||
        loadingAction
      ) {
        return;
      }

      // If user is focused on an input element, do not trigger scoring shortcuts
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.key === '0') executeScoringAction({ type: 'RUNS', runs: 0 });
      else if (e.key === '1') executeScoringAction({ type: 'RUNS', runs: 1 });
      else if (e.key === '2') executeScoringAction({ type: 'RUNS', runs: 2 });
      else if (e.key === '3') executeScoringAction({ type: 'RUNS', runs: 3 });
      else if (e.key === '4') executeScoringAction({ type: 'RUNS', runs: 4 });
      else if (e.key === '6') executeScoringAction({ type: 'RUNS', runs: 6 });
      else if (e.key.toLowerCase() === 'w') {
        setShowWicketModal(true);
      } else if (e.key.toLowerCase() === 'u') {
        handleUndo();
      } else if (e.key.toLowerCase() === 's') {
        handleSwapStrike();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    showWicketModal,
    showBowlerModal,
    showSecondInningsModal,
    pendingExtraType,
    showShareModal,
    showIntervalModal,
    showConcludeModal,
    match.status,
    loadingAction,
    executeScoringAction,
    handleUndo,
    handleSwapStrike,
  ]);

  const isMatchPaused = match.status === 'PAUSED' || match.status === 'INTERVAL';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
          <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
            {match.teamA} vs {match.teamB}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Pause / Interval Controls */}
          {match.status === 'LIVE' && (
            <button
              onClick={() => setShowIntervalModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-pointer"
            >
              <FiPauseCircle className="w-3.5 h-3.5" />
              <span>Interval</span>
            </button>
          )}

          {isMatchPaused && (
            <button
              onClick={handleResumeMatch}
              disabled={loadingAction}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors cursor-pointer"
            >
              <FiPlayCircle className="w-3.5 h-3.5" />
              <span>Resume Match</span>
            </button>
          )}

          {match.status !== 'COMPLETED' && (
            <button
              onClick={() => setShowConcludeModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-zinc-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              title="End / Conclude Match"
            >
              <span>End Match</span>
            </button>
          )}

          {/* Share Button */}
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            <FiShare2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{t('share')}</span>
            {match.shareEnabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </button>
        </div>
      </div>

      {/* PAUSED BANNER (Lunch, Tea, Stumps, Rain, etc.) */}
      {isMatchPaused && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center font-bold shrink-0">
              <FiPauseCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-extrabold">
                {match.currentInterval?.note || 'Match Paused'}
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-300">
                Score at interval: {match.currentInterval?.scoreAtInterval || `${currentInnings?.score}/${currentInnings?.wickets}`}.
                {match.currentInterval?.startedAt && ` Started at ${new Date(match.currentInterval.startedAt).toLocaleTimeString()}.`}
              </div>
            </div>
          </div>
          <button
            onClick={handleResumeMatch}
            disabled={loadingAction}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <FiPlayCircle className="w-4 h-4" />
            <span>Resume Play</span>
          </button>
        </div>
      )}

      {/* Main Scorecard Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950/80 via-zinc-900 to-zinc-950 border border-emerald-500/30 text-white shadow-2xl relative overflow-hidden">
        {/* Teams and Status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-extrabold tracking-wide uppercase text-zinc-200">
              {match.teamA} vs {match.teamB}
            </span>
            <span className="text-zinc-500">•</span>
            <span className="text-xs text-zinc-400 font-medium">
              {activeInningsNumber === 1 ? '1st Innings' : '2nd Innings'}
            </span>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
              match.status === 'COMPLETED'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : match.status === 'INNINGS_BREAK'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : isMatchPaused
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {match.status === 'LIVE' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>}
            {isMatchPaused
              ? match.currentInterval?.note || 'PAUSED'
              : match.status === 'INNINGS_BREAK'
              ? t('inningsBreak')
              : match.status === 'COMPLETED'
              ? t('completed')
              : t('live')}
          </span>
        </div>

        {/* Big Score Display */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 py-2">
          <div>
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
              {currentInnings?.battingTeam} Batting
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl sm:text-6xl font-black font-mono text-white tracking-tight">
                {runs}/{currentInnings?.wickets || 0}
              </span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-zinc-400">
                ({currentOversFormatted} / {match.overs} ov)
              </span>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between text-xs text-zinc-300 font-medium gap-1">
            <div>CRR: <span className="font-mono font-bold text-white text-sm">{crr}</span></div>
            {match.currentInnings === 2 && match.target && (
              <>
                <div className="text-amber-400 font-bold">
                  {t('target')}: <span className="font-mono">{match.target}</span>
                </div>
                <div className="text-emerald-400 font-semibold text-[11px]">
                  Need {runsNeeded} runs in {ballsRemaining} balls (RRR {rrr})
                </div>
              </>
            )}
          </div>
        </div>

        {/* Result Banner */}
        {match.status === 'COMPLETED' && (
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-center text-sm font-extrabold text-emerald-300">
            {match.result || 'Match Completed'}
          </div>
        )}

        {/* Innings Break Banner */}
        {match.status === 'INNINGS_BREAK' && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <span className="font-bold text-amber-400 text-sm block">
                Innings Break: {match.innings1?.battingTeam} scored {match.innings1?.score}/{match.innings1?.wickets} ({match.overs} ov)
              </span>
              <span className="text-xs text-zinc-300">
                Target for {match.innings1?.bowlingTeam}: <strong className="text-amber-400">{match.target} runs</strong> in {match.overs} overs.
              </span>
            </div>
            <button
              onClick={() => setShowSecondInningsModal(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-transform active:scale-95 cursor-pointer shrink-0"
            >
              {t('startSecondInnings')}
            </button>
          </div>
        )}
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('PAD')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'PAD'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <FiPlay className="w-4 h-4" />
          <span>Scoring Pad</span>
        </button>

        <button
          onClick={() => setActiveTab('SCORECARD')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'SCORECARD'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <FiList className="w-4 h-4" />
          <span>{t('viewScorecard')}</span>
        </button>

        <button
          onClick={() => setActiveTab('TIMELINE')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'TIMELINE'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <FiActivity className="w-4 h-4" />
          <span>{language === 'bn' ? 'বল বিবরণ' : 'Activity Log'}</span>
        </button>
      </div>

      {/* TAB 1: SCORING PAD */}
      {activeTab === 'PAD' && (
        <div className="space-y-6">
          {/* Active Players Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Batters */}
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider pb-1.5 border-b border-zinc-100 dark:border-zinc-800">
                <span>{t('batter')}</span>
                <div className="flex gap-4">
                  <span>R (B)</span>
                  <span>4s</span>
                  <span>6s</span>
                  <span>SR</span>
                </div>
              </div>

              {/* Striker */}
              <div className="flex items-center justify-between text-sm p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 font-medium">
                <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 truncate max-w-[140px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  * {strikerStat.name}
                </span>
                <div className="flex gap-4 font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{strikerStat.runs} ({strikerStat.balls})</span>
                  <span>{strikerStat.fours}</span>
                  <span>{strikerStat.sixes}</span>
                  <span>{strikerStat.strikeRate || '0.00'}</span>
                </div>
              </div>

              {/* Non-Striker */}
              <div className="flex items-center justify-between text-sm p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 font-medium">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[140px]">
                  • {nonStrikerStat.name}
                </span>
                <div className="flex gap-4 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                  <span>{nonStrikerStat.runs} ({nonStrikerStat.balls})</span>
                  <span>{nonStrikerStat.fours}</span>
                  <span>{nonStrikerStat.sixes}</span>
                  <span>{nonStrikerStat.strikeRate || '0.00'}</span>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleSwapStrike}
                  disabled={loadingAction || match.status !== 'LIVE'}
                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer disabled:opacity-50"
                >
                  <FiRepeat className="w-3 h-3" />
                  <span>{t('swapStrike')}</span>
                </button>
              </div>
            </div>

            {/* Bowler */}
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider pb-1.5 border-b border-zinc-100 dark:border-zinc-800">
                <span>{t('bowler')}</span>
                <div className="flex gap-4">
                  <span>O</span>
                  <span>M</span>
                  <span>R</span>
                  <span>W</span>
                  <span>Econ</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 font-medium">
                <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">
                  {bowlerStat.name}
                </span>
                <div className="flex gap-4 font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <span>{bowlerOvers}</span>
                  <span>{bowlerStat.maidens}</span>
                  <span>{bowlerStat.runsConceded}</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">{bowlerStat.wickets}</span>
                  <span>{bowlerEconomy}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                {/* Recent balls badge strip */}
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-[220px]">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Over:</span>
                  {(currentInnings?.currentOverBalls || []).map((badge, idx) => (
                    <span
                      key={idx}
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono shadow-xs shrink-0 ${
                        badge === 'W'
                          ? 'bg-rose-600 text-white'
                          : badge === '4'
                          ? 'bg-sky-600 text-white'
                          : badge === '6'
                          ? 'bg-purple-600 text-white'
                          : badge.startsWith('Wd') || badge.startsWith('Nb')
                          ? 'bg-amber-500 text-zinc-950'
                          : badge !== '0'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {badge}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => setShowBowlerModal(true)}
                  disabled={loadingAction || match.status !== 'LIVE'}
                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer disabled:opacity-50"
                >
                  <FiUserCheck className="w-3 h-3" />
                  <span>{t('changeBowler')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Pad Container */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                {language === 'bn' ? 'স্কোরবোর্ড ইনপুট' : 'Scoring Controls'}
              </h3>
              <div className="flex items-center gap-2">
                {loadingAction && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
                    <span>Saving…</span>
                  </span>
                )}
                <button
                  onClick={handleUndo}
                  disabled={loadingAction || !match.stateHistory || match.stateHistory.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <FiRotateCw className="w-3.5 h-3.5" />
                  <span>{t('undo')}</span>
                </button>
              </div>
            </div>

            {/* Run Buttons Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {[0, 1, 2, 3, 4, 6].map((r) => (
                <button
                  key={r}
                  disabled={loadingAction || match.status !== 'LIVE'}
                  onClick={() => executeScoringAction({ type: 'RUNS', runs: r })}
                  className={`py-4 rounded-2xl font-mono font-black text-2xl border transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                    r === 0
                      ? 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      : r === 4
                      ? 'bg-sky-600 hover:bg-sky-700 text-white border-sky-600 shadow-md shadow-sky-600/20'
                      : r === 6
                      ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600 shadow-md shadow-purple-600/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                  }`}
                >
                  {r === 0 ? '0 • Dot' : r === 4 ? '4 FOUR' : r === 6 ? '6 SIX' : `+${r}`}
                </button>
              ))}
            </div>

            {/* Extras & Wicket Controls */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              <button
                disabled={loadingAction || match.status !== 'LIVE'}
                onClick={() => setPendingExtraType('WD')}
                className="py-3 px-2 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs hover:bg-amber-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Wide (+1)
              </button>

              <button
                disabled={loadingAction || match.status !== 'LIVE'}
                onClick={() => setPendingExtraType('NB')}
                className="py-3 px-2 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs hover:bg-amber-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                No Ball (+1)
              </button>

              <button
                disabled={loadingAction || match.status !== 'LIVE'}
                onClick={() => setPendingExtraType('BYE')}
                className="py-3 px-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Bye
              </button>

              <button
                disabled={loadingAction || match.status !== 'LIVE'}
                onClick={() => setPendingExtraType('LB')}
                className="py-3 px-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Leg Bye
              </button>

              <button
                disabled={loadingAction || match.status !== 'LIVE'}
                onClick={() => setShowWicketModal(true)}
                className="col-span-2 sm:col-span-1 py-3 px-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/30 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                OUT / WICKET
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCORECARD VIEW */}
      {activeTab === 'SCORECARD' && (
        <div className="space-y-6">
          {[
            { num: 1, state: match.innings1, title: `${match.innings1?.battingTeam} Innings (1st Innings)` },
            { num: 2, state: match.innings2, title: `${match.innings2?.battingTeam || match.teamB} Innings (2nd Innings)` },
          ].map((innObj) => {
            const inn = innObj.state;
            if (!inn) return null;

            return (
              <div key={innObj.num} className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">{innObj.title}</h3>
                  <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {inn.score}/{inn.wickets} ({Math.floor(inn.legalBalls / 6)}.{inn.legalBalls % 6} ov)
                  </div>
                </div>

                {/* Batting Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 uppercase font-semibold">
                        <th className="py-2">Batter</th>
                        <th className="py-2">Dismissal</th>
                        <th className="py-2 text-right">R</th>
                        <th className="py-2 text-right">B</th>
                        <th className="py-2 text-right">4s</th>
                        <th className="py-2 text-right">6s</th>
                        <th className="py-2 text-right">SR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium text-zinc-800 dark:text-zinc-200">
                      {inn.batters?.map((b, i) => (
                        <tr key={i}>
                          <td className="py-2 font-bold">{b.name}</td>
                          <td className="py-2 text-zinc-400 text-[11px]">{b.dismissal || (b.status === 'batting' ? 'batting' : 'not out')}</td>
                          <td className="py-2 text-right font-mono font-bold">{b.runs}</td>
                          <td className="py-2 text-right font-mono">{b.balls}</td>
                          <td className="py-2 text-right font-mono">{b.fours}</td>
                          <td className="py-2 text-right font-mono">{b.sixes}</td>
                          <td className="py-2 text-right font-mono text-zinc-500">
                            {b.strikeRate || (b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.00')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Extras */}
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-xs flex flex-wrap items-center justify-between gap-2 text-zinc-600 dark:text-zinc-300">
                  <div>
                    Extras: <span className="font-bold">{inn.extras?.total || 0}</span> (wd {inn.extras?.wides || 0}, nb {inn.extras?.noBalls || 0}, b {inn.extras?.byes || 0}, lb {inn.extras?.legByes || 0})
                  </div>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                    Total: {inn.score}/{inn.wickets}
                  </div>
                </div>

                {/* Bowling Table */}
                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 uppercase font-semibold">
                        <th className="py-2">Bowler</th>
                        <th className="py-2 text-right">O</th>
                        <th className="py-2 text-right">M</th>
                        <th className="py-2 text-right">R</th>
                        <th className="py-2 text-right">W</th>
                        <th className="py-2 text-right">Econ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium text-zinc-800 dark:text-zinc-200">
                      {inn.bowlers?.map((bw, i) => (
                        <tr key={i}>
                          <td className="py-2 font-bold">{bw.name}</td>
                          <td className="py-2 text-right font-mono">{Math.floor((bw.legalBalls || 0) / 6)}.{(bw.legalBalls || 0) % 6}</td>
                          <td className="py-2 text-right font-mono">{bw.maidens}</td>
                          <td className="py-2 text-right font-mono">{bw.runsConceded}</td>
                          <td className="py-2 text-right font-mono font-bold text-rose-600 dark:text-rose-400">{bw.wickets}</td>
                          <td className="py-2 text-right font-mono text-zinc-500">
                            {bw.economy || (bw.legalBalls > 0 ? ((bw.runsConceded / bw.legalBalls) * 6).toFixed(2) : '0.00')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Fall of Wickets */}
                {inn.fallOfWickets && inn.fallOfWickets.length > 0 && (
                  <div className="pt-2">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      {t('fallOfWickets')}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {inn.fallOfWickets.map((fow, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-mono">
                          {fow.score}/{fow.wicket} ({fow.player}, {fow.overs} ov)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: BALL BY BALL TIMELINE */}
      {activeTab === 'TIMELINE' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md space-y-4">
          <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
            {language === 'bn' ? 'সাম্প্রতিক বল সমূহের লগ' : 'Ball-by-Ball Activity Stream'}
          </h3>

          {(!currentInnings?.ballHistory || currentInnings.ballHistory.length === 0) ? (
            <div className="p-8 text-center text-xs text-zinc-400">
              No deliveries recorded yet.
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {currentInnings.ballHistory.map((b, i) => (
                <div key={b.id || i} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-emerald-600 text-white font-mono font-bold flex items-center justify-center shrink-0">
                      {b.badge || b.label || b.runs}
                    </span>
                    <div>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {b.striker} facing {b.bowler}
                      </span>
                      <p className="text-[11px] text-zinc-400">{b.description || `${b.runs} runs`} • Score: {b.teamScore}/{b.teamWickets}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {b.timestamp ? new Date(b.timestamp).toLocaleTimeString() : `Over ${b.overNumber}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: WICKET DISMISSAL WITH SQUAD SELECTION */}
      {showWicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-rose-600">{t('wicketModalTitle')}</h3>
              <button onClick={() => setShowWicketModal(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWicketSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Dismissal Type
                </label>
                <select
                  value={wicketType}
                  onChange={(e) => setWicketType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
                >
                  <option value="Bowled">Bowled</option>
                  <option value="Caught">Caught</option>
                  <option value="LBW">LBW</option>
                  <option value="Run Out">Run Out</option>
                  <option value="Stumped">Stumped</option>
                  <option value="Hit Wicket">Hit Wicket</option>
                  <option value="Retired">Retired Hurt / Out</option>
                </select>
              </div>

              {wicketType === 'Run Out' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Who was Out?
                    </label>
                    <select
                      value={outBatter}
                      onChange={(e) => setOutBatter(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
                    >
                      <option value={currentInnings?.striker}>{currentInnings?.striker} (Striker)</option>
                      <option value={currentInnings?.nonStriker}>{currentInnings?.nonStriker} (Non-Striker)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Runs Completed Before Run Out
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="4"
                      value={runOutRuns}
                      onChange={(e) => setRunOutRuns(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </>
              )}

              {/* SQUAD-BASED NEW BATTER SELECTION */}
              {currentInnings?.wickets < 9 && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    {t('newBatter')} ({currentInnings?.battingTeam})
                  </label>
                  <select
                    value={newBatterSelect}
                    onChange={(e) => setNewBatterSelect(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="">-- Select from {currentInnings?.battingTeam} Squad --</option>
                    {eligibleNewBatters.map((player, idx) => (
                      <option key={idx} value={player}>
                        {player}
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ Enter custom player name...</option>
                  </select>

                  {newBatterSelect === '__CUSTOM__' && (
                    <input
                      type="text"
                      required
                      value={customNewBatter}
                      onChange={(e) => setCustomNewBatter(e.target.value)}
                      placeholder="e.g. Mushfiqur Rahim"
                      className="w-full mt-2 px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-rose-500"
                    />
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWicketModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  {loadingAction && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                  <span>Record Wicket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHANGE BOWLER WITH SQUAD SELECTION */}
      {showBowlerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">{t('changeBowler')}</h3>
              <button onClick={() => setShowBowlerModal(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBowlerChangeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Next Bowler ({currentInnings?.bowlingTeam})
                </label>
                <select
                  value={newBowlerSelect}
                  onChange={(e) => setNewBowlerSelect(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Select from {currentInnings?.bowlingTeam} Squad --</option>
                  {eligibleBowlers.map((player, idx) => (
                    <option key={idx} value={player}>
                      {player}
                    </option>
                  ))}
                  <option value="__CUSTOM__">+ Enter custom bowler name...</option>
                </select>

                {newBowlerSelect === '__CUSTOM__' && (
                  <input
                    type="text"
                    required
                    value={customNewBowler}
                    onChange={(e) => setCustomNewBowler(e.target.value)}
                    placeholder="e.g. Mustafizur Rahman"
                    className="w-full mt-2 px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500"
                  />
                )}
              </div>

              {/* Quick Select from previous bowlers */}
              {currentInnings?.bowlers && currentInnings.bowlers.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Previously Bowled:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentInnings.bowlers
                      .filter(b => b.name !== currentInnings.currentBowler)
                      .map((b, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setNewBowlerSelect(b.name)}
                          className="px-2.5 py-1 rounded-lg text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-500/20 hover:text-emerald-500 transition-colors cursor-pointer"
                        >
                          {b.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBowlerModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  {loadingAction && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                  <span>Confirm Bowler</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: START 2ND INNINGS WITH SQUAD SELECTION */}
      {showSecondInningsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">{t('startSecondInnings')}</h3>
              <button onClick={() => setShowSecondInningsModal(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              Target: <span className="font-bold text-amber-500">{match.target} runs</span> in {match.overs} overs.
            </p>

            <form onSubmit={handleStartSecondInnings} className="space-y-3.5">
              {/* 2nd Inn Striker */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Opening Striker ({match.innings1?.bowlingTeam})
                </label>
                <select
                  value={secondInnStriker}
                  onChange={(e) => setSecondInnStriker(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Select from {match.innings1?.bowlingTeam} Squad --</option>
                  {secondInnBattingSquad.map((player, idx) => (
                    <option key={idx} value={player}>
                      {player}
                    </option>
                  ))}
                  <option value="__CUSTOM__">+ Enter custom striker name...</option>
                </select>
                {secondInnStriker === '__CUSTOM__' && (
                  <input
                    type="text"
                    required
                    value={customSecondStriker}
                    onChange={(e) => setCustomSecondStriker(e.target.value)}
                    placeholder="Enter striker name"
                    className="w-full mt-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-800"
                  />
                )}
              </div>

              {/* 2nd Inn Non-Striker */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Opening Non-Striker ({match.innings1?.bowlingTeam})
                </label>
                <select
                  value={secondInnNonStriker}
                  onChange={(e) => setSecondInnNonStriker(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Select from {match.innings1?.bowlingTeam} Squad --</option>
                  {secondInnBattingSquad
                    .filter(p => p !== secondInnStriker)
                    .map((player, idx) => (
                      <option key={idx} value={player}>
                        {player}
                      </option>
                    ))}
                  <option value="__CUSTOM__">+ Enter custom non-striker name...</option>
                </select>
                {secondInnNonStriker === '__CUSTOM__' && (
                  <input
                    type="text"
                    required
                    value={customSecondNonStriker}
                    onChange={(e) => setCustomSecondNonStriker(e.target.value)}
                    placeholder="Enter non-striker name"
                    className="w-full mt-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-800"
                  />
                )}
              </div>

              {/* 2nd Inn Bowler */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Opening Bowler ({match.innings1?.battingTeam})
                </label>
                <select
                  value={secondInnBowler}
                  onChange={(e) => setSecondInnBowler(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Select from {match.innings1?.battingTeam} Squad --</option>
                  {secondInnBowlingSquad.map((player, idx) => (
                    <option key={idx} value={player}>
                      {player}
                    </option>
                  ))}
                  <option value="__CUSTOM__">+ Enter custom opening bowler...</option>
                </select>
                {secondInnBowler === '__CUSTOM__' && (
                  <input
                    type="text"
                    required
                    value={customSecondBowler}
                    onChange={(e) => setCustomSecondBowler(e.target.value)}
                    placeholder="Enter bowler name"
                    className="w-full mt-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-800"
                  />
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSecondInningsModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  {loadingAction && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                  <span>Start Chase</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EXTRAS RUNS INPUT */}
      {pendingExtraType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                Additional Runs for {pendingExtraType}
              </h3>
              <button onClick={() => setPendingExtraType(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExtraSubmit} className="space-y-4">
              <p className="text-xs text-zinc-500">
                {pendingExtraType === 'WD' && '1 run is automatically added for Wide. Enter any extra runs scored (e.g. 4 for boundary):'}
                {pendingExtraType === 'NB' && '1 run is automatically added for No-Ball. Enter runs scored off the bat:'}
                {['BYE', 'LB'].includes(pendingExtraType) && 'Enter total runs run for Bye / Leg-Bye:'}
              </p>

              <div className="grid grid-cols-5 gap-2">
                {[0, 1, 2, 3, 4].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setExtraRunsInput(num)}
                    className={`py-2 rounded-xl font-bold font-mono text-sm border transition-colors cursor-pointer ${
                      extraRunsInput === num
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200'
                    }`}
                  >
                    +{num}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingExtraType(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  {loadingAction && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                  <span>Record Extra</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INTERVAL / PAUSE CONTROLS */}
      {showIntervalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                Match Interval / Break
              </h3>
              <button onClick={() => setShowIntervalModal(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSetInterval} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Select Interval Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'LUNCH', label: 'Lunch Break' },
                    { id: 'TEA', label: 'Tea Break' },
                    { id: 'STUMPS', label: 'Stumps' },
                    { id: 'RAIN', label: 'Rain Delay' },
                    { id: 'DRINKS', label: 'Drinks Break' },
                    { id: 'CUSTOM', label: 'Custom Pause' },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setIntervalType(item.id)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer text-left ${
                        intervalType === item.id
                          ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300'
                          : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {intervalType === 'CUSTOM' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Custom Note / Reason
                  </label>
                  <input
                    type="text"
                    required
                    value={customIntervalNote}
                    onChange={(e) => setCustomIntervalNote(e.target.value)}
                    placeholder="e.g. Bad Light, Injury delay"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-800"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIntervalModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  {loadingAction && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                  <span>Pause Match</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONCLUDE MATCH */}
      {showConcludeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-rose-600">
                End / Conclude Match
              </h3>
              <button onClick={() => setShowConcludeModal(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              Are you sure you want to conclude this match? Scoring will be locked and final results recorded.
            </p>

            <form onSubmit={handleConcludeMatch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Result Summary (optional)
                </label>
                <input
                  type="text"
                  value={concludeResult}
                  onChange={(e) => setConcludeResult(e.target.value)}
                  placeholder="e.g. Match abandoned due to rain"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConcludeModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  {loadingAction && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                  <span>Conclude Match</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LIVE SHARING */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiShare2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">{t('shareModalTitle')}</h3>
              </div>
              <button onClick={() => setShowShareModal(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed">
              {t('shareModalDesc')}
            </p>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {match.shareEnabled ? t('disableLiveSharing') : t('enableLiveSharing')}
              </span>
              <button
                onClick={handleToggleShare}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  match.shareEnabled ? 'bg-emerald-600' : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    match.shareEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {match.shareEnabled ? (
              <div className="space-y-3 pt-2">
                <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between gap-2">
                  <span className="text-xs text-zinc-600 dark:text-zinc-300 font-mono truncate">
                    {getPublicShareUrl()}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shrink-0 transition-colors cursor-pointer"
                  >
                    {copied ? <FiCheck className="w-3.5 h-3.5" /> : <FiCopy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <a
                    href={`/live/${match.shareToken}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <FiExternalLink className="w-4 h-4" />
                    <span>Open Public View</span>
                  </a>

                  {typeof navigator !== 'undefined' && navigator.share && (
                    <button
                      onClick={() => {
                        navigator.share({
                          title: `${match.teamA} vs ${match.teamB} Live Cricket Score`,
                          text: `Watch live cricket score between ${match.teamA} and ${match.teamB}`,
                          url: getPublicShareUrl(),
                        }).catch(() => {});
                      }}
                      className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      {t('nativeShare')}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-xl">
                {language === 'bn' ? 'লিংক পেতে লাইভ শেয়ারিং চালু করুন।' : 'Enable live sharing above to generate the public link.'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
