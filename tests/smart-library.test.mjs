import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from './app-harness.mjs';

test('importação pela interface preenche rascunho, salva pelo formulário e impede duplicação',async()=>{
 const ui=await app(),before=ui.run('JSON.stringify(state)'),count=ui.run('state.songs.length');
 const source='{title: Música de revisão}\n{artist: Equipe de teste}\n{key: D}\n{start_of_chorus}\n[D]Minha  [A/C#]canção\n{end_of_chorus}\n';
 await ui.click('library-import');assert(ui.elements.get('#library-import').open);
 ui.elements.get('#library-text-source').value=source;
 ui.elements.get('#library-import-form').onsubmit({preventDefault(){}});
 assert.equal(ui.elements.get('#edit-form [name="chords"]').value,source);
 assert.equal(ui.elements.get('#edit-form [name="name"]').value,'Música de revisão');
 assert.equal(ui.elements.get('#edit-form [name="key"]').value,'D');
 assert.equal(ui.run('JSON.stringify(state)'),before);assert(ui.elements.get('#editor').open);
 const values={name:'Música de revisão',artist:'Equipe de teste',key:'D',category:'',bpm:'80',lyrics:'',chords:source,notes:'',scoreLink:'',gradeLink:'',audioLink:'',videoLink:'',pdfLink:'',voicesLink:'',projectionLink:''};
 ui.context.FormData=class{constructor(){return new Map(Object.entries(values));}};
 const submit=()=>ui.elements.get('#edit-form').handlers.get('submit')({preventDefault(){},target:ui.elements.get('#edit-form')});
 await submit();assert.equal(ui.run('state.songs.length'),count+1,ui.elements.get('#toast').textContent);assert.equal(ui.run('state.songs.at(-1).chords'),source);
 ui.run("edit('songs')");await submit();assert.equal(ui.run('state.songs.length'),count+1);assert(ui.elements.get('#toast').textContent.includes('Já existe'));
});

test('arquivo de texto inválido e cancelamento não alteram cadastros; consulta não importa',async()=>{
 const ui=await app(),before=ui.run('JSON.stringify(state)');await ui.click('library-import');
 await ui.elements.get('#library-text-file').onchange({target:{files:[{size:100001,text:async()=>{throw Error('Não deveria ler');}}]}});
 assert(ui.elements.get('#library-import-error').textContent.includes('Arquivo muito grande'));
 ui.elements.get('#library-text-source').value='';ui.elements.get('#library-import-form').onsubmit({preventDefault(){}});
 assert(ui.elements.get('#library-import').open);await ui.click('library-import-close');assert.equal(ui.run('JSON.stringify(state)'),before);
 ui.run("authenticatedUser={role:'viewer'}");await ui.click('library-import');assert(!ui.elements.get('#library-import').open);assert.equal(ui.run('JSON.stringify(state)'),before);
});

test('biblioteca combina pesquisa sem acentos com tom, material e conteúdo',async()=>{
 const ui=await app();ui.context.location.hash='#acervo';ui.run('render()');
 ui.run("state.songs=[{...state.songs[0],id:'own',name:'Canção própria',artist:'Ministério',category:'Adoração',key:'C',originalKey:'G',chords:'[C]Minha [G]canção',lyrics:'',resources:[]},{...state.songs[0],id:'ref',name:'Outra canção',chords:'',lyrics:'',pdfLink:'https://example.com/test.pdf',resources:[]}];filters={query:'cancao ministerio adoracao',key:'G',content:'complete',material:'letra'}");
 assert.equal(ui.run('catalogueSongs().length'),1);assert.equal(ui.run('catalogueSongs()[0].id'),'own');
 ui.run("filters.key='D'");assert.equal(ui.run('catalogueSongs().length'),0);
 ui.run("filters={material:'pdf',content:'reference'}");assert.equal(ui.run('catalogueSongs()[0].id'),'ref');
 ui.run("filters={category:'Adoração',material:'letra',key:'G'};render()");
 ui.elements.get('#global-search').oninput({target:{value:'cancao'}});
 assert.equal(ui.run('filters.category'),'Adoração');assert.equal(ui.run('filters.key'),'G');assert.equal(ui.run('filters.material'),'letra');
 await ui.click('library-clear');assert.equal(ui.run('filters.material'),'');assert.equal(ui.run('state.songs.length'),2);
});
test('importação preserva texto exato, diretivas, posições e não escreve no acervo',async()=>{
 const ui=await app(),before=ui.run('JSON.stringify(state)');
 const source='{title: Minha canção}\r\n{artist: Meu ministério}\r\n{key: D}\r\n{start_of_chorus}\r\n[D]Minha  [A/C#]canção\r\n{end_of_chorus}';
 ui.context.importSource=source;assert.equal(ui.run('SmartLibrary.importDraft(importSource).source'),source);assert.equal(ui.run('SmartLibrary.importDraft(importSource).name'),'Minha canção');assert.equal(ui.run('SmartLibrary.importDraft(importSource).key'),'D');
 assert.equal(ui.run('JSON.stringify(state)'),before);
 assert.throws(()=>ui.run("SmartLibrary.importDraft('x'.repeat(20001))"));assert.throws(()=>ui.run("SmartLibrary.importDraft('{new_song}\\n[C]Uma')"));
 ui.run("state.songs[0].name='Canção';state.songs[0].artist='Ministério'");assert.equal(ui.run("SmartLibrary.duplicates(state.songs,' cancao ','ministerio').length"),1);
});
test('biblioteca adiciona o mesmo ID ao repertório sem duplicar música ou entrada',async()=>{
 const ui=await app(),count=ui.run('state.songs.length');ui.run("state.departments[0].repertoire=[]");
 await ui.click('library-repertoire','luz');await ui.click('library-repertoire','luz');
 assert.equal(ui.run('department().repertoire.length'),1);assert.equal(ui.run('department().repertoire[0].songId'),'luz');assert.equal(ui.run('state.songs.length'),count);
 ui.run("authenticatedUser={role:'viewer'}");await ui.click('library-repertoire','unidos');assert.equal(ui.run('department().repertoire.length'),1);
});
test('rótulos diferenciam texto parcial, cifra completa e arquivos de referência',async()=>{
 const ui=await app();assert.equal(ui.run("SmartLibrary.content({chords:'[C]Minha letra',lyrics:''})"),'complete');assert.equal(ui.run("SmartLibrary.content({chords:'',lyrics:'Uma letra'})"),'partial');assert.equal(ui.run("SmartLibrary.content({chords:'C  G  Am',lyrics:''})"),'partial');assert.equal(ui.run("SmartLibrary.content({chords:'',lyrics:'',pdfLink:'https://example.com/a.pdf'})"),'reference');
});
