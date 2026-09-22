import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
const db = new PGlite();
const a = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  b = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
let companyA: string, quoteA: string;
async function user(id: string) {
  await db.exec('reset role; set role authenticated;');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
}
async function scalar(sql: string, params: unknown[] = []) {
  const r = await db.query<Record<string, unknown>>(sql, params);
  return Object.values(r.rows[0])[0];
}
before(async () => {
  await db.exec(
    `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`,
  );
  await db.exec("set timezone='America/Sao_Paulo'");
  const sql = readFileSync('supabase/migrations/20260922085348_retoma.sql', 'utf8').replace(
    'create extension if not exists pgcrypto;',
    '',
  );
  await db.exec(sql);
  await db.query('insert into auth.users values ($1,$3),($2,$3)', [
    a,
    b,
    JSON.stringify({ name: 'teste' }),
  ]);
});
after(() => db.close());
test('signup trigger creates own profile; company bootstrap is atomic and single', async () => {
  await user(a);
  assert.equal(await scalar('select count(*)::int from profiles'), 1);
  companyA = String(await scalar("select create_company('empresa alfa')"));
  assert.equal(await scalar('select count(*)::int from company_members'), 1);
  await assert.rejects(db.query("select create_company('duplicada')"), /already exists/);
});
test('a quote creates precisely the day 1, 3 and 7 schedule', async () => {
  await user(a);
  quoteA = String(
    await scalar(
      "select save_quote('cliente alfa','5561999999999','ppf',480000,(now() at time zone 'America/Sao_Paulo')::date-4,'')",
    ),
  );
  const r = await db.query<{ days: number }>(
    'select f.due_on-q.sent_on as days from followups f join quotes q on q.id=f.quote_id order by step',
  );
  assert.deepEqual(
    r.rows.map((v) => v.days),
    [1, 3, 7],
  );
});
test('tenant b cannot read tenant a profiles, membership, company, quote or followups', async () => {
  await user(b);
  await scalar("select create_company('empresa beta')");
  for (const table of ['quotes', 'followups'])
    assert.equal(await scalar(`select count(*)::int from ${table}`), 0);
  assert.equal(await scalar('select count(*)::int from profiles where id=$1', [a]), 0);
  assert.equal(await scalar('select count(*)::int from companies where id=$1', [companyA]), 0);
  assert.equal(
    await scalar('select count(*)::int from company_members where company_id=$1', [companyA]),
    0,
  );
});
test('tenant b cannot mutate an a quote through any RPC', async () => {
  await user(b);
  await assert.rejects(db.query("select resolve_quote($1,'won')", [quoteA]), /not found/);
  await assert.rejects(
    db.query("select save_quote('hacked','5561999999999','ppf',1,current_date,'',$1)", [quoteA]),
    /not found/,
  );
  await db.exec('reset role');
  const fid = await scalar('select id from followups where quote_id=$1 limit 1', [quoteA]);
  await user(b);
  await assert.rejects(db.query("select complete_followup($1,'oi')", [fid]), /not found/);
});
test('direct writes, forged membership and reassignment are blocked', async () => {
  await user(b);
  await assert.rejects(
    db.query('insert into company_members(company_id,user_id) values($1,$2)', [companyA, b]),
    /permission denied/,
  );
  await assert.rejects(
    db.query('update quotes set company_id=$1', [companyA]),
    /permission denied/,
  );
  await assert.rejects(db.query("update profiles set name='hacked'"), /permission denied/);
});
test('both tenants are denied direct deletion of another company data', async () => {
  for (const [actor, target] of [
    [a, b],
    [b, a],
  ]) {
    await user(target);
    const targetCompany = await scalar('select my_company_id()');
    await user(actor);
    for (const sql of [
      'delete from quotes where company_id=$1',
      'delete from followups where company_id=$1',
      'delete from company_members where company_id=$1',
      'delete from companies where id=$1',
    ])
      await assert.rejects(db.query(sql, [targetCompany]), /permission denied/);
    await assert.rejects(
      db.query('delete from profiles where id=$1', [target]),
      /permission denied/,
    );
    await user(target);
    assert.equal(
      await scalar('select count(*)::int from companies where id=$1', [targetCompany]),
      1,
    );
  }
});
test('anonymous has no data or mutation access', async () => {
  await db.exec("reset role;set role anon;select set_config('request.jwt.claim.sub','',false)");
  await assert.rejects(db.query('select * from quotes'), /permission denied/);
  await assert.rejects(db.query("select create_company('anonymous')"), /permission denied/);
});
test('completion is idempotent, groups overdue steps and preserves future schedule', async () => {
  await user(a);
  const fid = await scalar('select id from followups where quote_id=$1 and step=1', [quoteA]);
  await db.query("select complete_followup($1,'oi, cliente!')", [fid]);
  await db.query("select complete_followup($1,'segunda tentativa')", [fid]);
  assert.equal(
    await scalar(
      'select count(*)::int from followups where quote_id=$1 and completed_at is not null',
      [quoteA],
    ),
    1,
  );
  assert.equal(
    await scalar(
      'select count(*)::int from followups where quote_id=$1 and skipped_at is not null',
      [quoteA],
    ),
    1,
  );
  assert.equal(
    await scalar(
      'select count(*)::int from followups where quote_id=$1 and completed_at is null and skipped_at is null',
      [quoteA],
    ),
    1,
  );
  assert.equal(await scalar('select status from quotes where id=$1', [quoteA]), 'awaiting');
});
test('future followup and post-contact date edits are rejected', async () => {
  await user(a);
  const fid = await scalar('select id from followups where quote_id=$1 and step=3', [quoteA]);
  await assert.rejects(db.query("select complete_followup($1,'oi')", [fid]), /unavailable/);
  await assert.rejects(
    db.query(
      "select save_quote('cliente alfa','5561999999999','ppf',480000,(now() at time zone 'America/Sao_Paulo')::date,'',$1)",
      [quoteA],
    ),
    /cannot reschedule/,
  );
});
test('won is idempotent, snapshots cents, closes queue and cannot be overwritten', async () => {
  await user(a);
  await db.query("select resolve_quote($1,'won')", [quoteA]);
  const closed = await scalar('select closed_at::text from quotes where id=$1', [quoteA]);
  await db.query("select resolve_quote($1,'won')", [quoteA]);
  assert.equal(await scalar('select recovered_cents from quotes where id=$1', [quoteA]), 480000);
  assert.equal(await scalar('select closed_at::text from quotes where id=$1', [quoteA]), closed);
  await assert.rejects(
    db.query("select resolve_quote($1,'lost','preço')", [quoteA]),
    /closed quote/,
  );
  await assert.rejects(
    db.query("select save_quote('cliente alfa','5561999999999','ppf',10,current_date,'',$1)", [
      quoteA,
    ]),
    /closed quote/,
  );
});
test('lost requires valid reason and details for other; no recovered revenue', async () => {
  await user(b);
  const id = await scalar(
    "select save_quote('cliente beta','5561999999999','polimento',85000,current_date,'')",
  );
  await assert.rejects(db.query("select resolve_quote($1,'lost')", [id]), /loss reason/);
  await assert.rejects(db.query("select resolve_quote($1,'lost','outro','')", [id]), /loss reason/);
  await assert.rejects(
    db.query("select resolve_quote($1,'lost','invalido')", [id]),
    /check constraint/,
  );
  await db.query("select resolve_quote($1,'lost','preço')", [id]);
  assert.equal(await scalar('select recovered_cents from quotes where id=$1', [id]), null);
});
test('uncontacted schedule follows edited sent date', async () => {
  await user(b);
  const id = await scalar(
    "select save_quote('edição','5561999999999','ppf',50000,current_date,'')",
  );
  await db.query("select save_quote('edição','5561999999999','ppf',60000,current_date-1,'',$1)", [
    id,
  ]);
  const rows = await db.query<{ days: number }>(
    'select f.due_on-q.sent_on as days from followups f join quotes q on q.id=f.quote_id where q.id=$1 order by step',
    [id],
  );
  assert.deepEqual(
    rows.rows.map((r) => r.days),
    [1, 3, 7],
  );
});
test('tenant a cannot read or mutate tenant b data, while b keeps access', async () => {
  await user(b);
  const companyB = await scalar('select my_company_id()');
  const quoteB = await scalar(
    "select save_quote('cliente isolado beta','5561999999999','higienização',45000,current_date-1,'')",
  );
  const followupB = await scalar('select id from followups where quote_id=$1 and step=1', [quoteB]);
  await user(a);
  for (const [sql, id] of [
    ['select count(*)::int from profiles where id=$1', b],
    ['select count(*)::int from company_members where user_id=$1', b],
    ['select count(*)::int from companies where id=$1', companyB],
    ['select count(*)::int from quotes where id=$1', quoteB],
    ['select count(*)::int from followups where id=$1', followupB],
  ] as const)
    assert.equal(await scalar(sql, [id]), 0);
  await assert.rejects(
    db.query("select save_quote('alterado','5561999999999','ppf',1,current_date,'',$1)", [quoteB]),
    /not found/,
  );
  await assert.rejects(
    db.query("select complete_followup($1,'alterado')", [followupB]),
    /not found/,
  );
  await assert.rejects(db.query("select resolve_quote($1,'won')", [quoteB]), /not found/);
  await assert.rejects(db.query("select resolve_quote($1,'lost','preço')", [quoteB]), /not found/);
  await assert.rejects(
    db.query("update companies set name='alterada' where id=$1", [companyB]),
    /permission denied/,
  );
  await user(b);
  assert.equal(await scalar('select amount_cents from quotes where id=$1', [quoteB]), 45000);
  await db.query("select complete_followup($1,'contato autorizado')", [followupB]);
  assert.equal(
    await scalar('select message from followups where id=$1', [followupB]),
    'contato autorizado',
  );
});
test('server rejects invalid phone, nonpositive amount and future date', async () => {
  await user(a);
  await assert.rejects(
    db.query("select save_quote('cliente','123','ppf',10,current_date,'')"),
    /check constraint/,
  );
  await assert.rejects(
    db.query("select save_quote('cliente','5561999999999','ppf',0,current_date,'')"),
    /check constraint/,
  );
  await assert.rejects(
    db.query("select save_quote('cliente','5561999999999','ppf',10,current_date+5,'')"),
    /invalid date/,
  );
});

test('composite foreign key rejects a followup assigned to another company even for a privileged writer', async () => {
  await db.exec('reset role');
  const companyB = await scalar('select company_id from company_members where user_id=$1', [b]);
  await assert.rejects(
    db.query(
      'insert into followups(quote_id,company_id,step,due_on) values($1,$2,1,current_date)',
      [quoteA, companyB],
    ),
    /foreign key|unique constraint/,
  );
  // A fresh quote avoids a unique-step conflict masking the tenant constraint.
  await user(a);
  const id = await scalar(
    "select save_quote('tenant test','5561999999999','ppf',100,current_date,'')",
  );
  await db.exec('reset role');
  await assert.rejects(
    db.query('update followups set company_id=$1 where quote_id=$2', [companyB, id]),
    /foreign key/,
  );
});
