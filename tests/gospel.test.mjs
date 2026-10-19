import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {seed,validate} from '../domain.mjs';
test('catálogo gospel preserva materiais, evita duplicados e respeita departamentos',()=>{
 let count=0;const context=vm.createContext({structuredClone,uid:()=>`gospel-${++count}`,document:{addEventListener(){}},data:structuredClone(seed)});
 vm.runInContext(fs.readFileSync('src/gospel.js','utf8'),context);
 const next=vm.runInContext("mergeGospelCatalogue(data,'fe')",context);assert.equal(next.songs.length,seed.songs.length+19);validate(next);
 assert.equal(next.songs.find(song=>song.name==='Ele Me Ama').artist,'Livres Para Adorar');
 assert(next.songs.slice(seed.songs.length).every(song=>song.gradeLink===''));
 const song=next.songs.find(song=>song.name==='Ele Me Ama');song.chords='D A Bm G';song.key='D';song.resources.push({id:'user-pdf',type:'cifra',instrument:'Geral',label:'Meu PDF',url:'https://example.com/meu.pdf'});
 context.data=next;const repeated=vm.runInContext("mergeGospelCatalogue(data,'fe')",context);assert.equal(repeated.songs.length,next.songs.length);assert.equal(repeated.songs.find(item=>item.id===song.id).chords,'D A Bm G');assert.equal(repeated.songs.find(item=>item.id===song.id).resources.length,1);
 context.data=repeated;const other=vm.runInContext("mergeGospelCatalogue(data,'japones')",context);assert.equal(other.songs.length,repeated.songs.length);assert(other.songs.find(item=>item.id===song.id).departmentIds.includes('japones'));assert.deepEqual(other.departments[1].repertoire,[]);validate(other);
 assert.throws(()=>vm.runInContext("mergeGospelCatalogue(data,'missing')",context),/acervo/);
});
