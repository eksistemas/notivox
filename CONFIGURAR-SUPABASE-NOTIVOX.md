# Conexão Supabase da Notivox

Projeto confirmado por consulta de leitura: `qtdcwydysaydoakjbwoo`, organização **notivox**, nome no painel **Ek Sistemas**. A reconexão finalmente autorizou consultas; `public` estava sem tabelas e o schema `notivox` ainda não existia. Nenhuma tabela ou arquivo remoto foi criado nesta preparação.

## Implementação preparada

O aplicativo continua usando suas regras de sessão, autenticação e permissões, sem transferir automaticamente contas para Supabase Auth. A função Vercel usa o banco PostgreSQL privado e o Supabase Storage, preservando os leitores, uploads em partes e backup. O adaptador de banco parametriza os valores e mantém os lotes transacionais exigidos pela restauração. O servidor local SQLite permanece disponível e independente.

Arquivo SQL para revisão: `supabase/migrations/20261019214411_notivox_private_backend.sql`. Ele cria:

- Schema privado `notivox` e as tabelas `users`, `sessions`, `attempts` e `app_data`.
- Usuário de banco `notivox_app`, sem superusuário, criação de banco ou criação de roles. Ele recebe somente uso do schema, DML das tabelas e uso das sequências.
- RLS nas quatro tabelas. Somente o papel do backend é autorizado; o navegador continua sujeito à autenticação e autorização do aplicativo. Não expor esse schema na Data API.
- Bucket privado `notivox-private`, sem políticas de acesso anônimo. O servidor acessa os objetos após conferir o usuário pelo código existente.

Não insere músicas, usuários fictícios, senhas ou sessões. A criação falha se os nomes já existirem: não reutiliza um bucket público nem sobrescreve uma estrutura desconhecida. O id 1 é reservado para o administrador inicial e a sequência começa em 2.

## Etapas ainda pendentes

1. Revisar e autorizar a aplicação da migração no projeto dedicado. Não executar este arquivo em outro aplicativo. A migração cria estrutura, mas não transfere o acervo local.
2. Definir uma senha forte para o novo usuário técnico `notivox_app` por um canal privado do painel. Não usar a senha da conta ChatGPT. Não enviar senhas no chat nem salvar no Git.
3. Montar a conexão PostgreSQL pelo Transaction pooler do Supabase, com o usuário `notivox_app.<project-ref>` e a senha técnica correspondente. O código desativa prepared statements, usa TLS com validação de certificado e limita conexões por instância. Não configurar com o superusuário `postgres`.
4. Cadastrar as variáveis privadas abaixo no ambiente Vercel de homologação, preservando o histórico do ambiente atual.
5. Preparar o administrador inicial: execute `node prepare-notivox-admin.mjs` no seu terminal privado. O comando solicita e confirma uma senha com digitação oculta e grava somente hash e salt em um novo arquivo `.runtime/notivox-admin-*.env`, fora do Git. Cadastre os dois valores como variáveis privadas na Vercel; não envie o arquivo no chat. O servidor usa `NOTIVOX_INITIAL_ADMIN_HASH` e `NOTIVOX_INITIAL_ADMIN_SALT` para criar a conta `admin` somente se não existir administrador. São os formatos PBKDF2 já utilizados pelo sistema, sem senha em texto puro no arquivo. A rota pública de setup não aceita cabeçalho de proprietário enviado pelo cliente.
6. Publicar somente após autorização. Conferir login, papel de consulta, upload/abertura de PDF, transposição, repertório, exportação e restauração com banco e arquivos reais.
7. Para levar o acervo existente, conferir um backup completo antes de transferir. Não copiar `.runtime` para a pasta pública. O backup transporta contas sem credenciais; revisar a forma de restabelecer acesso antes da migração de usuários.

| Variável privada Vercel | Valor |
|---|---|
| `NOTIVOX_DATABASE_URL` | URL PostgreSQL do pooler com o usuário limitado `notivox_app` |
| `SUPABASE_URL` | `https://qtdcwydysaydoakjbwoo.supabase.co` |
| `SUPABASE_SECRET_KEY` | Chave secreta do projeto, exclusivamente no servidor |
| `NOTIVOX_STORAGE_BUCKET` | `notivox-private` (padrão) |
| `NOTIVOX_INITIAL_ADMIN_HASH` | Hash do administrador inicial, caso o banco ainda não tenha administrador |
| `NOTIVOX_INITIAL_ADMIN_SALT` | Salt correspondente ao hash |

Configuração parcial retorna 503; não há fallback silencioso para dados fictícios ou acesso público. Remova as variáveis do modo antigo `ADNIPO_BACKEND_*` se optar pela integração Supabase. Elas não são necessárias nesse modo.

## Validação e limites

Dependências fixadas: `postgres` 3.4.9 e `@supabase/supabase-js` 2.118.0. Testes PostgreSQL locais usam PGlite 0.5.10; o teste não cria dados no Supabase. Ver `tests/supabase-backend.test.mjs`.

Testes de banco locais não substituem validação do pooler, credenciais, bucket real e políticas no projeto depois de aplicar a estrutura. Testes de Storage nesta etapa usam uma implementação simulada do cliente; não foi confirmado upload real no serviço. A autenticação por e-mail liberado mantém o comportamento existente, sem adicionar prova de posse por OTP nesta mudança.

Esta integração ainda atende um acervo compartilhado com permissões. Separação comercial de clientes e cobrança não são implementadas aqui.
