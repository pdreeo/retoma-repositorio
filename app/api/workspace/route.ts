import { NextResponse } from 'next/server';
import { authenticated, fail } from '@/lib/api';
import type { Quote } from '@/lib/domain';
export async function GET() {
  const auth = await authenticated();
  if (auth.error) return auth.error;
  const { db, user } = auth;
  const [profile, membership] = await Promise.all([
    db.from('profiles').select('name').eq('id', user.id).single(),
    db.from('company_members').select('company_id').eq('user_id', user.id).maybeSingle(),
  ]);
  if (profile.error || membership.error)
    return fail('não foi possível carregar sua conta. tente novamente.', 500);
  if (!membership.data)
    return NextResponse.json(
      { profile: profile.data, company: null, quotes: [] },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  const company = await db
    .from('companies')
    .select('id,name,timezone')
    .eq('id', membership.data.company_id)
    .single();
  if (company.error) return fail('não foi possível carregar sua empresa.', 500);
  // Supabase limits rows per response; fetch every page so metrics stay correct.
  const quotes: Quote[] = [];
  for (let offset = 0; ; offset += 500) {
    const page = await db
      .from('quotes')
      .select('*,followups(*)')
      .order('sent_on', { ascending: false })
      .order('id')
      .range(offset, offset + 499);
    if (page.error) return fail('não foi possível carregar os orçamentos.', 500);
    quotes.push(...(page.data as Quote[]));
    if (page.data.length < 500) break;
  }
  return NextResponse.json(
    { profile: profile.data, company: company.data, quotes },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
