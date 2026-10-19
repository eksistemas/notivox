# Correção do deploy Notivox na Vercel

## Causa identificada

Em 19/10/2026, a URL `https://notivox-zeta.vercel.app` respondeu HTTP 500 com `FUNCTION_INVOCATION_FAILED` na página inicial, em `/api/site`, `/api/status` e `/manifest.webmanifest`. O deploy analisado foi `dpl_6XSLUEC1jQUNBA1KLvZ1ceBuquEt`, commit `ab8cedd`, Ready, Node.js 24.x.

A inspeção autenticada, somente de leitura, confirmou Framework Preset `node`, sem configuração explícita de build, instalação ou saída. O log de build informa: `Build complete — Using server.cjs as the root entrypoint.` Os logs de execução registram:

```
ReferenceError: ADNIPO is not defined
    at file:///var/task/app.js:21:65
Node.js process exited with exit status: 1.
```

Portanto, a inicialização está carregando o JavaScript de navegador no ambiente Node, com a aplicação empacotada pelo preset e entrada inadequados. `ADNIPO` é criado pelo script de dados na página; não é um global do servidor. Não se deve inserir um global artificial para esconder o problema. O servidor local `server.cjs` abre SQLite e arquivos em disco, escuta 127.0.0.1:4173 e valida esse Host. Não é o backend persistente para uma função Vercel.

O endpoint `api/site.js` já exporta `{fetch}`, formato suportado atualmente pela Vercel. Não foi alterado por uma suposição de incompatibilidade.

## Alterações

- `vercel.json`: framework `null` (Other), instalação `npm ci`, build `npm run vercel-build`, saída pública `public`, função `api/site.js` com limite de 300 segundos e rewrites explícitos para a raiz e demais caminhos. A pasta `dist` contém recursos privados de implementação e não é publicada como diretório estático.
- `lib/vercel-handler.mjs`: libera o recurso público `theme.js` antes da configuração de backend, como o servidor existente já fazia. Isso permite carregar o tema da tela de entrada sem liberar APIs privadas.
- `tests/vercel-entrypoint.test.mjs`: verifica a inicialização da entrada real sem DOM, a configuração de roteamento e a resposta fechada das APIs sem backend.
- `verify-vercel-build.mjs`: verifica o artefato de produção real, entrada e runtime, ausência do servidor/SQLite local na função e execução das rotas compiladas. Não publica nem consulta banco.
- `prepare-release.cjs`: inclui a configuração Vercel e o verificador nos próximos pacotes.
- `PUBLICAR-ESTA-VERSAO.md` e este relatório: configuração e limitações atualizadas.

Nenhuma alteração nas cifras, transposição, partituras, repertórios, banco, anexos ou regras de autenticação. Nada foi enviado ao GitHub nem publicado nesta correção.

## Banco e variáveis: pendência independente

A consulta do projeto Vercel retornou **zero variáveis de ambiente cadastradas**. O handler atual usa um backend externo compatível com as rotas existentes:

| Variável privada | Conteúdo necessário |
|---|---|
| `ADNIPO_BACKEND_URL` | Origem HTTPS do backend persistente, sem caminho, query ou credenciais na URL |
| `ADNIPO_BACKEND_TOKEN` | Credencial de serviço válida desse backend |

Não usar o endereço do próprio frontend como backend. URL e chave de um projeto Supabase não substituem essas variáveis: ainda não foi implementado adaptador Supabase. O backend precisa realmente oferecer autenticação, banco e armazenamento de anexos compatíveis. Nenhum banco remoto foi consultado ou migrado.

Sem essas configurações, a entrada e os recursos públicos são exibidos, mas as APIs privadas retornam 503 e o login não pode ser concluído. Essa resposta é intencional e não é apresentada como aplicação plenamente operacional. Não foi introduzido login fictício, banco em memória, SQLite em `/tmp` ou remoção de permissões para contornar o erro.

## Configurações a conferir na Vercel

1. Projeto `notivox`, repositório `adnipoitaquera/notivox`, diretório raiz do projeto.
2. Framework Preset **Other**, Node.js **24.x**.
3. Instalação **npm ci**, Build Command **npm run vercel-build**, Output Directory **public**. Esses valores estão versionados no novo `vercel.json` e prevalecem sobre os defaults.
4. Configurar as duas variáveis privadas acima apenas quando houver backend real compatível. Usar os ambientes adequados (Preview/Production), sem colocar valores no código público.
5. Após autorização para enviar e publicar, validar primeiro uma versão de homologação. Verificar que o build identifica `api/site.js`, não `server.cjs`, e conferir Runtime Logs.
6. Conferir login, permissões de consulta e administração, biblioteca, importação, transposição, PDF, repertório, anexos e backup com contas e materiais autorizados. Só liberar produção após essa validação e configuração do backend.

## Resultados locais

Node.js **24.19.0** e Vercel CLI **64.5.0**:

- `npm ci`: concluído durante o build Vercel. Indicou cinco alertas de dependências (quatro moderados, um alto); não foram aplicadas atualizações incompatíveis ou `audit fix --force`.
- `npm run build`: aprovado.
- `npm test`: **134 aprovados, zero falhas**. Inclui biblioteca, importação, filtros, transposição, partituras, leitor PDF, repertórios, autenticação, backup e os dois novos testes da entrada Vercel.
- `vercel build --prod`: **aprovado localmente, sem deploy**. Preset autodetectado desativado; função `api/site.js`, runtime `nodejs24.x`. O builder estático de `package.json` gera apenas `public/.keep`, não expõe fontes ou dados.
- `node verify-vercel-build.mjs`: **aprovado**, com nove rotas verificadas no artefato: `/`, `/login`, tema, logo, manifesto e bundle PDF retornam 200; API de dados sem backend retorna 503; servidor local e banco por URL retornam 404. A raiz e os caminhos são conferidos usando os rewrites efetivamente compilados pela Vercel.

Uma primeira tentativa local do CLI falhou com `spawn cmd.exe ENOENT`. A normalização da variável PATH do Windows resolveu a execução, sem mudar o aplicativo para contornar uma limitação da máquina. A janela inicial de consulta dos logs também precisou ser reduzida à retenção permitida pelo plano; os logs recentes foram obtidos com sucesso.

A página pública continua no deploy anterior porque nenhuma publicação foi executada. O build local não comprova o funcionamento ponta a ponta com backend real, que está ausente da configuração atual.

## Referências oficiais

- [Configuração framework e rewrites](https://vercel.com/docs/project-configuration/vercel-json)
- [Função Node com export fetch](https://vercel.com/docs/functions/runtimes/node-js)
- [Build local da Vercel](https://vercel.com/docs/cli/build)
- [Logs de execução](https://vercel.com/docs/cli/logs)
