# Notivox: experiência, áudio e administração

## Navegação

Os músicos usam `/login`, `/inicio`, `/repertorio` e `/musica/:id`. A aplicação continua usando a SPA existente; os caminhos amigáveis encaminham para as rotas internas. A navegação de músicos mostra somente Início e Repertório. A administração usa `/admin/login`, `/admin`, `/admin/musicas/nova` e `/admin/musicas/:id`, sem links administrativos no menu dos músicos.

O início reúne a busca dinâmica e até três acessos recentes. O repertório mantém busca, filtros aplicáveis ao acervo real e lista compacta. A ficha da música mantém os leitores de cifra, PDF e partituras existentes.

## Áudios

O áudio é um material da música (`resources[].type = "audio"`); as referências antigas em `audioLink` também são aceitas. O reprodutor usa esses endereços, não inicia sozinho e descarrega a fonte ao fechar a música. A busca do repertório oferece filtro Áudio somente quando há músicas com áudio. Administração pode gerenciar arquivos de áudio no acervo; músicos podem enviar áudio ao cadastrar uma música nova. São aceitos MP3, WAV, M4A, OGG, AAC e FLAC, com limite compartilhado de 200 MB e envio em partes pelo armazenamento privado atual.

Ao remover ou substituir um upload, o servidor só apaga o objeto depois que a referência deixa de existir no cadastro persistido. A rota administrativa de exclusão confirma que o arquivo não é usado por outra música. Arquivos referenciados permanecem protegidos contra remoção acidental.

## Autenticação e permissões

O login usa as contas e sessões já existentes, com senha PBKDF2-SHA512 e cookie `HttpOnly`, `SameSite=Strict`. A tela de músico aceita e-mail ou usuário e senha. O antigo endpoint de login somente por e-mail foi desativado. A administração exige papel `admin`; controles de API, upload e exclusão são verificados no servidor. `department_admin` não recebe acesso administrativo geral.

Não há serviço de envio de e-mail para recuperação de senha configurado neste projeto. O músico deve pedir ao administrador que redefina a senha pelo fluxo administrativo disponível. Contas também podem ser criadas pela administração em Administração → Acessos, com senha inicial definida pela equipe e compartilhada por canal seguro.

## Administrador inicial em produção

O banco usa a tabela de usuários existente; nenhuma migração adicional é necessária para senha, papel ou áudio. Gere o hash localmente em terminal interativo:

```powershell
node generate-admin-hash.mjs
```

Cadastre como variáveis de ambiente privadas no servidor:

- `NOTIVOX_INITIAL_ADMIN_USERNAME`: nome de usuário único (opcional; padrão `admin`).
- `NOTIVOX_INITIAL_ADMIN_SALT`: valor gerado pelo script.
- `NOTIVOX_INITIAL_ADMIN_HASH`: valor gerado pelo script.

Na primeira solicitação com esses valores, o backend cria a conta de papel `admin` somente se ainda não houver administrador. Remova as variáveis de hash depois da primeira inicialização bem-sucedida. Não coloque esses valores no frontend, repositório ou logs. Para desenvolvimento local, o primeiro cadastro protegido pode ser feito no fluxo local em `/admin/login`.

## Configuração de armazenamento e backend

O deploy em nuvem requer as variáveis já usadas pelo backend:

- `NOTIVOX_DATABASE_URL`: conexão PostgreSQL privada do usuário `notivox_app`.
- `SUPABASE_URL`: URL base do projeto Supabase.
- `SUPABASE_SECRET_KEY`: chave secreta apenas no servidor.
- `NOTIVOX_STORAGE_BUCKET`: opcional; padrão `notivox-private`.

O bucket privado não deve ser tornado público. A migração existente `supabase/migrations/20261019214411_notivox_private_backend.sql` cria as tabelas de sessão/dados e configura o bucket privado. A migração precisa ser aplicada no projeto Supabase de destino; este trabalho não a executa em ambiente externo. O limite total de upload continua sendo 200 MB, conforme `files.mjs`. A implantação em nuvem precisa ter o bucket `NOTIVOX_STORAGE_BUCKET` configurado para aceitar e reproduzir anexos; sem ele, o cadastro de texto continua disponível, enquanto uploads retornam erro explícito.

## Build e validação

Use Node.js 24: `npm ci`, `npm run build`, `npm test`. O repositório não define comando de lint. Testes de login administrativo e upload dependem de banco/bucket locais; validações contra o Supabase de produção dependem de variáveis e credenciais externas.

## Contribuições dos músicos

Contas `member` podem adicionar músicas pelo início ou pelo repertório. O formulário aceita título, artista, tom original e da cifra, gênero, BPM, cifra com acordes e letra, letra separada, observações e links de partitura, cifra/grade, PDF, vídeo, vozes e slides. Também permite enviar um áudio real em MP3, WAV, M4A, OGG, AAC ou FLAC até 200 MB. O servidor cria o identificador, define `createdBy` a partir da sessão e aceita somente os campos previstos; o cliente não escolhe usuário, papel ou departamento.

O músico não recebe permissão para editar, remover ou regravar o acervo completo. A administração continua responsável por edição e exclusão. A API dedicada `POST /api/songs` valida os dados e registra somente um novo item. O upload de membros é restrito a áudio de música nova; outros uploads permanecem administrativos.

## Preparação para cobrança

`GET /api/users` (somente administração) apresenta `songCount`, `billingThreshold` (20) e `billingEligible` (mais de 20 músicas atribuídas à conta). A autoria é persistida em `songs[].createdBy`, sem alteração de esquema de banco. A interface administrativa exibe a contagem e sinaliza contas acima do limite. Não existe cobrança mensal ou vitalícia integrada: plano, preço, consentimento, pagamentos e regras para músicas duplicadas precisam ser definidos antes de ativar uma cobrança.

## Cadastro público e acesso administrativo

A tela `/login` oferece cadastro de músico com e-mail ou nome de usuário e senha de pelo menos oito caracteres. O endpoint `POST /api/signup` cria sempre o papel `member`, aplica limite de tentativas e inicia uma sessão segura. O cadastro não permite escolher nem alterar papel. Não há confirmação por e-mail nem recuperação automática de senha configuradas; a senha pode ser redefinida pela administração.

O endpoint `GET /api/users` e a área de gerenciamento continuam exclusivos para `admin`, verificado no servidor. Cadastro público não concede acesso à lista de contas. Para dar acesso administrativo ao proprietário é necessário usar uma conta `admin` já provisionada; a conta de teste local não existe automaticamente no Supabase. Este recurso usa a tabela de usuários existente e não requer migração SQL.
