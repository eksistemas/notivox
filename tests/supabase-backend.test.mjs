import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import worker from '../dist/server/index.js';
import {postgresAdapter,postgresStatement} from '../lib/postgres-adapter.mjs';
import {supabaseBucket} from '../lib/supabase-bucket.mjs';
import {createHandler} from '../lib/vercel-handler.mjs';

const migration=fs.readFileSync('supabase/migrations/20261019214411_notivox_private_backend.sql','utf8');
async function fixture(){
 const pg=new PGlite();
 await pg.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA storage; CREATE TABLE storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint);');
 await pg.exec(migration);
 const wrap=connection=>({async query(sql,values){const r=await connection.query(sql,values);return {rows:r.rows,count:r.affectedRows??r.rows.length};},transaction:fn=>connection.transaction(tx=>fn(wrap(tx)))});
 return {pg,DB:postgresAdapter(wrap(pg))};
}
const request=(path,method='GET',data,cookie)=>new Request('https://notivox.example'+path,{method,headers:{...(data?{'Content-Type':'application/json',Origin:'https://notivox.example'}:{}),...(cookie?{Cookie:cookie}:{})},...(data?{body:JSON.stringify(data)}:{})});

test('Postgres parametriza SQL legado, preserva literais e rejeita quantidade inválida',()=>{
 const result=postgresStatement("SELECT '?' AS literal,department_id AS departmentId FROM users WHERE id=? AND department_id IS ?",[1,null]);
 assert.equal(result.sql,"SELECT '?' AS literal,department_id AS \"departmentId\" FROM notivox.users WHERE id=$1 AND department_id IS NOT DISTINCT FROM $2");
 assert.throws(()=>postgresStatement('SELECT ?',[1,2]));
 assert.throws(()=>postgresStatement('SELECT 1;DELETE FROM users',[]));
});

test('Postgres local preserva login, permissões, revisão e transações sem Supabase remoto',async()=>{
 const {pg,DB}=await fixture();
 try{
  const {hashPassword}=await import('../dist/server/index.js');
  const hash=await hashPassword('senha-segura-teste','salt-de-teste');
  const savedFiles=new Map();
  const BUCKET={async put(key,value){savedFiles.set(key,new Blob([value]));},async get(key){const blob=savedFiles.get(key);return blob?{body:blob.stream(),json:()=>blob.text().then(JSON.parse)}:null;}};
  const env={DB,BUCKET,REQUIRE_LOGIN:true,INITIAL_ADMIN_HASH:hash,INITIAL_ADMIN_SALT:'salt-de-teste'};
  assert.equal((await worker.fetch(request('/api/status'),env)).status,200);
  let r=await worker.fetch(request('/api/login','POST',{username:'admin',password:'senha-segura-teste'}),env);
  assert.equal(r.status,200);const cookie=r.headers.get('set-cookie').split(';')[0];
  r=await worker.fetch(request('/api/me','GET',null,cookie),env);assert.equal((await r.json()).user.role,'admin');
  r=await worker.fetch(request('/api/users','POST',{username:'musico',password:'senha-musico',role:'member'},cookie),env);assert.equal(r.status,201);
  const musician=await worker.fetch(request('/api/login','POST',{username:'musico',password:'senha-musico'}),env);assert.equal(musician.status,200);const memberCookie=musician.headers.get('set-cookie').split(';')[0];
  r=await worker.fetch(request('/api/data','GET',null,cookie),env);assert.equal(r.status,200);const current=await r.json();
  current.data.songs[0].name='Alteração apenas no teste';r=await worker.fetch(request('/api/data','PUT',current,cookie),env);assert.equal(r.status,200);
  assert.equal((await worker.fetch(request('/api/data','PUT',current,cookie),env)).status,409);
  assert.equal((await worker.fetch(request('/api/data','PUT',current,memberCookie),env)).status,403);
  const backupResult=await worker.fetch(request('/api/backup','GET',null,cookie),env);assert.equal(backupResult.status,200);const backup=await backupResult.json();
  const restore=await worker.fetch(request('/api/backup/restore','POST',{backup:backup.backup,mapping:{},revision:backup.revision},cookie),env);assert.equal(restore.status,200,await restore.text());
  assert.equal((await worker.fetch(request('/api/data'),env)).status,401);
  const count=(await DB.prepare('SELECT COUNT(*) AS n FROM users').first()).n;
  await assert.rejects(DB.batch([DB.prepare("INSERT INTO users(username,salt,password_hash,role) VALUES('rollback','s','h','member')"),DB.prepare('INSERT INTO app_data(id,payload,revision) VALUES(2,NULL,1)')]));
  assert.equal((await DB.prepare('SELECT COUNT(*) AS n FROM users').first()).n,count);
  await pg.exec('SET ROLE anon');await assert.rejects(pg.query('SELECT * FROM notivox.users'));await pg.exec('RESET ROLE');
  await pg.exec('SET ROLE notivox_app');assert.equal((await DB.prepare('SELECT username FROM users').first()).username,'admin');
  await assert.rejects(pg.exec('CREATE TABLE notivox.forbidden(id integer)'));await pg.exec('RESET ROLE');
 }finally{await pg.close();}
});

test('bucket privado mantém bytes, intervalos, ausência e falhas sem expor credenciais',async()=>{
 const objects=new Map();let blocked=false;
 const bucket=supabaseBucket({
  async upload(key,value){if(blocked)return {error:{statusCode:503}};objects.set(key,value instanceof Blob?value:new Blob([value]));return {};},
  async download(key){return objects.has(key)?{data:objects.get(key)}:{error:{statusCode:404}};},
  async info(key){return objects.has(key)?{data:{size:objects.get(key).size}}:{error:{statusCode:404}};},
  async remove(keys){keys.forEach(key=>objects.delete(key));return {};}
 });
 await bucket.put('uploads/test/manifest',JSON.stringify({complete:true}));assert.equal((await (await bucket.get('uploads/test/manifest')).json()).complete,true);
 await bucket.put('uploads/test/part-0',new Uint8Array([1,2,3,4]));assert.equal((await bucket.head('uploads/test/part-0')).size,4);
 const part=await bucket.get('uploads/test/part-0',{range:{offset:1,length:2}});assert.deepEqual([...new Uint8Array(await new Response(part.body).arrayBuffer())],[2,3]);
 assert.equal(await bucket.get('uploads/absent'),null);assert.equal(await bucket.head('uploads/absent'),null);
 await assert.rejects(bucket.get('../secret'));blocked=true;await assert.rejects(bucket.put('uploads/x','x'),/indisponível/);
 await bucket.delete(['uploads/test/part-0']);assert.equal(await bucket.head('uploads/test/part-0'),null);
});

test('Vercel encaminha backend integrado sem identidade de proprietário forjada',async()=>{
 let seen;
 const handler=createHandler({getCloudBackend:async()=>({fetch:async request=>{seen=request;return Response.json({ok:true});}})});
 const result=await handler(new Request('https://notivox.example/api/site?path=/api/data',{headers:{'oai-authenticated-user-id':'fake','cf-connecting-ip':'fake',Cookie:'adnipo_session='+'a'.repeat(64)}}));
 assert.equal(result.status,200);assert.equal(new URL(seen.url).pathname,'/api/data');
 assert.equal(seen.headers.get('oai-authenticated-user-id'),null);assert.equal(seen.headers.get('cf-connecting-ip'),null);assert.ok(seen.headers.get('cookie'));
 const denied=await handler(new Request('https://notivox.example/api/site?path=/api/data',{method:'PUT',headers:{Origin:'https://attacker.example'}}));assert.equal(denied.status,403);
});
