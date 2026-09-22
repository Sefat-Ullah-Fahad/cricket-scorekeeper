'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '../../components/LanguageThemeContext';
import { useToast } from '../../components/Toast';
import { MdSportsCricket } from 'react-icons/md';
import {
  FiPlay,
  FiEye,
  FiShare2,
  FiTrash2,
  FiSearch,
  FiCopy,
  FiCheck,
  FiX,
  FiPlus,
  FiExternalLink,
  FiPauseCircle
} from 'react-icons/fi';

export default function MatchesClient({ user, initialMatches = [] }) {
  const [matches, setMatches] = useState(initialMatches);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL', 'LIVE', 'BREAK', 'COMPLETED'
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shareModalMatch, setShareModalMatch] = useState(null);
  const [copied, setCopied] = useState(false);

  const { t, language } = useApp();
  const toast = useToast();

  // Status priority: Live (1) > Break / Interval (2) > Completed (3)
  const statusPriority = (status) => {
    if (status === 'LIVE') return 1;
    if (status === 'INNINGS_BREAK' || status === 'PAUSED' || status === 'INTERVAL') return 2;
    if (status === 'COMPLETED') return 3;
    return 4;
  };

  const sortedAndFilteredMatches = useMemo(() => {
    return [...matches]
      .sort((a, b) => {
        const prioA = statusPriority(a.status);
        const prioB = statusPriority(b.status);
        if (prioA !== prioB) return prioA - prioB;
        return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
      })
      .filter(m => {
        const matchesTab =
          activeTab === 'ALL' ||
          (activeTab === 'LIVE' && m.status === 'LIVE') ||
          (activeTab === 'BREAK' && (m.status === 'INNINGS_BREAK' || m.status === 'PAUSED' || m.status === 'INTERVAL')) ||
          (activeTab === 'COMPLETED' && m.status === 'COMPLETED');

        const search = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !search ||
          m.teamA.toLowerCase().includes(search) ||
          m.teamB.toLowerCase().includes(search);

        return matchesTab && matchesSearch;
      });
  }, [matches, activeTab, searchTerm]);

  const handleDelete = async (matchId) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/matches/${matchId}`, { method: 'DELETE' });
      if (res.ok) {
        setMatches(prev => prev.filter(m => m.id !== matchId));
        toast.success(language === 'bn' ? 'ম্যাচ মুছে ফেলা হয়েছে।' : 'Match deleted successfully.');
        setDeleteConfirmId(null);
      } else {
        toast.error('Failed to delete match');
      }
    } catch (err) {
      toast.error('Network error while deleting match');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleShare = async (match, currentState) => {
    const nextState = !currentState;
    try {
      const res = await fetch(`/api/matches/${match.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareEnabled: nextState }),
      });
      if (res.ok) {
        setMatches(prev =>
          prev.map(m => (m.id === match.id ? { ...m, shareEnabled: nextState } : m))
        );
        toast.success(nextState ? 'Live sharing enabled.' : 'Live sharing disabled.');
      } else {
        toast.error('Failed to update share setting');
      }
    } catch (err) {
      toast.error('Network error updating share setting');
    }
  };

  const getPublicShareUrl = (token) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/live/${token}`;
    }
    return `/live/${token}`;
  };

  const handleCopyLink = (token) => {
    const url = getPublicShareUrl(token);
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast.success(t('linkCopied'));
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
            {t('matchHistory')}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {language === 'bn' ? 'আপনার সকল স্কোর করা ম্যাচের পূর্ণ বিবরণ (Live > Break > Completed)' : 'All matches ordered by status: Live > Break > Completed'}
          </p>
        </div>

        <Link
          href="/matches/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm shadow-md transition-all shrink-0"
        >
          <FiPlus className="w-4 h-4" />
          <span>{t('createMatch')}</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1">
          {[
            { id: 'ALL', label: language === 'bn' ? 'সকল' : 'All' },
            { id: 'LIVE', label: language === 'bn' ? 'লাইভ' : 'Live' },
            { id: 'BREAK', label: language === 'bn' ? 'বিরতি' : 'Break / Paused' },
            { id: 'COMPLETED', label: language === 'bn' ? 'সমাপ্ত' : 'Completed' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'bn' ? 'দলের নাম খুঁজুন...' : 'Search team name...'}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Matches Grid */}
      {sortedAndFilteredMatches.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 text-center flex flex-col items-center justify-center">
          <MdSportsCricket className="w-10 h-10 text-zinc-400 mb-3" />
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            {language === 'bn' ? 'কোন ম্যাচ পাওয়া যায়নি।' : 'No matches found.'}
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            {language === 'bn' ? 'নতুন ম্যাচ তৈরি করুন অথবা ফিল্টার পরিবর্তন করুন।' : 'Create a new match or change your filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedAndFilteredMatches.map(m => {
            const isLive = m.status === 'LIVE';
            const isBreak = m.status === 'INNINGS_BREAK' || m.status === 'PAUSED' || m.status === 'INTERVAL';
            const activeInn = m.currentInnings === 1 ? m.innings1 : m.innings2;
            const oversText = activeInn ? `${Math.floor(activeInn.legalBalls / 6)}.${activeInn.legalBalls % 6}` : '0.0';

            return (
              <div
                key={m.id}
                className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-emerald-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Status & Date */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
                        isLive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : isBreak
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>}
                      {m.status === 'PAUSED' || m.status === 'INTERVAL'
                        ? (m.currentInterval?.note || 'PAUSED')
                        : m.status === 'INNINGS_BREAK'
                        ? t('inningsBreak')
                        : isLive
                        ? t('live')
                        : t('completed')}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Teams and Scores */}
                  <div className="space-y-1 my-3">
                    <div className="flex items-center justify-between text-base font-bold text-zinc-900 dark:text-zinc-100">
                      <span className="truncate max-w-[170px]">{m.teamA}</span>
                      <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                        {m.innings1 ? `${m.innings1.score}/${m.innings1.wickets}` : '0/0'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-base font-bold text-zinc-900 dark:text-zinc-100">
                      <span className="truncate max-w-[170px]">{m.teamB}</span>
                      <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                        {m.innings2 ? `${m.innings2.score}/${m.innings2.wickets}` : (m.currentInnings === 2 ? '0/0' : '-')}
                      </span>
                    </div>
                  </div>

                  {/* Match Result / Ongoing Info */}
                  <div className="mt-3">
                    {m.result ? (
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                        {m.result}
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 text-xs text-zinc-500 flex justify-between">
                        <span>{activeInn?.battingTeam || m.teamA} Batting</span>
                        <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                          {activeInn?.score || 0}/{activeInn?.wickets || 0} ({oversText} ov)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/matches/${m.id}`}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-colors"
                    >
                      <FiPlay className="w-3.5 h-3.5 fill-white" />
                      <span>{m.status === 'COMPLETED' ? 'Scorecard' : 'Score'}</span>
                    </Link>

                    <button
                      onClick={() => setShareModalMatch(m)}
                      className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 transition-colors cursor-pointer"
                      title={t('share')}
                    >
                      <FiShare2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {deleteConfirmId === m.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(m.id)}
                        disabled={isDeleting}
                        className="px-2 py-1 rounded bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700"
                      >
                        {isDeleting ? '...' : t('confirm')}
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[11px]"
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(m.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title={t('delete')}
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Share Modal */}
      {shareModalMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiShare2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">{t('shareModalTitle')}</h3>
              </div>
              <button
                onClick={() => setShareModalMatch(null)}
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed">
              {t('shareModalDesc')}
            </p>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {shareModalMatch.shareEnabled ? t('disableLiveSharing') : t('enableLiveSharing')}
              </span>
              <button
                onClick={() => handleToggleShare(shareModalMatch, shareModalMatch.shareEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  shareModalMatch.shareEnabled ? 'bg-emerald-600' : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    shareModalMatch.shareEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {shareModalMatch.shareEnabled ? (
              <div className="space-y-3 pt-2">
                <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between gap-2">
                  <span className="text-xs text-zinc-600 dark:text-zinc-300 font-mono truncate">
                    {getPublicShareUrl(shareModalMatch.shareToken)}
                  </span>
                  <button
                    onClick={() => handleCopyLink(shareModalMatch.shareToken)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shrink-0 transition-colors cursor-pointer"
                  >
                    {copied ? <FiCheck className="w-3.5 h-3.5" /> : <FiCopy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <a
                  href={`/live/${shareModalMatch.shareToken}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <FiExternalLink className="w-4 h-4" />
                  <span>Open Public Fan View</span>
                </a>
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
