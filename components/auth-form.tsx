'use client';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Brand } from './brand';
export function AuthForm({
  mode,
  linkError = false,
}: {
  mode: 'signin' | 'signup' | 'recover' | 'password';
  linkError?: boolean;
}) {
  const [error, setError] = useState(
    linkError ? 'esse link expirou ou já foi usado. solicite um novo.' : '',
  );
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const title = {
    signin: 'bom ter você de volta.',
    signup: 'seu próximo cliente já falou com você.',
    recover: 'vamos recuperar seu acesso.',
    password: 'uma nova senha. pronto.',
  }[mode];
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(e.currentTarget);
    try {
      const body = { mode, ...Object.fromEntries(form.entries()) };
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (data.redirect) {
        router.push(data.redirect);
        router.refresh();
      } else setMessage(data.message);
    } catch (e) {
      setError((e as Error).message || 'tente novamente.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <Link href="/" aria-label="voltar ao início">
        <Brand />
      </Link>
      <div className="auth-layout">
        <section className="auth-intro">
          <div className="eyebrow">menos oportunidades esquecidas</div>
          <h1>
            às vezes, falta
            <br />
            só retomar<span>.</span>
          </h1>
          <p>
            seus orçamentos organizados.
            <br />
            seu próximo passo, claro.
          </p>
          <div className="auth-proof">
            <Check size={18} /> sem cartão. sem mensagem automática.
          </div>
        </section>
        <section className="auth-card">
          <h2>{title}</h2>
          <p className="muted">
            {mode === 'signup'
              ? 'crie sua conta e organize os primeiros orçamentos.'
              : mode === 'signin'
                ? 'entre para ver quem precisa de você hoje.'
                : mode === 'recover'
                  ? 'vamos enviar um link para o seu e-mail.'
                  : 'use pelo menos 8 caracteres.'}
          </p>
          {message ? (
            <div role="status" className="success-box">
              <Check size={22} />
              <p>{message}</p>
              <Link href="/entrar">voltar para entrar</Link>
            </div>
          ) : (
            <form className="form-stack" onSubmit={submit}>
              {mode === 'signup' && (
                <label>
                  seu nome
                  <input
                    name="name"
                    autoComplete="given-name"
                    minLength={2}
                    maxLength={80}
                    required
                    placeholder="como podemos chamar você?"
                  />
                </label>
              )}
              {mode !== 'password' && (
                <label>
                  e-mail
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="voce@empresa.com.br"
                  />
                </label>
              )}
              {mode !== 'recover' && (
                <label>
                  senha
                  <input
                    name="password"
                    type="password"
                    minLength={8}
                    maxLength={128}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    required
                    placeholder="pelo menos 8 caracteres"
                  />
                </label>
              )}
              {mode === 'signin' && (
                <Link className="auth-forgot" href="/recuperar">
                  esqueci minha senha
                </Link>
              )}
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="spin" size={18} /> : null}
                {
                  {
                    signin: 'entrar',
                    signup: 'criar minha conta',
                    recover: 'enviar link de acesso',
                    password: 'salvar nova senha',
                  }[mode]
                }
                <ArrowRight size={17} />
              </Button>
            </form>
          )}
          <p className="auth-switch">
            {mode === 'signin' ? (
              <>
                ainda não tem conta? <Link href="/criar-conta">começar agora</Link>
              </>
            ) : (
              <Link href="/entrar">já tem conta? entrar</Link>
            )}
          </p>
          <Link className="demo-link" href="/demo">
            explorar a demonstração
          </Link>
        </section>
      </div>
      <footer className="auth-footer">retoma · uma conversa de cada vez.</footer>
    </main>
  );
}
