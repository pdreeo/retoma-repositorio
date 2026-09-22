import { NextResponse } from 'next/server';
import { supabaseServer, configured } from './supabase/server';
export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
export async function authenticated(request?: Request) {
  if (request && request.method !== 'GET') {
    const origin = request.headers.get('origin');
    if (!origin || origin !== new URL(request.url).origin)
      return { error: fail('origem da solicitação inválida.', 403) };
  }
  if (!configured())
    return {
      error: fail('o ambiente ainda não foi configurado. a demonstração está disponível.', 503),
    };
  const db = await supabaseServer();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) return { error: fail('entre novamente para continuar.', 401) };
  return { db, user };
}
export const databaseError = () =>
  fail('não foi possível salvar. atualize a página e tente novamente.', 400);
