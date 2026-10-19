// Lista explícita: não empacota banco, anexos privados, segredos nem servidor piloto.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = __dirname;
const folders = ['src', 'tests', 'docs', 'drizzle', 'api', 'lib', 'dist'];
const files = ['package.json','package-lock.json','build.cjs','build-pdf.cjs','build-pwa.cjs','build-vercel.cjs','server.cjs','sqlite-adapter.mjs','local-files.mjs','worker.mjs','files.mjs','domain.mjs','backup-core.mjs','backup-server.mjs','login.html','login.js','PUBLICAR-ESTA-VERSAO.md','RELATORIO-PREPARACAO-PUBLICACAO.md'];
const forbidden = name => /^(?:\.env.*|\.runtime|node_modules|\.git|\.vercel|\.sites-runtime)$/i.test(name) || /\.(?:sqlite(?:-wal|-shm)?|db|zip|rar|pem|key)$/i.test(name);
function prepareRelease({complete=false}={}) {
  const id = new Date().toISOString().replace(/[:.]/g, '-') + '-' + crypto.randomBytes(3).toString('hex');
  const out = path.join(root, '.release', (complete?'notivox-completo-':'acervo-musical-web-') + id);
  const entries = [];
  function copy(relative) {
    const source = path.join(root, relative);
    const stat = fs.lstatSync(source);
    if (stat.isSymbolicLink()) throw Error('Link não permitido no pacote: ' + relative);
    if (forbidden(path.basename(relative))) return;
    if (relative === path.join('dist','.openai','hosting.json')) return;
    if (stat.isDirectory()) {for (const name of fs.readdirSync(source)) copy(path.join(relative, name)); return;}
    const destination = path.join(out, relative);
    fs.mkdirSync(path.dirname(destination), {recursive:true});
    fs.copyFileSync(source, destination);
    entries.push({file:relative.replaceAll('\\','/'),sha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex')});
  }
  for (const name of [...folders,...files]) copy(name);
  if(complete){
    copy('db');copy('prepare-release.cjs');
    for(const name of fs.readdirSync(root))if(name.endsWith('.md')&&!files.includes(name))copy(name);
  }
  // Configuração vazia necessária ao build, sem configuração privada da máquina.
  fs.mkdirSync(path.join(out,'.openai'),{recursive:true});
  fs.writeFileSync(path.join(out,'.openai','hosting.json'),'{}\n');
  entries.push({file:'.openai/hosting.json',sha256:crypto.createHash('sha256').update('{}\n').digest('hex')});
  fs.writeFileSync(path.join(out,'MANIFESTO-SHA256.json'), JSON.stringify(entries,null,2));
  return {directory:out,files:entries.length};
}
module.exports = {prepareRelease};
if(require.main===module)console.log(JSON.stringify(prepareRelease({complete:process.argv.includes('--complete')})));
