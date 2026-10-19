# Cifras, letras e editor visual

## Como usar

1. Abra Adicionar música ou Editar uma música. Ao lado do campo Cifra / ChordPro, use **Editor visual e importar ChordPro**.
2. No modo Visual, cole a letra ou use **Usar letra cadastrada**. Essa ação só prepara um rascunho. Se já houver cifra, a substituição do rascunho exige confirmação. A letra separada continua intacta.
3. Clique na posição exata da letra, digite o acorde e escolha **Inserir na posição**. Para inserir no meio de uma palavra, posicione o cursor entre as sílabas.
4. Use a lista Acordes inseridos para selecionar um acorde. É possível alterar seu nome, removê-lo ou posicionar o cursor em outro ponto e usar **Mover para o cursor**.
5. **Inserir parte** inclui um título de Introdução, Estrofe, Refrão, Ponte ou Final no começo da linha escolhida. Não são inventados acordes nem posições.
6. A prévia é atualizada a cada edição. As larguras Automática, Celular, Tablet e Computador permitem inspecionar a composição. Textos e acordes longos podem exigir rolagem horizontal.
7. No modo ChordPro é possível colar texto ou importar `.cho`, `.chopro`, `.chordpro`, `.pro` e `.txt`. O arquivo permanece texto não confiável; HTML e scripts não executam.
8. **Usar esta cifra no formulário** transfere o rascunho para o campo Cifra. Só **Salvar alterações**, com confirmação, grava a música. Cancelar o editor não altera o campo nem o cadastro.

Desfazer recupera até 20 estados do rascunho, incluindo os acordes. Restaurar rascunho inicial exige confirmação. A edição nativa de texto pode remover acordes do trecho apagado; o editor informa a quantidade. Para desfazer também os acordes use o botão Desfazer do editor.

## Alinhamento e leitura

Os acordes permanecem associados a segmentos `{chord, lyric}`. O renderizador agrupa todos os segmentos de uma mesma palavra em um elemento indivisível. Assim `[C]pre[G]sença` não quebra entre as sílabas ao reduzir a largura ou aumentar a fonte. Cada segmento reserva espaço para seu acorde, evitando sobreposição de acordes extensos; isso pode aumentar visualmente a distância entre sílabas. Espaços consecutivos, tabulações e partes em branco são preservados.

Quando uma palavra ou sequência musical isolada for maior que a largura disponível, a linha permite rolagem horizontal em vez de cortar acorde ou palavra. Na impressão, trechos muito largos podem exigir fonte menor; não há promessa de paginação perfeita sem conferência da impressão renderizada.

Transposição, mapa, modo músico, largura, fonte, impressão, rolagem automática e navegação do repertório permanecem. O texto de cadastro e o tom original não são modificados pela consulta. O motor reconhece extensões, inversões, parênteses, alterações e sustenidos/bemóis Unicode. Letras e cifras separadas continuam válidas.

## Compatibilidade ChordPro

Referência: [diretivas oficiais](https://www.chordpro.org/chordpro/chordpro-directives/), [refrões](https://www.chordpro.org/chordpro/directives-env_chorus/), [grades](https://www.chordpro.org/chordpro/directives-env_grid/) e [transposição](https://www.chordpro.org/chordpro/directives-transpose/).

| Recurso | Comportamento nesta versão |
|---|---|
| Acordes entre colchetes e inversões | Interpretados e transpostos; posição relativa às palavras preservada |
| Metadados e aliases `t`, `st` | Reconhecidos; mostrados com segurança, sem substituir automaticamente os campos do cadastro |
| Estrofe, refrão, ponte e rótulos | Reconhecidos com diretivas longas/curtas, argumentos simples ou `label` |
| Repetição `{chorus}` | Repete o último refrão definido; expansão limitada a 2.000 blocos para impedir consumo excessivo |
| Comentários, anotações `[*...]`, `N.C.` | Preservados como indicação textual, sem transposição de anotações |
| Tablatura | Texto monoespaçado, sem tentar transpor números de casas |
| Grades com pontos, barras e `~` | Preservadas; acordes transpostos, símbolos rítmicos mantidos |
| `{transpose}` | Aplica deslocamento de leitura e aceita sufixos `s`/`f`, sem gravar a fonte |
| Quebras de página/coluna | Preservadas; impressão usa quebra de página, sem diagramação em colunas |
| Comentários `#` e extensões `x_` | Mantidos na fonte; não executados |
| Imagens, diagramas, fontes/cores arbitrárias, seletores condicionais e diretivas desconhecidas | Fonte preservada e aviso de compatibilidade; sem execução/renderização especializada |
| ABC, LilyPond, SVG e textblock | Conteúdo preservado como texto escapado, sem chamar renderizadores externos |

**Esta implementação não cobre integralmente todos os recursos da especificação ChordPro.** O suporte de cifras e documentos foi ampliado, mas imagens, diagramas, seletores e motores externos continuam limitados conforme a tabela. Nenhuma diretiva é descartada do campo original pelo editor. Um documento com várias músicas deve ser separado em cadastros; o leitor avisa quando encontra `new_song`.

## Músicas antigas e preservação

Cifras antigas com linhas de acordes acima da letra continuam usando o parser existente. O editor abre grades e texto tradicional no modo ChordPro. Mudar para Visual solicita confirmação da preparação; a conversão usa somente os acordes e as colunas já cadastradas. Grades sem letra não recebem letras inventadas. Revise a prévia, pois tabulações, textos copiados de PDFs e fontes proporcionais podem exigir ajuste manual.

Nenhum cadastro real é convertido automaticamente. A fonte original permanece até a confirmação de salvamento. Esta etapa não adiciona histórico permanente de versões: depois de uma alteração confirmada, a recuperação de uma versão anterior depende dos backups existentes. Recomenda-se exportar o acervo antes de alterações em massa.

Espaços iniciais/finais de letras e cifras não são mais removidos pelo formulário. O limite existente de 20.000 caracteres continua sendo aplicado. Importação de arquivo aceita até 80 KB e valida o limite em caracteres após a leitura. O importador de PDF foi preservado e passou a pedir confirmação antes da gravação; OCR e reconhecimento de pentagramas não foram adicionados.

## Arquivos modificados

- `src/chord-sheet.js`: grupos de palavra, reconhecimento de anotações e APIs usadas pelo editor.
- `src/chordpro.js` (novo): adaptador de documentos, metadados, partes, repetições e diretivas.
- `src/chord-editor.js` (novo): modelo de rascunho, âncoras, editor visual, importação e confirmação.
- `src/app.js`: acesso ao editor e salvamento confirmado sem remover espaços musicais.
- `src/transpose.js`: acordes complexos adicionais e acidentes Unicode.
- `src/pdf-reader.js`: confirmação de gravação da cifra preparada.
- `src/styles.css`: agrupamento de sílabas, editor responsivo e impressão.
- `build.cjs`: inclusão dos novos módulos no build existente.
- `tests/chord-editor.test.mjs` e `tests/chord-editor-save.test.mjs` (novos): parsing, edição, preservação e persistência isolada.
- `dist/`: arquivos distribuídos regenerados.

Banco, autenticação e código de backup não foram alterados. Não há publicação em produção. Os testes usam armazenamento e dados isolados, sem restauração ou substituição de dados reais. Não havia navegador conectado para conferência visual; os testes de largura validam a estrutura e os estilos, sem provar o resultado renderizado em dispositivos reais.
