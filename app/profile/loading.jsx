import CricketBallLoader from '@/components/CricketBallLoader';

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <CricketBallLoader size={56} />
      <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Loading...</p>
    </div>
  );
}