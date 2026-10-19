# Leitor de cifras — Etapa 2

## Modelo de leitura

O cadastro continua em `song.chords`. O parser gera uma estrutura de seções, grades e segmentos `{chord, lyric}` somente em memória. Na cifra completa, cada segmento é uma pequena grade com acorde acima e letra abaixo: alterar o comprimento do nome do acorde não muda sua associação ao texto. A letra e a qualidade do acorde são preservadas.

Suporta acordes entre colchetes, linhas convencionais de acordes acima da letra, rótulos de introdução/estrofe/pré-refrão/refrão/ponte/final e diretivas básicas ChordPro de seções/comentários. Não é uma implementação integral do padrão ChordPro. Diretivas de diagrama, tablatura e formatação avançada não são interpretadas. Letras cadastradas em campo separado são mostradas sem inventar posições de acordes.

Referência primária: https://www.chordpro.org/chordpro/chordpro-introduction/ e https://www.chordpro.org/chordpro/directives-env/.

## Modos, transposição e impressão

O modo Cifra completa mostra acordes sobre palavras; Mapa de acordes mantém grades com barras e divisões. Alternar o modo ou mudar a fonte não reseta o tom. A preferência de visualização fica neste dispositivo. A impressão usa o modo e tom atuais, com fundo branco. Nenhuma consulta modifica ou salva `song.chords`.

Modo músico recolhe os controles para ampliar a área útil; título, tom atual, iniciar/pausar rolagem, impressão, retorno e Mostrar controles continuam disponíveis.

## Rolagem automática

Rolagem com requestAnimationFrame, baseada no tempo decorrido e velocidade de 5 a 80 pixels por segundo. Iniciar e pausar independem do tom. Pausa ao fechar (inclusive Escape), imprimir, ocultar a aba, atingir o fim ou ativar movimento reduzido. Com movimento reduzido, o controle orienta o uso manual. Navegação e formulários mantêm a arquitetura da Etapa 1.

## Compatibilidade e limites

PDFs permanecem no leitor existente; o texto extraído é reconhecido pelo mesmo parser, com revisão antes de salvar. Arquivos sem letra continuam válidos no mapa. A extração de PDFs escaneados e pentagramas continua fora desta etapa. Verificação visual em dispositivos reais depende de navegador disponível.

## Verificação

Build, checagem de sintaxe e 36 testes passaram. Cobertura inclui todas as qualidades solicitadas, extensões/inversões, associação entre acordes e palavras, restauração, imutabilidade, alternância de modo/fonte, modo músico, tempo/velocidade da rolagem, movimento reduzido e regressões de PDF, impressão, biblioteca e permissões. A transposição não interrompe a rolagem; fechar o leitor a interrompe. Texto inválido longo é rejeitado sem expressão regular de repetição ambígua.

A revisão visual em dispositivos reais permanece pendente, conforme indisponibilidade de Browser identificada na Etapa 1. Os testes de estrutura e simulação de interface não substituem essa inspeção.
