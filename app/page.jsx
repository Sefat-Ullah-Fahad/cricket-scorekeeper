import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Link from 'next/link';
import { MdSportsCricket } from 'react-icons/md';
import { FiArrowRight, FiShield, FiRepeat, FiShare2, FiZap, FiCheckCircle, FiUserPlus, FiPlusCircle, FiRotateCcw, FiSave } from 'react-icons/fi';

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
        <span>সহজ ও নির্ভুল ক্রিকেট স্কোরিং</span>
      </div>

      {/* Main Hero */}
      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white max-w-4xl leading-tight">
        প্রতিটি বলের স্কোর রাখুন <br className="hidden sm:inline" />
        <span className="text-emerald-600 dark:text-emerald-400">সহজেই</span>
      </h1>

      <p className="mt-5 text-base sm:text-xl text-zinc-600 dark:text-zinc-300 max-w-2xl leading-relaxed">
        Cricket Scorekeeper ব্যবহার করে আপনার ক্রিকেট ম্যাচের প্রতিটি বল, রান, উইকেট ও ওভার সহজে হিসাব রাখুন এবং চাইলে ম্যাচের Live Score সবার সাথে শেয়ার করুন।
      </p>

      {/* CTA Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full max-w-md">
        <Link
          href="/register"
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 transition-all text-base"
        >
          <span>শুরু করুন</span>
          <FiArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/login"
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-base"
        >
          <span>লগইন করুন</span>
        </Link>
      </div>

      {/* How It Works */}
      <div className="mt-24 w-full text-left">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-zinc-900 dark:text-zinc-50 mb-2">
          কীভাবে ব্যবহার করবেন?
        </h2>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm mb-4">
              ১
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">অ্যাকাউন্ট তৈরি করুন</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              প্রথমে Register করে আপনার একটি অ্যাকাউন্ট তৈরি করুন। Google অথবা Email &amp; Password দিয়ে সহজেই শুরু করতে পারবেন।
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm mb-4">
              ২
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">নতুন ম্যাচ তৈরি করুন</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Dashboard থেকে New Match নির্বাচন করুন। দুই দলের নাম, ম্যাচের তথ্য এবং প্রয়োজনীয় Player যোগ করে ম্যাচ শুরু করুন।
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm mb-4">
              ৩
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">বল অনুযায়ী স্কোর দিন</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              প্রতিটি বলে ০, ১, ২, ৩, ৪, ৬, Wide, No Ball, Bye, Leg Bye অথবা Wicket নির্বাচন করুন। অ্যাপ স্বয়ংক্রিয়ভাবে Score, Over, Strike এবং Player Statistics হিসাব করবে।
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm mb-4">
              ৪
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">ভুল হলে Undo করুন</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              স্কোর দিতে কোনো ভুল হলে Undo ব্যবহার করে আগের অবস্থায় ফিরে যেতে পারবেন।
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm mb-4">
              ৫
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">ম্যাচ Save ও Resume করুন</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              ম্যাচের সব তথ্য স্বয়ংক্রিয়ভাবে সংরক্ষিত থাকবে। পরে আবার Dashboard থেকে ম্যাচটি খুলে যেখানে শেষ করেছিলেন সেখান থেকেই চালিয়ে যেতে পারবেন।
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm mb-4">
              ৬
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Live Score শেয়ার করুন</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              ম্যাচ চলাকালীন Live Score Sharing চালু করে একটি Public Link তৈরি করুন। সেই Link অন্যদের দিলে তারা Login ছাড়াই Live Score দেখতে পারবে।
            </p>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="mt-24 w-full text-left">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-zinc-900 dark:text-zinc-50 mb-10">
          দ্রুত ও নির্ভুল স্কোরিং
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-emerald-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <FiZap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">দ্রুত ও নির্ভুল স্কোরিং</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              প্রতিটি বলের রান, উইকেট, Extra এবং Over স্বয়ংক্রিয়ভাবে হিসাব করুন।
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-emerald-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <FiRepeat className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">সহজ Undo System</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              ভুল স্কোর হলে এক ক্লিকেই আগের অবস্থায় ফিরে যান।
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-emerald-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <FiShare2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Live Score Sharing</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              একটি Link শেয়ার করেই বন্ধু, খেলোয়াড় বা দর্শকদের Live Score দেখান।
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-emerald-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <FiShield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">নিরাপদ Match Management</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              আপনার তৈরি ম্যাচ ও ব্যক্তিগত তথ্য শুধু আপনিই পরিচালনা করতে পারবেন।
            </p>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-24 w-full p-10 sm:p-14 rounded-3xl bg-emerald-600 text-white text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold">
          আপনার পরবর্তী ম্যাচের স্কোর রাখা শুরু করুন
        </h2>
        <p className="mt-3 text-sm sm:text-base text-emerald-50/90 max-w-xl mx-auto">
          একটি অ্যাকাউন্ট তৈরি করুন, ম্যাচ শুরু করুন এবং প্রতিটি বলের হিসাব সহজভাবে সংরক্ষণ করুন।
        </p>
        <Link
          href="/register"
          className="mt-7 inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg transition-all text-base"
        >
          <span>ম্যাচ শুরু করুন</span>
          <FiArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}