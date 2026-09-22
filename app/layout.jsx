import './globals.css';
import { cookies } from 'next/headers';
import { getSession } from '../lib/auth';
import { ToastProvider } from '../components/Toast';
import { LanguageThemeProvider } from '../components/LanguageThemeContext';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'Cricket Scorekeeper — Live Scoring & Match Tracker',
  description: 'A complete production-ready full-stack cricket scoring and live match tracking web application with ball-by-ball scoring, undo, and live sharing.',
  openGraph: {
    title: 'Cricket Scorekeeper — Live Scoring & Match Tracker',
    description: 'A complete production-ready full-stack cricket scoring and live match tracking web application.',
    siteName: 'Cricket Scorekeeper',
    type: 'website',
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
};

export default async function RootLayout({ children }) {
  const cookieStore = cookies();
  const token = cookieStore.get('cricket_session')?.value;
  let user = null;

  if (token) {
    try {
      const sessionResult = await getSession(token);
      if (sessionResult && sessionResult.user) {
        user = sessionResult.user;
      }
    } catch (err) {
      console.error('[AUTH ERROR] RootLayout session verification:', err.message);
    }
  }

  return (
    <html lang="en" className={user?.theme === 'light' ? '' : 'dark'}>
      <body className="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white">
        <LanguageThemeProvider initialUser={user}>
          <ToastProvider>
            <Navbar />
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </main>
            <footer className="w-full border-t border-zinc-200 dark:border-zinc-800/80 py-6 text-center text-xs text-zinc-500 dark:text-zinc-500">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p>&copy; {new Date().getFullYear()} Cricket Scorekeeper. Full-Stack Production System.</p>
                <div className="flex items-center gap-4 text-zinc-400">
                  <span>Ball-by-Ball Live Scoring</span>
                  <span>•</span>
                  <span>Real-time SSE Sync</span>
                  <span>•</span>
                  <span>Zero-Loss Undo</span>
                </div>
              </div>
            </footer>
          </ToastProvider>
        </LanguageThemeProvider>
      </body>
    </html>
  );
}
