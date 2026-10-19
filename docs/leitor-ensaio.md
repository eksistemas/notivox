# Leitor de cifras para ensaios e cultos

## Controles e leitura

O cabeçalho reúne título, modo músico, impressão e retorno. Uma barra compacta agrupa transposição, fonte, cifra completa/mapa, largura e rolagem automática. No celular, os controles se reorganizam em grupos com áreas de toque de pelo menos 44 px; a faixa de transposição permite rolagem horizontal em telas estreitas.

O seletor Largura oferece Estreita (680 px), Padrão (960 px), Ampla (1.200 px) e Tela toda, sempre limitado pela tela disponível. Ele muda somente a largura máxima do contêiner. O parser e os segmentos que associam acordes às palavras permanecem os mesmos. Fonte, largura e modo músico permanecem durante a sessão do leitor; o modo completo/mapa mantém a preferência local já existente.

No modo músico, a barra de ajustes é recolhida. Título, tom atual, iniciar/pausar rolagem, navegação anterior/próxima, impressão, retorno e Mostrar controles continuam disponíveis. O botão Tom do repertório fica na apresentação com controles expandidos.

## Repertório

- Abra a música pelo Repertório ou pelo bloco do repertório no Início. A consulta aplica o tom da entrada sem salvar alterações.
- Ao abrir pela biblioteca, a consulta mantém o tom do cadastro. Se a música fizer parte do repertório atual, Tocar repertório permite entrar explicitamente nesse contexto.
- Anterior/Próxima seguem a ordem do repertório atual e mostram a posição. Os limites desativam o botão correspondente, sem retornar automaticamente ao início.
- As alterações manuais de tom ficam em memória para cada música nessa sessão. Ao voltar para uma música, seu ajuste temporário é recuperado. Tom original restaura o tom cadastrado; Tom do repertório reaplica o tom da entrada.
- Trocar de música pausa a rolagem e volta ao início da área de leitura, mantendo velocidade, fonte, largura e modo de visualização.
- Uma entrada sem cifra em texto continua na sequência. O leitor informa a ausência e permite abrir os materiais ou seguir para a próxima música. Nenhum PDF é convertido ou transposto automaticamente.

A transposição continua preservando a qualidade dos acordes e usando a grafia enarmônica simplificada do motor existente. Uma mudança entre tonalidade maior e menor exige revisão musical: se o repertório solicitar essa conversão, o leitor informa a incompatibilidade e mantém o tom cadastrado. Ele não inventa uma reharmonização. A escolha de bemóis da tonalidade do repertório é usada na consulta, sem alterar os textos originais.

## Impressão e preservação

A impressão usa a música atual, o tom de consulta e o modo completo/mapa selecionado, sem incluir os controles. A largura é liberada para a página impressa. Imprimir pelo botão ou pelo navegador pausa a rolagem. Fechar, ocultar a aba ou ativar movimento reduzido mantém os mecanismos existentes de pausa.

Não há alterações de banco, autenticação, backups, parser musical ou persistência de cadastros. O contexto do repertório e os ajustes temporários ficam em memória. Não houve publicação.

## Arquivos

- `src/transpose.js`: cabeçalho compacto, atualização do título, controles e impressão.
- `src/reader-controls.js`: largura, navegação, tons de consulta por música e modo músico.
- `src/app.js`: identificação da abertura a partir do repertório.
- `src/experience.js`: identificação dos botões do repertório e de sua prévia no Início.
- `src/styles.css`: composição compacta, pontos de quebra e impressão.
- `tests/reader-repertoire.test.mjs`: ordem, limites, tons individuais, entrada sem cifra, largura, imutabilidade e impressão.
- `tests/experience.test.mjs`: abertura pelo repertório e pela biblioteca.
- `dist/`: arquivos distribuídos regenerados pelo build.

## Verificação

Use `npm run build` e `npm test`. A inspeção visual em navegador real permanece pendente, pois não havia navegador conectado na sessão. Os testes usam um DOM simulado e não substituem a conferência em computador, tablet, celular e impressão real.
