import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import worker from '../dist/server/index.js';
import {database} from '../sqlite-adapter.mjs';
import {localBucket} from '../local-files.mjs';

test('músico cadastra música e áudio sem receber permissões administrativas',async()=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'notivox-member-')),DB=database(),env={DB,BUCKET:localBucket(directory),LOCAL_ONLY:true},origin='http://localhost';
 const request=(route,method='GET',body,cookie,contentType='application/json')=>worker.fetch(new Request(origin+route,{method,headers:{Origin:origin,...(cookie?{Cookie:cookie}:{}),...(method!=='GET'?{'Content-Type':contentType}:{})},...(body!==undefined?{body:body instanceof Uint8Array?body:JSON.stringify(body)}:{})}),env);
 try{
  const setup=await request('/api/setup','POST',{username:'owner',password:'OwnerPass123!',confirm:'OwnerPass123!'});assert.equal(setup.status,200);const admin=setup.headers.get('set-cookie').split(';')[0];
  assert.equal((await request('/api/users','POST',{username:'musicouser',password:'MusicoPass123!',role:'member'},admin)).status,201);
  const login=await request('/api/login','POST',{username:'musicouser',password:'MusicoPass123!'}),member=login.headers.get('set-cookie').split(';')[0];
  const audio=await request('/api/uploads','POST',{name:'ensaio.mp3',size:4,purpose:'song-audio'},member);assert.equal(audio.status,201);const {id}=await audio.json();
  assert.equal((await request('/api/uploads/'+id+'/0','POST',new Uint8Array([1,2,3,4]),member,'application/octet-stream')).status,200);
  assert.equal((await request('/api/uploads/'+id+'/complete','POST',{},member)).status,200);
  const create=await request('/api/songs','POST',{song:{name:'Nova canção',artist:'Artista',key:'G',originalKey:'C',category:'Pop',bpm:96,chords:'[C]Letra [G]cantada',lyrics:'Letra cantada',notes:'Entrada suave',scoreLink:'',gradeLink:'',pdfLink:'',videoLink:'',voicesLink:'',projectionLink:'',audioFileId:id,role:'admin',departmentIds:['forged']}},member);assert.equal(create.status,201,await create.clone().text());const result=await create.json();
  const response=await request('/api/data','GET',undefined,member),catalogue=await response.json(),song=catalogue.data.songs.find(item=>item.id===result.id);assert.equal(song.createdBy,2);assert.equal(song.chords,'[C]Letra [G]cantada');assert.equal(song.resources[0].type,'audio');assert.equal((await request('/api/data','PUT',{data:catalogue.data,revision:catalogue.revision},member)).status,403);assert.equal((await request('/api/users','GET',undefined,member)).status,403);
  const users=await (await request('/api/users','GET',undefined,admin)).json();assert.equal(users.users.find(user=>user.username==='musicouser').songCount,1);assert.equal(users.users.find(user=>user.username==='musicouser').billingEligible,false);
  assert.equal((await request('/api/uploads/'+id,'DELETE',undefined,member)).status,409);
 }finally{DB.close();await fs.rm(directory,{recursive:true,force:true});}
});
