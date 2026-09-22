import { AuthForm } from '@/components/auth-form';
export const metadata = { title: 'nova senha', robots: { index: false } };
export default function Page() {
  return <AuthForm mode="password" />;
}
