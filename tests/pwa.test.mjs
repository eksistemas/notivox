import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {webcrypto} from 'node:crypto';
import {seed,validate} from '../domain.mjs';
import {createHandler} from '../lib/vercel-handler.mjs';
import worker from '../dist/server/index.js';
import {app} from './app-harness.mjs';

function cacheStorage(){const entries=new Map();return {entries,async keys(){return [...entries.keys()];},async delete(name){return entries.delete(name);},async open(name){if(!entries.has(name))entries.set(name,new Map());const data=entries.get(name);return {async match(key){return data.get(String(key))?.clone();},async put(key,response){data.set(String(key),response.clone());}};}};}
function offline(){const data=structuredClone(seed),values=new Map(),caches=cacheStorage();const context=vm.createContext({caches,localStorage:{getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)},location:{protocol:'https:',origin:'https://app.example'},Date,crypto:webcrypto,URL,Response,TextDecoder,structuredClone});vm.runInContext(fs.readFileSync('src/offline-store.js','utf8'),context);const options={data,user:{id:42,username:'Pessoa',role:'admin',token:'never-save'},departmentId:data.departments[0].id,revision:4,resources:song=>song.resources,readFile:async()=>new Blob(['%PDF-1.4\nTeste']),fetchFile:async()=>new Blob(['%PDF-1.4\nTeste'])};context.options=options;return {context,values,caches,options,run:source=>vm.runInContext(source,context)};}

