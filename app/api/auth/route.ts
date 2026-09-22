import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer, configured } from '@/lib/supabase/server';
import { fail } from '@/lib/api';
const schema = z.object({
  mode: z.enum(['signin', 'signup', 'recover', 'password', 'signout']),
  email: z.email().optional(),
  password: z.string().min(8, 'use pelo menos 8 caracteres.').max(128).optional(),
  name: z.string().trim().min(2).max(80).optional(),
});
export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin)
    return fail('origem inválida.', 403);
  if (!configured())
    return fail(
      'o cadastro ainda não está disponível neste ambiente. você pode explorar a demonstração.',
      503,
    );
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return fail('confira os campos. a senha precisa ter pelo menos 8 caracteres.');
  const { mode, email, password, name } = parsed.data;
  const db = await supabaseServer();
  const site = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, '');
  if (mode === 'signout') {
    const { error } = await db.auth.signOut();
    return error
      ? fail('não foi possível sair. tente novamente.')
      : NextResponse.json({ redirect: '/entrar' });
  }
  if (mode === 'recover') {
    if (!email) return fail('informe seu e-mail.');
    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: site + '/auth/callback?next=/nova-senha',
    });
    if (error)
      return fail('não foi possível solicitar o link agora. tente novamente em alguns minutos.');
    return NextResponse.json({
      message: 'se este e-mail estiver cadastrado, você receberá um link para recuperar o acesso.',
    });
  }
  if (mode === 'password') {
    if (!password) return fail('informe uma senha.');
    const {
      data: { user },
    } = await db.auth.getUser();
    if (!user) return fail('o link expirou. solicite outro.', 401);
    const { error } = await db.auth.updateUser({ password });
    return error
      ? fail('não foi possível alterar a senha. solicite um novo link.')
      : NextResponse.json({ redirect: '/app' });
  }
  if (!email || !password) return fail('informe seu e-mail e senha.');
  if (mode === 'signup') {
    if (!name) return fail('informe seu nome.');
    const { data, error } = await db.auth.signUp({
      email,
      password,
      options: { data: { name }, emailRedirectTo: site + '/auth/callback' },
    });
    if (error)
      return fail(
        'não foi possível criar sua conta. confira os dados ou tente recuperar o acesso.',
      );
    return NextResponse.json(
      data.session
        ? { redirect: '/app' }
        : {
            message:
              'confira seu e-mail para confirmar o cadastro e começar. se já tem conta, entre ou recupere o acesso.',
          },
    );
  }
  const { error } = await db.auth.signInWithPassword({ email, password });
  return error
    ? fail('e-mail ou senha inválidos. confira também se você confirmou seu e-mail.', 401)
    : NextResponse.json({ redirect: '/app' });
}
