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
