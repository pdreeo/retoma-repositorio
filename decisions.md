# decisões

## 2026-09-21

- **stack:** next.js 16.3.5, react 19.3.0, typescript 6.0.3, tailwind 4.3.3 e supabase js 2.116.0 / ssr 0.12.7, versões estáveis resolvidas no registry npm nesta execução. versões exatas transitivas no lockfile. próxima manutenção deve revisar avisos do registry. eslint 9.39.5 mantido por compatibilidade com a configuração do next, embora npm já avise fim de suporte; atualizar quando suportado e validado.
- **next.js 16:** uso de `proxy.ts` para renovar sessão, seguindo a mudança de nomenclatura do framework. autenticação final também é conferida em cada rota com `getUser()`.
- **monólito:** frontend e rotas de servidor no mesmo projeto. postgres e auth no supabase. nenhuma api de ia, cron, fila, microsserviço ou integração whatsapp.
- **componentes:** padrão shadcn/ui com cva, slot e dialog radix; classes próprias para a identidade do retoma. sem biblioteca de dashboard.
- **empresa única por usuário:** `company_members.user_id` é único na v1. nenhuma interface de convites ou permissões avançadas. schema preserva a relação para evolução deliberada.
- **segurança:** rls em todas as tabelas. authenticated tem apenas select; escritas só pelas rpcs listadas explicitamente. funções security definer com search_path vazio e identidade derivada de `auth.uid()`. clientes não escolhem company_id. sem service role na aplicação. `followups` possui chave estrangeira composta para impedir vínculos entre empresas.
- **dinheiro:** integer em centavos, até r$ 9.999.999,99 por orçamento. análise do texto brasileiro sem arredondamento binário. valor fechado preservado em `recovered_cents`; orçamentos encerrados não são reabertos/editados na v1.
- **receita:** a pedido do produto, todo orçamento marcado ganho conta como recuperado no mês do fechamento. isto é atribuição manual, não prova de pagamento nem prova causal de que um follow-up gerou a venda. explicado na faq.
- **datas:** data do orçamento e vencimentos usam date. eventos usam timestamptz. dias e meses são interpretados em America/Sao_Paulo. mudança de mês em utc não antecipa fechamento no brasil. dias corridos, inclusive fins de semana.
- **régua:** dias 1, 3 e 7 desde o envio. array fica na empresa, sem editor; constraint mantém os intervalos fixos na v1. adaptar constraint e validação em migration futura se houver configuração.
- **atrasados:** ficam na fila de hoje até a conclusão ou encerramento. ordem por vencimento mais antigo, depois maior valor. ao realizar uma etapa atrasada, outras etapas já vencidas são agrupadas, com registro `skipped_at`, para evitar pedir várias mensagens no mesmo dia. etapas futuras permanecem.
- **status:** banco guarda new/awaiting/won/lost; “follow-up hoje” é calculado a partir da próxima etapa pendente. isso elimina um job diário e estados desatualizados. “aguardando resposta” no indicador significa orçamento aberto sem pendência hoje.
- **sem resposta:** não lemos o whatsapp e não há cadastro de respostas. por honestidade, a lista informa “dias desde o orçamento”, sem fingir conhecer a última resposta do cliente.
- **envio:** abrir wa.me não conclui contato. usuário confirma depois do envio. guarda a mensagem que estava no editor ao confirmar. o histórico não é recibo de entrega do whatsapp.
- **idempotência:** confirmação recebe o id da etapa e não consome a próxima no clique repetido. fechamento repetido não duplica valor nem muda data de fechamento. funções bloqueiam a linha do orçamento.
- **edição:** datas podem mudar antes do primeiro contato; após contato/agrupamento, data preservada. não há edição de orçamento encerrado.
- **demo:** `/demo` usa os mesmos componentes, dados e regras de exibição, mas dados fictícios em sessionStorage. banner explícito. números iniciais inválidos para contato real. seed opcional para uma conta supabase dedicada, sem secrets hardcoded.
- **paginação interna:** leituras buscam páginas de 500 para não truncar métricas no limite padrão do supabase. sem filtros avançados ou paginação visível na v1.
- **preview:** wrapper de desenvolvimento traduz flags do ambiente supervisionado para next dev; localmente usa porta 3000. não altera stack de produção.
- **infraestrutura:** usuário autorizou github, supabase e vercel. github conectado e conta verificada; ferramenta não cria repositórios. supabase e vercel confirmados instalados/conectados, mas sem ferramentas expostas no registro desta execução. não foram criados projetos por caminhos não autenticados nem usados repositórios de outros sites.
- **verificação visual:** a landing renderizou e seu conteúdo foi inspecionado. depois a política do navegador rejeitou navegação e captura por protocolo de url não permitido. nenhum contorno foi tentado. qa visual e autenticação real continuam pendentes.

