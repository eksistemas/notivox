// Verificação local do artefato real; não publica nem acessa o banco.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const output=path.resolve('.vercel/output');
const config=JSON.parse(fs.readFileSync(path.join(output,'config.json'),'utf8'));
const builds=JSON.parse(fs.readFileSync(path.join(output,'builds.json'),'utf8'));
assert.equal(builds.detectedFramework.status,'skipped');
assert.deepEqual(builds.builds.filter(build=>build.use==='@vercel/node').map(build=>build.src),['api/site.js']);
assert.equal(builds.builds.some(build=>build.src==='server.cjs'),false);
const folder=path.join(output,'functions/api/site.func');
const runtime=JSON.parse(fs.readFileSync(path.join(folder,'.vc-config.json'),'utf8'));
assert.equal(runtime.runtime,'nodejs24.x');assert.equal(runtime.handler,'api/site.js');
for(const file of ['server.cjs','sqlite-adapter.mjs','local-files.mjs','app.js'])assert.equal(fs.existsSync(path.join(folder,file)),false,file);
const entry=(await import(pathToFileURL(path.join(folder,runtime.handler)).href)).default;
assert.equal(typeof entry.fetch,'function');
const previous=[process.env.ADNIPO_BACKEND_URL,process.env.ADNIPO_BACKEND_TOKEN];
delete process.env.ADNIPO_BACKEND_URL;delete process.env.ADNIPO_BACKEND_TOKEN;
const checked=[];
try{
 for(const [pathname,status]of [['/',200],['/login',200],['/theme.js',200],['/assets/logo.png',200],['/manifest.webmanifest',200],['/assets/pdf/pdf.js',200],['/api/data',503],['/server.cjs',404],['/.runtime/ministry.sqlite',404]]){
  const route=config.routes.find(route=>route.src&&route.dest?.startsWith('/api/site?')&&new RegExp(route.src).test(pathname));
  assert.ok(route,'Rota não encaminhada: '+pathname);
  const dest=pathname.replace(new RegExp(route.src),route.dest);
  const request=new Request(new URL(dest,'https://notivox.example'));
  assert.equal(new URL(request.url).searchParams.get('path'),pathname);
  const response=await entry.fetch(request);assert.equal(response.status,status,pathname);
  if(pathname==='/')assert.match(await response.text(),/<title>Notivox/);
  checked.push({path:pathname,status});
 }
}finally{
 for(const [index,key]of ['ADNIPO_BACKEND_URL','ADNIPO_BACKEND_TOKEN'].entries()){
  if(previous[index]===undefined)delete process.env[key];else process.env[key]=previous[index];
 }
}
console.log(JSON.stringify({runtime:runtime.runtime,entry:runtime.handler,checked},null,2));
