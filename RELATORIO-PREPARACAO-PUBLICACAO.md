# Preparação da versão web

A interface aprovada no piloto 4174 já integra o build principal. Não foi reconstruída nem substituída por um segundo layout. O código principal mantém seus leitores, cifras alinhadas, transposição, filtros, importação e playlist. A correção do Enter atende à playlist e ao modo músico. Músicas reais não foram modificadas.

Arquivos adicionados nesta preparação: `PUBLICAR-ESTA-VERSAO.md`, `prepare-release.cjs` e este relatório. O README foi atualizado para orientar a execução pelo servidor. O pacote exclui o servidor piloto e seu teste específico, segredos, bancos, arquivos privados, dependências instaladas e arquivos compactados antigos; inclui fontes, testes de produto, backend e recursos compilados. Um manifesto SHA256 permite verificar seu conteúdo.

Validação com Node.js 24.19.0: build aprovado e 133 testes aprovados no projeto original. Na cópia separada, `npm ci` e build aprovados; a suíte de produto tem 130 testes, pois os três testes exclusivos do piloto foram excluídos junto com o servidor fictício. Os testes automatizados não equivalem a homologação em dispositivos reais. O usuário aprovou a leitura alinhada e o Enter no piloto.

Na primeira tentativa de compilar a cópia, faltava instalar as dependências naquele diretório: o build do PDF resolve o caminho local de `node_modules`. Após `npm ci`, a mesma compilação passou, sem alteração de código. Não se tratava de uma regressão no leitor.

Dependências: `npm ci` informou cinco vulnerabilidades (quatro moderadas e uma alta), enquanto a consulta subsequente `npm audit --json` retornou zero, sem qualquer atualização entre as consultas. Essa divergência não comprova correção dos cinco alertas. Nenhuma atualização incompatível ou `audit fix --force` foi aplicada; repetir a auditoria no ambiente de implantação antes de liberar a versão.

Não foi realizado deploy, publicação em loja, migração ou edição do banco de dados. A publicação web depende do destino e backend configurados. Este pacote não é um AAB Android e não implementa cobrança ou isolamento de clientes.
