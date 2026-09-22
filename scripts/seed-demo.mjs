// Run only against a dedicated demo account. No service role is needed.
import { createClient } from '@supabase/supabase-js';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const email = process.env.RETOMA_DEMO_EMAIL;
const password = process.env.RETOMA_DEMO_PASSWORD;
if (!url || !key || !email || !password)
  throw new Error(
    'configure supabase URL/key and RETOMA_DEMO_EMAIL/RETOMA_DEMO_PASSWORD in your local environment.',
  );
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { error: loginError } = await db.auth.signInWithPassword({ email, password });
if (loginError)
  throw new Error('could not sign in to the dedicated demo account. confirm its email first.');
try {
  const { data: members, error: memberError } = await db
    .from('company_members')
    .select('company_id');
  if (memberError) throw memberError;
  if (!members.length) {
    const { error } = await db.rpc('create_company', { p_name: 'vértice estética automotiva' });
    if (error) throw error;
  }
  const { count, error: countError } = await db
    .from('quotes')
    .select('id', { count: 'exact', head: true });
  if (countError) throw countError;
  if (count !== 0)
    throw new Error(
      'seed stopped: the account already contains quotes. use an empty demo account.',
    );
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  function before(days) {
    const date = new Date(today + 'T12:00:00Z');
    date.setUTCDate(date.getUTCDate() - days);
    return date.toISOString().slice(0, 10);
  }
  const rows = [
    ['rafael costa', 'vitrificação cerâmica', 240000, 4],
    ['mariana alves', 'ppf frontal', 480000, 2],
    ['bruno ferreira', 'polimento técnico', 85000, 1],
    ['lucas martins', 'higienização interna', 45000, 0],
    ['camila rocha', 'lavagem detalhada', 18000, 0],
    ['gabriel silva', 'vitrificação cerâmica', 240000, 8],
    ['ana oliveira', 'polimento técnico', 85000, 5],
    ['felipe santos', 'ppf frontal', 480000, 10],
  ];
  for (const [i, [name, service, cents, days]] of rows.entries()) {
    const { data: id, error } = await db.rpc('save_quote', {
      p_customer_name: name,
      p_phone: '5561000000000',
      p_service: service,
      p_amount_cents: cents,
      p_sent_on: before(days),
      p_notes: 'dados fictícios de demonstração. telefone sem destinatário real.',
    });
    if (error) throw error;
    if (i === 0) {
      const { data: followups, error: followError } = await db
        .from('followups')
        .select('id')
        .eq('quote_id', id)
        .eq('step', 1)
        .single();
      if (followError) throw followError;
      const { error } = await db.rpc('complete_followup', {
        p_id: followups.id,
        p_message: 'oi, rafael! conseguiu olhar o orçamento?',
      });
      if (error) throw error;
    }
    if (i === 5 || i === 6 || i === 7) {
      const { error } = await db.rpc('resolve_quote', {
        p_id: id,
        p_status: i === 7 ? 'lost' : 'won',
        p_reason: i === 7 ? 'prazo' : null,
      });
      if (error) throw error;
    }
  }
  console.log('8 fictional quotes created in the dedicated demo account.');
} finally {
  await db.auth.signOut();
}
