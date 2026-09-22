import { AuthForm } from '@/components/auth-form';
export const metadata = { title: 'entrar' };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return <AuthForm mode="signin" linkError={(await searchParams).error === 'link'} />;
}
