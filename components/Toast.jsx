'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl shadow-xl text-sm font-medium transition-all duration-300 transform translate-y-0 ${
              t.type === 'success'
                ? 'bg-emerald-600 text-white border border-emerald-500'
                : t.type === 'error'
                ? 'bg-rose-600 text-white border border-rose-500'
                : 'bg-zinc-800 text-zinc-100 border border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-2.5 mr-2">
              {t.type === 'success' && <FiCheckCircle className="w-5 h-5 shrink-0 text-emerald-200" />}
              {t.type === 'error' && <FiAlertCircle className="w-5 h-5 shrink-0 text-rose-200" />}
              {t.type === 'info' && <FiInfo className="w-5 h-5 shrink-0 text-sky-300" />}
              <span className="leading-snug break-words">{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 rounded-lg hover:bg-black/20 text-white/80 hover:text-white transition-colors shrink-0"
              aria-label="Close"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
