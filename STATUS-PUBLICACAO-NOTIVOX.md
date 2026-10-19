# Ativação autorizada

## Estado atual: online validado em 19/10/2026

Publicação de produção `dpl_4fqstmHtkGA37TJ6891GQf4qCz35`, disponível em https://notivox-zeta.vercel.app. As notas seguintes registram etapas anteriores e seus bloqueios já resolvidos.

- Login do administrador e consulta autenticada ao acervo aprovados; acesso sem sessão bloqueado com 401.
- Quatro músicas e uma conta real copiadas da instalação local, sem sobrescrever banco remoto existente. A conta fictícia local não foi transferida.
- Quatro objetos de armazenamento correspondem a dois anexos completos. Bytes conferidos por SHA-256 antes e depois da cópia; download e Range HTTP 206 aprovados em produção.
- Usuário comum não pode editar o acervo nem exportar backup (403). Logout invalida a sessão. A conta temporária de verificação foi removida.
- `npm run build` e build Vercel aprovados em Node.js 24.19.0; `npm test`: 138 aprovados, zero falhas.
- Cinco alertas de dependências continuam registrados (quatro moderados e um alto); não foram aplicadas atualizações incompatíveis automáticas.

Correção adicional: a CLI atual exige `db query --linked` ao utilizar `--project-ref`. A conexão PostgreSQL também requer a CA própria do Supabase, obtida por HTTPS em `https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt`. `lib/supabase-backend.mjs` aceita `NOTIVOX_DATABASE_CA` sem desativar `rejectUnauthorized` nem a verificação do nome do servidor. O certificado é configurado no servidor, juntamente com `NOTIVOX_DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY` e `NOTIVOX_STORAGE_BUCKET`; nenhuma chave é enviada ao frontend ou ao Git.

Acesso de administrador temporário para teste definido por solicitação explícita do proprietário. Trocar a senha antes da abertura ao público. A validação foi por testes automatizados e HTTP real; a inspeção visual manual em celular/tablet ainda deve ser feita. Instalação e arquivos locais preservados.

O usuário autorizou a publicação e a criação da estrutura dedicada no Supabase em 19/10/2026. A migração `notivox_private_backend` foi aplicada com sucesso ao projeto `qtdcwydysaydoakjbwoo`.

Verificação posterior: quatro tabelas em `notivox` com RLS habilitada; zero contas e zero registros de acervo inicializados; bucket `notivox-private` não público; verificador de segurança Supabase sem alertas. Nenhum dado anterior foi excluído e nenhum plano pago foi contratado.

A configuração privada da Vercel ainda depende da autorização local do Supabase e do provisionamento das credenciais limitadas. A janela de login foi aberta no computador do usuário; nenhum código ou senha deve ser enviado à conversa. O site pode exibir a entrada após receber a correção da função, mas não deve ser considerado funcional antes de validar login e acesso ao banco real.

## Publicação da correção concluída

Commit `b21f945` enviado para `https://github.com/eksistemas/notivox`, branch main. O Git local foi atualizado para esse endereço. Pacote prebuilt validado publicado no projeto Vercel existente, deploy `dpl_123qQcV3xmaduuFL3XFVeLM3TyqL`, alias de produção `https://notivox-zeta.vercel.app`.

Conferência HTTP pública após o deploy: raiz 200 com título Notivox, theme.js 200, manifesto 200; cabeçalho FUNCTION_INVOCATION_FAILED ausente. `/api/status` retorna 503 controlado, indicando falta de configuração do backend. Portanto, o erro 500 de inicialização está corrigido, mas a aplicação ainda não permite login ou consulta online ao acervo.

A sessão CLI Supabase não estava autenticada. Foi aberta uma janela interativa privada para o usuário concluir a autenticação. Esse é o bloqueio atual; não foi pedido que senhas ou códigos sejam enviados na conversa. Nenhum conteúdo de usuário foi transferido automaticamente para a nuvem.

Validação do código antes do envio: 138 testes aprovados, build normal e build de produção local da Vercel aprovados. Verificador do artefato aprovado. Os relatórios anteriores descrevem o estado antes da autorização; este arquivo registra a aplicação posterior da estrutura.
