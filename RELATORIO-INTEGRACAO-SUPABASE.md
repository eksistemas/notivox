# Preparação da integração Supabase

## Estado confirmado

A reconexão autorizou o projeto `qtdcwydysaydoakjbwoo`, na organização notivox, exibido como Ek Sistemas. Foram executadas somente consultas de leitura. O schema public estava sem tabelas; a conferência final encontrou zero schemas chamados notivox e zero buckets chamados notivox-private. URL confirmada pela integração: https://qtdcwydysaydoakjbwoo.supabase.co.

Nenhuma migração foi aplicada no banco remoto. Não foram criados usuários, tabelas, arquivos ou credenciais no serviço. Não houve push ou deploy. O repositório novo mostrado no painel, https://github.com/eksistemas/notivox, foi consultado e respondeu com o mesmo commit ab8cedd da versão anterior. O vínculo local não foi alterado nesta etapa.

## Código preparado

- `lib/postgres-adapter.mjs`: adapta as declarações internas preparadas existentes ao PostgreSQL; preserva parâmetros, aliases e operações atômicas. Restauração bloqueia mudanças concorrentes nas tabelas críticas dentro da transação. Erros externos de banco são apresentados sem SQL ou credenciais.
- `lib/supabase-bucket.mjs`: mantém a interface de bucket usada pelos uploads em partes, leitor PDF e backup. Valida caminhos e mantém bytes, leitura parcial, exclusão de partes e identificação de objetos ausentes. O acesso é exclusivamente do servidor.
- `lib/supabase-backend.mjs`: cliente PostgreSQL com TLS validado, pool limitado e prepared statements desativados para o transaction pooler; cliente Storage sem sessão de navegador; usuário de banco limitado exigido. Reutiliza o worker existente e exige login; elimina cabeçalhos de identidade do proprietário vindos do cliente.
- `lib/vercel-handler.mjs`: aceita backend Supabase quando suas variáveis estão configuradas, mantendo o backend externo anterior como opção separada. Mantém validação de origem e tamanho do corpo.
- `supabase/migrations/20261019214411_notivox_private_backend.sql`: arquivo gerado pela CLI e preenchido localmente para revisão. Cria schema privado, quatro tabelas com RLS, role limitada e bucket privado. Não contém senhas ou dados fictícios e não substitui estruturas existentes.
- `prepare-notivox-admin.mjs`: preparação privada de hash e salt do administrador, com senha digitada sem eco e arquivo em .runtime, excluído do Git. Não executado para criar credenciais reais nesta etapa.
- `tests/supabase-backend.test.mjs`: quatro testes adicionais, incluindo PostgreSQL local real via PGlite, autenticação, permissões, revisão, restauração, rollback e isolamento; Storage simulado e encaminhamento seguro da Vercel.
- `package.json` e `package-lock.json`: conectores fixados em postgres 3.4.9 e supabase-js 2.118.0; PGlite 0.5.10 somente para testes.
- `prepare-release.cjs`, `.gitignore`, `PUBLICAR-ESTA-VERSAO.md`, `COMECE-AQUI-NOTIVOX.md` e `CONFIGURAR-SUPABASE-NOTIVOX.md`: inclusão dos novos arquivos no pacote e instruções de configuração, sem segredos.

## Validação

Com Node.js 24.19.0:

- `npm run build`: aprovado.
- `npm test`: 138 aprovados, zero falhas. PostgreSQL local conferiu criação do administrador inicial, cadastro e login de músico, bloqueio de edição para consulta, conflito de revisão, backup/restauração e rollback após falha; os testes antigos de cifras, partituras e repertório permanecem aprovados.
- `vercel build --prod`: aprovado localmente pela CLI 64.5.0, sem deploy, com os conectores de runtime incluídos.
- `node verify-vercel-build.mjs`: aprovado em nove rotas do pacote real. Entrada api/site.js, Node.js 24, APIs privadas sem configuração retornam 503 e URLs de banco/servidor local retornam 404.
- `node --check prepare-notivox-admin.mjs`: aprovado.
- `npm ci` no build: concluído; manteve os cinco alertas de dependências anteriores. Nenhum audit fix forçado foi aplicado.

## O que ainda impede uso online completo

A estrutura SQL ainda precisa ser aplicada e conferida no projeto remoto, e as variáveis privadas de banco/Storage/admin precisam ser definidas na Vercel. Pooler, credenciais, Storage real e permissões ainda exigem validação integrada. Os testes de Storage desta etapa foram simulados; não se afirma que um upload remoto foi testado.

Os dados reais permanecem no armazenamento anterior. A migração estrutural não transfere automaticamente acervo ou contas. Um backup completo e a estratégia de credenciais dos usuários devem ser conferidos antes de transferir dados.

A versão hospedada ainda não recebeu as correções. Consulte CONFIGURAR-SUPABASE-NOTIVOX.md para as etapas de ativação, mantendo a autorização de publicação separada.
