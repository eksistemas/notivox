# Backup e restauração — etapa 1

Use os botões existentes **Exportar acervo** e **Importar acervo** em Configurações. Não houve alteração de layout, navegação ou funções musicais.

## Conteúdo e integridade

O formato `acervo-musical-backup`, versão 1, contém todo o modelo validado: músicas, cifras, letras, repertórios, instrumentos, departamentos e registros legados; metadados de usuários; preferências deste navegador (tema, favoritos, recentes e modo do leitor); anexos vinculados no IndexedDB ou bucket. Os arquivos são incorporados em base64, com tamanho e SHA-256 individual. O payload completo também tem SHA-256 calculado sobre JSON canônico. A restauração rejeita formato desconhecido, dados inválidos, referências incompletas e bytes adulterados.

SHA-256 detecta corrupção, mas não comprova autoria: alguém que altere o conteúdo pode recalcular o checksum. Importe apenas cópias de origem conhecida. O backup não é criptografado e contém letras, arquivos e endereços de usuários.

Nenhuma consulta exporta hashes de senha, salts, senhas, sessões, tokens, tentativas de login ou variáveis de ambiente. Segredos digitados pelo próprio usuário em letras, notas ou documentos permanecem conteúdo desses documentos e não são automaticamente detectados.

## Segurança da restauração

1. O pacote é validado antes da confirmação do administrador.
2. A cópia atual completa é oferecida como download antes da restauração. O navegador pode pedir autorização para downloads múltiplos.
3. Uma cópia adicional é gravada e relida no armazenamento, com verificação de integridade. Se isso falhar, a restauração para.
4. Os anexos importados recebem novos IDs. Os antigos não são sobrescritos ou apagados. Referências repetidas continuam compartilhando o mesmo arquivo.
5. No modo local, arquivos são preparados no IndexedDB antes de um único `localStorage.setItem` substituir o envelope do acervo. Falha de quota mantém o envelope anterior. A revisão é conferida novamente antes do commit. LocalStorage não fornece transação entre abas; evite editar em outra aba durante a restauração.
6. No servidor, o navegador envia os arquivos por partes usando o upload existente. O servidor verifica proprietário, partes, tamanho, checksum e relacionamentos. A troca dos cadastros e usuários usa uma única transação `DB.batch`, com comparação da revisão. Qualquer falha SQL desfaz a transação inteira.

O administrador autenticado no servidor de destino é preservado. Outros usuários são restaurados por nome e perfil; senhas existentes no destino são mantidas para nomes correspondentes. Contas novas recebem um marcador de bloqueio, não uma senha exportada. Suas sessões não são importadas e sessões dos demais usuários do destino são revogadas. IDs internos de usuários podem mudar; o sistema não possui vínculos musicais com esses IDs. Para usuários com nome de login convencional, o administrador pode definir a senha pelo formulário existente de cadastro, usando o mesmo nome de uma conta restaurada bloqueada. Novos e-mails restaurados permanecem bloqueados; a ativação segura deve acompanhar a próxima etapa de autenticação por e-mail. O acesso local permanece local, sem autenticação: usuários transportados ficam apenas como metadados para exportação posterior.

## Cópias de recuperação

Além do download `acervo-antes-da-restauracao-*.json`:

- Local: o envelope `acervo-musical-local-v1` guarda `recoveryId`. O arquivo JSON correspondente permanece no object store `files` do banco IndexedDB `acervo-musical-files`. Pode ser extraído com as ferramentas do navegador e selecionado em Importar acervo. Salvamentos normais preservam esse identificador.
- Servidor: o bucket guarda `backups/recovery/<id>`. A API autenticada `GET /api/backup/recovery?id=<id>` retorna o pacote, somente para administrador. O ID também é retornado por `POST /api/backup/restore`. Pelo proxy use `/api/site?path=/api/backup/recovery&id=<id>`. O operador pode baixar esse pacote e importá-lo pelo fluxo normal.

As cópias não têm expiração automática nesta etapa. Falhas na preparação podem deixar anexos novos sem vínculo; eles são mantidos para evitar exclusões inseguras. Não execute limpeza indiscriminada do bucket ou IndexedDB.

## Limites explícitos

- Até **64 MiB de anexos vinculados por pacote**. O importador aceita até 96 MiB de JSON; o plano enviado ao servidor continua sujeito ao limite existente de 2 MB de cadastros/metadados. Se exceder os limites, a operação falha; não produz backup parcial.
- Arquivos de sites externos permanecem como URLs. Não são baixados de terceiros. Arquivos órfãos, sem referência no acervo, não são incluídos.
- Preferências são do navegador que exporta; não há configurações globais persistidas no servidor. Credenciais de infraestrutura e flags de implantação devem ser configuradas separadamente no destino.
- JSON antigo contendo somente cadastros não passa como backup completo. É rejeitado sem substituir dados. Esta etapa não fornece conversor de arquivos antigos.
- A cópia anterior não é um mecanismo para recuperar senhas antigas: credenciais deliberadamente não fazem parte dos pacotes.
- A preferência restaurada também fica no envelope local; se aplicar as chaves auxiliares do navegador falhar, os cadastros permanecem íntegros, mas pode ser necessário reaplicar a aparência.
- Falhas de hardware, limpeza do navegador e perda do próprio bucket exigem a cópia baixada em outro local.
- Testes automatizados usam bancos SQLite em memória, bucket de teste e adaptadores simulados de armazenamento local. Teste visual e de quota real em navegadores continua pendente.

## Validação

Execute `npm run build` antes de `npm test`, pois os testes de integração carregam o servidor distribuído. Nenhum teste abre o banco real `.runtime/ministry.sqlite`, restaura o acervo real ou faz chamadas a serviços externos.
