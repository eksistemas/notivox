# Aplicativo instalável, consulta offline e apresentação

Implementação incremental em 19/10/2026. Node.js v24.19.0. Versão compilada: `c36bebe270a8`.

## Escopo e decisões

A base web existente foi mantida e recebeu suporte a Progressive Web App (PWA), instalável pelo navegador quando suportado. Não foi criado um pacote nativo Android/iOS, nem cadastro nas lojas. Não houve publicação, migração de dados ou alteração das regras de autorização do servidor.

O modo sem internet é uma cópia explícita de **consulta**, preparada com a conta autenticada. Não permite gravação ou sincronização posterior de edições. Essa escolha preserva o controle de revisão e a confirmação de salvamento existentes no servidor. A instalação, por si só, não baixa o acervo privado.

## Funcionalidades

- Manifesto, ícones PNG de 192/512 pixels, configuração de abertura como aplicativo e orientação de instalação para navegadores com ou sem convite automático.
- Service worker com conjunto versionado de arquivos da interface, incluindo PDF.js. O instalador rejeita respostas redirecionadas ou malsucedidas para não armazenar uma página de login como script.
- Requisições de login, APIs, mídias protegidas e gravações **não são interceptadas nem armazenadas automaticamente pelo service worker**. Em navegações conhecidas, a interface offline só é utilizada quando a requisição de rede falha.
- Em Configurações: instalar, baixar repertório, consultar a cópia, conferir disponibilidade, remover cópia e verificar atualização.
- O preparo baixa as cifras, letras, ordem e tons do repertório escolhido e seus PDFs identificáveis. Os dados do acervo original não são alterados. Conteúdo de agenda e comunicados não integra a cópia de consulta.
- Os PDFs são verificados pelo cabeçalho do arquivo. O resultado mostra arquivos baixados/total e lista os faltantes e respectivos motivos. Um endereço que devolve HTML de login não é considerado PDF baixado.
- Até 30 MB por PDF e 200 MB de PDFs por repertório; arquivos além dos limites são explicitamente listados como não baixados. CORS e indisponibilidade de arquivos externos também ficam registrados.
- Pacote preparado em cache separado: a referência à cópia anterior só é trocada depois que a nova cópia está pronta e a identidade da conta é verificada novamente. Falhas antes dessa confirmação preservam a anterior.
- A cópia é de consulta, sem privilégio administrativo, e fica válida por até oito horas a partir do preparo. Ela não contém senha, cookie ou token de autenticação. Os documentos baixados permanecem como dados locais do dispositivo durante esse período.
- Expiração verificada ao abrir/ler a cópia e a cada minuto durante a consulta: os dados em memória são removidos e a navegação não reabre o repertório expirado. Uma nova cópia exige conexão.
- Troca de conta detectada online e saída removem as cópias offline do aplicativo. Um erro 401 não é substituído por dados offline. No modo sem rede, sair limpa a cópia e volta à tela de entrada; a invalidação da sessão remota depende do servidor, que não pode ser contatado sem conexão.
- Aviso de conexão e bloqueio de gravações quando offline. Ao recuperar conexão, é solicitado reabrir o aplicativo para validar a conta e recarregar os dados atuais; não há envio silencioso de alterações.
- Memória da página de leitura por PDF e conta, sem alterar o cadastro da música.
- Opção de manter a tela ligada durante leitores de PDF/cifra por Screen Wake Lock, com tratamento de ausência da API, rejeição, fechamento e mudança de visibilidade. Não há garantia de concessão pelo dispositivo.
- Identificação da versão e atualização explícita pelo usuário, bloqueada enquanto há formulário/leitor aberto. Uma nova versão aguarda ativação; não ocorre troca automática de interface durante o culto.
- Diagnóstico local e exportável: limitado a 30 registros com versão, horário e categoria do erro. Não registra mensagem, pilha, URL, nome da conta, senha ou conteúdo musical. Não foi contratado monitoramento externo nem enviado relatório a terceiros.
- Os backups completos já existentes continuam disponíveis. O download offline não substitui um backup nem sincroniza arquivos locais entre dispositivos.

## Arquivos alterados

| Arquivo | Finalidade |
| --- | --- |
| `src/offline-store.js` | Preparo, leitura, validade e remoção das cópias de consulta; armazenamento dos PDFs e confirmação antes de trocar a referência da cópia. |
| `src/pwa.js` | Instalação, integração de leitura offline, bloqueio de gravação, estado de conexão, atualização, memória de página, tela ligada e diagnóstico local. |
| `src/service-worker.js` | Cache restrito aos arquivos da interface; navegação offline e ciclo de atualização explícito. |
| `src/manifest.webmanifest` | Identidade e configuração do aplicativo instalável. |
| `src/pwa.css` | Estado de conexão, opções e áreas seguras de telas em modo instalado. |
| `build-pwa.cjs` | Geração dos ícones e identificação da versão pelo conteúdo; preparo do manifesto, interface offline e service worker. |
| `build.cjs` | Integra os novos recursos ao build existente e aos assets servidos pelo backend. |
| `worker.mjs` | Serve os arquivos estáticos específicos da PWA; regras das APIs preservadas. |
| `lib/vercel-handler.mjs` | Disponibiliza os mesmos arquivos estáticos na camada Vercel, preservando validação de origem e autorização das APIs. |
| `tests/pwa.test.mjs` | Onze testes novos, incluindo cópia offline, falhas, expiração, isolamento de contas, cache, rotas, tela ligada, diagnóstico e memória de páginas. |
| `RELATORIO-APLICATIVO-INSTALAVEL.md` | Este relatório. |

