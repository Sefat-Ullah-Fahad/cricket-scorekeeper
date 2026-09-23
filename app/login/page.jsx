'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '../../components/LanguageThemeContext';
import { useToast } from '../../components/Toast';
import { MdSportsCricket } from 'react-icons/md';
import { FcGoogle } from 'react-icons/fc';
import { FiMail, FiLock, FiArrowRight, FiAlertCircle } from 'react-icons/fi';
import CricketBallLoader from '@/components/CricketBallLoader';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { setUser, t, language } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const oauthError = searchParams.get('error');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage(language === 'bn' ? 'অনুগ্রহ করে ইমেইল ও পাসওয়ার্ড প্রদান করুন।' : 'Please enter email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Login failed');
        toast.error(data.error || 'Login failed');
      } else {
        setUser(data.user);
        toast.success(language === 'bn' ? 'সফলভাবে লগইন হয়েছে!' : 'Logged in successfully!');
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      console.error('[AUTH ERROR] Login request failed:', err);
      setErrorMessage('Network error. Please try again.');
      toast.error('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center py-8">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-emerald-600 text-white items-center justify-center mb-3 shadow-md shadow-emerald-600/30">
            <MdSportsCricket className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t('login')}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            {language === 'bn' ? 'আপনার অ্যাকাউন্টে প্রবেশ করে লাইভ স্কোরিং শুরু করুন' : 'Sign in to access your cricket matches and live scoring'}
          </p>
        </div>

        {/* OAuth / Server Error Alert */}
        {(errorMessage || oauthError) && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-2.5 text-xs sm:text-sm text-rose-700 dark:text-rose-300">
            <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              {errorMessage || (
                oauthError === 'google_oauth_not_configured'
                  ? 'Google OAuth credentials not configured in .env. Please sign in with Email & Password or configure GOOGLE_CLIENT_ID.'
                  : 'Authentication error occurred. Please try again.'
              )}
            </div>
          </div>
        )}

        {/* Google Login Button */}
        <a
          href="/api/auth/google"
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/70 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium text-sm text-zinc-800 dark:text-zinc-200 shadow-sm transition-all"
        >
          <FcGoogle className="w-5 h-5 shrink-0" />
          <span>{t('continueWithGoogle')}</span>
        </a>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-zinc-900 px-3 text-zinc-400 font-semibold tracking-wider">
              {language === 'bn' ? 'অথবা ইমেইল দিয়ে' : 'Or with Email'}
            </span>
          </div>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              {t('email')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <FiMail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="scorer@cricket.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              {t('password')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <FiLock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all mt-2"
          >
            {loading ? (
              <CricketBallLoader size={16} />
            ) : (
              <>
                <span>{t('login')}</span>
                <FiArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Switch */}
        <div className="mt-6 text-center text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          <span>{language === 'bn' ? 'অ্যাকাউন্ট নেই?' : "Don't have an account?"}{' '}</span>
          <Link href="/register" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
            {t('register')}
          </Link>
        </div>
      </div>
    </div>
  );
}
