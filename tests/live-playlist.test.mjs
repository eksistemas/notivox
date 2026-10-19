import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import esbuild from 'esbuild';
import {app} from './app-harness.mjs';

test('playlist reutiliza repertório, identifica materiais e permite busca sem acentos sem reordenar',async()=>{
 const ui=await app(),before=ui.run('JSON.stringify(state)');ui.context.location.hash='#playlist';ui.run('render()');
 const html=ui.elements.get('#main').innerHTML;assert(html.includes('Sua próxima música.'));assert(html.includes('Entrar no modo palco'));assert(html.includes('Playlist do repertório'));assert(html.includes('Organizar'));
 assert(html.indexOf('Caminho de Fé')<html.lastIndexOf('Tua Luz Nos Guia'));assert(!html.includes('data-action="delete-song"'));
 ui.elements.get('#live-library-search').oninput({target:{value:'caminho fe'}});assert(ui.elements.get('#live-library-results').innerHTML.includes('Caminho de Fé'));assert(!ui.elements.get('#live-library-results').innerHTML.includes('Tua Luz Nos Guia'));assert.equal(ui.run('JSON.stringify(state)'),before);
});
test('modo palco avança em um toque, antecipa próxima e respeita início e fim',async()=>{
 const ui=await app(),before=ui.run('JSON.stringify(state)');await ui.click('live-start','caminho');assert(ui.elements.get('#cifra-reader').open);assert.equal(ui.run('currentSong.id'),'caminho');
 assert(ui.elements.get('#cifra-reader #live-stage-footer').innerHTML.includes('Tua Luz Nos Guia'));assert.equal(ui.run('liveMove(-1)'),false);
 await ui.click('live-move',null,{direction:'1'});assert.equal(ui.run('currentSong.id'),'luz');assert(ui.run("LivePlaylist.played.has('caminho')"));
 const last=ui.run('liveEntries().at(-1).song.id');ui.context.lastId=last;ui.run('liveSelect(lastId)');assert.equal(ui.run('liveMove(1)'),false);assert(ui.elements.get('#cifra-reader #live-stage-footer').innerHTML.includes('FIM DA PLAYLIST'));assert.equal(ui.run('JSON.stringify(state)'),before);
});
test('troca rápida aplica tom da entrada, preserva acordes posicionados e pausa rolagem',async()=>{
 const ui=await app();ui.run("state.songs[0].chords='[C]Eu  [G/B]quero';state.departments[0].repertoire[0].key='D'");const source=ui.run('state.songs[0].chords');await ui.click('live-start','caminho');
 assert.equal(ui.run('transposeSteps'),2);assert(ui.elements.get('#cifra-reader .reader-sheet').innerHTML.includes('D'));ui.run('readerAutoScroll={stop(){this.stopped=true;}}');await ui.click('live-select','luz');assert(ui.run('readerAutoScroll.stopped'));await ui.click('live-select','caminho');assert.equal(ui.run('transposeSteps'),2);assert.equal(ui.run('state.songs[0].chords'),source);
});
test('letras e partituras compartilham apresentação sem esconder notas nem inventar conteúdo',async()=>{
 const ui=await app();ui.run("state.songs[0].lyrics='Minha letra\\nSegunda linha';state.departments[0].repertoire[0].notes='Entrar após a bateria';state.songs[0].resources.push({id:'drum-live',type:'partitura',instrument:'Bateria',label:'Bateria.pdf',url:'https://example.com/bateria.pdf'})");
 await ui.click('live-start','caminho');await ui.click('live-view',null,{view:'lyrics'});assert(ui.elements.get('#cifra-reader .reader-sheet').innerHTML.includes('Minha letra'));
 await ui.click('live-view',null,{view:'scores'});const html=ui.elements.get('#cifra-reader .reader-sheet').innerHTML;assert(html.includes('Bateria.pdf'));assert(html.includes('data-action="pdf-open"'));assert(html.includes('data-resource="drum-live"'));
 ui.run("state.songs[0].chords='';state.songs[0].lyrics=''");await ui.click('live-view',null,{view:'lyrics'});assert(ui.elements.get('#cifra-reader .reader-sheet').innerHTML.includes('ainda não cadastrada'));
});
test('fila mantém ordem durante pesquisa e salto, sem duplicar músicas ou gravar no servidor',async()=>{
 const ui=await app(),before=ui.run('JSON.stringify(state)'),count=ui.run('state.songs.length');await ui.click('live-start','caminho');await ui.click('live-queue');
 ui.elements.get('#cifra-reader #live-stage-search').oninput({target:{value:'luz'}});const html=ui.elements.get('#cifra-reader #live-stage-results').innerHTML;assert(html.includes('Tua Luz Nos Guia'));assert(!html.includes('Caminho de Fé'));
 await ui.click('live-select','luz');assert.equal(ui.run('currentSong.id'),'luz');assert.equal(ui.run('LivePlaylist.query'),'');assert.equal(ui.run('state.songs.length'),count);assert.equal(ui.run('JSON.stringify(state)'),before);
});
test('setas e PageDown navegam; edição, modificadores e leitor PDF não disparam troca',async()=>{
 const ui=await app();await ui.click('live-start','caminho');const event={key:'ArrowRight',preventDefault(){},target:{matches:()=>false}};ui.key(event);assert.equal(ui.run('currentSong.id'),'luz');
 ui.key({...event,key:'ArrowLeft',target:{matches:()=>true}});assert.equal(ui.run('currentSong.id'),'luz');ui.key({...event,key:'ArrowLeft',ctrlKey:true});assert.equal(ui.run('currentSong.id'),'luz');
 ui.elements.get('#pdf-reader').open=true;ui.key({...event,key:'ArrowLeft'});assert.equal(ui.run('currentSong.id'),'luz');ui.elements.get('#pdf-reader').open=false;ui.key({...event,key:'PageUp'});assert.equal(ui.run('currentSong.id'),'caminho');
});
test('Enter avança uma música por pressão e respeita fim, foco e composição',async()=>{
 const ui=await app();await ui.click('live-start','caminho');
 const before=ui.run('JSON.stringify(state)');let prevented=0;
 const event={key:'Enter',preventDefault(){prevented++;},target:{matches:()=>false,closest:()=>null}};
 ui.key(event);assert.equal(ui.run('currentSong.id'),'luz');assert.equal(prevented,1);
 for(const extra of [{repeat:true},{shiftKey:true},{isComposing:true},{defaultPrevented:true},{ctrlKey:true},{altKey:true},{metaKey:true},{target:{matches:()=>true}},{target:{matches:()=>false,closest:()=>({})}}]){
  ui.key({...event,...extra});assert.equal(ui.run('currentSong.id'),'luz');
 }
 ui.elements.get('#pdf-reader').open=true;ui.key(event);assert.equal(ui.run('currentSong.id'),'luz');ui.elements.get('#pdf-reader').open=false;
 ui.key(event);const last=ui.run('currentSong.id');assert.notEqual(last,'luz');ui.key(event);assert.equal(ui.run('currentSong.id'),last);
 assert.equal(ui.run('JSON.stringify(state)'),before);
 await ui.click('live-exit');ui.key(event);assert.equal(ui.run('LivePlaylist.active'),false);
});

