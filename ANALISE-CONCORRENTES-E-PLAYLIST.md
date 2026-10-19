# Acervo Musical — concorrentes e experiência de palco

Pesquisa e implementação em 19/10/2026. Fontes públicas oficiais; comparação de capacidades, sem testes presenciais dos concorrentes e sem alegações de superioridade comprovada. Preços e planos não foram usados como critério, pois podem variar por plataforma, região e assinatura.

## Mapeamento

| Concorrente | Pontos fortes documentados | Atenção na escolha / comparação com o Acervo |
| --- | --- | --- |
| **SongbookPro** | Importação ChordPro/OnSong/PDF, transposição, personalização visual, anotações e sincronização de bibliotecas pessoais e de grupos. | Referência direta para um songbook multiplataforma. Nosso produto ainda não tem equivalentes completos de sincronização de grupos e anotação livre. A oportunidade é tornar evidente o fluxo biblioteca → repertório → palco. [Fonte oficial](https://songbook-pro.com/). |
| **OnSong** | Controles por pedal/MIDI, rolagem automática, anexos, anotações e backing tracks, entre outras ferramentas de apresentação. | É uma referência de profundidade para palco. A amplitude de recursos exige verificar quais são necessários ao músico e em quais planos; isso não prova dificuldade de uso. Nosso Acervo ainda não oferece essas integrações de hardware ou backing tracks. [Manual oficial](https://onsong.app/docs/features/). |
| **forScore** | Especialização em partituras, anotações, setlists, marcadores e dispositivos para virar páginas. O fabricante destaca cache adaptativo para trocas de página. | Sua distribuição é voltada aos sistemas Apple. O Acervo web tem uma oportunidade de atender diferentes aparelhos pelo navegador, mas ainda não atingiu o mesmo conjunto de ferramentas para PDF nem foi homologado em dispositivos reais. [Site oficial](https://forscore.co/). |
| **MobileSheets** | Organização de partituras, edição de setlists, marcadores e recursos de apresentação. | Concorrente importante para músicos que trabalham principalmente com partituras. Nosso leitor atual cobre visualização e navegação básicas; não há evidência para alegar que ele seja mais rápido ou mais completo. [Recursos oficiais](https://www.zubersoft.com/mobilesheets/features/), [apresentação do produto](https://www.zubersoft.com/mobilesheets/). |
| **BandHelper** | Setlists divididos em blocos, pausas, medleys, reutilização de listas e cálculo de duração e fim de apresentação. | Referência para planejar uma apresentação inteira. A quantidade de possibilidades sugere uma oportunidade de oferecer um caminho inicial curto — uma hipótese de design, não uma falha comprovada do concorrente. O Acervo ainda não possui esses recursos completos de produção e gestão de sets. [Tutorial oficial](https://www.bandhelper.com/tutorials/building_set_lists.html). |
| **Cifra Club** | Listas acessíveis em diferentes dispositivos mediante conta; o suporte informa consulta offline das listas no aplicativo. | O Acervo não deve vender listas e offline como exclusividade nem pressupor acesso ao catálogo do concorrente. Seu foco próprio é a organização do conteúdo autorizado da equipe, incluindo partituras por instrumento. [Suporte oficial](https://suporte.cifraclub.com.br/pt-BR/support/solutions/articles/64000253540-como-acessar-minhas-listas-em-qualquer-dispositivo). |

“Atenção” descreve critérios de adequação ou lacunas do nosso produto. Não se atribuem defeitos, travamentos, insatisfação de usuários ou ausência de funcionalidades aos concorrentes sem comprovação. Nenhuma cifra, partitura, identidade visual ou conteúdo protegido desses serviços foi copiado para o aplicativo.

## A favor do Acervo atual

- Conteúdo próprio/autorizado em um cadastro central: cifra, letra, PDF e vários materiais por instrumento, referenciados pelo ID da música.
- Acordes posicionados e seções preservados; a transposição de consulta e os tons individuais do repertório já estão integrados.
- Biblioteca, repertório e leitores trabalham sobre a mesma música. Organização e leitura ficam disponíveis no mesmo produto.
- Interface em português, possibilidade de uso em navegador e estrutura PWA, com consulta offline explícita e indicação de PDFs faltantes.
- Backups e controle de revisão existentes. A apresentação pode mudar temporariamente o tom sem reescrever o cadastro.

Esses são pontos favoráveis do produto, não funcionalidades necessariamente exclusivas em relação aos seis concorrentes.

## Contra / lacunas atuais

- Homologação visual, instalação e uso contínuo em Android/iPad ainda pendentes. Passar testes automatizados não demonstra qualidade superior no palco.
- A playlist usa o repertório atual. Ainda não há um conjunto de playlists independentes por bar, cliente, show, data ou bloco sincronizado entre aparelhos.
- Não há sincronização ao vivo da página entre músicos, pedal/MIDI validado, backing tracks, anotações livres sobre PDF ou estimativa de duração do show.
- A consulta offline continua limitada a oito horas e exige preparo prévio. Ela não permite editar sem internet. PDFs externos dependem de disponibilidade e permissão de leitura.
- Ainda faltam separação comercial por cliente/igreja, cobrança, publicação em loja e operação comercial homologada. Isso não foi misturado com a melhoria de palco.

## Direção de produto

A proposta é reduzir decisões durante a apresentação: **escolher, ler e avançar**. Playlist, transposição e offline já existem em concorrentes; a vantagem desejada precisa vir da integração e do cuidado com os detalhes, e deve ser medida com músicos reais.

### O que foi implementado nesta etapa

1. **Tela Playlist ao vivo** no menu e atalho em Repertório. Mostra música inicial ou último ponto de leitura, próxima música, tom, BPM cadastrado e materiais disponíveis.
2. **Preparação separada da execução**: “Organizar” leva ao repertório existente; “Entrar no modo palco” inicia a leitura. Não se exibem ações de excluir, remover ou editar músicas dentro da apresentação.
3. **Busca própria da playlist**, por música, artista e tom, sem exigir acentos. Filtrar a fila não altera sua ordem, e um salto não remove músicas.
4. **Modo palco com alto contraste**, superfície escura, acordes em verde claro, notas em destaque e tipografia de leitura. Não há imagens decorativas ou fontes externas para baixar durante a apresentação.
5. **Fila lateral no computador/tablet amplo**, com busca e indicação da música atual e das marcadas como tocadas. Em telas menores ela abre pelo botão “Fila de músicas”, ocupando a área de leitura; as ações continuam nomeadas.
6. **Próxima música sempre antecipada** no rodapé, com título e tom. O botão avança em uma ação, respeitando a ordem do repertório e os limites de início/fim. Não há reprodução automática de áudio nem mudança temporizada de música.
7. **Cifra, Letra e Partituras** no mesmo fluxo. A cifra reutiliza o leitor e o renderizador existentes, com acordes, seções, fonte, rolagem e transposição. A letra pode usar o campo separado ou o conteúdo textual da cifra, sem copiar acordes como palavras.
8. **Partituras no leitor PDF atual**. Há controles distintos para página e música. Ao avançar de música por um PDF, se a próxima possui exatamente uma partitura PDF para o mesmo instrumento, ela é aberta. Havendo ambiguidade ou ausência de material, o usuário escolhe, sem seleção silenciosa de outra versão.
9. **Atalhos de teclado**: direita/PageDown para próxima; esquerda/PageUp para anterior. Não atuam em campos de digitação, com modificadores ou quando o PDF está aberto. Escape encerra o modo palco.
10. **Atalhos fixos no celular**: Biblioteca, Playlist, Favoritos e Ajustes. Ícones acompanham rótulos visíveis e o estado da página atual.
11. **Continuidade local**: o último ID de música é lembrado por conta e repertório neste dispositivo. Não duplica o cadastro nem cria uma lista divergente do repertório compartilhado.

O status “com texto ou partitura” significa presença de material associado, não comprovação de que todo link externo funcionará offline. A checagem de download continua na preparação offline existente.

## Critérios de aceitação

| Tarefa | Critério nesta implementação |
| --- | --- |
| Avançar na leitura de cifra/letra | Uma ativação do botão grande “Próxima música”; sem abrir biblioteca ou editor. |
| Saber o próximo passo | Título e tom da próxima música visíveis antes de avançar. |
| Encontrar um pedido na sequência | Fila pesquisável; escolher resultado não reordena nem exclui itens. |
| Ler materiais diferentes | Abas com nomes; PDF usa o leitor existente e retorna à apresentação. |
| Evitar alteração acidental | Nenhuma gravação do cadastro/ordem é feita por iniciar, pesquisar, saltar, transpor ou avançar no palco. |
| Descobrir funções no celular | Quatro atalhos persistentes com ícone e nome. |

Os critérios de número de ações são verificáveis na estrutura e nos testes. Não foi medido um tempo de troca em milissegundos em dispositivos reais. Abrir/decodificar PDFs depende do aparelho, arquivo e disponibilidade; não se promete abertura instantânea.

## Arquivos modificados

- `src/live-playlist.js`: nova tela, fila, controles de palco e integração com os leitores e o repertório existentes.
- `src/live-playlist.css`: identidade visual da tela e do palco, navegação móvel, responsividade e ajustes de impressão.
- `src/navigation.js`: reconhecimento da rota `#playlist` e seu ícone.
- `src/shell.html`: link no menu e atalhos inferiores em telas pequenas.
- `build.cjs`: inclui o módulo e os estilos no build/PWA atuais.
- `tests/app-harness.mjs`: simula consultas e operações DOM adicionais usadas no palco; não modifica a lógica do aplicativo para satisfazer testes.
- `tests/live-playlist.test.mjs`: dez testes de comportamento e regressão.
- `ANALISE-CONCORRENTES-E-PLAYLIST.md`: este documento.

Os artefatos `dist/` e a versão PWA foram regenerados. Não houve mudança de esquema, migração, dependências, autenticação ou permissões. Nenhum cadastro real foi criado/excluído e nenhuma publicação foi realizada.

## Validação

- Node.js **v24.19.0**.
- `npm run build`: aprovado.
- `npm test`: **120 testes aprovados**, nenhuma falha, nenhum teste ignorado ou cancelado (110 anteriores + 10 novos).
- Cobertura nova: busca e ordem, avanço e limites, aplicação do tom da entrada, preservação do texto original, parada de rolagem, alternância de materiais, fila, teclas e seus bloqueios, encerramento, consulta, expiração e troca de música por instrumento no PDF.
- A primeira execução de um teste de notas encontrou falta do método DOM `prepend` na simulação. O método foi representado no auxiliar de testes; não foi necessário remover notas ou flexibilizar o aplicativo.
- A lista de navegadores conectados permaneceu vazia; não foi possível fazer inspeção visual nem medir satisfação ou velocidade em aparelhos reais. Os testes usam DOM simulado. As fontes descrevem concorrentes; não demonstram superioridade do Acervo.
- O servidor local foi reiniciado para carregar o build atualizado. Caso uma PWA antiga esteja controlando a página, use Configurações → Verificar atualização, aguarde a instalação da atualização e confirme novamente se necessário. O ZIP anterior não foi atualizado.

## Como experimentar

1. Abra `http://127.0.0.1:4173/#playlist` no computador com o servidor local ligado e entre com sua conta.
2. Organize o repertório existente com três músicas de teste e tons diferentes. O uso do modo palco não altera essa organização.
3. Entre no modo palco. Veja a próxima música no rodapé, avance e volte. Abra a fila e procure pelo artista ou título.
4. Alterne Cifra, Letra e Partituras. Use “Mostrar controles” para acessar ajustes de leitura. Selecione um PDF e compare os botões de página com os de música.
5. Confira uma tela pequena: fila pelo botão e barra inferior com quatro atalhos. Prepare os PDFs antes de simular ausência de rede.
6. Encerre o palco e confira se a ordem, as cifras e os tons cadastrados continuam intactos.

## Próximas validações para buscar vantagem real

Antes de anunciar que o produto é melhor, observar músicos em uma apresentação simulada de 30–60 minutos. Medir tempo para encontrar música, número de ações, toques acidentais, falhas de leitura, recuperação após perda de rede e percepção de conforto. Comparar as mesmas tarefas nos aplicativos concorrentes, em condições equivalentes.

Prioridades seguintes sugeridas: playlists independentes com blocos e eventos, sincronização e isolamento de clientes, histórico/recuperação de repertórios e avaliação de pedal. São oportunidades de evolução; não estão apresentadas como funcionalidades já entregues.
