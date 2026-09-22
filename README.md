# retoma

follow-up simples para estéticas automotivas. next.js + supabase, preparado para vercel.

**estado da entrega:** supabase real ativo em são paulo, migration aplicada e isolamento no banco verificado. código validado localmente. autenticação hospedada, repositório remoto, deploy público e qa visual ainda pendentes. detalhes em `validation.md` e `handoff.md`.

## rodar localmente

node.js 22 ou superior.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

abra `http://localhost:3000`. `/demo` funciona sem credenciais, com dados fictícios persistidos somente na aba. `/app` usa autenticação e banco reais; não troca silenciosamente para dados de demonstração.

## variáveis

| variável                               | conteúdo                                                       |
| -------------------------------------- | -------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | url do projeto supabase                                        |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | chave publicável; segurança garantida pelas políticas do banco |
| `NEXT_PUBLIC_SITE_URL`                 | origem pública exata, por exemplo `https://retoma.vercel.app`  |

não coloque `service_role`, senha do banco ou token pessoal em variáveis `NEXT_PUBLIC_*`. a aplicação não precisa dessas credenciais.

## supabase

1. crie um projeto separado e aplique `supabase/migrations/20260922085348_retoma.sql` pelo sql editor ou `supabase db push` com o projeto vinculado.
2. habilite login por e-mail/senha. mantenha confirmação de e-mail e configure o site url e os redirect urls: `<origem>/auth/callback` e `<origem>/auth/callback?next=/nova-senha`.
3. para links que funcionam também em outro dispositivo, use nos templates:
   - confirmação: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup`
   - recuperação: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery`
4. configure smtp próprio antes de abrir cadastro ao público; o serviço de e-mail padrão do supabase é restrito. revise os limites de envio no painel. não desligue a confirmação para contornar o problema.
5. teste duas contas, cada uma com sua empresa. nenhuma pode ler ou alterar os dados da outra. a migration cria rls, permissões restritas e funções transacionais.

para popular uma conta de demonstração real, crie e confirme uma conta dedicada vazia. defina `RETOMA_DEMO_EMAIL` e `RETOMA_DEMO_PASSWORD` apenas no ambiente local e rode:

```sh
node --env-file=.env.local scripts/seed-demo.mjs
```

o seed usa a conta comum e rls; não usa administrador. não roda se já existirem orçamentos. nunca rode na conta de um cliente.

## deploy na vercel

crie um repositório separado com este código e importe na vercel como next.js. configure as três variáveis acima em produção e preview. build: `npm run build`. configure a mesma origem no supabase e publique novamente quando mudar variáveis `NEXT_PUBLIC_*`. remova proteção de acesso apenas da produção pública, mantendo `/app` protegido pelo login da aplicação. não funciona em github pages: há rotas de servidor.

antes de entregar a url: testar cadastro, confirmação de e-mail, empresa, novo orçamento, persistência após sair/entrar, follow-up, ganho, perda, recuperação de senha e duas contas isoladas. não adicionar cobrança.

## arquitetura e banco

- `app/`: páginas next.js e rotas de backend em `app/api/`.
- `components/`: interface compartilhada pela aplicação real e demo; primitivas shadcn/ui com radix.
- `lib/domain.ts`: datas brasileiras, dinheiro, mensagens e priorização.
- `lib/validation.ts`: validação zod repetida no servidor.
- `lib/supabase/server.ts` + `proxy.ts`: sessão em cookies, validação do usuário e renovação.
- `supabase/migrations/`: postgres, rls e funções de negócio.
- `tests/`: regras de domínio e banco postgres embutido para verificar rls sem credenciais.

| tabela            | responsabilidade                                        |
| ----------------- | ------------------------------------------------------- |
| `profiles`        | nome do usuário; relação com `auth.users`               |
| `companies`       | empresa, timezone e intervalos                          |
| `company_members` | vínculo único usuário → empresa na v1                   |
| `quotes`          | orçamento, centavos, status e fotografia do valor ganho |
| `followups`       | três etapas com data, mensagem e conclusão/agrupamento  |

escritas passam por funções específicas que verificam o vínculo e bloqueiam concorrência por orçamento. rls isola leituras. browser e servidor usam a chave publicável; sem bypass de segurança.

## verificação

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

pglite é dependência exclusiva de testes. detalhes e limites da verificação em `validation.md`. decisões em `decisions.md`; ideias adiadas em `future-ideas.md`.
