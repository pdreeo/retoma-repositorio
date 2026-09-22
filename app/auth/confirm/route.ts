import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  if (token_hash && (type === 'signup' || type === 'recovery' || type === 'email')) {
    const db = await supabaseServer();
    const { error } = await db.auth.verifyOtp({ type, token_hash });
    if (!error)
      return NextResponse.redirect(
        new URL(type === 'recovery' ? '/nova-senha' : '/app', url.origin),
      );
  }
  return NextResponse.redirect(new URL('/entrar?error=link', url.origin));
}
