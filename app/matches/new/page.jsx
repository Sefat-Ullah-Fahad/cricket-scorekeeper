'use client';
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../../components/LanguageThemeContext';
import { useToast } from '../../../components/Toast';
import { MdSportsCricket } from 'react-icons/md';
import { FiArrowLeft, FiPlus, FiTrash2, FiUsers, FiPlay, FiList, FiEdit3 } from 'react-icons/fi';
import Link from 'next/link';
import CricketBallLoader from '@/components/CricketBallLoader';

export default function NewMatchPage() {
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [overs, setOvers] = useState('20');
  const [battingFirst, setBattingFirst] = useState('Team A');

  // Squads
  const [teamASquad, setTeamASquad] = useState([
    'Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5',
    'Player 6', 'Player 7', 'Player 8', 'Player 9', 'Player 10', 'Player 11'
  ]);
  const [teamBSquad, setTeamBSquad] = useState([
    'Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5',
    'Player 6', 'Player 7', 'Player 8', 'Player 9', 'Player 10', 'Player 11'
  ]);

  const [newPlayerA, setNewPlayerA] = useState('');
  const [newPlayerB, setNewPlayerB] = useState('');
  const [showSquadConfig, setShowSquadConfig] = useState(false);

  // Lineup selection
  const [striker, setStriker] = useState('');
  const [nonStriker, setNonStriker] = useState('');
  const [bowler, setBowler] = useState('');
  const [customStriker, setCustomStriker] = useState('');
  const [customNonStriker, setCustomNonStriker] = useState('');
  const [customBowler, setCustomBowler] = useState('');

  const [loading, setLoading] = useState(false);

  const { t, language } = useApp();
  const router = useRouter();
  const toast = useToast();

  const battingTeamName = battingFirst === 'Team A' ? (teamA.trim() || 'Team A') : (teamB.trim() || 'Team B');
  const bowlingTeamName = battingFirst === 'Team A' ? (teamB.trim() || 'Team B') : (teamA.trim() || 'Team A');

  const battingSquad = battingFirst === 'Team A' ? teamASquad : teamBSquad;
  const bowlingSquad = battingFirst === 'Team A' ? teamBSquad : teamASquad;

  // Add player to Team A
  const handleAddPlayerA = (e) => {
    e?.preventDefault();
    if (!newPlayerA.trim()) return;
    if (teamASquad.includes(newPlayerA.trim())) {
      toast.error('Player already in squad');
      return;
    }
    setTeamASquad([...teamASquad, newPlayerA.trim()]);
    setNewPlayerA('');
  };

  // Add player to Team B
  const handleAddPlayerB = (e) => {
    e?.preventDefault();
    if (!newPlayerB.trim()) return;
    if (teamBSquad.includes(newPlayerB.trim())) {
      toast.error('Player already in squad');
      return;
    }
    setTeamBSquad([...teamBSquad, newPlayerB.trim()]);
    setNewPlayerB('');
  };

  const handleRemovePlayerA = (index) => {
    setTeamASquad(teamASquad.filter((_, i) => i !== index));
  };

  const handleRemovePlayerB = (index) => {
    setTeamBSquad(teamBSquad.filter((_, i) => i !== index));
  };

  const effectiveStriker = striker === '__CUSTOM__' ? customStriker.trim() : (striker.trim() || battingSquad[0] || '');
  const effectiveNonStriker = nonStriker === '__CUSTOM__' ? customNonStriker.trim() : (nonStriker.trim() || battingSquad[1] || '');
  const effectiveBowler = bowler === '__CUSTOM__' ? customBowler.trim() : (bowler.trim() || bowlingSquad[0] || '');

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!teamA.trim() || !teamB.trim()) {
      toast.error(language === 'bn' ? 'উভয় দলের নাম প্রয়োজন।' : 'Both team names are required.');
      return;
    }

    if (!effectiveStriker || !effectiveNonStriker || !effectiveBowler) {
      toast.error(language === 'bn' ? 'উদ্বোধনী স্ট্রাইকার, নন-স্ট্রাইকার ও বোলারের নাম প্রয়োজন।' : 'Opening striker, non-striker, and bowler are required.');
      return;
    }

    if (effectiveStriker.toLowerCase() === effectiveNonStriker.toLowerCase()) {
      toast.error(language === 'bn' ? 'স্ট্রাইকার ও নন-স্ট্রাইকার ভিন্ন খেলোয়াড় হতে হবে।' : 'Striker and Non-striker must be different players.');
      return;
    }

    const numOvers = parseInt(overs, 10);
    if (isNaN(numOvers) || numOvers < 1 || numOvers > 100) {
      toast.error(language === 'bn' ? 'ওভার ১ থেকে ১০০ এর মধ্যে হতে হবে।' : 'Overs must be between 1 and 100.');
      return;
    }

    // Ensure opening players are included in squads
    const finalTeamASquad = Array.from(new Set([
      ...teamASquad,
      battingFirst === 'Team A' ? effectiveStriker : effectiveBowler,
      battingFirst === 'Team A' ? effectiveNonStriker : null,
    ].filter(Boolean)));

    const finalTeamBSquad = Array.from(new Set([
      ...teamBSquad,
      battingFirst === 'Team B' ? effectiveStriker : effectiveBowler,
      battingFirst === 'Team B' ? effectiveNonStriker : null,
    ].filter(Boolean)));

    setLoading(true);
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamA: teamA.trim(),
          teamB: teamB.trim(),
          overs: numOvers,
          battingFirst,
          striker: effectiveStriker,
          nonStriker: effectiveNonStriker,
          bowler: effectiveBowler,
          teamAPlayers: finalTeamASquad,
          teamBPlayers: finalTeamBSquad,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to create match');
      } else {
        toast.success(language === 'bn' ? 'ম্যাচ সফলভাবে তৈরি হয়েছে!' : 'Match created successfully!');
        router.push(`/matches/${data.match.id}`);
      }
    } catch (err) {
      console.error('[CREATE MATCH ERROR]', err);
      toast.error('Network error creating match');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 mb-6 transition-colors"
      >
        <FiArrowLeft className="w-4 h-4" />
        <span>{language === 'bn' ? 'ড্যাশবোর্ডে ফিরে যান' : 'Back to Dashboard'}</span>
      </Link>

      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl">
        <div className="flex items-center gap-3 pb-6 border-b border-zinc-100 dark:border-zinc-800 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
            <MdSportsCricket className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {t('newMatch')}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              {language === 'bn' ? 'দল, স্কোয়াড, ওভার ও উদ্বোধনী খেলোয়াড় নির্বাচন করুন' : 'Setup match details, team squads, and opening lineup'}
            </p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="space-y-6">
          {/* Teams Setup */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
                {t('teamA')}
              </label>
              <input
                type="text"
                required
                value={teamA}
                onChange={(e) => setTeamA(e.target.value)}
                placeholder="e.g. Bangladesh"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
                {t('teamB')}
              </label>
              <input
                type="text"
                required
                value={teamB}
                onChange={(e) => setTeamB(e.target.value)}
                placeholder="e.g. India"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Overs & Batting First */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
                {t('overs')}
              </label>
              <div className="flex gap-2 mb-2">
                {['5', '10', '20', '50'].map(ov => (
                  <button
                    key={ov}
                    type="button"
                    onClick={() => setOvers(ov)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      overs === ov
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {ov}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="1"
                max="100"
                required
                value={overs}
                onChange={(e) => setOvers(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
                {t('battingFirst')}
              </label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setBattingFirst('Team A')}
                  className={`py-3 px-3 rounded-xl text-xs font-bold border truncate transition-colors ${
                    battingFirst === 'Team A'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {teamA.trim() || 'Team A'}
                </button>
                <button
                  type="button"
                  onClick={() => setBattingFirst('Team B')}
                  className={`py-3 px-3 rounded-xl text-xs font-bold border truncate transition-colors ${
                    battingFirst === 'Team B'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {teamB.trim() || 'Team B'}
                </button>
              </div>
              <p className="text-[11px] text-zinc-400 mt-2">
                {battingTeamName} bats first, {bowlingTeamName} bowls first.
              </p>
            </div>
          </div>

          {/* Squad Management Toggle */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiUsers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                  {language === 'bn' ? 'স্কোয়াড ও খেলোয়াড় তালিকা' : 'Squad Player Lists'}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-medium">
                  {teamASquad.length} vs {teamBSquad.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowSquadConfig(!showSquadConfig)}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <FiEdit3 className="w-3.5 h-3.5" />
                <span>{showSquadConfig ? (language === 'bn' ? 'লুকান' : 'Hide Squads') : (language === 'bn' ? 'স্কোয়াড কাস্টমাইজ করুন' : 'Customize Squads')}</span>
              </button>
            </div>

            {showSquadConfig && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-zinc-200 dark:border-zinc-700/60">
                {/* Team A Squad */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    {teamA.trim() || 'Team A'} Squad ({teamASquad.length})
                  </span>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Add player..."
                      value={newPlayerA}
                      onChange={(e) => setNewPlayerA(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPlayerA(); } }}
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
                    />
                    <button
                      type="button"
                      onClick={handleAddPlayerA}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                    >
                      <FiPlus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {teamASquad.map((player, idx) => (
                      <div key={idx} className="flex items-center justify-between px-2 py-1 rounded bg-white dark:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300">
                        <span className="truncate">{idx + 1}. {player}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePlayerA(idx)}
                          className="text-zinc-400 hover:text-rose-500"
                        >
                          <FiTrash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team B Squad */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    {teamB.trim() || 'Team B'} Squad ({teamBSquad.length})
                  </span>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Add player..."
                      value={newPlayerB}
                      onChange={(e) => setNewPlayerB(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPlayerB(); } }}
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
                    />
                    <button
                      type="button"
                      onClick={handleAddPlayerB}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                    >
                      <FiPlus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {teamBSquad.map((player, idx) => (
                      <div key={idx} className="flex items-center justify-between px-2 py-1 rounded bg-white dark:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300">
                        <span className="truncate">{idx + 1}. {player}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePlayerB(idx)}
                          className="text-zinc-400 hover:text-rose-500"
                        >
                          <FiTrash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Opening Lineup Setup */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <FiList className="w-4 h-4" />
              <span>{language === 'bn' ? 'উদ্বোধনী খেলোয়াড় নির্বাচন (ড্রপডাউন)' : 'Opening Lineup Selection'}</span>
            </h3>

            {/* Striker */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t('striker')} ({battingTeamName})
              </label>
              <select
                value={striker}
                onChange={(e) => setStriker(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Select from {battingTeamName} Squad --</option>
                {battingSquad.map((player, idx) => (
                  <option key={idx} value={player}>
                    {player}
                  </option>
                ))}
                <option value="__CUSTOM__">+ Enter custom player name...</option>
              </select>

              {striker === '__CUSTOM__' && (
                <input
                  type="text"
                  required
                  value={customStriker}
                  onChange={(e) => setCustomStriker(e.target.value)}
                  placeholder="Enter custom striker name"
                  className="w-full mt-2 px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              )}
            </div>

            {/* Non-Striker */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t('nonStriker')} ({battingTeamName})
              </label>
              <select
                value={nonStriker}
                onChange={(e) => setNonStriker(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Select from {battingTeamName} Squad --</option>
                {battingSquad
                  .filter((p) => p !== striker)
                  .map((player, idx) => (
                    <option key={idx} value={player}>
                      {player}
                    </option>
                  ))}
                <option value="__CUSTOM__">+ Enter custom player name...</option>
              </select>

              {nonStriker === '__CUSTOM__' && (
                <input
                  type="text"
                  required
                  value={customNonStriker}
                  onChange={(e) => setCustomNonStriker(e.target.value)}
                  placeholder="Enter custom non-striker name"
                  className="w-full mt-2 px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              )}
            </div>

            {/* Bowler */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t('bowler')} ({bowlingTeamName})
              </label>
              <select
                value={bowler}
                onChange={(e) => setBowler(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Select from {bowlingTeamName} Squad --</option>
                {bowlingSquad.map((player, idx) => (
                  <option key={idx} value={player}>
                    {player}
                  </option>
                ))}
                <option value="__CUSTOM__">+ Enter custom player name...</option>
              </select>

              {bowler === '__CUSTOM__' && (
                <input
                  type="text"
                  required
                  value={customBowler}
                  onChange={(e) => setCustomBowler(e.target.value)}
                  placeholder="Enter custom opening bowler name"
                  className="w-full mt-2 px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            {loading ? (
              <CricketBallLoader size={16} />
            ) : (
              <>
                <FiPlay className="w-4 h-4 fill-white" />
                <span>{t('startMatch')}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
