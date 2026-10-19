# Interface para ensaios — Início e Cifras

## Resultado

O Início apresenta o repertório atual antes das músicas recentes, com até quatro entradas de cada. O acesso à biblioteca é a ação principal. Os três indicadores viraram links discretos; os atalhos de cifras, partituras e importação permanecem próximos. Favoritos e cadastro de música continuam disponíveis.

Os cartões da biblioteca usam uma única linha de cabeçalho para ícone, título, artista e favorito; tom e BPM aparecem juntos. Todos os materiais, gêneros e avisos de arquivo sem cifra continuam presentes. A lista compacta reutiliza os mesmos cartões, eventos e informações. A preferência de visualização é local, na chave `acervo-ui-catalogue-mode`.

O catálogo renderiza até 48 músicas por página, mantendo a pesquisa sobre o acervo inteiro. Trocar filtros ou resultados volta à primeira página; alternar cartões/lista mantém a página. O paginador informa intervalo, quantidade e página. Isso limita o DOM com centenas de músicas, sem mudar o modelo ou o limite de cadastros existente.

No computador, o botão do cabeçalho recolhe o menu para uma faixa de ícones. Os nomes completos permanecem nos rótulos acessíveis e títulos dos links. A preferência usa `acervo-ui-sidebar-collapsed`. Em larguras até 1.000 px continua sendo usada a gaveta existente, com foco contido, Escape e conteúdo de fundo inerte. A opção do computador é recuperada ao voltar para uma tela maior.

## Preservação

Não foram alterados banco, autenticação, código de backup, transposição, parser de cifras, leitura de PDFs ou projeção. Os dois novos ajustes de apresentação são preferências deste navegador e não foram adicionados ao formato de backup, conforme a restrição de não modificar backups nesta etapa.

## Acessibilidade e validação

Mantidos roxo, branco, cinzas, tipografia e ícones existentes. Texto secundário das telas revisadas usa um cinza um pouco mais escuro no tema claro para melhorar contraste em superfícies cinza-claro. Controles de alternância possuem `aria-pressed`; o menu expõe nome e estado; os favoritos e a abertura das músicas continuam sendo botões separados. Textos longos podem quebrar linha. No celular os controles principais têm pelo menos 44 px.

`npm run build`, `node --check dist/app.js` e a suíte de testes validam o código distribuído. Os testes incluem 600 músicas, paginação, troca de visualização, pesquisa, favoritos, abertura da cifra e alternância desktop/celular, além das regressões musicais e de backup.

Não havia navegador conectado para inspeção renderizada. A revisão visual em dispositivos reais, zoom e leitor de tela continua pendente; os testes usam DOM simulado e não comprovam o layout renderizado nem o tempo de resposta em hardware real.
