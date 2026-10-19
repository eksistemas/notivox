# Editor visual — seleção de palavras e escolha de acordes

## Estado encontrado e mudanças

O projeto já tinha `src/chord-editor.js`, com rascunho visual, posições de acordes, importação da letra, prévia, modo ChordPro e confirmação na gravação do formulário. Antes desta etapa, `npm test` passou em todos os 68 testes existentes. O editor estava acessível pelo formulário de cadastro, mas exigia digitar o nome do acorde e não mostrava claramente a posição selecionada.

Esta etapa reutiliza esse editor e completa o fluxo sem digitação de sintaxe:

1. Em Cifras, abra uma música e use **Editor visual de acordes**. Em Letras, use **Criar cifra a partir desta letra**. O editor anterior no formulário continua disponível.
2. **Usar letra cadastrada** copia somente para o rascunho. Se houver cifra no rascunho, pede confirmação antes da substituição. A letra original não é apagada.
3. Selecione uma palavra ou clique em uma posição. O editor informa linha, coluna e trecho selecionado.
4. Escolha Nota, Tipo e Baixo, ou um botão de acorde frequente. Por exemplo, Nota D, Tipo Maior e Baixo F# monta `D/F#`, sem escrever colchetes.
5. **Inserir na posição** ancora o acorde no início da seleção. O trecho selecionado não é substituído ou apagado. O acorde inserido fica selecionado para permitir alterar, remover ou mover em seguida.
6. A prévia mostra os acordes acima das palavras, usando o mesmo renderizador do leitor. Para acordes menos comuns, o campo personalizado permanece disponível.
7. O modo ChordPro continua permitindo editar ou colar a sintaxe diretamente.
8. Aplicar envia o rascunho ao formulário. Só **Salvar alterações**, mediante confirmação, grava o cadastro. Cancelar não altera o original.

## Integridade e limites

Autenticação, backups, banco de dados, parser musical e persistência não foram alterados. Nenhum dado real foi convertido, salvo ou substituído pelos testes. Não houve publicação.

O seletor oferece as notas convencionais e 16 tipos de acorde, incluindo extensões e inversões. O campo personalizado mantém o suporte aos demais acordes reconhecidos pelo motor existente. A transposição continua temporária na leitura; tamanho da fonte e largura não alteram as posições de origem.

O conteúdo das letras é exibido como texto escapado. Os valores do seletor são validados contra listas permitidas. A mensagem da posição usa `textContent`, incluindo quando o trecho selecionado contém sinais de HTML.

Não há navegador conectado nesta sessão: a revisão renderizada em dispositivos reais permanece pendente. Os testes usam DOM simulado, seleção numérica e renderização de HTML. As limitações ChordPro e de impressão já registradas em `cifras-letras-editor.md` continuam válidas.

## Investigação de experience.test.mjs e pdf-reader.test.mjs

### Reprodução

Na cópia atual, a suíte completa inicial passou (68/68). Os comandos abaixo, executados diretamente no sandbox, falharam antes de executar os testes:

```
node --test tests/experience.test.mjs
node --test tests/pdf-reader.test.mjs
```

Erro observado em ambos:

```
Error: spawn EPERM
syscall: spawn
code: EPERM
at ChildProcess.spawn
at node:internal/test_runner/runner
```

O runner Node tenta criar um processo para cada arquivo de teste. A política do sandbox bloqueou essa criação de processos. Trata-se de uma falha de execução do ambiente; não de uma asserção funcional de tema, navegação ou PDF. Com autorização para executar fora da restrição:

```
node --test tests/experience.test.mjs tests/pdf-reader.test.mjs
```

Resultado: 12 testes aprovados, nenhum reprovado (10 de experiência e 2 de PDF). Não foi necessário mudar as asserções desses arquivos.

### Dependências verificadas

- Node: `v24.19.0`, compatível com o projeto.
- `pdfjs-dist`: `6.4.299`; declara Node `>=22.13.0 || >=24`.
- `@napi-rs/canvas`: `1.0.11`, instalado como dependência do PDF.js.
- `esbuild`: `0.28.2`, utilizado pelo teste de CSS e pelo build.

`experience.test.mjs` carrega `dist/app.js`; por isso o build deve preceder a validação de mudanças nas fontes. `pdf-reader.test.mjs` usa o PDF.js instalado e um PDF de teste gerado em memória. Não foi detectada dependência ausente nem falha de extração neste ambiente.

Sem os logs de eventuais execuções anteriores, não é possível atribuir a elas uma causa específica diferente. O diagnóstico acima descreve somente os erros reproduzidos nesta sessão.

## Testes adicionados

- Composição de acordes pelos campos Nota/Tipo/Baixo, com rejeição de valores não permitidos.
- Seleção exata de palavra e posição, inclusive linha vazia e começo da linha.
- Inserção sem apagar o texto selecionado.
- Seleção automática do acorde inserido e alteração, movimentação e remoção pelo fluxo visual.
- Prévia, transposição e preservação da associação acorde/palavra.
- Entrada direta pelo material Cifras e pela letra separada.

Os testes existentes de rascunho, cancelamento, confirmação de gravação, transposição, fonte, impressão, repertório, PDF, autenticação e backups também são executados.

Resultado final: `npm run build`, `npm test` (73 aprovados, 0 falhas) e `node --check dist/app.js`.

## Arquivos desta etapa

- `src/chord-editor.js`: seletor, posição/seleção, acessos diretos e continuidade da edição do acorde selecionado.
- `src/transpose.js`: botão de acesso pelo material Cifras.
- `src/catalog.js`: criação de cifra a partir da letra separada.
- `src/styles.css`: seletor responsivo e indicador da posição.
- `tests/chord-editor.test.mjs`: novas regras de composição e seleção.
- `tests/chord-editor-save.test.mjs`: fluxo visual e acessos diretos.
- `README.md` e documentação: instruções e diagnóstico.
- `dist/app.js`, `dist/styles.css` e `dist/server/assets.mjs`: regenerados pelo build.
