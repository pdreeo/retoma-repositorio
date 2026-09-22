import { AuthForm } from '@/components/auth-form';
export const metadata = { title: 'recuperar acesso' };
export default function Page() {
  return <AuthForm mode="recover" />;
}
