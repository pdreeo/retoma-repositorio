import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  MessageCircle,
  Clock3,
  RotateCcw,
  Plus,
} from 'lucide-react';
import { Brand } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Dashboard } from '@/components/workspace';
import { demoWorkspace } from '@/lib/demo';
export default function Landing() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <Link href="/" aria-label="retoma, início">
          <Brand />
        </Link>
        <nav aria-label="navegação">
          <a href="#como-funciona">como funciona</a>
          <a href="#preco">preço</a>
          <Link href="/entrar">entrar</Link>
          <Button asChild size="sm">
            <Link href="/criar-conta">
              começar agora
              <ArrowUpRight size={15} />
            </Link>
          </Button>
        </nav>
      </header>
      <main>
        <section className="hero">
          <div className="hero-kicker">
            <span className="tiny-dot" /> feito para estéticas automotivas
          </div>
          <h1>
            pare de esquecer
            <br />
            dinheiro no <span>whatsapp.</span>
          </h1>
          <p>
            o retoma mostra quais orçamentos precisam de follow-up
            <br className="desktop-break" /> hoje e quanto dinheiro você recuperou.
          </p>
          <div className="hero-actions">
            <Button asChild>
              <Link href="/criar-conta">
                começar a recuperar <ArrowRight size={18} />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/demo">
                ver por dentro <ArrowUpRight size={17} />
              </Link>
            </Button>
          </div>
          <div className="hero-fine">
            <Check size={14} /> sem cartão de crédito <span>·</span> sem mensagens automáticas
          </div>
        </section>
        <section
          className="product-preview"
          aria-label="interface real do retoma com dados fictícios"
        >
          <div className="preview-chrome">
            <span className="preview-dots">
              <i />
              <i />
              <i />
            </span>
            <span>retoma / meu dia</span>
            <span className="preview-live">demonstração</span>
          </div>
          <div className="preview-app">
            <Dashboard workspace={demoWorkspace()} preview />
          </div>
          <div className="preview-caption">
            essa é a sua tela. sem planilha, sem dez menus.{' '}
            <Link href="/demo">
              experimente <ArrowUpRight size={14} />
            </Link>
          </div>
        </section>
        <section className="problem-section">
          <div className="eyebrow">o orçamento foi. a conversa ficou.</div>
          <div className="split-heading">
            <h2>
              seu cliente não disse não.
              <br />
              <span>só parou de responder.</span>
            </h2>
            <p>
              entre um carro e outro, as conversas descem na lista. aquele orçamento de vitrificação
              fica para depois. e o depois vira nunca.
              <br />
              <br />o retoma coloca essas oportunidades de volta na sua frente.
            </p>
          </div>
        </section>
        <section className="how-section" id="como-funciona">
          <div className="section-heading">
            <div>
              <div className="eyebrow">simples de verdade</div>
              <h2>
                três passos.
                <br />
                uma conversa retomada.
              </h2>
            </div>
            <span className="how-note">
              o trabalho continua sendo seu.
              <br />a lembrança fica com a gente.
            </span>
          </div>
          <div className="steps">
            {[
              {
                n: '01',
                icon: Plus,
                title: 'cadastre o orçamento.',
                text: 'cliente, whatsapp, serviço e valor. só o que você precisa para lembrar da conversa.',
              },
              {
                n: '02',
                icon: Clock3,
                title: 'veja quem chamar hoje.',
                text: 'em 1, 3 e 7 dias, o retoma coloca o cliente na sua lista. os atrasados também aparecem.',
              },
              {
                n: '03',
                icon: MessageCircle,
                title: 'retome. feche. registre.',
                text: 'abra a mensagem no whatsapp e envie. fechou o serviço? marque como ganho.',
              },
            ].map((s) => (
              <article key={s.n}>
                <div className="step-top">
                  <s.icon size={24} />
                  <span>{s.n}</span>
                </div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="benefits-section">
          <div className="benefits-title">
            <RotateCcw size={32} />
            <h2>
              menos “depois eu vejo”.
              <br />
              mais clientes de volta.
            </h2>
          </div>
          <div className="benefits-list">
            {[
              ['saiba por onde começar', 'uma lista priorizada. o próximo contato fica óbvio.'],
              ['continue no seu whatsapp', 'mensagens curtas, editáveis e enviadas por você.'],
              [
                'veja o resultado das retomadas',
                'acompanhe o valor dos orçamentos que marcou como ganhos.',
              ],
            ].map(([a, b]) => (
              <div key={a}>
                <Check size={18} />
                <div>
                  <h3>{a}</h3>
                  <p>{b}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section id="preco" className="pricing-section">
          <div>
            <div className="eyebrow">pequeno no preço. claro no propósito.</div>
            <h2>
              um plano.
              <br />o que você precisa.
            </h2>
            <p className="muted">
              para quem quer cuidar melhor das oportunidades
              <br />
              que já chegam pelo whatsapp.
            </p>
          </div>
          <div className="price-card">
            <div className="price-top">
              <strong>retoma beta</strong>
              <span className="beta-pill">acesso inicial</span>
            </div>
            <div className="price">
              <span>r$</span>49<small>/mês</small>
            </div>
            <p>preço previsto durante o beta.</p>
            <ul>
              {[
                'orçamentos organizados',
                'régua de follow-up em 1, 3 e 7 dias',
                'mensagens prontas para o whatsapp',
                'receita recuperada no mês',
              ].map((t) => (
                <li key={t}>
                  <Check size={16} />
                  {t}
                </li>
              ))}
            </ul>
            <Button asChild className="full">
              <Link href="/criar-conta">
                começar agora <ArrowRight size={17} />
              </Link>
            </Button>
            <small>nenhuma cobrança nesta versão. sem cartão.</small>
          </div>
        </section>
        <section className="faq-section">
          <div className="eyebrow">antes de começar</div>
          <h2>alguma dúvida?</h2>
          {[
            [
              'o retoma envia mensagens sozinho?',
              'não. ele prepara uma mensagem e abre a conversa no whatsapp. você revisa, envia e depois confirma o contato no retoma.',
            ],
            [
              'preciso conectar meu whatsapp?',
              'não precisa de integração nem leitura das suas conversas. você cadastra os orçamentos e abre o whatsapp pelo botão.',
            ],
            [
              'o que conta como receita recuperada?',
              'o valor de cada orçamento que você marca como ganho. o indicador organiza esses valores pelo mês do fechamento; não é uma conciliação bancária.',
            ],
            [
              'e se eu esquecer de entrar no dia certo?',
              'o orçamento continua na lista de hoje enquanto houver follow-up pendente. os contatos atrasados aparecem primeiro.',
            ],
            [
              'funciona pelo celular?',
              'sim. você acessa pelo navegador, cadastra orçamentos e abre as conversas no whatsapp do seu celular.',
            ],
            [
              'vou pagar agora?',
              'não. r$ 49/mês é o preço previsto para o beta. esta versão não faz cobranças e não pede cartão.',
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <Plus size={18} />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </section>
        <section className="final-cta">
          <div className="eyebrow">a próxima venda pode estar numa conversa antiga</div>
          <h2>
            seu próximo passo?
            <br />
            retomar<span>.</span>
          </h2>
          <Button asChild>
            <Link href="/criar-conta">
              organizar meus orçamentos <ArrowRight size={18} />
            </Link>
          </Button>
          <p>comece com os orçamentos que você enviou esta semana.</p>
        </section>
      </main>
      <footer className="landing-footer">
        <Link href="/">
          <Brand />
        </Link>
        <span>uma conversa de cada vez.</span>
        <Link href="/entrar">
          entrar na minha conta <ArrowUpRight size={14} />
        </Link>
      </footer>
    </div>
  );
}
