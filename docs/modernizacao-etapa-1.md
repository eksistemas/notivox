# Etapa 1 — análise antes das alterações

## Estrutura e tecnologias

JavaScript puro, sem framework. `app.js` concentra estado, formulários, permissões, projeção e repertório; `catalog.js` apresenta materiais; `navigation.js` controla rotas por hash. `uploads.js` usa IndexedDB e upload em partes. `pdf-reader.js` lê PDFs, `transpose.js` controla tonalidades e impressão; `gospel.js`, `instruments.js`, `access-pilot.js` e `ensemble.js` mantêm catálogo, instrumentos, acessos e simulação de ensaio.

O build concatena os scripts e gera assets. `dist/data.js` define o modelo validado e gera `domain.mjs`. LocalStorage e IndexedDB suportam uso local; Node 24, SQLite, Worker, bucket e adaptador Vercel suportam servidor. Dependências existentes: Drizzle ORM/Kit, PDF.js e esbuild. Testes Node verificam autenticação, permissões, arquivos, catálogo, PDF, transposição e navegação.

## Problemas identificados

CSS acumula cores fixas, grids conflitantes e múltiplas regras de cabeçalho. Não há pesquisa no cabeçalho, identificação do usuário ou configurações. Favoritos e operações de repertório existem sem telas acessíveis. O menu não possui agrupamentos e o início é apenas listagem. Filtros e botões são comprimidos em telas menores; o foco do menu móvel trata um único elemento como lista. Não há tema escuro consistente nos leitores ou diálogos.

## Decisões

Preservar arquitetura, APIs, migrações, arquivos locais, chaves de dados, revisão concorrente, PDF, transposição e impressão. Consolidar CSS com tokens de tema. Adicionar Início, Favoritos, Repertório e Configurações. Histórico e favoritos são locais; repertório usa o modelo compartilhado atual. Acervo continua único, sem nomes de departamentos ou identidade institucional. Pesquisa do cabeçalho busca todo o acervo. Impressão usa fundo branco em ambos os temas. Preferências Sistema/Claro/Escuro são aplicadas antes da pintura. Verificação visual em navegador quando disponível, com limitações reportadas.

## Resultado e verificação

Painel inicial com acessos recentes, favoritos, resumo do repertório e atalhos. Menu agrupado em Biblioteca e Organização. Cabeçalho com pesquisa global, identificação do usuário e configurações. Cards com favorito, artista, tom, gênero, BPM e materiais. Repertório permite adicionar, ordenar, alterar tom/anotações e projetar letras usando as operações existentes. Preferências de tema também cobrem login e leitores. CSS consolidado substitui as sobrescritas antigas.

Build e 28 testes passaram: regressões de autenticação, permissões, arquivos, PDF real, transposição e impressão; novos testes de tema, favoritos, histórico, busca global, repertório e foco do menu móvel, incluindo o ciclo de Tab/Shift+Tab. Menu fechado em telas pequenas usa `inert` para impedir foco em links fora da tela. Folha CSS validada pelo parser esbuild.

A conexão Browser não encontrou nenhum navegador disponível. A inspeção visual em computadores, tablets e celulares permanece pendente; os testes de interface usam um ambiente DOM simulado e não comprovam layout, contraste renderizado ou apresentação em dispositivos reais. Não houve publicação nem migração de banco.

Fontes canônicas: `src/styles.css`, `src/navigation.js`, `src/shell.html`, `src/experience.js`, `src/theme.js`. `src/shell.html` gera a página distribuída. Scripts históricos de transformação são de aplicação única e não devem ser reexecutados para construir. Use somente `npm run build` e `npm test` no fluxo normal.
