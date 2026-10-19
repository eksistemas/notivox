# Cifra completa: acordes sobre a letra

19/10/2026 — Node.js v24.19.0. Versão PWA: `d321af528242`.

O leitor já suportava acordes ligados às palavras por ChordPro e cifras tradicionais com uma linha de acordes sobre uma linha de letra. O problema identificado foi a apresentação do cadastro: os campos Letra e Cifra eram oferecidos separadamente, e registros antigos contêm apenas grades harmônicas e uma letra independente. Essas grades não informam a posição dos acordes nas palavras.

## Alterações

- O campo principal do cadastro passou a ser **Cifra completa — acordes e letra juntos**. Aceita colar a cifra tradicional inteira, com acordes na linha de cima e palavras na linha de baixo, ou ChordPro.
- Foi acrescentada uma prévia integrada com o renderizador existente. O texto permanece escapado e as colunas/posições não são substituídas por alinhamento adivinhado.
- O botão do editor passou a se chamar **Posicionar acordes sobre a letra**. O editor existente continua oferecendo escolha de acordes, edição visual, seções, importação e confirmação antes de gravar.
- A letra independente permanece no formulário, recolhida em uma opção explícita. Nenhum campo, valor ou registro antigo foi excluído ou migrado.
- Ao salvar uma cifra completa com letra, não é necessário repetir o texto no campo independente para consultar a seção Letras ou projetá-lo. A letra pode ser obtida em leitura a partir da cifra, sem gravar uma segunda cópia. Uma letra independente já cadastrada continua tendo prioridade para esses usos.
- A prévia principal da música sempre exibe a cifra completa, mesmo se o usuário tiver escolhido anteriormente o mapa de acordes no leitor ampliado. A preferência do leitor ampliado é preservada.
- Se houver somente uma grade e uma letra separadas, aparece uma orientação para posicionar os acordes com o editor. O sistema não sabe em qual sílaba cada acorde deve entrar e não altera automaticamente os cadastros para simular esse conhecimento.

## Arquivos modificados

`src/combined-song-sheet.js`, `src/combined-song-sheet.css`, `src/app.js`, `src/chord-editor.js`, `src/catalog.js`, `src/experience.js`, `src/transpose.js`, `src/library.js`, `build.cjs` e `tests/combined-song-sheet.test.mjs`. Os artefatos `dist/` foram regenerados pelo build existente.

## Validação

- `npm run build`: aprovado.
- `npm test`: **126 testes aprovados**, nenhuma falha, nenhum teste ignorado/cancelado.
- Seis testes novos cobrem o formulário integrado, prévia de linhas tradicionais, derivação da letra/projeção, preservação de grades e versões independentes, transposição na prévia e escape de HTML.
- A primeira execução de um teste de transposição não informou o ID da música atualmente transposta. O leitor corretamente restaurou o tom de cadastro ao abrir outra música. A simulação foi ajustada para identificar a música antes de mudar o tom, sem alterar essa regra do aplicativo.
- Não houve alteração de banco, autenticação, permissões ou transposição de partituras. Não houve publicação nem atualização do ZIP.
- A validação continua automatizada; não há navegador conectado para inspeção visual real.

## Como conferir

Abra `http://127.0.0.1:4173/#cifras`, escolha uma música e clique em Editar. Cole uma cifra completa no campo principal e observe a prévia. Para posicionar acordes manualmente, use o botão do editor visual. Aplicar ao formulário ainda exige Salvar alterações para persistir.

Nos cadastros antigos que possuem somente uma sequência de acordes e uma letra independente, será necessário indicar as posições corretas no editor. Os conteúdos anteriores permanecem preservados até uma edição confirmada pelo usuário.
