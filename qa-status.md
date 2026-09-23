# qa do retoma — 23/09/2026 (utc)

ambiente: produção em https://retoma-five.vercel.app, projeto supabase `retoma` existente, migration `20260922085348` já aplicada. o navegador exibiu 22/09 no fuso de brasília durante o teste.

## verificado na url pública

- landing sem selo segmentado e metadata/description genérica para negócios de serviços; screenshot desktop conferido sem alteração da identidade visual.
- conta alfa fictícia: cadastro, confirmação de e-mail pelo proprietário, login, criação da empresa, edição do nome, acesso direto a `/app`, persistência após fechar e reabrir uma aba e entre sessões, redirects autenticados de `/entrar` e `/criar-conta`, logout.
- conta alfa: estado vazio, criação e edição de orçamento, dinheiro `125099` centavos, datas d+1/d+3/d+7 confirmadas também no banco hospedado; orçamento vencido na fila, mensagem editável e `wa.me` com telefone/mensagem codificados, registro manual da etapa, agrupamento das vencidas, próxima etapa futura, ganho e indicador de r$ 1.250,99 atualizado.
- demo pública: perda com motivo “outro” e detalhes obrigatórios, busca/estado vazio, filtro ganho, edição e ganho anteriormente conferidos; números fictícios. “marcar como aguardando” com etapa vencida deixa o orçamento visível na fila de hoje. observar com os primeiros usuários antes de mudar a regra.
- contraste do botão whatsapp medido no navegador: fundo verde existente `rgb(45,98,75)`, texto/ícone off-white `rgb(250,251,249)`; hover `rgb(33,75,57)`, foco de teclado com contorno de 3px. estado disabled aparece quando mensagem vazia. screenshot desktop salvo.
- console da aplicação sem erro detectado nessa inspeção; entradas registradas vieram da extensão do navegador de teste. o plugin vercel respondeu 403 para logs administrativos.

## banco e segurança

- supabase ativo/saudável; rls nas cinco tabelas. suíte automatizada usa postgres embutido com duas identidades simuladas, testa leitura, edição e exclusão cruzadas nas duas direções, permissões de rpcs, centavos e datas. isso não equivale a logins de duas contas no projeto hospedado.
- security advisor: nenhum finding crítico. seis avisos de rpcs `security definer` executáveis somente por usuários autenticados são intencionais e protegidos pela checagem de `auth.uid()`/empresa. aviso separado: leaked password protection desativada; integração não oferece edição dessa opção.
- performance advisor: índice ausente para chave estrangeira composta de `followups`, nível informativo; manutenção futura registrada sem migration nova.
- varredura dos arquivos de entrega não encontrou padrão de chave secreta, service_role, senha de banco ou token privado. `.env.local`, `handoff.md` e `validation.md` ficam fora do zip.

## validação técnica

`npm run lint`, `npm run typecheck`, `npm test` (23/23) e `npm run build` (next.js 16.3.5, turbopack) passaram após a alteração de copy.

## ainda não validado

- segunda conta real, empresa beta e isolamento cruzado autenticado na produção. a revisão automática bloqueou o formulário seguro de cadastro antes do envio porque o texto da ferramenta dizia “sign in” embora a página criasse uma conta; não se tentou contornar o bloqueio. somente uma conta de teste nova foi confirmada. a outra conta previamente existente no supabase não foi usada por não ser conta de teste.
- recuperação de senha completa, inclusive recebimento do e-mail e nova senha; valor remoto de `NEXT_PUBLIC_SITE_URL`, templates e redirects não podem ser lidos pela integração disponível. cadastro/confirmacão real e login funcionaram, mas não provam o fluxo de recuperação.
- login com senha incorreta e login novamente após logout ainda não foram exercidos com credenciais no navegador desta rodada.
- perda, busca e filtros foram verificados no modo demonstração, ainda não com a conta real hospedada.
- abertura do aplicativo whatsapp em aparelho real; o link `wa.me` foi validado sem enviar mensagem a número fictício.
- viewport mobile real não exposta pelo navegador desta execução. teste visual e funcional mobile pendente.
- vercel retorna 403 na leitura administrativa do projeto, variáveis e logs; o status do commit no github confirma deployment de sucesso e o site está acessível. nenhum valor de env remoto foi afirmado por inferência.

o beta público está acessível; estas pendências impedem declarar concluída a validação integral de segurança e recuperação pedida para liberação a clientes.

## 23/09/2026 — mensagens e clareza do fluxo

ambiente: `https://retoma-five.vercel.app` após o commit `faa126e7`; no navegador a data brasileira era 22/09. supabase existente saudável, migration original `20260922085348` preservada e nova `20260923010036_reschedule_followup` aplicada uma vez.

- demonstração pública: orçamento fictício “anna silva”, serviço com maiúsculas `Landing Page + PPF`, telefone fictício e r$ 1.250,99 criado. o formulário abriu o detalhe automaticamente. conferidos status, vencimento, mensagem `Oi, Anna! Conseguiu... Se...`, telefone e mensagem codificados no `wa.me`. o clique abriu o destino `whatsapp://send` com os mesmos dados; nenhuma mensagem foi enviada a um número real.
- após voltar: contato confirmado no diálogo, primeira etapa registrada com a mensagem correta e etapa seguinte exibida. a mensagem da segunda etapa aparece como `Oi, Anna! Passando... Posso...`. reagendamento para 26/09 atualizou a etapa seguinte para 30/09; a visão geral separou pendências de hoje e contatos futuros. ganho acrescentou r$ 1.250,99 ao indicador do mês e encerrou o orçamento.
- outro orçamento fictício marcado perdido com motivo “outro”; detalhes vazios impedidos pelo formulário, motivo e texto salvos. o total aberto e a lista de hoje caíram depois do encerramento.
- screenshot desktop da visão geral confirmou sidebar, tipografia, cores e disposição aprovadas. console sem erro da aplicação durante o fluxo; os erros vistos têm origem na extensão do navegador de teste. inspeção do navegador em viewport mobile não disponível; regras responsivas permanecem no código, sem confirmação visual em aparelho ou emulação mobile.
- `npm run lint`, `npm run typecheck`, `npm test` (25/25) e `npm run build` passaram depois das correções finais. teste de banco embutido cobriu reagendamento e bloqueio de tenant distinto. na instância hospedada, privilégios da nova função: `anon` sem execute, `authenticated` com execute; os testes com duas contas reais hospedadas e recuperação de senha seguem pendentes conforme acima.
- security advisor após nova migration: nenhum finding crítico, 7 avisos da mesma classe de rpcs `security definer` autenticadas e aviso de leaked password protection desativada. a nova rpc exige `auth.uid()`, isola por `my_company_id()` e valida data/estado; o aviso é intencional. inspeção administrativa da vercel pela integração ainda retorna 403, mas o status do commit no github confirmou deployment bem-sucedido e a URL publicou a correção.
