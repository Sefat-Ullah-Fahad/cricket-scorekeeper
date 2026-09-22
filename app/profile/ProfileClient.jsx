'use client';
import React, { useState } from 'react';
import { useApp } from '../../components/LanguageThemeContext';
import { useToast } from '../../components/Toast';
import { FiUser, FiMail, FiShield, FiSave, FiCheck, FiMoon, FiSun, FiGlobe } from 'react-icons/fi';
import { MdSportsCricket } from 'react-icons/md';

export default function ProfileClient({ initialUser }) {
  const [name, setName] = useState(initialUser.name || '');
  const [teamName, setTeamName] = useState(initialUser.teamName || '');
  const [themePref, setThemePref] = useState(initialUser.theme || 'dark');
  const [langPref, setLangPref] = useState(initialUser.language || 'en');
  const [saving, setSaving] = useState(false);

  const { setUser, setTheme, setLanguage, t, language } = useApp();
  const toast = useToast();

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          teamName: teamName.trim(),
          theme: themePref,
          language: langPref,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setTheme(themePref);
        setLanguage(langPref);
        toast.success(t('profileUpdated'));
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('[PROFILE ERROR]', err);
      toast.error('Network error updating profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6">
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl">
        {/* User Identity Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800 mb-6">
          {initialUser.image ? (
            <img
              src={initialUser.image}
              alt={initialUser.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-emerald-600/30">
              {initialUser.name ? initialUser.name[0].toUpperCase() : 'U'}
            </div>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {initialUser.name}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{initialUser.email}</p>
            <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <FiShield className="w-3 h-3" />
              <span>Verified Account</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Email (Read Only) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
              {t('email')} (Fixed)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <FiMail className="w-4 h-4" />
              </div>
              <input
                type="email"
                disabled
                value={initialUser.email}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/40 text-zinc-500 text-sm cursor-not-allowed"
              />
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              {t('name')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <FiUser className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Favorite Team Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              {t('teamName')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <MdSportsCricket className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Dhaka Dynamites / India"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Theme & Language Preferences */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                {t('theme')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setThemePref('dark')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                    themePref === 'dark'
                      ? 'bg-zinc-900 text-white border-emerald-500'
                      : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <FiMoon className="w-3.5 h-3.5" />
                  <span>Dark</span>
                </button>
                <button
                  type="button"
                  onClick={() => setThemePref('light')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                    themePref === 'light'
                      ? 'bg-zinc-100 text-zinc-900 border-emerald-500'
                      : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <FiSun className="w-3.5 h-3.5" />
                  <span>Light</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                {t('language')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLangPref('en')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                    langPref === 'en'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <FiGlobe className="w-3.5 h-3.5" />
                  <span>English</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLangPref('bn')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                    langPref === 'bn'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <FiGlobe className="w-3.5 h-3.5" />
                  <span>বাংলা</span>
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-sm shadow-md shadow-emerald-600/30 transition-all mt-4"
          >
            {saving ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <FiSave className="w-4 h-4" />
                <span>{t('saveChanges')}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
