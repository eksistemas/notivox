import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import entry from '../api/site.js';

test('entrada Vercel inicia sem DOM, SQLite ou servidor local e falha fechada sem backend',async()=>{
 const previous=[process.env.ADNIPO_BACKEND_URL,process.env.ADNIPO_BACKEND_TOKEN];
 delete process.env.ADNIPO_BACKEND_URL;delete process.env.ADNIPO_BACKEND_TOKEN;
 try{
  assert.equal(typeof entry.fetch,'function');
  const home=await entry.fetch(new Request('https://notivox.example/api/site?path=/'));
  assert.equal(home.status,200);assert.match(await home.text(),/<title>Notivox/);
  const data=await entry.fetch(new Request('https://notivox.example/api/site?path=/api/data'));
  assert.equal(data.status,503);assert.match((await data.json()).error,/configuração/);
  const theme=await entry.fetch(new Request('https://notivox.example/api/site?path=/theme.js'));
  assert.equal(theme.status,200);assert.match(theme.headers.get('content-type'),/javascript/);
 }finally{
  for(const [i,key]of ['ADNIPO_BACKEND_URL','ADNIPO_BACKEND_TOKEN'].entries()){
   if(previous[i]===undefined)delete process.env[key];else process.env[key]=previous[i];
  }
 }
});

test('configuração explícita evita autodetecção Node e não publica dist nem fontes',()=>{
 const config=JSON.parse(fs.readFileSync('vercel.json','utf8'));
 assert.equal(config.framework,null);assert.equal(config.buildCommand,'npm run vercel-build');
 assert.equal(config.installCommand,'npm ci');assert.equal(config.outputDirectory,'public');
 assert.deepEqual(config.rewrites,[{source:'/',destination:'/api/site?path=/'},{source:'/:path*',destination:'/api/site?path=/:path*'}]);
 assert.deepEqual(Object.keys(config.functions),['api/site.js']);
 assert.equal(config.functions['api/site.js'].maxDuration,300);
});
