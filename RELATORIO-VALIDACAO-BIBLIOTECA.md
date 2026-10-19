# Validação da Biblioteca Inteligente — 19/10/2026

Ambiente: Windows, Node.js v24.19.0, npm 11.17.0.

## Resultado

- `npm ci`: concluído. A primeira tentativa foi bloqueada pelo ambiente com EPERM ao criar node_modules; a repetição autorizada concluiu a instalação de 20 pacotes. Não foi uma falha do aplicativo.
- `npm run build`: concluído antes e depois da revisão.
- `npm test` antes da revisão: 96 execuções aprovadas, nenhuma falha.
- `node --test tests/experience.test.mjs tests/pdf-reader.test.mjs tests/smart-library.test.mjs` após a revisão: 19 testes aprovados, nenhuma falha.
- `npm test` final: 89 testes aprovados, nenhuma falha, nenhum teste ignorado ou cancelado.

As falhas relatadas na verificação externa não se reproduziram neste ambiente após a instalação limpa. Sem seus logs, não é possível determinar a causa externa nem atribuí-la ao aplicativo. Não foram alteradas expectativas existentes para esconder falhas.

## Problema confirmado e correção

`smart-library.test.mjs` importava o auxiliar `app` de `experience.test.mjs`. Essa importação também registrava e executava os dez testes de experiência novamente. O auxiliar foi extraído para um módulo sem testes, compartilhado pelos dois arquivos.

A contagem final é 96 - 10 execuções duplicadas + 3 novos testes = 89. Isso não corresponde à remoção de cobertura.

O auxiliar agora registra eventos do formulário e distingue os campos consultados, permitindo validar o fluxo de importação até o salvamento. Durante a criação desse novo teste, a simulação de FormData omitia campos de links vazios; a validação rejeitou corretamente scoreLink ausente. A simulação foi completada para representar o formulário real, sem flexibilizar a validação do aplicativo.

## Verificações

- Pesquisa por termos sem acentos, artista e gênero, combinada com tom original/atual e filtros de material e conteúdo.
- Preservação dos filtros durante a busca e limpeza explícita dos filtros.
- Importação de texto/ChordPro: metadados, posições dos acordes, seções, espaços e texto original preservados; revisão sem gravação imediata; salvamento pelo formulário existente; bloqueio de duplicação.
- Rejeição de entrada vazia, arquivo excessivo e documento com várias músicas; cancelamento sem modificar cadastros; perfil de consulta sem permissão de importação.
- Repertórios vinculados ao ID existente, sem duplicação de música ou entrada; permissões e tons individuais preservados.
- PDF real processado por pdfjs-dist: extração de texto e acordes, recomposição por posição e transposição sem alterar a letra.
- PDF inválido rejeitado com InvalidPDFException. O aviso `Indexing all PDF objects` é emitido pelo PDF.js durante esse cenário deliberadamente inválido; o teste passa e confirma a rejeição.
- CSS principal, CSS da biblioteca e CSS compilado analisados sem avisos de sintaxe.
- Suíte completa de regressão: autenticação, permissões, backups, anexos, cifras, seções e transposição aprovada.

## Arquivos alterados nesta revisão

- `tests/app-harness.mjs`: novo auxiliar compartilhado com simulação de formulário.
- `tests/experience.test.mjs`: utiliza o auxiliar independente e verifica também o CSS da biblioteca e o CSS compilado.
- `tests/smart-library.test.mjs`: elimina a importação de outro arquivo de testes e acrescenta dois testes do fluxo de importação.
- `tests/pdf-reader.test.mjs`: acrescenta rejeição de PDF inválido.
- `RELATORIO-VALIDACAO-BIBLIOTECA.md`: este relatório.

Os artefatos de build foram regenerados pelos scripts existentes. Nenhuma alteração funcional em src, no esquema ou na lógica do servidor foi necessária. Nenhum banco de dados existente foi aberto ou modificado e nenhuma publicação foi realizada.

## Limites e observações

A validação foi automatizada em Windows com Node 24; a interface usa uma simulação de DOM nos testes. Não houve inspeção visual em navegador real nem comprovação de renderização de canvas em outros sistemas operacionais. A instalação informou cinco vulnerabilidades nas dependências (quatro moderadas e uma alta); não foi aplicado upgrade forçado ou alteração de dependências nesta revisão.

Para repetir, na raiz do projeto e com Node 24: execute `npm ci`, `npm run build` e `npm test`, nessa ordem. Para isolar os arquivos relatados, execute o comando de três arquivos acima após o build. O ZIP anterior não foi atualizado por esta revisão.