referências oficiais consultadas: https://nextjs.org/docs/app/getting-started/proxy e https://supabase.com/docs/guides/auth/server-side/creating-a-client.

## 2026-09-23 — mensagens e próximo contato

- mensagens sugeridas capitalizam início de frase e o primeiro nome; preservam a escrita informada do serviço, inclusive siglas. a interface mantém sua linguagem em minúsculas. nenhuma ia ou css intervém na mensagem enviada.
- a visão geral separa contatos vencidos de próximos contatos, reaproveitando a lista existente. a página do orçamento coloca o whatsapp antes do registro e agrupa contato, ganho, perda e reagendamento. a ação ambígua “marcar como aguardando” saiu da interface; o status aguardando continua definido ao registrar ou reagendar.
- reagendamento explícito altera apenas a próxima etapa pendente e, quando preciso, posterga as posteriores mantendo a distância mínima da régua d+1/d+3/d+7. o banco confere usuário autenticado, empresa, orçamento aberto e data entre amanhã e 365 dias; chamadas por outro tenant falham. sem nova tabela, serviço externo ou editor de cadência.
- migration hospedada `20260923010036_reschedule_followup` aplicada ao projeto supabase existente. a função usa o mesmo padrão de acesso restrito das rpcs atuais; advisor acusa aviso deliberado de security definer executável por authenticated. nenhuma chave de administrador foi adicionada.


## 2026-09-22 — provisionamento

- preservado o projeto supabase já criado do retoma. aplicado sql existente integralmente. migration local renomeada para a versão atribuída pelo supabase, `20260922085348`, evitando divergência futura de histórico.
- variáveis locais apontam para o projeto real com chave publicável; arquivo `.env.local` ignorado pelo git e pelo pacote de entrega. não há service role.
- avisos security advisor sobre funções security definer executáveis por authenticated são intencionais no desenho de rpcs estreitas: revogar impediria o produto; security invoker sem políticas de escrita também impediria o fluxo. autorização por vínculo foi testada no banco real, inclusive chamadas com id de outro tenant.
- não configurar senha, usuários autenticados, redirects ou smtp diretamente em tabelas internas de auth; usar configuração oficial do serviço.
- instrução da habilidade control-browser exige permissão antes de trocar para os painéis no navegador quando o plugin de um serviço falha. pedir uma única autorização para esse caminho, sem pedir senhas ou tokens no chat.
- referência do aviso: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable

## 2026-09-22 — correções pontuais autorizadas

- auth: o proxy valida a identidade com `getClaims()` e redireciona usuários autenticados de `/entrar` e `/criar-conta` para `/app`. visitantes continuam vendo os formulários. a proteção de dados no servidor continua usando `getUser()`.
- cookies: cookies renovados são copiados para respostas de redirecionamento. todos os headers fornecidos por `setAll` são preservados; respostas dos caminhos de autenticação recebem cache privado e no-store. testes cobrem sessão válida, expirada, visitante e renovação.
- contraste: a regra específica do link primário no painel de ação usa o off-white existente para texto/ícone, mantendo o fundo verde, dimensões, tipografia e layout. foco recebe o verde escuro existente. esta exceção foi explicitamente solicitada; não autoriza redesign.
- validação: isolamento automatizado cobre leitura, alteração e exclusão nas duas direções. esses testes usam identidades simuladas em postgres embutido e não substituem duas contas reais na aplicação publicada. resultados atuais ficam em `qa-status.md`.
