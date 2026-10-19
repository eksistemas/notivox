# Sistema de Acervo Musical

## Executar e preparar para publicação

Use Node.js 24, execute `npm ci`, `npm run build` e `npm test`. Inicie `node server.cjs` e abra **http://127.0.0.1:4173/**. Para validar login, permissões e acervo do servidor, use esse endereço. As instruções antigas de abrir HTML diretamente servem apenas ao modo local de demonstração, com armazenamento separado.

A versão principal inclui a interface Notivox aprovada, playlist ao vivo e Enter no modo músico. Consulte [PUBLICAR-ESTA-VERSAO.md](PUBLICAR-ESTA-VERSAO.md) para atualização, hospedagem e limitações. O ambiente fictício separado foi retirado; utilize a porta 4173.

Abra index.html para usar localmente. O app abre no Acervo geral. Acesse Partituras ou Cifras pelo menu. Em Cifras, use Adicionar louvor para cadastrar título, tom e cifra em texto. Acordes em linhas próprias ou entre colchetes são transpostos pelos botões de meio tom e um tom. Tom original restaura a consulta; o cadastro não é alterado. Letras são preservadas. PDFs e imagens são consultados sem transposição.

Os dados e arquivos locais ficam neste navegador, separados do projeto original. Exportar acervo agora gera backup completo dos cadastros e anexos vinculados do IndexedDB ou servidor, com verificação de integridade. Esta cópia contém apenas o acervo inicial do código; bancos, arquivos de usuários e credenciais do projeto original não foram copiados.

Backup e restauração: consulte [docs/backup-restauracao.md](docs/backup-restauracao.md). O pacote tem limite de 64 MiB de anexos; links externos permanecem como links. A importação exige validação, confirmação do administrador e cópia anterior verificada. Usuários são transportados sem credenciais. Arquivos JSON antigos contendo somente cadastros não são aceitos como backups completos. A versão atual possui 73 testes automatizados, incluindo edição de cifras, leitura, falhas de restauração e integridade.

## Editor visual de cifras e letras

No cadastro ou edição de música, abra **Editor visual e importar ChordPro**. Posicione o cursor na letra para inserir acordes, use a lista para alterar/remover/reposicionar e confira a prévia antes de aplicar ao formulário. A letra separada pode servir de base, sem inventar acordes. O salvamento exige confirmação. [Documentação e matriz de compatibilidade ChordPro](docs/cifras-letras-editor.md). Não há cobertura integral de renderizadores externos e diretivas especializadas; os originais são preservados com avisos. Músicas antigas continuam disponíveis sem conversão automática.

Build: npm run build. Testes: npm test. Servidor opcional: node server.cjs (porta 4173). Esta versão não foi publicada.

## Acompanhamento e impressão
Ao alterar o tom, a cifra em texto abre na tela ampliada. Os botões A− e A+ alteram o tamanho da fonte. Imprimir usa o tom atual e inclui título e artista; a janela de impressão também permite salvar em PDF.

## Catálogo gospel
Na seção Cifras, abra Catálogo gospel e Adicionar ao meu acervo. São 19 títulos com artistas e links de consulta verificados em 14/10/2026. O catálogo não contém letras ou cifras completas copiadas. Cadastre sua versão em texto para transpor e imprimir. Adicionar novamente preserva textos e arquivos existentes e evita duplicação por título e artista.

## Acervo único e gêneros
Todas as músicas ficam disponíveis sem selecionar departamento. O campo Gênero no cadastro é opcional e aceita nomes livres, como Black, Soul e Sertanejo. Todos os gêneros mostra tudo. A organização antiga é preservada nos dados para compatibilidade, sem separar a navegação. Arquivos locais e cifras existentes continuam vinculados às mesmas músicas. A identidade institucional e o logo foram removidos das telas.

## Catálogo dentro do app
O catálogo abre cada título no próprio app. Links de referência gerados pelo catálogo anterior não são mais exibidos. Os títulos iniciais não incluem cifras completas: cadastre a versão em texto para acompanhamento, transposição e impressão. Arquivos e links personalizados são preservados.

## PDF no app
Em Acervo geral ou Cifras, use Importar PDF e preparar cifra. O app exibe o original, extrai o texto e identifica linhas de acordes. Confira o tom e o texto antes de Salvar e acompanhar. PDFs já cadastrados também abrem no leitor interno. Arquivos de internet devem ser baixados e importados; links sem permissão de leitura podem ser bloqueados pelo navegador. O original fica preservado, e a versão em texto pode ser transposta e impressa. Até 30 MB e 100 páginas para extração, 20.000 caracteres por cifra. PDFs escaneados, fotos e notação no pentagrama ainda não são reconhecidos automaticamente.

## Modernização da interface — Etapa 1
O Início mostra acessos recentes, favoritos, repertório e atalhos. A busca do cabeçalho pesquisa o acervo completo. Favoritos e histórico são locais. Configurações permite escolher Sistema, Claro ou Escuro; preferência aplicada também aos leitores e à tela de acesso. O repertório usa o armazenamento existente e permite ordem, tom, observações e projeção. APIs, arquivos locais e chaves de dados foram preservados. A análise está em docs/modernizacao-etapa-1.md.

## Leitor profissional — Etapa 2
Acompanhamento possui Cifra completa e Mapa de acordes. Cifra completa aceita ChordPro com [C]acordes antes das palavras, títulos de partes e diretivas básicas de estrofe/refrão/ponte. Também reconhece linhas tradicionais de acordes acima da letra; a transposição usa segmentos estruturados para manter a associação. Letras cadastradas separadamente são mostradas sem inventar posições de acordes. Alternar os modos mantém o tom; a impressão usa o modo atual. Rolagem automática tem iniciar/pausar e velocidade em pixels/segundo, para ao fechar, ocultar a aba, imprimir ou chegar ao fim, e fica desativada quando movimento reduzido está ativo. Texto original não é alterado pela consulta.

## Selecionar palavras e escolher acordes

O editor visual agora tem seletores de Nota, Tipo e Baixo, acordes frequentes e indicador da palavra/posição selecionada. Também abre diretamente por Cifras e Letras. [Fluxo de uso e diagnóstico dos testes de experiência e PDF](docs/editor-visual-diagnostico.md).
