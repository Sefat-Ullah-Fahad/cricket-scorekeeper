import './globals.css';
import { cookies } from 'next/headers';
import { getSession } from '../lib/auth';
import { ToastProvider } from '../components/Toast';
import { LanguageThemeProvider } from '../components/LanguageThemeContext';
import Navbar from '../components/Navbar';

export const metadata = {
  metadataBase: new URL('https://cricket-scorekeeper-ten.vercel.app'),
  title: {
    default: 'Cricket Scorekeeper — Free Online Cricket Scoring App',
    template: '%s | Cricket Scorekeeper',
  },
  description: 'A free ball-by-ball cricket scoring app. Track runs, overs, wickets, and player stats in real time, undo mistakes instantly, and share live scores with a public link.',
  keywords: [
    'cricket scoring app',
    'cricket score keeper',
    'ball by ball cricket scoring',
    'online cricket scorer',
    'live cricket score sharing',
    'cricket match tracker',
  ],
  applicationName: 'Cricket Scorekeeper',
  icons: {
    icon: 'https://res.cloudinary.com/dp08caz1r/image/upload/v1790073691/50488d7c-ea70-4c92-8ac8-27959ce42e14_uetb5f.png',
    apple: 'https://res.cloudinary.com/dp08caz1r/image/upload/v1790073691/50488d7c-ea70-4c92-8ac8-27959ce42e14_uetb5f.png',
  },
  openGraph: {
    title: 'Cricket Scorekeeper — Free Online Cricket Scoring App',
    description: 'Ball-by-ball cricket scoring with real-time stats, undo, and live score sharing. Score your next match easily, on any device.',
    siteName: 'Cricket Scorekeeper',
    type: 'website',
    url: 'https://cricket-scorekeeper-ten.vercel.app',
    images: [
      {
        url: 'https://res.cloudinary.com/dp08caz1r/image/upload/v1790073691/50488d7c-ea70-4c92-8ac8-27959ce42e14_uetb5f.png',
        width: 512,
        height: 512,
        alt: 'Cricket Scorekeeper Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Cricket Scorekeeper — Free Online Cricket Scoring App',
    description: 'Ball-by-ball cricket scoring with real-time stats, undo, and live score sharing.',
    images: ['https://res.cloudinary.com/dp08caz1r/image/upload/v1790073691/50488d7c-ea70-4c92-8ac8-27959ce42e14_uetb5f.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
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
                <p>&copy; {new Date().getFullYear()} © 2026 Cricket Scorekeeper. All rights reserved.</p>
                <div className="flex items-center gap-4 text-zinc-400">
                  <span>Ball-by-Ball Scoring</span>
                  <span>•</span>
                  <span>Live Score Sharing</span>
                  <span>•</span>
                  <span>Secure Match Management</span>
                </div>
              </div>
            </footer>
          </ToastProvider>
        </LanguageThemeProvider>
      </body>
    </html>
  );
}