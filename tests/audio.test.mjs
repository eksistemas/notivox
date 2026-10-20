import test from 'node:test';
import assert from 'node:assert/strict';
import {seed,validate} from '../domain.mjs';
import {app} from './app-harness.mjs';

test('o modelo aceita materiais de áudio reais com a mesma validação do acervo',()=>{
 const data=structuredClone(seed);data.songs[0].resources.push({id:'faixa-referencia',type:'audio',instrument:'Geral',label:'ensaio.mp3',url:'https://files.example/ensaio.mp3',storage:'server',fileId:'21c5b287-1984-4f48-8c18-9a5637e9a382'});
 assert.equal(validate(data).songs[0].resources.at(-1).type,'audio');
 data.songs[0].resources.at(-1).url='javascript:alert(1)';assert.throws(()=>validate(data));
});

test('início, repertório e música exibem áudio somente quando há arquivo associado',async()=>{
 const ui=await app();ui.run("state.songs[0].resources.push({id:'track',type:'audio',instrument:'Geral',label:'Ensaio.mp3',url:'https://files.example/ensaio.mp3',storage:'server'});rememberSong('caminho');location.hash='#inicio';render()");
 assert.match(ui.elements.get('#main').innerHTML,/audio-available/);
 ui.run("location.hash='#repertorio';render();filters.material='audio';updateCatalogue()");assert.equal(ui.run('catalogueSongs().length'),1);
 ui.run("location.hash='#musica/caminho';render()");assert.match(ui.elements.get('#detail-content').innerHTML,/song-audio-player/);assert.match(ui.elements.get('#detail-content').innerHTML,/preload="none"/);assert.match(ui.elements.get('#detail-content').innerHTML,/audio-seek/);assert.match(ui.elements.get('#detail-content').innerHTML,/audio-volume/);
 ui.run("state.songs[0].resources=[];location.hash='#repertorio';filters.material='';render()");assert.doesNotMatch(ui.elements.get('#song-grid').innerHTML,/audio-available/);
});

test('administração configura upload de áudio permitido e fluxo de substituição',async()=>{
 const ui=await app();ui.run("authenticatedUser={id:1,role:'admin'};location.hash='#gerenciar';render()");await ui.click('resources','caminho');
 const form=ui.elements.get('#resource-editor').innerHTML;assert.match(form,/\.mp3/);assert.match(form,/\.m4a/);assert.match(form,/200 MB/);assert.match(form,/Enviar arquivo de áudio/);
 ui.run("location.hash='#gerenciar/musicas/caminho';render()");assert.match(ui.elements.get('#fields').innerHTML,/Gerenciar áudio/);assert.match(ui.elements.get('#fields').innerHTML,/data-action="resources"/);
});