test('sair limpa modo palco e restaura navegação normal; expiração e gravação bloqueiam início',async()=>{
 const ui=await app();await ui.click('live-start','caminho');await ui.click('live-exit');assert.equal(ui.run('LivePlaylist.active'),false);assert(!ui.elements.get('#cifra-reader').open);assert.equal(ui.run('readerRepertoireContext'),null);
 ui.run('AppRuntime.expired=true');assert.equal(ui.run("startLivePlaylist('caminho')"),false);ui.run('AppRuntime.expired=false;recording=true');assert.equal(ui.run("startLivePlaylist('caminho')"),false);
});
test('perfil de consulta usa playlist sem obter privilégios; fila vazia e ID inválido são seguros',async()=>{
 const ui=await app();ui.run("authenticatedUser={id:9,role:'member'}");assert.equal(ui.run("startLivePlaylist('caminho')"),true);assert.equal(ui.run('isAdmin()'),false);assert.equal(ui.run("liveSelect('missing')"),false);ui.run('endLivePlaylist();state.departments[0].repertoire=[]');assert.equal(ui.run('startLivePlaylist()'),false);assert(ui.run('playlistView()').includes('Montar repertório'));
});
test('layout e navegação identificam ações por texto e CSS válido em desktop e celular',()=>{
 const shell=fs.readFileSync('src/shell.html','utf8');assert(shell.includes('href="#playlist"'));assert(shell.includes('aria-label="Playlist ao vivo"'));
 for(const file of ['src/live-playlist.css','dist/styles.css'])assert.equal(esbuild.transformSync(fs.readFileSync(file,'utf8'),{loader:'css',logLevel:'silent'}).warnings.length,0);
});

test('partitura avança pela playlist mantendo instrumento quando a escolha é única',async()=>{
 const ui=await app();ui.run("state.songs[1].resources.push({id:'drum-next',type:'partitura',instrument:'Bateria',label:'Bateria.pdf',url:'https://example.com/bateria.pdf'});startLivePlaylist('caminho');pdfSession={existingResource:{instrument:'Bateria'}}");
 let opened;ui.context.capturePdf=async(songId,resourceId)=>{opened={songId,resourceId};};ui.run('openPdfResource=capturePdf');assert.equal(await ui.run('livePdfMove(1)'),true);assert.deepEqual(opened,{songId:'luz',resourceId:'drum-next'});
 ui.run('pdfSession={existingResource:{instrument:"Bateria"}}');assert.equal(await ui.run('livePdfMove(1)'),true);assert.equal(ui.run('LivePlaylist.view'),'scores');assert.equal(await ui.run('livePdfMove(1)'),false);
});
