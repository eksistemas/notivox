# Organização de seções musicais — 15/10/2026

## Implementação

- Editor visual com Introdução, Estrofe, Pré-refrão, Refrão, Ponte, Instrumental e Final.
- Lista ordenada de seções, renomeação e botões para mover acima/abaixo.
- Inserção na linha do cursor ou antes/depois da seção selecionada.
- Prévia imediata com títulos personalizados e títulos discretos no Modo Músico.
- Compatibilidade com os cabeçalhos antigos e blocos ChordPro existentes, incluindo aliases e atributos de rótulo.
- Reorganização por recortes do texto original: acordes, letras e espaços do corpo são movidos juntos. Metadados anteriores à primeira seção ficam no início.
- Ao usar letra cadastrada em uma cifra com seções, uma confirmação explica que ela será acrescentada ao final. As seções atuais são mantidas; nenhum acorde é inventado ou reposicionado automaticamente. Os cabeçalhos presentes na letra importada são mantidos.
- Alterações ficam no rascunho. Aplicar transfere ao formulário; persistência continua dependendo de Salvar e da confirmação existente. Cancelar e desfazer continuam disponíveis.

## Arquivos

Novos:
- `src/song-sections.js`: identificação, inserção, renomeação, reorganização e importação preservando seções.
- `src/section-editor.js`: controles visuais e integração com o rascunho.
- `tests/song-sections.test.mjs`: oito testes de reconhecimento, preservação, diretivas, transposição e condições de falha.
- Este relatório.

Alterados:
- `src/chord-editor.js`: integração dos controles, mapeamento do cursor e importação preservando seções.
- `src/chord-sheet.js`: Instrumental e cabeçalhos personalizados, inclusive junto de grades antigas.
- `src/chordpro.js`: nomes de ambientes prechorus e instrumental.
- `src/styles.css`: controles responsivos e títulos no Modo Músico.
- `build.cjs`: inclusão dos módulos no pacote existente.
- `tests/chord-editor-save.test.mjs`: teste adicional do fluxo completo de seções, cancelamento da confirmação e salvamento; ajustes dos testes de importação para a preservação das seções.
- `dist/app.js`, `dist/styles.css`, `dist/server/assets.mjs`: artefatos atualizados pelo build. O build também regenera suas cópias habituais de distribuição.

## Validação

- `npm run build`: concluído.
- `npm test`: **82 testes aprovados; nenhuma falha**, incluindo nove testes novos.
- Cobertura existente aprovada para transposição, fonte, impressão, Modo Músico, rolagem, navegação de repertório, PDF, interface, autenticação e backups.
- Testes de salvamento usam ambiente simulado e dados em memória; não substituem o acervo real.
- A execução direta inicial de testes encontrou `spawn EPERM` no ambiente restrito. A execução permitida e a suíte final foram concluídas.

## Limitações e riscos conhecidos

- Reorganização visual é bloqueada para blocos sem fechamento, repetição de refrão ou transposição global. Esses casos exigem revisão no modo ChordPro porque a ordem pode afetar o resultado musical.
- Blocos aninhados são movidos junto com a seção externa. Blocos de tablatura e formatos delegados não são divididos em seções visuais.
- Inserir dentro de um bloco ChordPro pareado exige usar os limites antes/depois ou editar a estrutura diretamente. Isso evita criar um bloco inconsistente.
- Novos cabeçalhos seguem a convenção entre colchetes já suportada pelo aplicativo; diretivas importadas não são convertidas automaticamente.
- Nomes têm até 80 caracteres e não podem ser apenas um acorde nem conter delimitadores de sintaxe.
- Mantido o limite existente de 20.000 caracteres por cifra; importações que ultrapassem esse limite são rejeitadas antes de alterar o rascunho.
- Não foi realizada inspeção visual manual em navegador nesta etapa. Responsividade e comportamento foram verificados pelos testes automatizados; recomenda-se conferência visual nos dispositivos de uso.

Banco de dados, autenticação, backups e regras de transposição não foram modificados. Não houve migração, alteração automática dos dados reais ou publicação em produção.
