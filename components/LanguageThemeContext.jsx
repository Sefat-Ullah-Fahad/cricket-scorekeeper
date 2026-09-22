'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../lib/translations';

const AppContext = createContext(null);

export function LanguageThemeProvider({ children, initialUser = null }) {
  const [user, setUser] = useState(initialUser);
  const [language, setLanguage] = useState(initialUser?.language || 'en');
  const [theme, setTheme] = useState(initialUser?.theme || 'dark');

  // Sync theme with HTML document class
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      localStorage.setItem('cricket_theme', theme);
    }
  }, [theme]);

  // Sync language with localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('cricket_lang');
      if (savedLang && !initialUser?.language) {
        setLanguage(savedLang);
      }
      const savedTheme = localStorage.getItem('cricket_theme');
      if (savedTheme && !initialUser?.theme) {
        setTheme(savedTheme);
      }
    }
  }, [initialUser]);

  // SELF-HEALING FALLBACK:
  // If the server (RootLayout) failed to resolve a logged-in user — e.g. a
  // transient MongoDB connection hiccup in the serverless environment — try
  // once, client-side, to confirm the session directly. This prevents the
  // navbar from showing "Log In / Create Account" while the rest of the app
  // (which may fetch its own data independently) correctly shows the user
  // as logged in.
  useEffect(() => {
    if (user) return; // already have a user from the server, nothing to do
    if (typeof window === 'undefined') return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'include' });
        if (!res.ok) return; // genuinely not logged in (401) — leave user as null
        const data = await res.json();
        if (!cancelled && data && data.user) {
          setUser(data.user);
        }
      } catch (err) {
        // Network/parse error — silently ignore, navbar just stays logged-out looking
        console.error('[SESSION SYNC] Fallback session check failed:', err.message);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only

  const changeLanguage = (newLang) => {
    setLanguage(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cricket_lang', newLang);
    }
  };

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  const t = (key) => {
    const dict = translations[language] || translations.en;
    return dict[key] || translations.en[key] || key;
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        language,
        setLanguage: changeLanguage,
        theme,
        setTheme: changeTheme,
        toggleTheme,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within LanguageThemeProvider');
  }
  return context;
}