'use client';
import React, { useState, useEffect } from 'react';
import { useApp } from '../../../components/LanguageThemeContext';
import { MdSportsCricket } from 'react-icons/md';
import {
  FiWifi,
  FiWifiOff,
  FiList,
  FiActivity,
  FiShare2,
  FiCopy,
  FiCheck,
  FiCheckCircle,
  FiMoon,
  FiSun,
  FiGlobe,
  FiPauseCircle
} from 'react-icons/fi';

export default function LiveViewerClient({ initialMatch, shareToken }) {
  const [match, setMatch] = useState(initialMatch);
  const [isConnected, setIsConnected] = useState(true);
  const [activeTab, setActiveTab] = useState('SCORECARD'); // 'SCORECARD', 'TIMELINE'
  const [copied, setCopied] = useState(false);

  const { t, language, setLanguage, theme, setTheme } = useApp();

  // Real-time EventSource connection with fallback polling
  useEffect(() => {
    let eventSource = null;
    let pollInterval = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource(`/api/public/matches/${shareToken}/stream`);

        eventSource.onopen = () => {
          setIsConnected(true);
        };

        eventSource.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.type === 'INIT' || data.type === 'UPDATE') {
              setMatch(data.match);
              setIsConnected(true);
            } else if (data.type === 'DISABLED') {
              setIsConnected(false);
            }
          } catch (err) {}
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          eventSource.close();
          if (!pollInterval) {
            pollInterval = setInterval(fetchMatchFallback, 3000);
          }
        };
      } catch (err) {
        setIsConnected(false);
        if (!pollInterval) {
          pollInterval = setInterval(fetchMatchFallback, 3000);
        }
      }
    };

    const fetchMatchFallback = async () => {
      try {
        const res = await fetch(`/api/public/matches/${shareToken}`);
        if (res.ok) {
          const data = await res.json();
          setMatch(data.match);
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      } catch (e) {
        setIsConnected(false);
      }
    };

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [shareToken]);

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

  // Active striker & non-striker
  const battersList = currentInnings?.batters || currentInnings?.batting || [];
  const strikerStat = battersList.find(b => b.name === currentInnings?.striker) || {
    name: currentInnings?.striker || 'Striker',
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
  };

  const nonStrikerStat = battersList.find(b => b.name === currentInnings?.nonStriker) || {
    name: currentInnings?.nonStriker || 'Non-Striker',
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
  };

  // Active bowler
  const bowlersList = currentInnings?.bowlers || currentInnings?.bowling || [];
  const activeBowlerName = currentInnings?.currentBowler || currentInnings?.bowler;
  const bowlerStat = bowlersList.find(b => b.name === activeBowlerName) || {
    name: activeBowlerName || 'Bowler',
    legalBalls: 0,
    balls: 0,
    maidens: 0,
    runsConceded: 0,
    wickets: 0,
  };
  const bowlerTotalBalls = bowlerStat.legalBalls ?? bowlerStat.balls ?? 0;
  const bowlerOvers = `${Math.floor(bowlerTotalBalls / 6)}.${bowlerTotalBalls % 6}`;
  const bowlerEconomy = bowlerStat.economy || (bowlerTotalBalls > 0 ? ((bowlerStat.runsConceded / bowlerTotalBalls) * 6).toFixed(2) : '0.00');

  const isMatchPaused = match.status === 'PAUSED' || match.status === 'INTERVAL';

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Header */}
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

        <div className="flex items-center gap-2">
          {/* Live Status indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
            {isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <FiWifi className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden sm:inline">Connected</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <FiWifiOff className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden sm:inline">Offline</span>
              </>
            )}
          </div>

          {/* Copy Share Link */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            {copied ? <FiCheck className="w-3.5 h-3.5" /> : <FiCopy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Share'}</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            {theme === 'dark' ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* PAUSED BANNER (Lunch, Tea, Stumps, Rain, etc.) */}
      {isMatchPaused && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-900 dark:text-amber-200 flex items-center gap-3 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center font-bold shrink-0">
            <FiPauseCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-extrabold">
              {match.currentInterval?.note || 'Match Paused'}
            </div>
            <div className="text-xs text-amber-700 dark:text-amber-300">
              Score at break: {match.currentInterval?.scoreAtInterval || `${currentInnings?.score}/${currentInnings?.wickets}`}.
              {match.currentInterval?.startedAt && ` Started at ${new Date(match.currentInterval.startedAt).toLocaleTimeString()}.`}
            </div>
          </div>
        </div>
      )}

      {/* Main Live Scorecard Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950/80 via-zinc-900 to-zinc-950 border border-emerald-500/30 text-white shadow-2xl relative overflow-hidden">
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
                ({oversFormatted} / {match.overs} ov)
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
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center text-xs font-bold text-amber-300">
            Innings Break: {match.innings1?.battingTeam} scored {match.innings1?.score}/{match.innings1?.wickets}. Target is {match.target} runs.
          </div>
        )}
      </div>

      {/* Active Batters & Bowlers (Live) */}
      {match.status === 'LIVE' && currentInnings && (
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

            <div className="flex items-center justify-between text-sm p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 font-medium">
              <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">
                * {strikerStat.name}
              </span>
              <div className="flex gap-4 font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{strikerStat.runs} ({strikerStat.balls})</span>
                <span>{strikerStat.fours}</span>
                <span>{strikerStat.sixes}</span>
                <span>{strikerStat.strikeRate || (strikerStat.balls > 0 ? ((strikerStat.runs / strikerStat.balls) * 100).toFixed(1) : '0.0')}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 font-medium">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[140px]">
                • {nonStrikerStat.name}
              </span>
              <div className="flex gap-4 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                <span>{nonStrikerStat.runs} ({nonStrikerStat.balls})</span>
                <span>{nonStrikerStat.fours}</span>
                <span>{nonStrikerStat.sixes}</span>
                <span>{nonStrikerStat.strikeRate || (nonStrikerStat.balls > 0 ? ((nonStrikerStat.runs / nonStrikerStat.balls) * 100).toFixed(1) : '0.0')}</span>
              </div>
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

            {/* Recent Balls Strip */}
            <div className="pt-2 flex items-center gap-2 overflow-x-auto">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider shrink-0">
                This Over:
              </span>
              <div className="flex items-center gap-1.5">
                {(currentInnings?.currentOverBalls || []).map((badge, idx) => (
                  <span
                    key={idx}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono shadow-sm shrink-0 ${
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
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs: Scorecard / Timeline */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
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
          <span>{language === 'bn' ? 'বল-বাই-বল বিবরণ' : 'Ball-by-Ball Feed'}</span>
        </button>
      </div>

      {/* Full Scorecard View */}
      {activeTab === 'SCORECARD' && (
        <div className="space-y-6">
          {[
            { num: 1, state: match.innings1, title: `${match.innings1?.battingTeam} Innings (1st Innings)` },
            { num: 2, state: match.innings2, title: `${match.innings2?.battingTeam || match.teamB} Innings (2nd Innings)` },
          ].map((innObj) => {
            const inn = innObj.state;
            if (!inn) return null;

            const batters = inn.batters || inn.batting || [];
            const bowlers = inn.bowlers || inn.bowling || [];

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
                      {batters.map((b, i) => (
                        <tr key={i}>
                          <td className="py-2 font-bold">{b.name}</td>
                          <td className="py-2 text-zinc-400 text-[11px]">{b.dismissal || (b.status === 'batting' ? 'batting' : 'not out')}</td>
                          <td className="py-2 text-right font-mono font-bold">{b.runs}</td>
                          <td className="py-2 text-right font-mono">{b.balls}</td>
                          <td className="py-2 text-right font-mono">{b.fours}</td>
                          <td className="py-2 text-right font-mono">{b.sixes}</td>
                          <td className="py-2 text-right font-mono text-zinc-500">
                            {b.strikeRate || (b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Extras */}
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-xs flex flex-wrap items-center justify-between gap-2 text-zinc-600 dark:text-zinc-300">
                  <div>
                    Extras: <span className="font-bold">{inn.extras?.total || 0}</span> (wd {inn.extras?.wides || inn.extras?.wide || 0}, nb {inn.extras?.noBalls || inn.extras?.noBall || 0}, b {inn.extras?.byes || inn.extras?.bye || 0}, lb {inn.extras?.legByes || inn.extras?.legBye || 0})
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
                      {bowlers.map((bw, i) => {
                        const totalBwBalls = bw.legalBalls ?? bw.balls ?? 0;
                        return (
                          <tr key={i}>
                            <td className="py-2 font-bold">{bw.name}</td>
                            <td className="py-2 text-right font-mono">{Math.floor(totalBwBalls / 6)}.{totalBwBalls % 6}</td>
                            <td className="py-2 text-right font-mono">{bw.maidens}</td>
                            <td className="py-2 text-right font-mono">{bw.runsConceded}</td>
                            <td className="py-2 text-right font-mono font-bold text-rose-600 dark:text-rose-400">{bw.wickets}</td>
                            <td className="py-2 text-right font-mono text-zinc-500">
                              {bw.economy || (totalBwBalls > 0 ? ((bw.runsConceded / totalBwBalls) * 6).toFixed(2) : '0.00')}
                            </td>
                          </tr>
                        );
                      })}
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
                          {fow.score}/{fow.wicket} ({fow.player || fow.batter}, {fow.overs || fow.over} ov)
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

      {/* Timeline Feed */}
      {activeTab === 'TIMELINE' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md space-y-4">
          <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
            {language === 'bn' ? 'বল-বাই-বল লাইভ ফিড' : 'Live Ball-by-Ball Feed'}
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
    </div>
  );
}
