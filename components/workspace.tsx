'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Plus,
  Search,
  LayoutDashboard,
  Rows3,
  Settings,
  LogOut,
  Check,
  CheckCheck,
  Clock3,
  MessageCircle,
  Inbox,
  Loader2,
  ChevronRight,
  TrendingUp,
  X,
  Building2,
} from 'lucide-react';
import { Button } from './ui/button';
import { Dialog } from './ui/dialog';
import { Brand } from './brand';
import {
  addDays,
  dateLabel,
  daysBetween,
  isDue,
  LOSS_REASONS,
  metrics,
  money,
  nextFollowup,
  prioritized,
  statusLabel,
  suggestion,
  todayBR,
  whatsappUrl,
  type Quote,
  type Workspace,
} from '@/lib/domain';
import { quoteSchema } from '@/lib/validation';
import { demoWorkspace } from '@/lib/demo';

type QuoteInput = {
  id?: string;
  customer_name: string;
  phone: string;
  service: string;
  amount: string;
  sent_on: string;
  notes: string;
};
type Mutation = {
  endpoint: string;
  body: Record<string, unknown>;
  method?: string;
};
async function api(endpoint: string, body?: Record<string, unknown>, method = 'POST') {
  const response = await fetch(
    '/api/' + endpoint,
    body
      ? {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      : { cache: 'no-store' },
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'não foi possível concluir. tente novamente.');
  return data;
}
export function StatusBadge({ quote }: { quote: Quote }) {
  return (
    <span className={`status status-${isDue(quote) ? 'due' : quote.status}`}>
      <span />
      {statusLabel(quote)}
    </span>
  );
}
export function Dashboard({
  workspace,
  base = '/app',
  preview = false,
  onNew,
}: {
  workspace: Workspace;
  base?: string;
  preview?: boolean;
  onNew?: () => void;
}) {
  const m = metrics(workspace.quotes);
  const due = prioritized(workspace.quotes);
  const today = todayBR();
  const upcoming = workspace.quotes
    .filter((q) => nextFollowup(q) && !isDue(q, today))
    .sort((a, b) => nextFollowup(a)!.due_on.localeCompare(nextFollowup(b)!.due_on));
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">seu dia, em ordem</div>
          <h1>
            bom dia, {workspace.profile.name.split(' ')[0]}
            <span className="green">.</span>
          </h1>
          <p className="muted">comece pelos clientes que precisam de você hoje.</p>
        </div>
        {!preview && (
          <Button onClick={onNew}>
            <Plus size={17} />
            novo orçamento
          </Button>
        )}
      </div>
      <section className="open-value">
        <span>você tem</span>
        <div>
          {money(m.open)}
          <span> em propostas abertas</span>
        </div>
        <p>orçamentos que ainda aguardam uma resposta.</p>
      </section>
      <div className="metrics">
        <div className="metric active">
          <div>
            <span>precisam de você hoje</span>
            <ArrowUpRight size={18} />
          </div>
          <strong>{m.due.toString().padStart(2, '0')}</strong>
          <span>{m.due === 1 ? 'uma conversa para retomar' : 'conversas para retomar'}</span>
        </div>
        <div className="metric">
          <div>
            <span>aguardando resposta</span>
            <Clock3 size={17} />
          </div>
          <strong>{m.awaiting.toString().padStart(2, '0')}</strong>
          <span>sem follow-up pendente hoje</span>
        </div>
        <div className="metric">
          <div>
            <span>recuperado este mês</span>
            <TrendingUp size={18} />
          </div>
          <strong className="green">{money(m.recovered)}</strong>
          <span>orçamentos marcados como ganhos</span>
        </div>
      </div>
      <section className="today-section">
        <div className="section-heading">
          <div>
            <h2>
              follow-ups de hoje <span className="count">{due.length}</span>
            </h2>
            <p className="muted">abra um orçamento para chamar no whatsapp.</p>
          </div>
          {!preview && (
            <Link className="text-link" href={base + '/orcamentos'}>
              ver todos <ArrowRight size={15} />
            </Link>
          )}
        </div>
        {due.length ? (
          <div className="followup-list">
            {due.slice(0, preview ? 3 : undefined).map((q) => (
              <div className="followup-row" key={q.id}>
                <div className="avatar">
                  {q.customer_name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <div className="customer">
                  <strong>{q.customer_name}</strong>
                  <span>{q.service}</span>
                </div>
                <div className="followup-value">
                  <strong>{money(q.amount_cents)}</strong>
                  <span>
                    {daysBetween(q.sent_on, today)}{' '}
                    {daysBetween(q.sent_on, today) === 1 ? 'dia' : 'dias'} desde o orçamento
                  </span>
                </div>
                {preview ? (
                  <span className="button button-primary button-sm">
                    fazer follow-up <ArrowUpRight size={15} />
                  </span>
                ) : (
                  <Button asChild size="sm">
                    <Link href={base + '/orcamentos/' + q.id}>
                      fazer follow-up <ArrowUpRight size={15} />
                    </Link>
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">
            <CheckCheck size={30} />
            <h3>
              {workspace.quotes.length
                ? 'por hoje, tudo em dia.'
                : 'seu próximo cliente começa aqui.'}
            </h3>
            <p>
              {workspace.quotes.length
                ? upcoming.length
                  ? 'sem contato pendente hoje. os próximos estão logo abaixo.'
                  : 'cadastre um novo orçamento para receber os próximos lembretes.'
                : 'cadastre um orçamento. amanhã, o retoma lembra você de voltar à conversa.'}
            </p>
            {!workspace.quotes.length && (
              <Button onClick={onNew}>
                <Plus size={17} />
                cadastrar primeiro orçamento
              </Button>
            )}
          </div>
        )}
        <div className="quiet-note">
          <span className="tiny-dot" />
          você cuida do serviço. o retoma cuida de lembrar.
        </div>
      </section>
      {!preview && upcoming.length > 0 && (
        <section className="upcoming-section">
          <div className="section-heading">
            <div>
              <h2>próximos contatos</h2>
              <p className="muted">agendados para depois de hoje.</p>
            </div>
          </div>
          <div className="followup-list">
            {upcoming.slice(0, 3).map((q) => (
              <div className="followup-row" key={q.id}>
                <div className="avatar">{q.customer_name.slice(0, 2)}</div>
                <div className="customer">
                  <strong>{q.customer_name}</strong>
                  <span>{q.service}</span>
                </div>
                <div className="followup-value">
                  <strong>{dateLabel(nextFollowup(q)!.due_on)}</strong>
                  <span>{money(q.amount_cents)}</span>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={base + '/orcamentos/' + q.id}>
                    ver orçamento <ArrowUpRight size={15} />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
          {upcoming.length > 3 && (
            <Link className="text-link upcoming-more" href={base + '/orcamentos'}>
              ver todos os orçamentos <ArrowRight size={15} />
            </Link>
          )}
        </section>
      )}
    </>
  );
}
export function WorkspaceApp({ demo = false }: { demo?: boolean }) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Quote | 'new' | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos');
  const [clock, setClock] = useState(todayBR());
  const pathname = usePathname();
  const router = useRouter();
  const base = demo ? '/demo' : '/app';
  const path = pathname.slice(base.length);
  const isQuotes = path.startsWith('/orcamentos');
  const selectedId = path.split('/')[2];
  const selected = workspace?.quotes.find((q) => q.id === selectedId);
  const companyView = path === '/empresa';
  const load = useCallback(async () => {
    try {
      if (demo) {
        let data: Workspace;
        try {
          data = JSON.parse(sessionStorage.getItem('retoma-demo-v1') || 'null') || demoWorkspace();
        } catch {
          data = demoWorkspace();
        }
        setWorkspace(data);
      } else setWorkspace(await api('workspace'));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erro ao carregar.');
    }
  }, [demo]);
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void load();
    });
    return () => {
      active = false;
    };
  }, [load]);
  useEffect(() => {
    const timer = setInterval(() => {
      const next = todayBR();
      if (clock !== next) {
        setClock(next);
        void load();
      }
    }, 60000);
    const focus = () => {
      if (!document.hidden) void load();
    };
    document.addEventListener('visibilitychange', focus);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', focus);
    };
  }, [load, clock]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  function saveDemo(data: Workspace) {
    sessionStorage.setItem('retoma-demo-v1', JSON.stringify(data));
    setWorkspace(data);
  }
  async function mutate({ endpoint, body, method }: Mutation) {
    if (!workspace) return;
    setBusy(true);
    setError('');
    let savedQuoteId: string | undefined;
    try {
      if (demo) {
        const data = structuredClone(workspace);
        const now = new Date().toISOString();
        if (endpoint === 'quotes') {
          const p = quoteSchema.parse(body);
          const old = data.quotes.find((q) => q.id === p.id);
          const id = p.id || crypto.randomUUID();
          savedQuoteId = id;
          const company_id = data.company!.id;
          const followups = old
            ? old.followups.map((f) => ({
                ...f,
                due_on: addDays(p.sent_on, [1, 3, 7][f.step - 1]),
              }))
            : [1, 3, 7].map((d, i) => ({
                id: crypto.randomUUID(),
                quote_id: id,
                company_id,
                step: i + 1,
                due_on: addDays(p.sent_on, d),
                completed_at: null,
                skipped_at: null,
                message: null,
              }));
          const q: Quote = {
            id,
            company_id,
            customer_name: p.customer_name,
            phone: p.phone,
            service: p.service,
            amount_cents: p.amount,
            sent_on: p.sent_on,
            notes: p.notes,
            status: old?.status || 'new',
            loss_reason: null,
            loss_note: null,
            closed_at: null,
            recovered_cents: null,
            created_at: old?.created_at || now,
            updated_at: now,
            followups,
          };
          data.quotes = old ? data.quotes.map((v) => (v.id === id ? q : v)) : [q, ...data.quotes];
        }
        if (endpoint === 'resolve') {
          const q = data.quotes.find((q) => q.id === body.id)!;
          if (q.status === 'won' || q.status === 'lost')
            throw new Error('este orçamento já foi encerrado.');
          q.status = body.status as Quote['status'];
          q.closed_at = q.status === 'awaiting' ? null : now;
          q.recovered_cents = q.status === 'won' ? q.amount_cents : null;
          q.loss_reason = q.status === 'lost' ? String(body.reason) : null;
          q.loss_note = q.status === 'lost' ? String(body.note || '') : null;
        }
        if (endpoint === 'followups') {
          const q = data.quotes.find((q) => q.followups.some((f) => f.id === body.id))!;
          const target = q.followups.find((f) => f.id === body.id)!;
          if (!target.completed_at) {
            target.completed_at = now;
            target.message = String(body.message);
            q.followups.forEach((f) => {
              if (f.id !== target.id && !f.completed_at && !f.skipped_at && f.due_on <= clock)
                f.skipped_at = now;
            });
            q.status = 'awaiting';
          }
        }
        if (endpoint === 'reschedule') {
          const q = data.quotes.find((q) => q.id === body.id)!;
          const next = nextFollowup(q);
          if (!next || q.status === 'won' || q.status === 'lost')
            throw new Error('não há contato pendente para reagendar.');
          const newDate = String(body.due_on);
          if (newDate < addDays(clock, 1) || newDate > addDays(clock, 365))
            throw new Error('escolha uma data entre amanhã e o próximo ano.');
          const offsets = [1, 3, 7];
          q.followups.forEach((f) => {
            if (f.completed_at || f.skipped_at || f.step < next.step) return;
            const date = addDays(newDate, offsets[f.step - 1] - offsets[next.step - 1]);
            f.due_on = f.step === next.step || f.due_on < date ? date : f.due_on;
          });
          q.status = 'awaiting';
          q.updated_at = now;
        }
        if (endpoint === 'company' && data.company) data.company.name = String(body.name);
        saveDemo(data);
      } else {
        const result = await api(endpoint, body, method);
        if (endpoint === 'quotes') savedQuoteId = result.id;
        await load();
      }
      setNotice(
        endpoint === 'reschedule'
          ? 'contato reagendado. ele volta na data escolhida.'
          : endpoint === 'followups'
          ? 'follow-up registrado. próxima ação atualizada.'
          : endpoint === 'resolve' && body.status === 'won'
            ? 'cliente recuperado. valor registrado no mês.'
            : 'salvo com sucesso.',
      );
      return savedQuoteId || true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'não foi possível salvar.');
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    try {
      if (demo) {
        router.push('/');
        return;
      }
      await api('auth', { mode: 'signout' });
      router.push('/entrar');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const links = [
    {
      href: base,
      label: 'visão geral',
      icon: LayoutDashboard,
      active: !isQuotes && !companyView,
    },
    {
      href: base + '/orcamentos',
      label: 'orçamentos',
      icon: Rows3,
      active: isQuotes,
    },
    {
      href: base + '/empresa',
      label: 'minha empresa',
      icon: Settings,
      active: companyView,
    },
  ];
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" aria-label="retoma, início">
          <Brand />
        </Link>
        <div className="workspace-label">
          <span className="company-icon">
            <Building2 size={18} />
          </span>
          <div>
            <strong>{workspace?.company?.name || 'sua empresa'}</strong>
            <span>espaço de trabalho</span>
          </div>
        </div>
        <nav aria-label="navegação principal">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={l.active ? 'nav-link selected' : 'nav-link'}
              aria-current={l.active ? 'page' : undefined}
            >
              <l.icon size={18} />
              {l.label}
              {l.label === 'visão geral' && workspace && metrics(workspace.quotes).due > 0 && (
                <span className="nav-count">{metrics(workspace.quotes).due}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="beta-note">
            <span>
              menos esquecimentos.
              <br />
              mais conversas retomadas.
            </span>
            <span className="beta-pill">beta</span>
          </div>
          <button className="user-button" onClick={logout} disabled={busy}>
            <span className="avatar small">{workspace?.profile.name.slice(0, 1) || 'r'}</span>
            <span>
              {workspace?.profile.name || 'minha conta'}
              <small>{demo ? 'sair da demonstração' : 'sair da conta'}</small>
            </span>
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <div className="app-body">
        <header className="app-topbar">
          <div className="mobile-brand">
            <Brand />
          </div>
          <span className="breadcrumb">
            seu espaço <ChevronRight size={14} />{' '}
            {isQuotes ? 'orçamentos' : companyView ? 'minha empresa' : 'visão geral'}
          </span>
          <span className="topbar-date">
            {dateLabel(clock)} <span className="tiny-dot" /> horário de brasília
          </span>
        </header>
        {demo && (
          <div className="demo-banner">
            <span>
              <strong>modo demonstração</strong> · dados fictícios, salvos só nesta aba.
            </span>
            <Link href="/criar-conta">
              criar minha conta <ArrowRight size={14} />
            </Link>
          </div>
        )}
        <main className="app-main">
          {error && (
            <div role="alert" className="error-box">
              {error}
              <button onClick={() => setError('')} aria-label="fechar erro">
                <X size={16} />
              </button>
            </div>
          )}
          {!workspace ? (
            error ? (
              <div className="empty">
                <h2>vamos tentar de novo?</h2>
                <Button onClick={load}>recarregar</Button>
                <Link href="/entrar">entrar na conta</Link>
              </div>
            ) : (
              <WorkspaceSkeleton />
            )
          ) : !workspace.company ? (
            <Onboarding
              busy={busy}
              onSave={async (name) => {
                setBusy(true);
                try {
                  await api('company', { name });
                  await load();
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            />
          ) : companyView ? (
            <Company
              workspace={workspace}
              busy={busy}
              onSave={(name) => mutate({ endpoint: 'company', method: 'PATCH', body: { name } })}
            />
          ) : selectedId ? (
            selected ? (
              <QuoteDetail
                key={selected.id + selected.updated_at}
                quote={selected}
                base={base}
                demo={demo}
                busy={busy}
                onEdit={() => setEditing(selected)}
                onMutate={mutate}
              />
            ) : (
              <div className="empty">
                <Inbox />
                <h2>orçamento não encontrado.</h2>
                <Link href={base + '/orcamentos'}>voltar aos orçamentos</Link>
              </div>
            )
          ) : isQuotes ? (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">nenhuma conversa esquecida</div>
                  <h1>
                    seus orçamentos<span className="green">.</span>
                  </h1>
                  <p className="muted">do primeiro contato ao próximo cliente.</p>
                </div>
                <Button onClick={() => setEditing('new')}>
                  <Plus size={17} />
                  novo orçamento
                </Button>
              </div>
              <div className="filters">
                <label className="search-field">
                  <Search size={17} />
                  <input
                    aria-label="buscar cliente ou serviço"
                    placeholder="buscar cliente ou serviço"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <select
                  aria-label="filtrar por status"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  {['todos', 'novo', 'aguardando', 'follow-up hoje', 'ganho', 'perdido'].map(
                    (s) => (
                      <option key={s}>{s}</option>
                    ),
                  )}
                </select>
              </div>
              <QuoteList
                quotes={workspace.quotes.filter(
                  (q) =>
                    (q.customer_name + ' ' + q.service)
                      .toLocaleLowerCase('pt-BR')
                      .includes(search.toLocaleLowerCase('pt-BR')) &&
                    (filter === 'todos' || statusLabel(q) === filter),
                )}
                base={base}
                onNew={() => setEditing('new')}
              />
            </>
          ) : (
            <Dashboard workspace={workspace} base={base} onNew={() => setEditing('new')} />
          )}
        </main>
        <nav className="mobile-nav" aria-label="navegação mobile">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={l.active ? 'selected' : ''}>
              <l.icon size={20} />
              <span>{l.label}</span>
            </Link>
          ))}
          <button onClick={logout} disabled={busy}>
            <LogOut size={20} />
            <span>sair</span>
          </button>
        </nav>
      </div>
      {notice && (
        <div className="toast" role="status">
          <Check size={18} />
          {notice}
        </div>
      )}
      <Dialog
        open={!!editing}
        onOpenChange={(v) => {
          if (!v && !busy) setEditing(null);
        }}
        title={editing === 'new' ? 'novo orçamento' : 'editar orçamento'}
        description="só o essencial para retomar a conversa."
      >
        {editing && (
          <QuoteForm
            key={editing === 'new' ? 'new' : editing.id}
            quote={editing === 'new' ? undefined : editing}
            busy={busy}
            onSave={async (body) => {
              const ok = await mutate({ endpoint: 'quotes', body });
              if (ok) {
                setEditing(null);
                if (editing === 'new' && typeof ok === 'string')
                  router.push(base + '/orcamentos/' + ok);
              }
              return ok;
            }}
          />
        )}
      </Dialog>
    </div>
  );
}
function QuoteList({ quotes, base, onNew }: { quotes: Quote[]; base: string; onNew: () => void }) {
  return quotes.length ? (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>cliente / serviço</th>
            <th>valor</th>
            <th>enviado em</th>
            <th>próximo follow-up</th>
            <th>status</th>
            <th>
              <span className="sr-only">abrir</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((q) => (
            <tr key={q.id}>
              <td>
                <Link className="table-customer" href={base + '/orcamentos/' + q.id}>
                  <strong>{q.customer_name}</strong>
                  <span>{q.service}</span>
                </Link>
              </td>
              <td className="tabular">{money(q.amount_cents)}</td>
              <td>{dateLabel(q.sent_on)}</td>
              <td>{nextFollowup(q) ? dateLabel(nextFollowup(q)!.due_on) : '—'}</td>
              <td>
                <StatusBadge quote={q} />
              </td>
              <td>
                <Link
                  className="row-arrow"
                  aria-label={'abrir orçamento de ' + q.customer_name}
                  href={base + '/orcamentos/' + q.id}
                >
                  <ArrowUpRight size={18} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <div className="empty">
      <Inbox size={32} />
      <h2>nenhum orçamento por aqui.</h2>
      <p>cadastre um orçamento ou ajuste sua busca.</p>
      <Button onClick={onNew}>
        <Plus size={16} />
        novo orçamento
      </Button>
    </div>
  );
}
function QuoteForm({
  quote,
  busy,
  onSave,
}: {
  quote?: Quote;
  busy: boolean;
  onSave: (body: QuoteInput) => Promise<boolean | string | undefined>;
}) {
  const [error, setError] = useState('');
  const contacted = quote?.followups.some((f) => f.completed_at || f.skipped_at);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const form = new FormData(e.currentTarget);
    const body: QuoteInput = {
      id: quote?.id,
      customer_name: String(form.get('customer_name')),
      phone: String(form.get('phone')),
      service: String(form.get('service')),
      amount: String(form.get('amount')),
      sent_on: String(form.get('sent_on')),
      notes: String(form.get('notes')),
    };
    const parsed = quoteSchema.safeParse(body);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    const ok = await onSave(body);
    if (!ok) setError('não foi possível salvar. confira os dados e tente novamente.');
  }
  return (
    <form onSubmit={submit} className="form-stack">
      <label>
        nome do cliente
        <input
          name="customer_name"
          autoComplete="name"
          required
          minLength={2}
          maxLength={100}
          defaultValue={quote?.customer_name}
          placeholder="ex.: rafael costa"
        />
      </label>
      <label>
        whatsapp com ddd
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          required
          defaultValue={quote?.phone}
          placeholder="(61) 99999-9999"
        />
      </label>
      <label>
        serviço
        <input
          name="service"
          required
          minLength={2}
          maxLength={120}
          defaultValue={quote?.service}
          placeholder="ex.: vitrificação cerâmica"
          list="services"
        />
        <datalist id="services">
          {[
            'vitrificação cerâmica',
            'polimento técnico',
            'higienização interna',
            'ppf',
            'lavagem detalhada',
          ].map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </label>
      <div className="form-columns">
        <label>
          valor do orçamento (r$)
          <input
            name="amount"
            inputMode="decimal"
            required
            defaultValue={quote ? (quote.amount_cents / 100).toFixed(2).replace('.', ',') : ''}
            placeholder="0,00"
          />
        </label>
        <label>
          data do envio
          <input
            name="sent_on"
            type="date"
            required
            min="2000-01-01"
            max={todayBR()}
            readOnly={contacted}
            defaultValue={quote?.sent_on || todayBR()}
          />
        </label>
      </div>
      {contacted && (
        <small className="muted">a data fica preservada depois do primeiro follow-up.</small>
      )}
      <label>
        observação <span className="optional">opcional</span>
        <textarea
          name="notes"
          rows={3}
          maxLength={2000}
          defaultValue={quote?.notes}
          placeholder="algo importante para a próxima conversa?"
        />
      </label>
      <div className="form-hint">
        <Clock3 size={16} />
        <span>lembretes em 1, 3 e 7 dias após o envio.</span>
      </div>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <Button disabled={busy} type="submit">
        {busy ? <Loader2 className="spin" size={17} /> : <Check size={17} />}
        salvar orçamento
      </Button>
    </form>
  );
}
function QuoteDetail({
  quote: q,
  base,
  demo,
  busy,
  onEdit,
  onMutate,
}: {
  quote: Quote;
  base: string;
  demo: boolean;
  busy: boolean;
  onEdit: () => void;
  onMutate: (v: Mutation) => Promise<boolean | string | undefined>;
}) {
  const [message, setMessage] = useState(suggestion(q));
  const [lossOpen, setLossOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [wonOpen, setWonOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(addDays(todayBR(), 1));
  const [reason, setReason] = useState<string>(LOSS_REASONS[0]);
  const [lossNote, setLossNote] = useState('');
  const [error, setError] = useState('');
  const closed = q.status === 'won' || q.status === 'lost';
  const next = nextFollowup(q);
  const due = isDue(q);
  async function resolve(status: 'won' | 'lost' | 'awaiting') {
    if (status === 'lost' && reason === 'outro' && !lossNote.trim()) {
      setError('conte o motivo da perda.');
      return;
    }
    const ok = await onMutate({
      endpoint: 'resolve',
      body: {
        id: q.id,
        status,
        ...(status === 'lost' ? { reason, note: lossNote } : {}),
      },
    });
    if (ok) {
      setLossOpen(false);
      setWonOpen(false);
    } else setError('não foi possível salvar. tente novamente.');
  }
  return (
    <>
      <Link className="back-link" href={base + '/orcamentos'}>
        <ArrowLeft size={16} />
        todos os orçamentos
      </Link>
      <div className="page-heading detail-heading">
        <div>
          <div className="eyebrow">seu orçamento</div>
          <h1>
            {q.customer_name}
            <span className="green">.</span>
          </h1>
          <p className="muted">{q.service}</p>
        </div>
        <StatusBadge quote={q} />
      </div>
      <div className="detail-grid">
        <div>
          <section className="quote-summary">
            <div>
              <span>valor do orçamento</span>
              <strong>{money(q.amount_cents)}</strong>
            </div>
            <dl>
              <div>
                <dt>whatsapp</dt>
                <dd>+{q.phone}</dd>
              </div>
              <div>
                <dt>orçamento enviado</dt>
                <dd>{dateLabel(q.sent_on)}</dd>
              </div>
              <div>
                <dt>próximo follow-up</dt>
                <dd>
                  {next
                    ? `${due ? 'hoje ou em atraso · ' : 'agendado · '}${dateLabel(next.due_on)}`
                    : closed
                      ? 'encerrado'
                      : 'régua concluída'}
                </dd>
              </div>
            </dl>
            {!closed && (
              <Button variant="outline" onClick={onEdit}>
                editar orçamento
              </Button>
            )}
          </section>
          <section className="detail-section">
            <h2>observações</h2>
            <p className="preserve muted">{q.notes || 'nenhuma observação adicionada.'}</p>
          </section>
          <section className="detail-section">
            <h2>histórico de follow-ups</h2>
            <div className="timeline">
              {[...q.followups]
                .sort((a, b) => a.step - b.step)
                .map((f) => (
                  <div className={'timeline-item ' + (f.completed_at ? 'done' : '')} key={f.id}>
                    <span className="timeline-icon">
                      {f.completed_at ? <Check size={14} /> : <Clock3 size={14} />}
                    </span>
                    <div>
                      <strong>{f.step}º follow-up</strong>
                      <span>
                        {f.completed_at
                          ? 'realizado em ' + dateLabel(f.completed_at)
                          : f.skipped_at
                            ? 'agrupado com contato de ' + dateLabel(f.skipped_at)
                            : closed
                              ? 'cancelado · orçamento encerrado'
                              : 'previsto para ' + dateLabel(f.due_on)}
                      </span>
                      {f.message && <p>“{f.message}”</p>}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        </div>
        <aside className="action-panel">
          {closed ? (
            <>
              <span className="action-icon">{q.status === 'won' ? <CheckCheck /> : <Inbox />}</span>
              <h2>{q.status === 'won' ? 'mais um cliente de volta.' : 'conversa encerrada.'}</h2>
              <p className="muted">
                {q.status === 'won'
                  ? `${money(q.recovered_cents || 0)} registrados como receita recuperada.`
                  : `motivo: ${q.loss_reason}.`}
              </p>
              {q.loss_note && <p>{q.loss_note}</p>}
              <Link href={base}>
                voltar para o meu dia <ArrowRight size={16} />
              </Link>
            </>
          ) : (
            <>
              <div className="eyebrow">próxima ação</div>
              <h2>
                {due
                  ? 'chame este cliente hoje.'
                  : next
                    ? `próximo contato: ${dateLabel(next.due_on)}.`
                    : 'aguarde uma resposta ou registre o resultado.'}
              </h2>
              <p className="muted">
                {due
                  ? 'confira a mensagem, abra o whatsapp e registre o resultado depois.'
                  : next
                    ? 'o retoma vai mostrar este cliente na lista do dia. você pode chamá-lo antes.'
                    : 'se o cliente respondeu, marque o orçamento como ganho ou perdido.'}
              </p>
              <label className="message-label" htmlFor="followup-message">
                mensagem para o cliente · pode editar
              </label>
              <textarea
                id="followup-message"
                rows={6}
                maxLength={2000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              {demo ? (
                <p className="form-hint">
                  os números da demonstração são fictícios. cadastre um orçamento com seu próprio
                  número para testar o link.
                </p>
              ) : null}
              <Button asChild={!!message.trim()} disabled={!message.trim()} className="full">
                {message.trim() ? (
                  <a href={whatsappUrl(q.phone, message)} target="_blank" rel="noopener noreferrer">
                    <MessageCircle size={18} />
                    chamar no whatsapp <ArrowUpRight size={16} />
                  </a>
                ) : (
                  <span>escreva uma mensagem</span>
                )}
              </Button>
              <small className="muted">o retoma não envia mensagens automaticamente.</small>
              <div className="result-actions">
                <span>depois da conversa, o que aconteceu?</span>
                {due && next && (
                  <Button
                    variant="outline"
                    className="full"
                    disabled={busy || !message.trim()}
                    onClick={() => setConfirmOpen(true)}
                  >
                    <Check size={17} />
                    registrar contato · aguardando resposta
                  </Button>
                )}
                <div>
                  <Button variant="outline" disabled={busy} onClick={() => setWonOpen(true)}>
                    <Check size={16} />
                    ganho
                  </Button>
                  <Button variant="ghost" disabled={busy} onClick={() => setLossOpen(true)}>
                    perdido
                  </Button>
                </div>
                {next && (
                  <button
                    className="text-link"
                    disabled={busy}
                    onClick={() => {
                      setRescheduleDate(addDays(todayBR(), 1));
                      setRescheduleOpen(true);
                    }}
                  >
                    <Clock3 size={16} />
                    reagendar próximo contato
                  </button>
                )}
              </div>
            </>
          )}
        </aside>
      </div>
      <Dialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="a mensagem já foi enviada?"
        description="confirme só depois de enviar no whatsapp. abrir a conversa não conta como contato."
      >
        <div className="dialog-actions">
          <Button variant="outline" onClick={() => setConfirmOpen(false)}>
            ainda não
          </Button>
          <Button
            disabled={busy}
            onClick={async () => {
              if (next) {
                const ok = await onMutate({
                  endpoint: 'followups',
                  body: { id: next.id, message },
                });
                if (ok) setConfirmOpen(false);
              }
            }}
          >
            {busy ? 'salvando...' : 'sim, registrar contato'}
          </Button>
        </div>
      </Dialog>
      <Dialog
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        title="quando falar de novo?"
        description="o cliente volta para a lista no dia escolhido. reagendar não registra um contato."
      >
        <form
          className="form-stack"
          onSubmit={async (e) => {
            e.preventDefault();
            const ok = await onMutate({
              endpoint: 'reschedule',
              body: { id: q.id, due_on: rescheduleDate },
            });
            if (ok) setRescheduleOpen(false);
          }}
        >
          <label>
            próxima data
            <input
              type="date"
              required
              min={addDays(todayBR(), 1)}
              max={addDays(todayBR(), 365)}
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
            />
          </label>
          <Button type="submit" disabled={busy}>
            {busy ? 'salvando...' : 'agendar próximo contato'}
          </Button>
        </form>
      </Dialog>
      <Dialog
        open={wonOpen}
        onOpenChange={setWonOpen}
        title="esse orçamento foi fechado?"
        description={`${money(q.amount_cents)} serão registrados como receita recuperada neste mês.`}
      >
        <div className="dialog-actions">
          <Button variant="outline" onClick={() => setWonOpen(false)}>
            voltar
          </Button>
          <Button disabled={busy} onClick={() => resolve('won')}>
            {busy ? 'salvando...' : 'confirmar ganho'}
          </Button>
        </div>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
      </Dialog>
      <Dialog
        open={lossOpen}
        onOpenChange={setLossOpen}
        title="por que não fechou?"
        description="registrar o motivo ajuda você a entender cada conversa."
      >
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            void resolve('lost');
          }}
        >
          <label>
            motivo
            <select value={reason} onChange={(e) => setReason(e.target.value)}>
              {LOSS_REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label>
            detalhes {reason !== 'outro' && <span className="optional">opcional</span>}
            <textarea
              required={reason === 'outro'}
              maxLength={500}
              value={lossNote}
              onChange={(e) => setLossNote(e.target.value)}
              rows={3}
            />
          </label>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <Button variant="destructive" disabled={busy} type="submit">
            {busy ? 'salvando...' : 'registrar perda'}
          </Button>
        </form>
      </Dialog>
    </>
  );
}
function Onboarding({ busy, onSave }: { busy: boolean; onSave: (name: string) => void }) {
  return (
    <div className="onboarding">
      <span className="action-icon">
        <Building2 />
      </span>
      <div className="eyebrow">um minuto para começar</div>
      <h1>
        qual é o nome
        <br />
        da sua empresa?
      </h1>
      <p className="muted">seus orçamentos ficam em um espaço só seu.</p>
      <form
        className="form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(String(new FormData(e.currentTarget).get('name')));
        }}
      >
        <label>
          nome da empresa
          <input
            name="name"
            autoComplete="organization"
            minLength={2}
            maxLength={100}
            required
            placeholder="ex.: meu negócio"
          />
        </label>
        <Button type="submit" disabled={busy}>
          {busy ? 'criando seu espaço...' : 'começar a retomar'}
          <ArrowRight size={17} />
        </Button>
      </form>
    </div>
  );
}
function Company({
  workspace,
  busy,
  onSave,
}: {
  workspace: Workspace;
  busy: boolean;
  onSave: (name: string) => Promise<unknown>;
}) {
  return (
    <>
      <div className="page-heading">
        <div className="eyebrow">seu espaço de trabalho</div>
        <h1>
          minha empresa<span className="green">.</span>
        </h1>
      </div>
      <section className="settings-section">
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            void onSave(String(new FormData(e.currentTarget).get('name')));
          }}
        >
          <label>
            nome da empresa
            <input
              name="name"
              defaultValue={workspace.company!.name}
              minLength={2}
              maxLength={100}
              required
            />
          </label>
          <Button type="submit" disabled={busy}>
            {busy ? 'salvando...' : 'salvar alterações'}
          </Button>
        </form>
        <hr />
        <h2>sua régua de follow-up</h2>
        <p className="muted">contados a partir da data do orçamento.</p>
        <div className="cadence">
          {[1, 3, 7].map((d, i) => (
            <div key={d}>
              <span>{i + 1}º contato</span>
              <strong>dia {d}</strong>
            </div>
          ))}
        </div>
        <p className="muted">horário de brasília · mensagens enviadas por você.</p>
        <div className="settings-beta">
          <span className="beta-pill">beta</span>
          <p>plano inicial: r$ 49/mês. nenhuma cobrança é feita nesta versão.</p>
        </div>
      </section>
    </>
  );
}
export function WorkspaceSkeleton() {
  return (
    <div aria-label="carregando orçamentos" role="status" className="skeleton-page">
      <div className="skeleton title" />
      <div className="skeleton subtitle" />
      <div className="skeleton summary" />
      <div className="metrics">
        {[0, 1, 2].map((n) => (
          <div key={n} className="skeleton metric" />
        ))}
      </div>
      <div className="skeleton summary" />
      <span className="sr-only">carregando...</span>
    </div>
  );
}
