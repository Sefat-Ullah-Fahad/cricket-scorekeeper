'use client';
import React, { useState, useEffect } from 'react';
import { MdSportsCricket } from 'react-icons/md';
import { FiWifi, FiWifiOff, FiList, FiActivity } from 'react-icons/fi';

export default function LiveMatchClient({ initialMatch, matchId }) {
  const [match, setMatch] = useState(initialMatch);
  const [isConnected, setIsConnected] = useState(true);
  const [activeTab, setActiveTab] = useState('SCORECARD'); // 'SCORECARD' | 'TIMELINE'

  // Real-time EventSource connection with polling fallback
  useEffect(() => {
    let eventSource = null;
    let pollInterval = null;

    const fetchFallback = async () => {
      try {
        const res = await fetch(`/api/all-match/${matchId}`);
        if (res.ok) {
          const data = await res.json();
          setMatch(data.match);
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      } catch (err) {
        setIsConnected(false);
      }
    };

    const connectSSE = () => {
      try {
        eventSource = new EventSource(`/api/all-match/${matchId}/stream`);

        eventSource.onopen = () => setIsConnected(true);

        eventSource.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.type === 'INIT' || data.type === 'UPDATE') {
              setMatch(data.match);
              setIsConnected(true);
            }
          } catch (err) {}
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          eventSource.close();
          if (!pollInterval) pollInterval = setInterval(fetchFallback, 3000);
        };
      } catch (err) {
        setIsConnected(false);
        if (!pollInterval) pollInterval = setInterval(fetchFallback, 3000);
      }
    };

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [matchId]);

  const activeInningsNumber = match.currentInnings;
  const currentInnings = activeInningsNumber === 1 ? match.innings1 : match.innings2;

  const legalBalls = currentInnings?.legalBalls || 0;
  const oversFormatted = `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
  const runs = currentInnings?.score || 0;
  const crr = legalBalls > 0 ? ((runs / legalBalls) * 6).toFixed(2) : '0.00';

  let rrr = null;
  let ballsRemaining = null;
  let runsNeeded = null;
  if (match.currentInnings === 2 && match.target) {
    const totalMatchBalls = match.overs * 6;
    ballsRemaining = Math.max(0, totalMatchBalls - legalBalls);
    runsNeeded = Math.max(0, match.target - runs);
    rrr = ballsRemaining > 0 ? ((runsNeeded / ballsRemaining) * 6).toFixed(2) : '0.00';
  }

  const battersList = currentInnings?.batters || [];
  const strikerStat = battersList.find(b => b.name === currentInnings?.striker) || {
    name: currentInnings?.striker || 'Striker', runs: 0, balls: 0, fours: 0, sixes: 0,
  };
  const nonStrikerStat = battersList.find(b => b.name === currentInnings?.nonStriker) || {
    name: currentInnings?.nonStriker || 'Non-Striker', runs: 0, balls: 0, fours: 0, sixes: 0,
  };

  const bowlersList = currentInnings?.bowlers || [];
  const activeBowlerName = currentInnings?.currentBowler;
  const bowlerStat = bowlersList.find(b => b.name === activeBowlerName) || {
    name: activeBowlerName || 'Bowler', legalBalls: 0, maidens: 0, runsConceded: 0, wickets: 0,
  };
  const bowlerOvers = `${Math.floor((bowlerStat.legalBalls || 0) / 6)}.${(bowlerStat.legalBalls || 0) % 6}`;
  const bowlerEconomy = (bowlerStat.legalBalls || 0) > 0
    ? ((bowlerStat.runsConceded / bowlerStat.legalBalls) * 6).toFixed(2)
    : '0.00';

  const strFmt = (v) => (v > 0 ? ((v)).toFixed(1) : '0.0');

  return (
    <div className="space-y-5">
      {/* Top header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
            <MdSportsCricket className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider block">
              {match.teamA} vs {match.teamB}
            </span>
            <span className="text-[10px] text-zinc-400 font-medium">
              Live Fan Cast • {match.overs} Overs Match
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
          {isConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <FiWifi className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Connected</span>
            </>
          ) : (
            <>
              <FiWifiOff className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Reconnecting…</span>
            </>
          )}
        </div>
      </div>

      {/* Big live score card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/80 via-zinc-900 to-zinc-950 border border-emerald-500/30 text-white shadow-xl">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-extrabold uppercase tracking-wide text-zinc-200">
            {match.teamA} vs {match.teamB} <span className="text-zinc-500">• {match.currentInnings === 2 ? '2nd' : '1st'} Innings</span>
          </span>
          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            {match.status === 'LIVE' ? '● LIVE' : match.status}
          </span>
        </div>

        <div className="flex items-end justify-between mt-3">
          <div>
            <span className="text-xs font-bold uppercase text-emerald-400 tracking-wider">
              {currentInnings?.battingTeam || match.teamA} Batting
            </span>
            <div className="text-5xl font-black font-mono mt-1">
              {runs}/{currentInnings?.wickets ?? 0}{' '}
              <span className="text-xl text-zinc-400 font-medium">({oversFormatted} / {match.overs} ov)</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">CRR</div>
            <div className="text-lg font-mono font-bold text-emerald-300">{crr}</div>
            {rrr && (
              <>
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider mt-1.5">RRR</div>
                <div className="text-lg font-mono font-bold text-amber-300">{rrr}</div>
              </>
            )}
          </div>
        </div>

        {match.status === 'COMPLETED' && match.result && (
          <div className="mt-4 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-center text-sm font-bold text-emerald-300">
            {match.result}
          </div>
        )}
      </div>

      {/* Current batters + bowler */}
      {currentInnings && match.status !== 'COMPLETED' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <span>Batter</span><span>R (B)</span><span>4s</span><span>6s</span><span>SR</span>
            </div>
            <div className="py-2 grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span>* {strikerStat.name}</span>
              <span className="font-mono">{strikerStat.runs} ({strikerStat.balls})</span>
              <span className="font-mono">{strikerStat.fours}</span>
              <span className="font-mono">{strikerStat.sixes}</span>
              <span className="font-mono">{strikerStat.balls > 0 ? ((strikerStat.runs / strikerStat.balls) * 100).toFixed(1) : '0.0'}</span>
            </div>
            <div className="py-2 grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 text-xs text-zinc-700 dark:text-zinc-300">
              <span>• {nonStrikerStat.name}</span>
              <span className="font-mono">{nonStrikerStat.runs} ({nonStrikerStat.balls})</span>
              <span className="font-mono">{nonStrikerStat.fours}</span>
              <span className="font-mono">{nonStrikerStat.sixes}</span>
              <span className="font-mono">{nonStrikerStat.balls > 0 ? ((nonStrikerStat.runs / nonStrikerStat.balls) * 100).toFixed(1) : '0.0'}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <span>Bowler</span><span>O</span><span>R</span><span>W</span><span>Econ</span>
            </div>
            <div className="py-2 grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200">
              <span>{bowlerStat.name}</span>
              <span className="font-mono">{bowlerOvers}</span>
              <span className="font-mono">{bowlerStat.runsConceded}</span>
              <span className="font-mono text-rose-600 dark:text-rose-400">{bowlerStat.wickets}</span>
              <span className="font-mono">{bowlerEconomy}</span>
            </div>

            <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">This Over</div>
              <div className="flex flex-wrap gap-1.5">
                {(currentInnings.currentOverBalls || []).length === 0 ? (
                  <span className="text-xs text-zinc-400">Yet to bowl</span>
                ) : (
                  currentInnings.currentOverBalls.map((badge, i) => (
                    <span
                      key={i}
                      className="w-7 h-7 rounded-full bg-emerald-600 text-white text-[11px] font-mono font-bold flex items-center justify-center"
                    >
                      {badge}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('SCORECARD')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'SCORECARD'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <FiList className="w-4 h-4" />
          <span>View Scorecard</span>
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
          <span>Ball-by-Ball Feed</span>
        </button>
      </div>

      {/* Full Scorecard */}
      {activeTab === 'SCORECARD' && (
        <div className="space-y-6">
          {[
            { num: 1, state: match.innings1, title: `${match.innings1?.battingTeam || match.teamA} Innings (1st Innings)` },
            { num: 2, state: match.innings2, title: `${match.innings2?.battingTeam || match.teamB} Innings (2nd Innings)` },
          ].map((innObj) => {
            const inn = innObj.state;
            if (!inn) return null;
            const batters = inn.batters || [];
            const bowlers = inn.bowlers || [];

            return (
              <div key={innObj.num} className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">{innObj.title}</h3>
                  <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {inn.score}/{inn.wickets} ({Math.floor((inn.legalBalls || 0) / 6)}.{(inn.legalBalls || 0) % 6} ov)
                  </div>
                </div>

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
                      {batters.map((b, i) => (
                        <tr key={i}>
                          <td className="py-2 font-bold">{b.name}</td>
                          <td className="py-2 text-zinc-400 text-[11px]">{b.dismissal || (b.status === 'batting' ? 'batting' : 'not out')}</td>
                          <td className="py-2 text-right font-mono font-bold">{b.runs}</td>
                          <td className="py-2 text-right font-mono">{b.balls}</td>
                          <td className="py-2 text-right font-mono">{b.fours}</td>
                          <td className="py-2 text-right font-mono">{b.sixes}</td>
                          <td className="py-2 text-right font-mono text-zinc-500">
                            {b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-xs flex flex-wrap items-center justify-between gap-2 text-zinc-600 dark:text-zinc-300">
                  <div>
                    Extras: <span className="font-bold">{inn.extras?.total || 0}</span> (wd {inn.extras?.wides || 0}, nb {inn.extras?.noBalls || 0}, b {inn.extras?.byes || 0}, lb {inn.extras?.legByes || 0})
                  </div>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                    Total: {inn.score}/{inn.wickets}
                  </div>
                </div>

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
                      {bowlers.map((bw, i) => {
                        const totalBwBalls = bw.legalBalls || 0;
                        return (
                          <tr key={i}>
                            <td className="py-2 font-bold">{bw.name}</td>
                            <td className="py-2 text-right font-mono">{Math.floor(totalBwBalls / 6)}.{totalBwBalls % 6}</td>
                            <td className="py-2 text-right font-mono">{bw.maidens}</td>
                            <td className="py-2 text-right font-mono">{bw.runsConceded}</td>
                            <td className="py-2 text-right font-mono font-bold text-rose-600 dark:text-rose-400">{bw.wickets}</td>
                            <td className="py-2 text-right font-mono text-zinc-500">
                              {totalBwBalls > 0 ? ((bw.runsConceded / totalBwBalls) * 6).toFixed(2) : '0.00'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {inn.fallOfWickets && inn.fallOfWickets.length > 0 && (
                  <div className="pt-2">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Fall of Wickets
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

      {/* Ball-by-Ball Timeline */}
      {activeTab === 'TIMELINE' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md space-y-4">
          <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
            Live Ball-by-Ball Feed
          </h3>

          {(!currentInnings?.ballHistory || currentInnings.ballHistory.length === 0) ? (
            <div className="p-8 text-center text-xs text-zinc-400">
              Waiting for first ball…
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {currentInnings.ballHistory.map((b, i) => (
                <div key={b.id || i} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-emerald-600 text-white font-mono font-bold flex items-center justify-center shrink-0">
                      {b.badge}
                    </span>
                    <div>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {b.striker} facing {b.bowler}
                      </span>
                      <p className="text-[11px] text-zinc-400">{b.description} • Score: {b.teamScore}/{b.teamWickets}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400">Over {b.overNumber}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-center text-[11px] text-zinc-400 pt-2">
        Read-only live view — scoring and editing are not available here.
      </p>
    </div>
  );
}