import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import ProfileClient from './ProfileClient';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const cookieStore = cookies();
  const token = cookieStore.get('cricket_session')?.value;

  if (!token) {
    redirect('/login');
  }

  const sessionResult = await getSession(token);
  if (!sessionResult || !sessionResult.user) {
    redirect('/login');
  }

  return <ProfileClient initialUser={sessionResult.user} />;
}
