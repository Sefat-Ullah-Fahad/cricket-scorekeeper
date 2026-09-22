import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Link from 'next/link';
import { MdSportsCricket } from 'react-icons/md';
import { FiArrowRight, FiShield, FiRepeat, FiShare2, FiZap, FiCheckCircle } from 'react-icons/fi';

export default async function HomePage() {
  const cookieStore = cookies();
  const token = cookieStore.get('cricket_session')?.value;

  if (token) {
    try {
      const sessionResult = await getSession(token);
      if (sessionResult && sessionResult.user) {
        redirect('/dashboard');
      }
    } catch (e) {}
  }

  return (
    <div className="flex flex-col items-center justify-center py-10 sm:py-16 text-center">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6 border border-emerald-500/20">
        <MdSportsCricket className="w-4 h-4" />
        <span>Full-Stack Production Cricket Scoring</span>
      </div>

      {/* Main Hero */}
      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white max-w-4xl leading-tight">
        Score Every Ball with <br className="hidden sm:inline" />
        <span className="text-emerald-600 dark:text-emerald-400">Absolute Precision & Live Sharing</span>
      </h1>

      <p className="mt-5 text-base sm:text-xl text-zinc-600 dark:text-zinc-300 max-w-2xl leading-relaxed">
        Professional ball-by-ball cricket scoring engine with accurate strike rotation, zero-loss deep undo, instant public live updates, and bilingual support.
      </p>

      {/* CTA Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full max-w-md">
        <Link
          href="/register"
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 transition-all text-base"
        >
          <span>Get Started Free</span>
          <FiArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/login"
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-base"
        >
          <span>Log In</span>
        </Link>
      </div>

      {/* Feature Highlights Grid */}
      <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full text-left">
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-emerald-500/40 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
            <FiZap className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Live Scoring Engine</h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Full support for runs (0-6), extras (WD, NB, BYE, LB), over completions, and official strike changes.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-emerald-500/40 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
            <FiRepeat className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Zero-Loss Undo</h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Every scoring delivery is snapshotted. Undo restores scores, wickets, overs, striker, bowler, and extras exactly.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-emerald-500/40 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
            <FiShare2 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Real-Time Live Sharing</h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Share a public viewer link. Fans and teammates watch real-time score updates with no login required.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-emerald-500/40 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
            <FiShield className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Private & Secure</h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Server-side ownership verification. Every match is private to its creator until explicitly shared.
          </p>
        </div>
      </div>
    </div>
  );
}
