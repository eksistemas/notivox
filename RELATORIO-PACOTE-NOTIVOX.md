# Pacote completo Notivox

O modo `node prepare-release.cjs --complete` reúne fontes, versão compilada, logos, leitor PDF e sua licença, backend, integração web, esquema do banco, migrações, testes e documentação em uma única pasta. O piloto fictício, seus três testes e seus documentos exclusivos foram removidos a pedido do usuário. O acesso local é pela porta 4173.

Não inclui dependências instaladas, caches, pastas temporárias, bancos, contas, sessões, credenciais, anexos privados ou pacotes anteriores. Scripts históricos de alteração pontual não são necessários para executar o aplicativo e ficam fora. Não é um backup do acervo. A configuração de hospedagem incluída é vazia, para não transportar configuração privada.

O refinamento visual mantém a composição e as cores da identidade fornecida. O logo completo original continua preservado, e o símbolo para ícones foi preparado em uma versão de bordas e gradientes refinados. Os ícones têm 192 e 512 pixels; a aplicação mantém o armazenamento e os identificadores internos anteriores para não perder preferências ou dados.

Validação após retirar o piloto: Node.js 24.19.0, build e suíte de 132 testes do aplicativo. Os três testes removidos eram exclusivos do servidor fictício; nenhum teste do produto foi retirado. Versão de interface 1d5caca711bc. A integridade do ZIP é conferida pelo manifesto SHA256, presença dos arquivos obrigatórios e CRC. Sem publicação online nem alterações no banco real. Integração com Supabase continua pendente. Pacotes antigos permanecem como versões históricas; utilize o ZIP identificado como sem piloto.
