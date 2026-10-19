import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import worker from '../dist/server/index.js';
import {createHandler} from '../lib/vercel-handler.mjs';

test('Notivox identifica entrada, aplicativo instalado e consulta offline',()=>{
 const manifest=JSON.parse(fs.readFileSync('dist/manifest.webmanifest','utf8'));
 assert.equal(manifest.name,'Notivox');assert.equal(manifest.short_name,'Notivox');
 for(const file of ['dist/index.html','dist/offline.html','login.html']){
  const html=fs.readFileSync(file,'utf8');assert.match(html,/<title>Notivox/);assert.match(html,/\/icons\/app-192.png/);
 }
 assert.match(fs.readFileSync('dist/styles.css','utf8'),/\.notivox-login-logo/);
 assert.match(fs.readFileSync('dist/service-worker.js','utf8'),/\/assets\/logo.png/);
});

test('logo original e ícones Notivox são servidos antes do login no backend e proxy',async()=>{
 const handler=createHandler({getBackend:()=>'',getToken:()=>''});
 for(const [route,file] of [['/assets/logo.png','src/brand/notivox-logo.png'],['/icons/app-192.png','src/brand/app-192.png'],['/icons/app-512.png','src/brand/app-512.png']]){
  const expected=fs.readFileSync(file);
  for(const response of [await worker.fetch(new Request('https://app.example'+route),{}),await handler(new Request('https://app.example'+route))]){
   assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/image\/png/);
   assert.deepEqual(Buffer.from(await response.arrayBuffer()),expected);
  }
 }
 assert.equal((await handler(new Request('https://app.example/api/data'))).status,503);
});
