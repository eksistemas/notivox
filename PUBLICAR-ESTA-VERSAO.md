# Versão para revisão e publicação web

## O que está preparado

A aplicação principal inclui a interface Notivox aprovada, playlist, cifras e leitores. O ambiente fictício separado foi retirado. Use http://127.0.0.1:4173/ para a aplicação local com autenticação e armazenamento existentes.

Na versão principal, os dados continuam no armazenamento existente, e a autenticação e as permissões continuam obrigatórias conforme a configuração do servidor. Cifras completas em ChordPro ou com acordes alinhados sobre a letra usam a apresentação aprovada. Uma grade sem posições e uma letra separada não podem ser alinhadas automaticamente com fidelidade; nenhum cadastro será convertido ou sobrescrito durante a atualização.

## Conferir no computador

1. Use Node.js 24. Na pasta extraída, execute `npm ci`, `npm run build` e `npm test`.
2. Para o acervo real, use a pasta original e `node server.cjs`. Abra http://127.0.0.1:4173/#playlist. Não copie bancos ou credenciais para pastas públicas.
3. Se já instalou o aplicativo, feche os leitores, abra Configurações e use **Verificar atualização**. O aplicativo pode manter a versão anterior em cache até a atualização ser ativada. Confira a versão exibida nas Configurações.
4. Entre com sua conta e confira biblioteca, repertório, tons, Enter no modo músico e PDFs autorizados. Uma extração nova do ZIP não inclui seu acervo nem contas: ela não substitui um backup.

## Publicação web

Este ZIP é código para preparação e revisão, não um site estático pronto para hospedar somente a pasta dist. O sistema depende de um backend com banco e armazenamento persistente. O servidor local da porta 4173 está restrito ao próprio computador e não deve ser exposto como hospedagem pública.

A integração web existente está em `api/site.js` e `lib/vercel-handler.mjs`, com compilação `npm run vercel-build`. O arquivo `vercel.json` fixa Framework Preset **Other** (`null`), instalação `npm ci`, saída `public` e encaminhamento das rotas à função. Não use o preset **Node**: ele pode detectar `server.cjs`, que é exclusivo da instalação local. Não use `dist` como pasta pública.

Há duas opções de backend. A integração Supabase está preparada localmente e exige sua migração e configuração antes de funcionar: `NOTIVOX_DATABASE_URL` (conexão do usuário privado `notivox_app`), `SUPABASE_URL` e `SUPABASE_SECRET_KEY`, todas somente no servidor. Consulte `CONFIGURAR-SUPABASE-NOTIVOX.md`. A opção anterior de backend externo continua disponível por `ADNIPO_BACKEND_URL` e `ADNIPO_BACKEND_TOKEN`; não misture as configurações. Não aponte a URL de backend externo para o próprio frontend nem use URL/chave Supabase como substitutos das variáveis dessa opção anterior.

Sem backend configurado, a tela de entrada, a marca e os recursos públicos podem ser exibidos, mas as APIs privadas retornam 503. Isso não representa um login funcional. Banco e anexos precisam de armazenamento persistente externo; não usar SQLite em memória, `/tmp` ou disco da função para substituir o acervo real. Veja `RELATORIO-CORRECAO-VERCEL.md` para o diagnóstico e os resultados.

Antes de atualizar um ambiente real: exporte e confira um backup completo usando a função existente, mantenha banco e anexos persistentes, valide a versão em um ambiente de homologação HTTPS e depois confira login, permissões, upload, PDFs, repertório e atualização do aplicativo. A preparação deste pacote não executa migrações no banco nem faz deploy.

## Limites para venda e lojas

Esta versão pode ser avaliada como aplicativo web instalável. Ela ainda não é um pacote Android AAB para Google Play. Separação de acervos entre clientes, cobrança, termos/privacidade para operação comercial e catálogo licenciado precisam ser definidos antes de oferecer um serviço pago para clientes independentes. A aplicação atual é um acervo compartilhado com permissões.

Não há garantia de que toda música venha completa. O conteúdo depende do que foi cadastrado ou importado com autorização. Instalação, offline, tela cheia e uso em apresentações ainda precisam da homologação nos dispositivos de destino.
