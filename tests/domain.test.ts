import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays,
  todayBR,
  parseMoney,
  normalizePhone,
  metrics,
  nextFollowup,
  prioritized,
  suggestion,
  whatsappUrl,
  type Quote,
} from '../lib/domain';
import { quoteSchema } from '../lib/validation';
import { demoWorkspace } from '../lib/demo';
test('dates use brazil calendar, including UTC month boundary', () => {
  assert.equal(todayBR(new Date('2026-10-01T02:30:00Z')), '2026-09-30');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2028-02-28', 1), '2028-02-29');
});
test('money is parsed in integer cents without binary rounding', () => {
  assert.equal(parseMoney('1.250,99'), 125099);
  assert.equal(parseMoney('0,29'), 29);
  assert.equal(parseMoney('0.29'), 29);
  assert.equal(parseMoney('1.250'), 125000);
  assert.equal(parseMoney('1250.50'), 125050);
  assert.ok(Number.isNaN(parseMoney('1.2.3')));
  assert.equal(parseMoney('49'), 4900);
  assert.ok(Number.isNaN(parseMoney('1,999')));
  assert.ok(Number.isNaN(parseMoney('-5')));
});
test('phone normalization and whatsapp message encoding', () => {
  assert.equal(normalizePhone('(61) 99999-9999'), '5561999999999');
  assert.equal(normalizePhone('+55 61 99999-9999'), '5561999999999');
  assert.equal(
    new URL(whatsappUrl('5561999999999', 'oi, joão! & você?')).searchParams.get('text'),
    'oi, joão! & você?',
  );
});
test('client messages use natural capitalization and preserve names and service spelling', () => {
  const quote = {
    ...demoWorkspace().quotes[1],
    customer_name: 'anna maria',
    service: 'Landing Page + PPF',
  };
  assert.equal(
    suggestion(quote),
    'Oi, Anna! Conseguiu dar uma olhada no orçamento de Landing Page + PPF? Se tiver alguma dúvida, me chama aqui.',
  );
  quote.followups = quote.followups.map((f) =>
    f.step === 1 ? { ...f, completed_at: '2026-09-21T12:00:00Z' } : f,
  );
  assert.equal(
    suggestion(quote),
    'Oi, Anna! Passando pra saber se você ainda tem interesse em Landing Page + PPF. Posso te ajudar com alguma dúvida?',
  );
  quote.followups = quote.followups.map((f) =>
    f.step === 2 ? { ...f, completed_at: '2026-09-22T12:00:00Z' } : f,
  );
  quote.customer_name = 'éverton';
  assert.equal(
    suggestion(quote),
    'Oi, Éverton! Ainda faz sentido pra você seguir com Landing Page + PPF? Se preferir deixar pra depois, tudo bem. Me avisa por aqui.',
  );
  assert.equal(new URL(whatsappUrl(quote.phone, suggestion(quote))).searchParams.get('text'), suggestion(quote));
  quote.customer_name = "D'ÁVILA";
  assert.match(suggestion(quote), /^Oi, D'Ávila!/);
  quote.customer_name = 'McDonald';
  assert.match(suggestion(quote), /^Oi, McDonald!/);
});
test('validation rejects malformed dates, future quotes, missing names and invalid phone', () => {
  const valid = {
    customer_name: 'cliente fictício',
    phone: '61999999999',
    service: 'polimento',
    amount: '850,00',
    sent_on: todayBR(),
    notes: '',
  };
  assert.equal(quoteSchema.safeParse(valid).success, true);
  for (const bad of [
    { phone: '123' },
    { amount: '0' },
    { amount: '10,001' },
    { sent_on: '2099-01-01' },
    { sent_on: '2026-02-30' },
    { customer_name: 'a' },
  ])
    assert.equal(quoteSchema.safeParse({ ...valid, ...bad }).success, false);
});
test('dashboard keeps overdue quotes, orders by deadline then amount, excludes closed quotes', () => {
  const w = demoWorkspace();
  const due = prioritized(w.quotes);
  assert.equal(due.length, 3);
  assert.equal(due[0].customer_name, 'mariana alves');
  assert.equal(metrics(w.quotes).open, 868000);
  assert.equal(metrics(w.quotes).recovered, 325000);
  const q = w.quotes.find((q) => q.status === 'won')!;
  assert.equal(nextFollowup(q), undefined);
});
test('recovered money uses brazil closing month and stored snapshot', () => {
  const q = {
    ...demoWorkspace().quotes[0],
    status: 'won',
    closed_at: '2026-10-01T01:00:00Z',
    recovered_cents: 50000,
    amount_cents: 999999,
  } as Quote;
  assert.equal(metrics([q], '2026-09-30').recovered, 50000);
  assert.equal(metrics([q], '2026-10-01').recovered, 0);
});
test('empty workspace yields zero metrics', () => {
  assert.deepEqual(metrics([]), { open: 0, due: 0, awaiting: 0, recovered: 0 });
});
