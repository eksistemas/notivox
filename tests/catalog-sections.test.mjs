import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('cada seção lista somente seus materiais e respeita busca, instrumento e departamento',()=>{
 const resource=(type,instrument='Geral')=>({type,instrument,label:type,url:'https://example.com/file'});
 const songs=[
  {name:'Partitura',departmentIds:['fe'],lyrics:'',resources:[resource('partitura','Bateria')]},
  {name:'Letra PDF',departmentIds:['fe'],lyrics:'',resources:[resource('letra')]},
  {name:'Letra digitada',departmentIds:['fe'],lyrics:'Estrofe',resources:[]},
  {name:'Projeção',departmentIds:['fe'],lyrics:'',resources:[resource('projecao')]},
  {name:'Videoaula',departmentIds:['fe'],lyrics:'',resources:[resource('videoaula','Bateria')]},
  {name:'Sem material',departmentIds:['fe'],lyrics:'',resources:[],audioLink:'https://example.com/reference.mp3'},
  {name:'Outro departamento',departmentIds:['japones'],lyrics:'',resources:[resource('vozes')]}
 ];
 const context=vm.createContext({favorites:[],isGospelReference:()=>false,pdfImportButton:()=>'',state:{songs},departmentId:'fe',page:'',filters:{query:'',instrument:''},departmentSongs:()=>songs.filter(s=>s.departmentIds.includes(context.departmentId)),searchSongs:(list,{query})=>list.filter(s=>s.name.includes(query))});
 vm.runInContext(fs.readFileSync('src/catalog.js','utf8'),context);
 const names=page=>{context.page=page;return Array.from(vm.runInContext('catalogueSongs().map(s=>s.name)',context));};
 assert.deepEqual(names('partituras'),['Partitura']);
 assert.deepEqual(names('letras'),['Letra PDF','Letra digitada']);
 assert.deepEqual(names('projecao'),['Projeção']);
 assert.deepEqual(names('kitvozes'),[]);
 assert.deepEqual(names('videoaula'),['Videoaula']);
 context.filters.instrument='Bateria';assert.deepEqual(names('videoaula'),['Videoaula']);assert.deepEqual(names('letras'),['Letra PDF','Letra digitada']);
 context.filters.instrument='Piano';assert.deepEqual(names('videoaula'),['Videoaula']);assert.deepEqual(names('partituras'),[]);context.filters.instrument='Geral';assert.deepEqual(names('letras'),['Letra PDF','Letra digitada']);
 context.filters.instrument='';context.filters.query='PDF';assert.deepEqual(names('letras'),['Letra PDF']);assert.deepEqual(names('partituras'),[]);
 context.filters.query='';context.departmentId='japones';assert.deepEqual(names('kitvozes'),['Outro departamento']);
});