test('download guarda somente repertório, preserva fonte, remove privilégios e lê PDF sem rede',async()=>{
 const ui=offline();ui.options.data.songs[0].resources.push({id:'score-pdf',type:'partitura',instrument:'Piano',label:'piano.pdf',url:'https://files.example/piano.pdf'});
 const before=JSON.stringify(ui.options.data),pack=await ui.run('OfflinePack.prepare(options)');assert.equal(JSON.stringify(ui.options.data),before);assert.equal(pack.count,1);assert.equal(pack.missing.length,0);assert.equal(pack.user.role,'member');assert.equal(pack.user.token,undefined);
 const ids=new Set(ui.options.data.departments[0].repertoire.map(entry=>entry.songId));assert(pack.data.songs.every(song=>ids.has(song.id)));assert.equal(pack.data.departments.length,1);validate(pack.data);
 const response=await ui.run('OfflinePack.read()');assert.equal(response.user.id,42);ui.context.pdfUrl=pack.data.songs[0].resources.at(-1).url;assert.equal(await (await ui.run('OfflinePack.file(pdfUrl)')).text(),'%PDF-1.4\nTeste');
});
test('falha de PDF fica explícita e falha na confirmação de conta preserva a cópia anterior',async()=>{
 const ui=offline();await ui.run('OfflinePack.prepare(options)');const original=await ui.run('OfflinePack.read()');
 ui.options.data.songs[0].resources.push({id:'bad',type:'partitura',instrument:'Piano',label:'bad.pdf',url:'https://files.example/bad.pdf'});ui.options.fetchFile=async()=>new Blob(['<html>login</html>']);
 const partial=await ui.run('OfflinePack.prepare(options)');assert.equal(partial.count,0);assert.equal(partial.total,1);assert.equal(partial.missing.length,1);assert(partial.missing[0].reason.includes('não retornou um PDF'));
 const before=await ui.run('OfflinePack.read()');ui.options.verifyUser=async()=>{throw Error('Conta mudou');};await assert.rejects(ui.run('OfflinePack.prepare(options)'),/Conta mudou/);assert.equal((await ui.run('OfflinePack.read()')).cacheName,before.cacheName);assert.notEqual(original.cacheName,before.cacheName);
});
test('expiração e limpeza removem somente cópias offline sem tocar nos dados originais',async()=>{
 const ui=offline(),before=JSON.stringify(ui.options.data),pack=await ui.run('OfflinePack.prepare(options)');await ui.caches.open('outro-sistema');
 ui.context.Date={now:()=>pack.expiresAt+1};assert.equal(await ui.run('OfflinePack.read()'),null);assert.deepEqual(await ui.caches.keys(),['outro-sistema']);assert.equal(JSON.stringify(ui.options.data),before);
});
test('service worker não intercepta login, APIs, gravações nem origens externas',()=>{
 const handlers=new Map(),context=vm.createContext({self:{location:{origin:'https://app.example'},addEventListener:(type,fn)=>handlers.set(type,fn)},URL});vm.runInContext(fs.readFileSync('dist/service-worker.js','utf8'),context);
 for(const [url,method,mode]of [['https://app.example/api/data','GET','cors'],['https://app.example/api/media/a','GET','cors'],['https://app.example/login','GET','navigate'],['https://app.example/api/data','PUT','cors'],['https://elsewhere.example/app.js','GET','cors']]){let intercepted=false;handlers.get('fetch')({request:{url,method,mode},respondWith(){intercepted=true;}});assert.equal(intercepted,false,url);}
});
test('service worker só usa a tela offline quando navegação falha e respeita atualização explícita',async()=>{
 const handlers=new Map(),caches=cacheStorage();let skipped=0;const context=vm.createContext({self:{location:{origin:'https://app.example'},addEventListener:(type,fn)=>handlers.set(type,fn),skipWaiting:()=>skipped++,clients:{claim:async()=>{}}},URL,caches,Response,fetch:async()=>new Response('online')});vm.runInContext(fs.readFileSync('dist/service-worker.js','utf8'),context);
 let installed;handlers.get('install')({waitUntil:value=>installed=value});await installed;
 let response;handlers.get('fetch')({request:{url:'https://app.example/',method:'GET',mode:'navigate'},respondWith:value=>response=value});assert.equal(await (await response).text(),'online');
 context.fetch=async()=>{throw new TypeError('offline');};handlers.get('fetch')({request:{url:'https://app.example/',method:'GET',mode:'navigate'},respondWith:value=>response=value});assert.equal(await (await response).text(),'online');
 assert.equal(skipped,0);handlers.get('message')({data:{type:'ACTIVATE_UPDATE'}});assert.equal(skipped,1);
});
test('manifesto, ícones e rotas PWA existem sem liberar a API privada',async()=>{
 const manifest=JSON.parse(fs.readFileSync('dist/manifest.webmanifest','utf8'));assert.equal(manifest.display,'standalone');assert.equal(manifest.start_url,'/');
 for(const icon of manifest.icons){const bytes=fs.readFileSync('dist'+icon.src);assert.equal(bytes.readUInt32BE(16),Number(icon.sizes.split('x')[0]));assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10]);}
 const handler=createHandler({getBackend:()=>'',getToken:()=>''});for(const path of ['/manifest.webmanifest','/service-worker.js','/offline.html','/icons/app-192.png']){assert.equal((await handler(new Request('https://app.example'+path))).status,200);assert.equal((await worker.fetch(new Request('https://app.example'+path),{})).status,200);}assert.equal((await handler(new Request('https://app.example/api/data'))).status,503);
});
test('modo offline bloqueia persistência e posts, sem desviar respostas 401 para cópias',async()=>{
 const ui=await app(),before=ui.run('JSON.stringify(state)');ui.run('AppRuntime.offline=true');assert.equal(await ui.run('persist(structuredClone(state))'),false);await assert.rejects(ui.run("api('/api/data',{method:'PUT'})"),/Consulta offline/);assert.equal(ui.run('JSON.stringify(state)'),before);
 ui.run("AppRuntime.offline=false;location.protocol='https:'");ui.context.fetch=async()=>({status:401,ok:false,json:async()=>({error:'negado'})});await assert.rejects(ui.run("api('/api/me')"),/Entre novamente/);assert.equal(ui.run('AppRuntime.offline'),false);
});

