export const TIMEZONE = 'America/Sao_Paulo';
export const LOSS_REASONS = [
  'preço',
  'prazo',
  'fechou com concorrente',
  'desistiu',
  'não respondeu',
  'outro',
] as const;
export type Status = 'new' | 'awaiting' | 'won' | 'lost';
export type Followup = {
  id: string;
  quote_id: string;
  company_id: string;
  step: number;
  due_on: string;
  completed_at: string | null;
  skipped_at: string | null;
  message: string | null;
};
export type Quote = {
  id: string;
  company_id: string;
  customer_name: string;
  phone: string;
  service: string;
  amount_cents: number;
  sent_on: string;
  notes: string;
  status: Status;
  loss_reason: string | null;
  loss_note: string | null;
  closed_at: string | null;
  recovered_cents: number | null;
  created_at: string;
  updated_at: string;
  followups: Followup[];
};
export type Workspace = {
  profile: { name: string };
  company: { id: string; name: string; timezone: string } | null;
  quotes: Quote[];
};
export function todayBR(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}
export function addDays(date: string, days: number) {
  const d = new Date(date + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000);
}
export function money(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}
export function dateLabel(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    timeZone: TIMEZONE,
  }).format(new Date(date.length === 10 ? date + 'T12:00:00Z' : date));
}
export function parseMoney(value: string) {
  let s = value.trim().replace(/\s|R\$/gi, '');
  if (s.includes(',')) {
    if (!/^(\d+|\d{1,3}(\.\d{3})+)(,\d{1,2})?$/.test(s)) return NaN;
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, '');
  } else if (!/^\d+(\.\d{1,2})?$/.test(s)) return NaN;
  const [whole, fraction = ''] = s.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(cents) ? cents : NaN;
}
export function normalizePhone(value: string) {
  const n = value.replace(/\D/g, '');
  return n.length === 10 || n.length === 11 ? '55' + n : n;
}
export function nextFollowup(q: Quote) {
  if (q.status === 'won' || q.status === 'lost') return undefined;
  return [...q.followups]
    .sort((a, b) => a.step - b.step)
    .find((f) => !f.completed_at && !f.skipped_at);
}
export function isDue(q: Quote, today = todayBR()) {
  const f = nextFollowup(q);
  return !!f && f.due_on <= today;
}
export function statusLabel(q: Quote, today = todayBR()) {
  if (q.status === 'won') return 'ganho';
  if (q.status === 'lost') return 'perdido';
  if (isDue(q, today)) return 'follow-up hoje';
  return q.status === 'new' ? 'novo' : 'aguardando';
}
export function prioritized(quotes: Quote[], today = todayBR()) {
  return quotes
    .filter((q) => isDue(q, today))
    .sort(
      (a, b) =>
        nextFollowup(a)!.due_on.localeCompare(nextFollowup(b)!.due_on) ||
        b.amount_cents - a.amount_cents,
    );
}
export function metrics(quotes: Quote[], today = todayBR()) {
  const open = quotes.filter((q) => q.status === 'new' || q.status === 'awaiting');
  return {
    open: open.reduce((s, q) => s + q.amount_cents, 0),
    due: prioritized(quotes, today).length,
    awaiting: open.filter((q) => !isDue(q, today)).length,
    recovered: quotes
      .filter(
        (q) =>
          q.status === 'won' &&
          q.closed_at &&
          todayBR(new Date(q.closed_at)).slice(0, 7) === today.slice(0, 7),
      )
      .reduce((s, q) => s + (q.recovered_cents ?? 0), 0),
  };
}
export function suggestion(q: Quote) {
  const name = q.customer_name.trim().split(/\s+/)[0];
  const normalized =
    name === name.toLocaleUpperCase('pt-BR') ? name.toLocaleLowerCase('pt-BR') : name;
  const first = normalized.replace(/(^|[-'’])(\p{L})/gu, (_, prefix: string, letter: string) =>
    prefix + letter.toLocaleUpperCase('pt-BR'),
  );
  const step = nextFollowup(q)?.step ?? 3;
  return step === 1
    ? `Oi, ${first}! Conseguiu dar uma olhada no orçamento de ${q.service}? Se tiver alguma dúvida, me chama aqui.`
    : step === 2
      ? `Oi, ${first}! Passando pra saber se você ainda tem interesse em ${q.service}. Posso te ajudar com alguma dúvida?`
      : `Oi, ${first}! Ainda faz sentido pra você seguir com ${q.service}? Se preferir deixar pra depois, tudo bem. Me avisa por aqui.`;
}
export function whatsappUrl(phone: string, message: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
