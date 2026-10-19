# Módulo profissional de partituras — 19/10/2026

## Análise da versão existente

O acervo já possuía um cadastro central de músicas, múltiplos materiais em `song.resources`, classificação por instrumento e voz, campos legados `scoreLink` e `pdfLink`, uploads no servidor ou no navegador, filtros por instrumento e um leitor PDF.js com páginas e extração de texto para cifras. O repertório utiliza referências ao ID das músicas e mantém tom e ordem independentes.

Não foi criado outro leitor, armazenamento ou esquema de banco. A implementação evolui o leitor PDF existente e acrescenta um fluxo específico de associação e leitura de partituras.

## Entregue

- Em Partituras, o administrador encontra “Associar partitura à música”: escolhe o cadastro existente pelo ID, instrumento, nome e arquivo PDF ou link. Cada associação acrescenta um recurso, preservando todos os materiais anteriores. Músicas homônimas podem ser diferenciadas pelo artista e pelo cadastro selecionado.
- São oferecidos Bateria, Baixo, Guitarra, Violão, Teclado, Piano, Saxofone, Trompete e Voz, além do cadastro existente. Caso a opção escolhida ainda não esteja registrada, ela é incluída junto com a associação, somente ao salvar. Os registros existentes não são migrados nem substituídos.
- A busca por título, artista e gênero continua disponível. Na página Partituras, a digitação mantém a seção e o instrumento selecionado. Os filtros e a paginação existentes são reutilizados.
- Cada partitura mostra seu instrumento ao abrir a música ou o repertório. O repertório oferece os arquivos diretamente em cada música e mantém a ordem das entradas e seus tons.
- PDFs de partituras abrem no mesmo leitor PDF.js, em um modo de apresentação com área ampla. O formulário de preparação de cifras fica oculto nesse modo; PDFs de cifras continuam com seu fluxo anterior.
- Controles de ampliar/reduzir, ajuste à largura, páginas anterior/próxima, número da página, percentual de zoom e tela cheia quando suportada. Os limites de páginas desabilitam os botões correspondentes.
- Ao abrir pelo repertório há um botão explícito para voltar ao repertório. Fechar a leitura não modifica músicas, tons ou ordem. A abertura guarda uma referência ao controle de origem para tentar restaurar seu foco quando ele continua disponível.
- Layout responsivo com controles grandes, cores do tema atual, rolagem para páginas ampliadas e adaptação a orientação horizontal e telas menores.
- Carregamento visível desde a busca do arquivo; mensagens para falhas de rede, arquivo ausente, PDF protegido e falhas de renderização. A troca rápida de página ou zoom descarta renderizações antigas; o fechamento cancela tarefas e libera o documento PDF.
- PDFs enviados ou associados pelo novo formulário abrem internamente mesmo quando o endereço do arquivo não termina com `.pdf`.

## Arquivos alterados

| Arquivo | Alteração |
| --- | --- |
| `src/pdf-reader.js` | Evolução do único leitor PDF: modo de partituras, controles, renderização com zoom e largura, cancelamento, erros e liberação de recursos. Extração e interpretação de cifras preservadas. |
| `src/scores.js` | Novo módulo de associação, instrumentos sugeridos, ações de leitura, integração com repertórios e biblioteca usando os serviços existentes. |
| `src/scores.css` | Apresentação responsiva e controles do leitor de partituras. |
| `src/library.js` | Busca permanece em Partituras, preservando o filtro de instrumento. |
| `build.cjs` | Inclui o módulo e seus estilos no build existente. |
| `tests/scores.test.mjs` | Dez testes de integração e regressão do novo fluxo. |
| `RELATORIO-MODULO-PARTITURAS.md` | Este relatório. |

O build regenerou `dist/app.js`, `dist/styles.css`, os bundles PDF.js e os artefatos do servidor, incluindo `dist/server/assets.mjs`. Outros arquivos derivados previstos pelo script também foram regenerados. `package.json` e `package-lock.json` não foram editados. Não houve alteração do esquema, autenticação ou regras de autorização.

## Validação

Ambiente: Windows, Node.js **v24.19.0**.

