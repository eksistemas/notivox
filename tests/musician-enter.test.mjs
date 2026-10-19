import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from './app-harness.mjs';

test('modo músico aceita Enter repetido entre músicas e preserva acervo e foco de leitura',async()=>{
 const ui=await app(),before=ui.run('JSON.stringify(state)');
 ui.run("currentSong=state.songs[0];openCifraReader();toggleReaderFocus()");
 assert.equal(ui.run('LivePlaylist.active'),false);
 assert.equal(ui.run('document.activeElement'),ui.elements.get('#cifra-reader .reader-sheet'));
 const press=()=>ui.key({key:'Enter',preventDefault(){},target:{matches:()=>false,closest:()=>null}});
 press();assert.equal(ui.run('currentSong.id'),'luz');
 assert.equal(ui.run('document.activeElement'),ui.elements.get('#cifra-reader .reader-sheet'));
 press();assert.equal(ui.run('currentSong.id'),'unidos');press();assert.equal(ui.run('currentSong.id'),'unidos');
 assert.equal(ui.run('JSON.stringify(state)'),before);
});

test('modo músico não troca ao digitar, segurar Enter, compor texto ou ler PDF',async()=>{
 const ui=await app();ui.run("currentSong=state.songs[0];openCifraReader();toggleReaderFocus()");
 const event={key:'Enter',preventDefault(){},target:{matches:()=>false,closest:()=>null}};
 for(const extra of [{repeat:true},{shiftKey:true},{ctrlKey:true},{altKey:true},{metaKey:true},{isComposing:true},{defaultPrevented:true},{target:{matches:()=>true}},{target:{matches:()=>false,closest:()=>({})}}]){
  ui.key({...event,...extra});assert.equal(ui.run('currentSong.id'),'caminho');
 }
 ui.elements.get('#pdf-reader').open=true;ui.key(event);assert.equal(ui.run('currentSong.id'),'caminho');
 ui.elements.get('#pdf-reader').open=false;ui.run('toggleReaderFocus()');ui.key(event);assert.equal(ui.run('currentSong.id'),'caminho');
});

test('Enter em música fora do repertório não escolhe outra sequência nem altera dados',async()=>{
 const ui=await app();ui.run("state.departments[0].repertoire=state.departments[0].repertoire.slice(1);currentSong=state.songs[0];openCifraReader();toggleReaderFocus()");
 const before=ui.run('JSON.stringify(state)');ui.key({key:'Enter',preventDefault(){},target:{matches:()=>false,closest:()=>null}});
 assert.equal(ui.run('currentSong.id'),'caminho');assert.equal(ui.run('readerRepertoireContext'),null);assert.equal(ui.run('JSON.stringify(state)'),before);
 assert.match(ui.elements.get('#toast').textContent,/repertório/);
});
