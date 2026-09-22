'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '../../components/LanguageThemeContext';
import { useToast } from '../../components/Toast';
import { MdSportsCricket } from 'react-icons/md';
import {
  FiPlus,
  FiPlay,
  FiShare2,
  FiEye,
  FiTrash2,
  FiClock,
  FiCheckCircle,
  FiActivity,
  FiCopy,
  FiCheck,
  FiX,
  FiExternalLink
} from 'react-icons/fi';

export default function DashboardClient({ user, initialMatches = [] }) {
  const [matches, setMatches] = useState(initialMatches);
  const [shareModalMatch, setShareModalMatch] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const { t, language } = useApp();
  const toast = useToast();

  const ongoingMatches = matches.filter(m => m.status === 'LIVE' || m.status === 'INNINGS_BREAK' || m.status === 'PAUSED' || m.status === 'INTERVAL');
  const completedMatches = matches.filter(m => m.status === 'COMPLETED');

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
      console.error('[DELETE ERROR]', err);
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
      const data = await res.json();
      if (res.ok) {
        setMatches(prev =>
          prev.map(m => (m.id === match.id ? { ...m, shareEnabled: nextState } : m))
        );
        toast.success(
          nextState
            ? (language === 'bn' ? 'লাইভ শেয়ারিং চালু হয়েছে।' : 'Live sharing enabled.')
            : (language === 'bn' ? 'লাইভ শেয়ারিং বন্ধ হয়েছে।' : 'Live sharing disabled.')
        );
      } else {
        toast.error(data.error || 'Failed to update share setting');
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
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  return (
    <div className="space-y-8">
      {/* Welcome & Stats Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-900/30 via-zinc-900/60 to-zinc-900/30 border border-emerald-500/20 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {language === 'bn' ? `স্বাগতম, ${user.name}` : `Welcome, ${user.name}`}
            </h1>
            {user.teamName && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                {user.teamName}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {language === 'bn'
              ? 'আপনার তৈরি করা ম্যাচগুলোর লাইভ স্কোর ও ইতিহাস পরিচালনা করুন।'
              : 'Manage and score your cricket matches with real-time live sharing.'}
          </p>
        </div>

        <Link
          href="/matches/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 transition-all text-sm shrink-0"
        >
          <FiPlus className="w-5 h-5" />
          <span>{t('createMatch')}</span>
        </Link>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center gap-3.5 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <FiActivity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{ongoingMatches.length}</div>
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t('ongoingMatches')}</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center gap-3.5 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <FiCheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{completedMatches.length}</div>
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t('completedMatches')}</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center gap-3.5 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <MdSportsCricket className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{matches.length}</div>
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              {language === 'bn' ? 'মোট ম্যাচ' : 'Total Matches'}
            </div>
          </div>
        </div>
      </div>

      {/* Ongoing Matches Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{t('ongoingMatches')}</h2>
          </div>
          <span className="text-xs font-semibold text-zinc-400">({ongoingMatches.length})</span>
        </div>

        {ongoingMatches.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mb-3">
              <MdSportsCricket className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{t('noOngoingMatches')}</h3>
            <Link
              href="/matches/new"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              <FiPlus className="w-4 h-4" />
              <span>{t('createMatch')}</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ongoingMatches.map(m => {
              const activeInn = m.currentInnings === 1 ? m.innings1 : m.innings2;
              const formattedOvers = activeInn ? `${Math.floor(activeInn.legalBalls / 6)}.${activeInn.legalBalls % 6}` : '0.0';
              return (
                <div
                  key={m.id}
                  className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-emerald-500/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Teams & Status */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                        m.status === 'PAUSED' || m.status === 'INTERVAL'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {m.status === 'LIVE' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>}
                        {m.status === 'PAUSED' || m.status === 'INTERVAL'
                          ? (m.currentInterval?.note || 'PAUSED')
                          : m.status === 'INNINGS_BREAK' ? t('inningsBreak') : t('live')}
                      </span>
                      <span className="text-xs text-zinc-400 font-medium">{m.overs} {t('overs')}</span>
                    </div>

                    {/* Match Score Display */}
                    <div className="space-y-1.5 my-3">
                      <div className="flex items-center justify-between text-base font-bold text-zinc-900 dark:text-zinc-100">
                        <span className="truncate max-w-[160px]">{m.teamA}</span>
                        <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                          {m.innings1 ? `${m.innings1.score}/${m.innings1.wickets}` : 'Yet to bat'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-base font-bold text-zinc-900 dark:text-zinc-100">
                        <span className="truncate max-w-[160px]">{m.teamB}</span>
                        <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                          {m.innings2 ? `${m.innings2.score}/${m.innings2.wickets}` : (m.currentInnings === 2 ? '0/0' : '-')}
                        </span>
                      </div>
                    </div>

                    {/* Active Inning Highlight */}
                    <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/40 text-xs text-zinc-600 dark:text-zinc-300 space-y-1 mt-3">
                      <div className="flex items-center justify-between font-medium">
                        <span>{t('batter')}: {activeInn?.striker || '-'}</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {activeInn?.score || 0}/{activeInn?.wickets || 0} ({formattedOvers} ov)
                        </span>
                      </div>
                      {m.currentInnings === 2 && m.target && (
                        <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                          {t('target')}: {m.target} (Need {m.target - (activeInn?.score || 0)} runs)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <Link
                      href={`/matches/${m.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm"
                    >
                      <FiPlay className="w-3.5 h-3.5 fill-white" />
                      <span>{t('resumeMatch')}</span>
                    </Link>

                    <button
                      onClick={() => setShareModalMatch(m)}
                      className={`p-2 rounded-xl border text-xs font-semibold transition-colors ${
                        m.shareEnabled
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                      title={t('liveSharing')}
                      aria-label="Share"
                    >
                      <FiShare2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeleteConfirmId(m.id)}
                      className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title={t('deleteMatch')}
                      aria-label="Delete"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Completed Matches Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-sky-500" />
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{t('completedMatches')}</h2>
          </div>
          <Link href="/matches" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
            {language === 'bn' ? 'সবগুলো দেখুন' : 'View All'} &rarr;
          </Link>
        </div>

        {completedMatches.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500">
            {t('noCompletedMatches')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {completedMatches.slice(0, 3).map(m => (
              <div
                key={m.id}
                className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                      {t('completed')}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-2">
                    {m.teamA} vs {m.teamB}
                  </div>

                  <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                    {m.innings1?.battingTeam}: {m.innings1?.score}/{m.innings1?.wickets}
                    {m.innings2 && ` | ${m.innings2?.battingTeam}: ${m.innings2?.score}/${m.innings2?.wickets}`}
                  </div>

                  <div className="mt-3 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {m.result || t('completed')}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <Link
                    href={`/matches/${m.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold transition-colors"
                  >
                    <FiEye className="w-3.5 h-3.5" />
                    <span>{t('viewScorecard')}</span>
                  </Link>

                  <button
                    onClick={() => setDeleteConfirmId(m.id)}
                    className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title={t('deleteMatch')}
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Share Live Score Modal */}
      {shareModalMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiShare2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{t('shareModalTitle')}</h3>
              </div>
              <button
                onClick={() => setShareModalMatch(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {t('shareModalDesc')}
            </p>

            {/* Toggle Live Sharing Switch */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {shareModalMatch.shareEnabled ? t('disableLiveSharing') : t('enableLiveSharing')}
              </span>
              <button
                onClick={async () => {
                  await handleToggleShare(shareModalMatch, shareModalMatch.shareEnabled);
                  setShareModalMatch(prev => ({ ...prev, shareEnabled: !prev.shareEnabled }));
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shrink-0 transition-colors"
                  >
                    {copied ? <FiCheck className="w-3.5 h-3.5" /> : <FiCopy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <a
                    href={`/live/${shareModalMatch.shareToken}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <FiExternalLink className="w-4 h-4" />
                    <span>Open Viewer Page</span>
                  </a>

                  {typeof navigator !== 'undefined' && navigator.share && (
                    <button
                      onClick={() => {
                        navigator.share({
                          title: `${shareModalMatch.teamA} vs ${shareModalMatch.teamB} Live Cricket Score`,
                          text: `Watch live cricket score between ${shareModalMatch.teamA} and ${shareModalMatch.teamB}`,
                          url: getPublicShareUrl(shareModalMatch.shareToken),
                        }).catch(() => {});
                      }}
                      className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold"
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

      {/* Delete Confirmation Modal (NO browser confirm!) */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <FiTrash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{t('confirmDeleteTitle')}</h3>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {t('confirmDeleteMsg')}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              >
                {isDeleting ? 'Deleting…' : t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