- `npm run build`: aprovado.
- `npm test`: **99 testes aprovados**, nenhuma falha, nenhum teste ignorado ou cancelado.
- Dez testes novos verificam associação múltipla pelo ID, inclusão de Trompete, preservação dos campos e repertórios, busca por instrumento, permissão de consulta, arquivo inválido/excessivo, upload pelo serviço existente, coleta do formulário antes de desabilitar campos, zoom, ajuste à largura, limites de páginas, controles de tela cheia, erros, cancelamento de carregamento remoto e renderizações concorrentes.
- A suíte anterior continua passando, incluindo importação de cifras, acordes posicionados, ChordPro, seções, transposição, extração de um PDF real, autenticação, permissões, backups e uploads.
- Nos novos testes, persistência e canvas são simulados em memória. Nenhum cadastro real foi criado. Os testes anteriores de backend usam seus próprios ambientes de teste; nenhum banco existente do aplicativo foi modificado.

## Avaliação dos cinco alertas anteriores

Foram executados `npm audit --json` e `npm audit --json --registry=https://registry.npmjs.org/`. Ambos terminaram com código 0 e **zero vulnerabilidades reportadas**, incluindo moderadas e altas. O resultado atual não reproduziu os cinco alertas registrados na instalação anterior.

Versões instaladas verificadas com `npm ls --depth=0`:

| Dependência | Versão | Uso neste projeto |
| --- | --- | --- |
| drizzle-kit | 0.31.11 | Ferramentas de esquema e migração. Nenhuma migração foi executada. |
| drizzle-orm | 0.44.7 | Dependência do projeto; não foi alterada nesta etapa. |
| esbuild | 0.28.2 | Compilação e preparação dos bundles do leitor. |
| pdfjs-dist | 6.4.299 | Leitor PDF efetivamente incluído no aplicativo. |

Não foi executado `npm audit fix`, upgrade forçado ou atualização de versões. O relatório anterior não contém os identificadores nem as cadeias dos cinco avisos, portanto não é possível atribuir individualmente sua origem ou afirmar que foram corrigidos. A conclusão verificável é que a auditoria atual não os reportou; isso não equivale a uma garantia geral de ausência de vulnerabilidades.

## Como validar a interface

1. Abra `dist/index.html` localmente ou utilize seu servidor de desenvolvimento. Para o servidor existente: `node server.cjs` e `http://127.0.0.1:4173`. A gravação de materiais durante sua validação usa o armazenamento desse ambiente; use cadastros de teste se não quiser alterar seu acervo.
2. Como administrador, entre em Partituras e clique em “Associar partitura à música”. Escolha uma música existente e associe dois PDFs de instrumentos diferentes. Confirme que não foi criada outra música e que os materiais anteriores continuam disponíveis.
3. Filtre por instrumento e pesquise pelo título. Abra a música e escolha uma partitura.
4. Confira zoom, ajuste à largura, páginas, limites e tela cheia se o navegador oferecer esse recurso. Gire o tablet e confira novamente o ajuste à largura.
5. No repertório, abra uma das partituras pelo botão da própria música e use “Voltar ao repertório”. Confira ordem, tons e observações.
6. Com perfil de consulta, confira a leitura e a ausência das ações administrativas.

## Limitações e preservação

- Não havia navegador conectado ao ambiente para inspeção visual. A tentativa de abrir a prévia encontrou o navegador integrado indisponível e a lista de navegadores estava vazia. Layout real, canvas e tela cheia precisam de conferência final nos dispositivos utilizados pela equipe; os testes automatizados não substituem essa inspeção.
- O limite de leitura interna permanece em **30 MB por PDF**, agora também explicitado no novo formulário. O fluxo de upload genérico existente pode aceitar outros limites; PDFs maiores não são ampliados por esta etapa.
- Links externos precisam retornar um PDF diretamente e permitir leitura pelo navegador (CORS). Páginas de compartilhamento, autenticação externa e links privados não são convertidos automaticamente em arquivos PDF. O upload é a alternativa suportada.
- Materiais legados que não podem ser identificados como PDF continuam usando seus links originais. Imagens, MusicXML e outros formatos não receberam um renderizador novo.
- Tela cheia depende do navegador, permissões e dispositivo; existe tratamento de indisponibilidade e rejeição.
- Arquivos enviados no modo local ficam no navegador/dispositivo, conforme o funcionamento anterior. O módulo não sincroniza automaticamente esses arquivos.
- A persistência e o upload reutilizam o fluxo existente. Se um upload terminar mas a associação falhar por conflito ou conexão, poderá restar um arquivo sem associação, como no mecanismo anterior; não foi introduzida remoção automática de arquivos ou dados.
- Não há transposição de notas de partituras PDF, OCR ou reconhecimento de notação nesta entrega.
- Cifras, transposição e seções musicais não foram reescritas. Dados existentes foram preservados. Não houve publicação nem atualização do ZIP anterior.
