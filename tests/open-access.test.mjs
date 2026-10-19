import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../dist/server/index.js';
import {database} from '../sqlite-adapter.mjs';
test('email cadastrado consulta e somente administrador cadastra, altera e revoga',async()=>{
 const DB=database();try{
 const request=(path,method='GET',data,cookie)=>worker.fetch(new Request('http://localhost'+path,{method,headers:{...(cookie?{Cookie:cookie}:{}),...(method==='GET'?{}:{Origin:'http://localhost','Content-Type':'application/json'})},...(data?{body:JSON.stringify(data)}:{})}),{DB,LOCAL_ONLY:true});
 assert.equal((await request('/')).status,303);
 assert.equal((await request('/login')).status,200);
 assert.equal((await request('/api/me')).status,401);
 assert.equal((await request('/api/data')).status,401);
 assert.equal((await request('/api/data','PUT',{})).status,401);
 const setup=await request('/api/setup','POST',{username:'admin',password:'AdminTest123!',confirm:'AdminTest123!'});
 assert.equal(setup.status,200);
 const cookie=setup.headers.get('set-cookie').split(';')[0];
 const state=await (await request('/api/data','GET',null,cookie)).json();
 assert.equal((await (await request('/api/me','GET',null,cookie)).json()).user.role,'admin');
 assert.equal((await request('/api/data','PUT',state,cookie)).status,200);
 assert.equal((await request('/api/members','POST',{email:'novo@adnipo.example'},cookie)).status,201);
 assert.equal((await request('/api/email-login','POST',{email:'nao-cadastrado@adnipo.example'})).status,403);
 const login=await request('/api/email-login','POST',{email:' NOVO@ADNIPO.EXAMPLE '});assert.equal(login.status,200);
 const memberCookie=login.headers.get('set-cookie').split(';')[0];
 assert.equal((await request('/api/data','GET',null,memberCookie)).status,200);
 assert.equal((await request('/api/data','PUT',state,memberCookie)).status,403);
 assert.equal((await request('/api/members','POST',{email:'outro@adnipo.example'},memberCookie)).status,403);
 assert.equal((await request('/api/users','GET',null,memberCookie)).status,403);
 const members=await (await request('/api/members','GET',null,cookie)).json();const member=members.members.find(m=>m.email==='novo@adnipo.example');
 assert.equal((await request('/api/members','POST',{action:'remove',id:member.id},cookie)).status,200);
 assert.equal((await request('/api/data','GET',null,memberCookie)).status,401);
 assert.equal((await request('/api/email-login','POST',{email:'novo@adnipo.example'})).status,403);
 const demo=await request('/api/email-login','POST',{email:'teste@adnipo.example'});assert.equal(demo.status,200);assert.equal((await demo.json()).user.role,'member');
 assert.equal((await request('/api/logout','POST',{},cookie)).status,200);
 assert.equal((await request('/api/data','PUT',state,cookie)).status,401);
 assert.equal((await request('/api/login','POST',{username:'admin',password:'wrong'})).status,401);
 assert.equal((await request('/api/login','POST',{username:'admin',password:'AdminTest123!'})).status,200);
 }finally{DB.close();}
});
