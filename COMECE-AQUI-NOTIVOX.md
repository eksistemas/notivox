# Notivox — projeto completo

Este pacote reúne em uma pasta o código atual, a interface compilada, os logos, os leitores, o backend, o esquema do banco, os testes e a documentação. O ambiente fictício foi retirado.

## Executar

1. Instale Node.js 24.
2. Abra um terminal na pasta extraída, onde está `package.json`.
3. Execute `npm ci`, depois `npm run build` e `npm test`.
4. Para o aplicativo principal: execute `node server.cjs` e abra http://127.0.0.1:4173/.

Mantenha o terminal do servidor aberto. O endereço 127.0.0.1 funciona somente no próprio computador. Para login e dados do servidor, não abra os arquivos HTML diretamente.

## Pastas

| Pasta | Conteúdo |
|---|---|
| src | Interface, cifras, playlist, PDF e marca em `src/brand` |
| dist | Versão compilada atual |
| api e lib | Integração do servidor com a hospedagem |
| db e drizzle | Esquema e migrações existentes |
| tests | Testes automatizados do aplicativo |
| docs | Documentação técnica e de uso |

## Seus dados

O pacote não inclui banco real, senhas, sessões, configurações privadas ou anexos de usuários. A extração em uma pasta nova não traz automaticamente seu acervo. Faça e confira o backup completo pelo aplicativo original antes de qualquer mudança de instalação. Não substitua a pasta `.runtime` da instalação existente.

As dependências `node_modules` são instaladas por `npm ci`; não estão no ZIP. Pastas de execução, caches, pacotes antigos e scripts históricos de alteração pontual não são necessários para executar a versão atual e não foram reunidos.

## Publicação

Leia `PUBLICAR-ESTA-VERSAO.md` e `CONFIGURAR-SUPABASE-NOTIVOX.md`. O adaptador Supabase está preparado no código, mas depende da configuração privada e da migração revisada. Não houve publicação nem aplicação automática das tabelas no banco remoto.

O arquivo `MANIFESTO-SHA256.json` registra os arquivos do pacote e suas assinaturas para conferência de integridade.
