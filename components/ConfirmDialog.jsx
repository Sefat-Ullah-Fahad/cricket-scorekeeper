'use client';
import React from 'react';
import { createPortal } from 'react-dom';
import { FiAlertTriangle } from 'react-icons/fi';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  danger = true,
}) {
  if (!open) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${
            danger
              ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
              : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
          }`}>
            <FiAlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
              {title}
            </h3>
            {message && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {message}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors shadow-sm ${
              danger
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}