import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../dist/server/index.js';
import {database} from '../sqlite-adapter.mjs';
import {createHandler} from '../lib/vercel-handler.mjs';

test('cadastro público cria somente músico e mantém dados de usuários privados',async()=>{
 const DB=database();
 try{
  const request=(path,method='GET',data,cookie,origin='http://localhost')=>worker.fetch(new Request('http://localhost'+path,{method,headers:{...(cookie?{Cookie:cookie}:{}),...(method==='GET'?{}:{Origin:origin,'Content-Type':'application/json'})},...(data===undefined?{}:{body:JSON.stringify(data)})}),{DB,LOCAL_ONLY:true,REQUIRE_LOGIN:true});
  const setup=await request('/api/setup','POST',{username:'admin',password:'AdminTest123!',confirm:'AdminTest123!'});
  assert.equal(setup.status,200);
  const adminCookie=setup.headers.get('set-cookie').split(';')[0];
  assert.equal((await request('/api/signup','POST',{username:'novo.musico',password:'MusicoTeste123!',confirm:'MusicoTeste123!'},null,'http://evil.example')).status,403);
  assert.equal((await request('/api/signup','POST',{username:'novo.musico',password:'1234',confirm:'1234'})).status,400);
  assert.equal((await request('/api/signup','POST',{username:'novo.musico',password:'MusicoTeste123!',confirm:'MusicoDiferente123!'})).status,400);
  const signup=await request('/api/signup','POST',{username:'novo.musico',password:'MusicoTeste123!',confirm:'MusicoTeste123!'});
  assert.equal(signup.status,200);
  assert.match(signup.headers.get('set-cookie'),/HttpOnly/);
  const musicianCookie=signup.headers.get('set-cookie').split(';')[0];
  const me=await (await request('/api/me','GET',undefined,musicianCookie)).json();
  assert.equal(me.user.username,'novo.musico');
  assert.equal(me.user.role,'member');
  assert.equal((await request('/api/users','GET',undefined,musicianCookie)).status,403);
  assert.equal((await request('/api/users','GET',undefined,adminCookie)).status,200);
  const row=await DB.prepare('SELECT role,password_hash FROM users WHERE username=?').bind('novo.musico').first();
  assert.equal(row.role,'member');
  assert.notEqual(row.password_hash,'MusicoTeste123!');
  assert.equal((await request('/api/signup','POST',{username:'novo.musico',password:'MusicoTeste123!',confirm:'MusicoTeste123!'})).status,409);
  for(let i=0;i<3;i++)assert.equal((await request('/api/signup','POST',{username:'novo.musico',password:'MusicoTeste123!',confirm:'MusicoTeste123!'})).status,409);
  assert.equal((await request('/api/signup','POST',{username:'novo.musico',password:'MusicoTeste123!',confirm:'MusicoTeste123!'})).status,429);
  const login=await request('/api/login','POST',{username:'novo.musico',password:'MusicoTeste123!',audience:'member'});
  assert.equal(login.status,200);
 }finally{DB.close();}
});

test('endpoint público de cadastro também atravessa a camada Vercel',async()=>{
 const DB=database(),env={DB,LOCAL_ONLY:true,REQUIRE_LOGIN:true};
 try{
  const setup=await worker.fetch(new Request('http://localhost/api/setup',{method:'POST',headers:{Origin:'http://localhost','Content-Type':'application/json'},body:JSON.stringify({username:'admin',password:'AdminTest123!',confirm:'AdminTest123!'})}),env);
  assert.equal(setup.status,200);
  const handler=createHandler({getToken:()=> 'test-token',getBackend:()=> 'https://backend.example',fetchImpl:(url,options)=>worker.fetch(new Request(url,options),env)});
  const response=await handler(new Request('https://app.example/api/signup',{method:'POST',headers:{Origin:'https://app.example','Content-Type':'application/json'},body:JSON.stringify({username:'cadastro.vercel',password:'CadastroSeguro123!',confirm:'CadastroSeguro123!'})}));
  assert.equal(response.status,200);
  assert.match(response.headers.get('set-cookie'),/HttpOnly/);
  const result=await response.json();
  assert.equal(result.user.username,'cadastro.vercel');
  assert.equal(result.user.role,'member');
 }finally{DB.close();}
});
