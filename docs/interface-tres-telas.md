# Interface em três telas

## Arquitetura

O app continua em JavaScript e CSS, compilado pelo `build.cjs`. A camada final
`src/simple-interface.js` compõe a navegação com os editores, leitores, funções
de busca e APIs existentes. `src/simple-interface.css` usa os mesmos tokens de
tema, logo e cores. Nenhuma dependência, tabela ou regra de persistência foi adicionada.

## Onde estão os recursos

| Tela | Recursos |
| --- | --- |
| `#inicio` | Biblioteca, pesquisa instantânea, todas/favoritas/recentes, material e gênero; tom, instrumento e estado do conteúdo em Mais filtros. |
| `#musica/ID` | Conteúdo da música, cifra, transposição, leitura ampliada, letras, partituras/PDF, projeção, vozes e videoaulas. Favorito e retorno à biblioteca. |
| `#gerenciar` | Adicionar, editar, excluir, materiais, importação de PDF/ChordPro, associação de partitura, envio de arquivos e catálogo. |

Repertório, playlist ao vivo e preferências/offline são ferramentas secundárias
do Início. Instrumentos, acessos e usuários ficam em Gerenciar. Backup e
restauração continuam disponíveis. Links antigos continuam aceitos e são
normalizados para as novas rotas; nenhum cadastro é convertido.

## Permissões

A rota Gerenciar exige `isAdmin()`, inclusive quando aberta diretamente. Seus
botões e formulários reutilizam as verificações existentes. O backend continua
autorizando cada operação: `/api/users`, `/api/members`, uploads e backup exigem
administrador; `/api/data` usa `authorizeUpdate`, preservando a restrição dos
perfis antigos a seu repertório/agenda. O hash não é uma autorização de servidor.
O login e o modo de consulta pública seguem a configuração existente.

## Verificação

Executar `npm ci`, `npm run build` e `node --test tests/*.test.mjs`.
Os novos testes verificam acesso direto, papéis, busca e filtros, favoritos,
recentes, estado vazio, música ausente, reabertura de música e CSS válido.
Os testes existentes cobrem CRUD, uploads, PDF, transposição, repertório,
playlist, sessões e autorização no backend.

A inspeção visual em um navegador e em tamanhos reais de celular ficou pendente
na sessão de implementação: a ferramenta de navegador não tinha superfícies
disponíveis. Os breakpoints, foco visível e movimento reduzido foram implementados
e verificados estaticamente; isso não substitui inspeção visual.