test('falha de rede permite somente consulta da cópia; expiração impede reabrir dados por navegação',async()=>{
 const ui=await app();ui.context.fixture={user:{id:7,username:'Consulta',role:'member'},data:structuredClone(seed),revision:9};
 ui.run("location.protocol='https:';OfflinePack.read=async()=>fixture");ui.context.fetch=async()=>{throw new TypeError('Sem rede');};
 const me=await ui.run("api('/api/me')"),data=await ui.run("api('/api/data')");assert.equal(me.user.role,'member');assert.equal(data.revision,9);assert.equal(ui.run('AppRuntime.offline'),true);
 await assert.rejects(ui.run("api('/api/data',{method:'PUT'})"));ui.run('OfflinePack.read=async()=>null');await ui.run('checkOfflineExpiry()');
 assert.equal(ui.run('state.songs.length'),0);ui.run("location.hash='#acervo';render()");assert(ui.elements.get('#main').innerHTML.includes('expirada'));await assert.rejects(ui.run("api('/api/data')"),/expirada/);
});

test('armazenamento bloqueado não impede autenticação online; diagnóstico não guarda mensagens ou conteúdo',async()=>{
 const ui=await app();ui.run("location.protocol='https:';OfflinePack.read=async()=>{const error=Error('bloqueado');error.name='SecurityError';throw error;}");
 ui.context.fetch=async()=>({ok:true,status:200,json:async()=>({user:{id:8,username:'Online',role:'member'}})});assert.equal((await ui.run("api('/api/me')")).user.id,8);
 ui.run("recordRuntimeIssue({name:'TypeError',message:'senha e música privadas',stack:'dados privados'})");const stored=ui.saved.get('acervo-diagnostics-v1');assert(stored.includes('TypeError'));assert(!stored.includes('senha'));assert(!stored.includes('dados privados'));
});

test('preferência de tela ligada falha sem repetição e libera solicitação cancelada',async()=>{
 const ui=await app();await ui.run('setReadingWake(true)');assert.equal(ui.run('AppRuntime.wakeRequested'),false);
 let resolve,released=0;ui.context.navigator={wakeLock:{request:()=>new Promise(done=>{resolve=done;})}};
 const pending=ui.run('setReadingWake(true)');await ui.run('setReadingWake(false)');resolve({release:async()=>released++,addEventListener(){}});await pending;assert.equal(released,1);assert.equal(ui.run('AppRuntime.wake'),null);
});

test('posição de leitura é lembrada por PDF e conta sem alterar a música',async()=>{
 const ui=await app(),before=ui.run('JSON.stringify(state)');const node=selector=>ui.context.document.querySelector(selector);
 node('#pdf-canvas').getContext=()=>({});node('#pdf-reader .pdf-page-tools').insertAdjacentHTML=()=>{};node('#pdf-reader .pdf-canvas-scroll').clientWidth=624;
 ui.context.library={getDocument:()=>({promise:Promise.resolve({numPages:4,loadingTask:{destroy:async()=>{}},getPage:async()=>({getViewport:({scale})=>({width:600*scale,height:800*scale}),render:()=>({promise:Promise.resolve(),cancel(){}})})})})};
 ui.context.file={name:'teste.pdf',size:10,arrayBuffer:async()=>new ArrayBuffer(4)};ui.run('loadPdfLibrary=async()=>library');
 await ui.run("openPdfFile(file,'caminho',{id:'score',type:'partitura',instrument:'Piano',label:'Piano.pdf'})");ui.run('pdfSession.page=3');await ui.run('renderPdfPage()');ui.run('closeScorePdf()');
 await ui.run("openPdfFile(file,'caminho',{id:'score',type:'partitura',instrument:'Piano',label:'Piano.pdf'})");assert.equal(ui.run('pdfSession.page'),3);ui.run('closeScorePdf();authenticatedUser={id:999,role:"member"}');
 await ui.run("openPdfFile(file,'caminho',{id:'score',type:'partitura',instrument:'Piano',label:'Piano.pdf'})");assert.equal(ui.run('pdfSession.page'),1);assert.equal(ui.run('JSON.stringify(state)'),before);
});
