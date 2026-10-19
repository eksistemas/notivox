import test from 'node:test';
import assert from 'node:assert/strict';
import {seed,validate,emptyDepartment,searchSongs,authorizeUpdate} from '../domain.mjs';
import worker from '../dist/server/index.js';
import {database} from '../sqlite-adapter.mjs';

test('migração preserva os dados antigos e separa os três departamentos',()=>{
 const first=seed.departments[0];const legacy={version:1,cult:first.cult,songs:seed.songs.map(({artist,originalKey,category,audioLink,pdfLink,departmentIds,...song})=>song),events:first.events,notices:first.notices,words:seed.words};
 const migrated=validate(legacy);assert.equal(migrated.version,4);assert.deepEqual(migrated.departments.map(d=>d.name),['Culto da Fé','Culto de Japonês','Inoti']);assert.deepEqual(migrated.songs.map(s=>s.lyrics),legacy.songs.map(s=>s.lyrics));assert.equal(migrated.departments[0].repertoire.length,3);assert.equal(migrated.departments[1].repertoire.length,0);
 const next=structuredClone(migrated);next.departments[1].cult.title='Culto em japonês';assert.equal(next.departments[0].cult.title,first.cult.title);next.departments.push(emptyDepartment('jovens','Jovens'));assert.equal(validate(next).departments.length,4);
 next.departments[1].repertoire.push({songId:next.songs[0].id,key:'D',notes:''});assert.throws(()=>validate(next),/departamento/);next.songs[0].departmentIds.push('japones');assert.equal(validate(next).departments[1].repertoire[0].key,'D');assert.equal(next.departments[0].repertoire[0].key,'C');
});
test('pesquisa considera intérprete, tema, tom e favoritos sem exigir acentos',()=>{
 const songs=structuredClone(seed.songs);songs[0].artist='Ministério Esperança';songs[0].category='Adoração';assert.equal(searchSongs(songs,{query:'ministerio esperanca adoracao'}).length,1);assert.equal(searchSongs(songs,{category:'Adoração',key:'C'}).length,1);assert.equal(searchSongs(songs,{favoritesOnly:true,favorites:[songs[1].id]})[0].id,songs[1].id);
});
test('cadastro de instrumentos e vozes exige nomes únicos e preserva Geral',()=>{
 const next=structuredClone(seed);next.instruments.push({id:'baritono',name:'Barítono',kind:'voice'});assert.equal(validate(next).instruments.at(-1).name,'Barítono');next.instruments.push({id:'duplicado',name:'baritono',kind:'voice'});assert.throws(()=>validate(next),/instrumentos e vozes/);const removed=structuredClone(seed);removed.instruments=removed.instruments.filter(item=>item.id!=='geral');assert.throws(()=>validate(removed),/Geral/);
});
test('administrador de departamento não pode alterar o acervo nem outro departamento',()=>{
 const user={role:'department_admin',departmentId:'fe'},next=structuredClone(seed);next.departments[0].repertoire.reverse();assert.equal(authorizeUpdate(user,seed,next),true);next.departments[1].cult.title='Outro';assert.equal(authorizeUpdate(user,seed,next),false);const altered=structuredClone(seed);altered.songs[0].name='Alterado';assert.equal(authorizeUpdate(user,seed,altered),false);assert.equal(authorizeUpdate({role:'member'},seed,seed),false);
});
test('servidor aplica a permissão do departamento mesmo com requisição manual',async()=>{
 const DB=database(),env={DB,LOCAL_ONLY:true,REQUIRE_LOGIN:true},origin='http://localhost';
 const request=(path,method='GET',data,cookie)=>worker.fetch(new Request(origin+path,{method,headers:{...(method==='GET'?{}:{Origin:origin,'Content-Type':'application/json'}),...(cookie?{Cookie:cookie}:{})},...(data?{body:JSON.stringify(data)}:{})}),env);
 try{
 const setup=await request('/api/setup','POST',{username:'admin',password:'1234',confirm:'1234'});const admin=setup.headers.get('set-cookie').split(';')[0];const initial=await (await request('/api/data','GET',null,admin)).json();
 assert.equal((await request('/api/users','POST',{username:'coordenador',password:'1234',role:'department_admin',departmentId:'fe'},admin)).status,201);
 const login=await request('/api/login','POST',{username:'coordenador',password:'1234'});const cookie=login.headers.get('set-cookie').split(';')[0];assert.equal((await (await request('/api/me','GET',null,cookie)).json()).user.departmentId,'fe');
 const own=structuredClone(initial);own.data.departments[0].repertoire.reverse();assert.equal((await request('/api/data','PUT',own,cookie)).status,200);
 const other=await (await request('/api/data','GET',null,cookie)).json();other.data.departments[1].cult.title='Mudança indevida';assert.equal((await request('/api/data','PUT',other,cookie)).status,403);
 const central=await (await request('/api/data','GET',null,cookie)).json();central.data.songs[0].name='Mudança indevida';assert.equal((await request('/api/data','PUT',central,cookie)).status,403);
 }finally{DB.close();}
});
