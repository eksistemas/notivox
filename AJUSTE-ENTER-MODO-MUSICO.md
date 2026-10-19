# Enter no modo músico

O atalho anterior só atendia à playlist ao vivo. Agora o leitor compartilha o tratamento de Enter entre a playlist e o modo músico. Ao ativar o modo músico, o foco vai para a leitura; depois de avançar, retorna à leitura, permitindo novos acionamentos. A ordem e os tons são os do repertório existente. Uma música fora do repertório exibe orientação, sem criar uma sequência ou modificar o cadastro.

Campos editáveis, controles com foco, composição de texto, teclas modificadoras e leitor PDF preservam seu funcionamento. Segurar Enter não avança várias músicas. A última música permanece aberta.

Arquivos: `src/reader-controls.js`, `src/live-playlist.js`, `tests/musician-enter.test.mjs`, `tests/chord-sheet.test.mjs` e artefatos gerados. O teste antigo de cifras precisou incluir `focus()` no elemento simulado: a falha inicial era a ausência desse método no mock, não um erro do DOM do aplicativo.

Node.js 24.19.0: compilação aprovada; 133 testes aprovados, zero falhas. Validação visual em navegador real continua pendente. Banco de dados e publicação não foram alterados por esta correção.

Para validar: recarregue com Ctrl+F5, abra uma música do repertório, ative Modo músico e pressione Enter duas vezes, soltando entre as pressões. Confira a ordem, os tons e a permanência na última música. Repita na Playlist ao vivo.