O build regenerou `dist/app.js`, `dist/styles.css`, HTMLs e assets do servidor; acrescentou `dist/offline.html`, `dist/service-worker.js`, `dist/manifest.webmanifest` e `dist/icons/`. Nenhuma dependência ou arquivo de lock foi alterado nesta etapa.

## Resultados da validação

- `npm run build`: aprovado.
- `npm test`: **110 testes aprovados**, nenhuma falha, nenhum teste ignorado ou cancelado (99 anteriores + 11 novos).
- `npm audit --json`: código 0, **zero vulnerabilidades reportadas**. Não foi aplicado upgrade forçado nem `audit fix`.
- Os testes anteriores de cifras, seções, transposição, PDF real, uploads, repertórios, autenticação, permissões e backups continuam aprovados.
- Cache, eventos do service worker, DOM e APIs de dispositivo são simulados nos testes novos. Nenhum repertório real foi alterado nem arquivo de banco do usuário manipulado.

## Como validar no computador

1. Na pasta do projeto, execute `node server.cjs` e abra `http://127.0.0.1:4173`. Utilize a conta normal do ambiente; abrir `dist/index.html` como arquivo não permite instalação/service worker.
2. Vá a Configurações e use “Instalar aplicativo”, ou a opção de instalação do navegador. O botão fornece instruções quando o navegador não expõe convite automático.
3. Prepare um repertório com músicas e PDFs de teste; em Configurações, use “Baixar repertório para uso offline”. Aguarde o resultado e confira a lista de faltantes.
4. Selecione “Consultar cópia baixada”. Confira que a consulta é identificada como offline e não oferece edição administrativa.
5. Simule ausência de rede nas ferramentas do navegador e reabra o aplicativo. Confira cifras, seções, transposição de consulta, ordem do repertório e PDFs efetivamente baixados. Tente abrir um material não baixado para verificar a mensagem.
6. Volte a ter conexão e reabra o aplicativo para autenticar e retornar ao acervo atual do servidor.
7. Confira a memória de página fechando e reabrindo o mesmo PDF; verifique a opção de tela ligada e a saída do leitor.
8. Remova a cópia e confira que ela não está mais disponível. Os cadastros do servidor devem continuar intactos.

## Limites e validação pendente

- Não havia navegador conectado para inspeção visual nesta sessão (essa indisponibilidade já foi verificada na etapa anterior). Instalação real, execução offline depois de fechar o aplicativo, rotação, tela cheia, desempenho e Screen Wake Lock em Android/iPad precisam de homologação nos dispositivos utilizados pela equipe.
- A instalação e os recursos de cache exigem contexto seguro: HTTPS, ou localhost/loopback para desenvolvimento no próprio aparelho. `127.0.0.1` no telefone aponta para o telefone, não para o computador. Um endereço HTTP da rede local não substitui HTTPS para essa homologação.
- Não houve publicação de ambiente externo. A validação em celulares dependerá de um ambiente HTTPS acessível previamente autorizado ou de infraestrutura local apropriada.
- O navegador controla espaço, persistência e remoção de dados. A solicitação de armazenamento persistente pode ser negada; limpezas do navegador podem apagar a cópia. Confirme disponibilidade e PDFs antes de cada culto.
- A cópia contém os documentos baixados no dispositivo. Ela não é uma sessão do servidor e não consegue receber revogações remotas sem internet; o limite local de oito horas reduz a duração dessa consulta. Não há criptografia adicional do pacote local nesta etapa.
- Somente PDFs identificáveis são baixados automaticamente após a ação explícita do usuário. Áudios, vídeos, páginas de compartilhamento, imagens e outros formatos não receberam download offline nesta etapa.
- Não existe edição offline, fila de gravações ou resolução automática de conflitos. O controle de revisão e o salvamento online existentes foram preservados.
- Não existe publicação nas lojas nem monitoramento remoto. O relatório de erros é local e depende de exportação manual. Os testes em aparelhos reais ainda impedem considerar a distribuição final homologada.
- O ZIP anterior não foi alterado.

Referências técnicas consultadas: [Service workers e contextos seguros](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers), [cache de PWAs](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Caching) e [convite de instalação](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event).
