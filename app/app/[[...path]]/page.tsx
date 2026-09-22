import { redirect } from 'next/navigation';
import { WorkspaceApp } from '@/components/workspace';
import { configured, supabaseServer } from '@/lib/supabase/server';
export const metadata = {
  title: 'meu dia',
  robots: { index: false, follow: false },
};
export default async function AppPage() {
  if (configured()) {
    const db = await supabaseServer();
    const {
      data: { user },
    } = await db.auth.getUser();
    if (!user) redirect('/entrar');
  }
  return <WorkspaceApp />;
}
