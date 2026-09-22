'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useApp } from './LanguageThemeContext';
import { useToast } from './Toast';
import { MdSportsCricket } from 'react-icons/md';
import { FiSun, FiMoon, FiGlobe, FiPlus, FiLogOut, FiUser, FiMenu, FiX, FiLayers, FiList } from 'react-icons/fi';

export default function Navbar() {
  const { user, setUser, language, setLanguage, theme, toggleTheme, t } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setUser(null);
        toast.success(language === 'bn' ? 'সফলভাবে লগআউট হয়েছে।' : 'Logged out successfully.');
        router.push('/login');
        router.refresh();
      } else {
        toast.error('Failed to log out');
      }
    } catch (err) {
      console.error('[AUTH ERROR] Logout failed:', err);
      toast.error('Network error during logout');
    } finally {
      setIsLoggingOut(false);
      setMobileMenuOpen(false);
    }
  };

  const isActive = (path) => pathname === path;

  return (
    <nav className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-zinc-950/90 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              <MdSportsCricket className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight tracking-tight text-zinc-900 dark:text-zinc-50">
                {t('appName')}
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-emerald-600 dark:text-emerald-400">
                Pro Scorekeeper
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1.5">
            {user && (
              <>
                <Link
                  href="/dashboard"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  {t('dashboard')}
                </Link>
                <Link
                  href="/matches"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/matches')
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  {t('matchHistory')}
                </Link>
              </>
            )}

            {/* All Match — always visible, whether logged in or not.
                If the user is not authenticated, the /all-match page itself
                redirects to /login (see app/all-match/page.jsx). */}
            <Link
              href="/all-match"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/all-match')
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
              }`}
            >
              {language === 'bn' ? 'সকল ম্যাচ' : 'All Match'}
            </Link>

            {user && (
              <Link
                href="/matches/new"
                className="ml-2 flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
              >
                <FiPlus className="w-4 h-4" />
                <span>{t('createMatch')}</span>
              </Link>
            )}
          </div>

          {/* Right Action Tools: Language, Theme, Profile/Logout */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Toggle Language"
            >
              <FiGlobe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'en' ? 'বাংলা' : 'English'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <FiSun className="w-4 h-4 text-amber-400" /> : <FiMoon className="w-4 h-4 text-zinc-700" />}
            </button>

            {/* User Profile & Logout */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 p-1.5 pr-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
                >
                  {user.image ? (
                    <img src={user.image} alt={user.name} className="w-7 h-7 rounded-full object-cover border border-emerald-500" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-600/30">
                      {user.name ? user.name[0].toUpperCase() : 'U'}
                    </div>
                  )}
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 max-w-[120px] truncate">
                    {user.name}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="p-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title={t('logout')}
                  aria-label={t('logout')}
                >
                  <FiLogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  {t('login')}
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
                >
                  {t('register')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
              className="px-2 py-1 rounded text-xs font-bold border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200"
            >
              {language === 'en' ? 'বাং' : 'EN'}
            </button>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
              aria-label="Theme"
            >
              {theme === 'dark' ? <FiSun className="w-4 h-4 text-amber-400" /> : <FiMoon className="w-4 h-4 text-zinc-700" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 pt-3 pb-5 space-y-2 shadow-xl">
          {user && (
            <div className="flex items-center gap-3 p-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-2">
              {user.image ? (
                <img src={user.image} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
              )}
              <div>
                <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{user.name}</div>
                <div className="text-xs text-zinc-500 truncate max-w-[200px]">{user.email}</div>
              </div>
            </div>
          )}

          {user && (
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <FiLayers className="w-4 h-4 text-emerald-600" />
              <span>{t('dashboard')}</span>
            </Link>
          )}

          {user && (
            <Link
              href="/matches"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <MdSportsCricket className="w-4 h-4 text-emerald-600" />
              <span>{t('matchHistory')}</span>
            </Link>
          )}

          {/* All Match — always visible on mobile too */}
          <Link
            href="/all-match"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <FiList className="w-4 h-4 text-emerald-600" />
            <span>{language === 'bn' ? 'সকল ম্যাচ' : 'All Match'}</span>
          </Link>

          {user ? (
            <>
              <Link
                href="/matches/new"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 text-white"
              >
                <FiPlus className="w-4 h-4" />
                <span>{t('createMatch')}</span>
              </Link>
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <FiUser className="w-4 h-4 text-emerald-600" />
                <span>{t('profile')}</span>
              </Link>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <FiLogOut className="w-4 h-4" />
                <span>{t('logout')}</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-center font-medium rounded-lg text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700"
              >
                {t('login')}
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-center font-medium rounded-lg bg-emerald-600 text-white shadow-sm"
              >
                {t('register')}
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}