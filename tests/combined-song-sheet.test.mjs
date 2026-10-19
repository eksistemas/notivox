import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import esbuild from 'esbuild';
import {app} from './app-harness.mjs';

test('cadastro prioriza cifra completa e mantém letra independente opcional sem alterar dados',async()=>{
 const ui=await app(),before=ui.run('JSON.stringify(state)');ui.run("edit('songs','caminho')");const html=ui.elements.get('#fields').innerHTML;
 assert(html.includes('Cifra completa — acordes e letra juntos'));assert(html.includes('<details class="song-independent-lyrics">'));assert(html.includes('name="lyrics"'));assert(html.includes('name="chords"'));assert(html.indexOf('name="chords"')<html.indexOf('name="lyrics"'));assert(html.includes('Prévia de leitura'));assert.equal(ui.run('JSON.stringify(state)'),before);
});
test('prévia tradicional mantém acordes sobre os trechos exatos e não grava o rascunho',async()=>{
 const ui=await app(),before=ui.run('JSON.stringify(state)');ui.run("edit('songs','caminho')");ui.elements.get('#editor [name="chords"]').value='C       G/B\nMinha canção';ui.elements.get('#editor [name="chords"]').oninput();
 const html=ui.elements.get('#combined-song-preview').innerHTML;assert(html.includes('sheet-chord">C</span>'));assert(html.includes('sheet-chord">G/B</span>'));assert(html.includes('Minha '));assert(ui.elements.get('#combined-song-status').textContent.includes('mesma cifra'));assert.equal(ui.run('JSON.stringify(state)'),before);
});
test('cifra única fornece letra e projeção sem preencher ou sobrescrever campo independente',async()=>{
 const ui=await app();ui.run("state.songs[0].lyrics='';state.songs[0].chords='[Estrofe]\\n[C]Minha [G]canção\\n\\n[Refrão]\\n[Am]Outra frase';filters={query:'caminho'};page='letras'");const before=ui.run('JSON.stringify(state.songs[0])');
 assert.equal(ui.run('catalogueSongs().length'),1);assert.equal(ui.run('songLyricText(state.songs[0])'),'Minha canção\n\nOutra frase');assert(ui.run('sectionMaterialContent(state.songs[0],sections.letras)').includes('Minha canção'));
 ui.run("currentSong=state.songs[0];project()");assert.equal(ui.run('slides[0]'),'Minha canção');assert.equal(ui.run('slides[1]'),'Outra frase');assert.equal(ui.run('JSON.stringify(state.songs[0])'),before);
});
test('grade e letra legadas não recebem alinhamento inventado e conservam versões independentes',async()=>{
 const ui=await app();ui.run("edit('songs','caminho')");const chords=ui.run('state.songs[0].chords'),lyrics=ui.run('state.songs[0].lyrics'),before=ui.run('JSON.stringify(state.songs[0])');
 ui.elements.get('#editor [name="chords"]').value=chords;ui.elements.get('#editor [name="lyrics"]').value=lyrics;ui.run('refreshCombinedSongPreview()');assert(ui.elements.get('#combined-song-status').textContent.includes('Nenhuma posição será inventada'));assert.equal(ui.run('songLyricText(state.songs[0])'),lyrics);assert.equal(ui.run('JSON.stringify(state.songs[0])'),before);
});
test('prévia principal sempre mostra cifra completa, mesmo com preferência anterior por mapa',async()=>{
 const ui=await app();ui.run("state.songs[0].chords='[C]Minha [G/B]canção';state.songs[0].lyrics='';readerMode='map';transposeSongId=state.songs[0].id;transposeSteps=2");const html=ui.run('cifraContent(state.songs[0])');assert(html.includes('Minha '));assert(html.includes('sheet-chord">D</span>'));assert(html.includes('A/C#'));assert.equal(ui.run('state.songs[0].chords'),'[C]Minha [G/B]canção');assert.equal(ui.run('readerMode'),'map');
});
test('conteúdo colado permanece escapado e estilos da cifra integrada são válidos',async()=>{
 const ui=await app();ui.run("edit('songs','caminho')");ui.elements.get('#editor [name="chords"]').value='[C]<img src=x onerror=alert(1)>';ui.run('refreshCombinedSongPreview()');const html=ui.elements.get('#combined-song-preview').innerHTML;assert(!html.includes('<img'));assert(html.includes('&lt;img'));
 assert.equal(esbuild.transformSync(fs.readFileSync('src/combined-song-sheet.css','utf8'),{loader:'css',logLevel:'silent'}).warnings.length,0);
});
