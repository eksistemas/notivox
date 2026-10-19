# Identidade Notivox

Nome aplicado ao título, menu lateral, rodapé, login e manifesto de instalação. Logo original fornecido pelo usuário copiado para `src/brand/notivox-logo.png`, sem alterar o arquivo de origem. Um símbolo isolado foi preparado com a ferramenta de imagens a partir do logo para os ícones; não é uma extração vetorial e deve ser conferido antes de material gráfico de alta resolução. Ícones PNG 192 e 512 usados no menu, favicon e instalação. O manifesto declara propósito `any`, sem prometer a área de segurança de um ícone maskable.

Arquivos principais: `src/shell.html`, `login.html`, `src/manifest.webmanifest`, `src/notivox.css`, `src/brand/`, `build.cjs`, `build-pwa.cjs`. O build inclui o logo no pacote do servidor e no cache offline, com nova versão ao mudar os recursos da marca. A rota pública de logo já existia e foi reutilizada. Nenhuma API privada foi liberada.

Testes: `tests/notivox-brand.test.mjs` verifica nomes, páginas offline, inclusão no cache e entrega dos bytes corretos de logo e ícones antes do login pelo backend e proxy. `tests/vercel.test.mjs` foi atualizado para o novo título. `tests/unified-interface.test.mjs` mantém a rejeição de identificação institucional antiga, permitindo agora o logo solicitado.

Node.js 24.19.0: `npm run build` aprovado; `npm test`: 135 aprovados, zero falhas. Versão gerada: 3b4c6da0f229. Ícone de 192 pixels inspecionado visualmente. As duas portas locais responderam com manifesto Notivox e logo PNG HTTP 200 após reiniciar os servidores. Não houve inspeção visual completa em navegador ou dispositivo real nesta etapa.

Banco, usuários, permissões, cifras, transposição e repertórios preservados. Sem publicação online ou migração para Supabase. Para ver: http://127.0.0.1:4173/. O ambiente fictício foi retirado posteriormente a pedido do usuário. Atualize com Ctrl+F5; se o aplicativo instalado mantiver o cache antigo, feche os leitores e use Configurações → Verificar atualização.
