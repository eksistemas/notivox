import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import esbuild from 'esbuild';
import {app} from './app-harness.mjs';

test('as três rotas preservam links antigos e IDs sem interpretar HTML',async()=>{
 const ui=await app();
 for(const [hash,screen] of [['#inicio','inicio'],['#cifras','repertorio'],['#repertorio','repertorio'],['#playlist','playlist'],['#gerenciar','gerenciar'],['#acessos','gerenciar'],['#musica/a%2Fb','musica']])assert.equal(ui.run(`simpleRoute(${JSON.stringify(hash)}).screen`),screen);
 assert.equal(ui.run("simpleRoute('#musica/a%2Fb').id"),'a/b');
 ui.run("location.hash='#musica/inexistente';render()");assert.match(ui.elements.get('#main').innerHTML,/Música não encontrada/);
 ui.run("location.hash='#musica/%E0%A4';render()");assert.match(ui.elements.get('#main').innerHTML,/Música não encontrada/);
});

test('visitantes e perfis antigos não entram em Gerenciar por link direto',async()=>{
 for(const role of ['member','department_admin']){
  const ui=await app();ui.run(`authenticatedUser={id:2,role:${JSON.stringify(role)}};location.hash='#gerenciar/acessos';render()`);
  assert.equal(ui.context.location.hash,'#inicio');assert.equal(ui.run('SimpleUI.screen'),'inicio');
  assert.doesNotMatch(ui.elements.get('#sidebar nav').innerHTML,/#gerenciar/);
  assert.doesNotMatch(ui.elements.get('#main').innerHTML,/data-action="(?:edit|delete-song|resources)"/);
  const before=ui.run('JSON.stringify(state)');await ui.click('simple-manage-song','caminho');assert.equal(ui.run('JSON.stringify(state)'),before);
 }
});

test('gerenciamento reutiliza edição e arquivos reais e preserva catálogo',async()=>{
 const ui=await app(),before=ui.run('JSON.stringify(state)');ui.run("location.hash='#gerenciar';render()");
 for(const action of ['add-cifra','export','import'])assert(ui.elements.get('#main').innerHTML.includes(`data-action="${action}"`));
 for(const action of ['edit','resources','delete-song'])assert(ui.elements.get('#song-grid').innerHTML.includes(`data-action="${action}"`));
 await ui.click('edit','caminho',{kind:'songs'});assert.equal(ui.run('editTarget.id'),'caminho');assert(ui.elements.get('#editor').open);
 assert.equal(ui.run('JSON.stringify(state)'),before);
});

test('busca instantânea combina favoritos, recentes e filtros; limpar restaura todas',async()=>{
 const ui=await app();ui.run("rememberSong('caminho');rememberSong('luz');favorites=['luz'];render()");
 await ui.click('simple-scope',null,{scope:'recent'});assert.equal(ui.run('catalogueSongs()[0].id'),ui.run('recentSongs[0]'));
 await ui.click('simple-scope',null,{scope:'favorites'});assert.equal(ui.run('catalogueSongs().length'),1);
 ui.elements.get('#global-search').oninput({target:{value:'nenhum resultado'}});assert.match(ui.elements.get('#song-grid').innerHTML,/Nenhuma música/);
 await ui.click('simple-clear');assert.equal(ui.run('catalogueSongs().length'),ui.run('state.songs.length'));
 ui.run("state.songs=[];SimpleUI.scope='all';location.hash='#repertorio';render()");assert.match(ui.elements.get('#song-grid').innerHTML,/biblioteca está pronta/);
});

test('um clique abre a música e um link direto reabre o mesmo ID sem alterar dados',async()=>{
 const ui=await app(),before=ui.run('JSON.stringify(state)');await ui.click('song','caminho');
 assert.equal(ui.context.location.hash,'#musica/caminho');assert(ui.elements.get('#detail').open);
 ui.run("$('#detail').close();currentSong=null;render()");assert.equal(ui.run('currentSong.id'),'caminho');assert(ui.elements.get('#detail').open);
 assert.equal(ui.run('JSON.stringify(state)'),before);
 ui.run("location.hash='#inicio';render()");assert(!ui.elements.get('#detail').open);
});

test('preferências, repertório, playlist e administração continuam sob três telas',async()=>{
 const ui=await app();for(const route of ['#inicio/configuracoes','#inicio/repertorio','#inicio/playlist','#gerenciar/instrumentos','#gerenciar/cadastroemail','#gerenciar/acessos']){
  ui.context.location.hash=route;ui.run('render()');assert(!ui.elements.get('#main').innerHTML.includes('Música não encontrada'));
  const expected=route.startsWith('#gerenciar')?'gerenciar':route.endsWith('/repertorio')?'repertorio':route.endsWith('/playlist')?'playlist':route.endsWith('/configuracoes')?'configuracoes':'inicio';assert.equal(ui.run('SimpleUI.screen'),expected);
 }
});

test('estilos responsivos, foco, redução de movimento e estados são válidos',()=>{
 const css=fs.readFileSync('src/simple-interface.css','utf8');assert.equal(esbuild.transformSync(css,{loader:'css',logLevel:'silent'}).warnings.length,0);
 for(const rule of ['max-width:600px','max-width:1000px','prefers-reduced-motion','focus-visible','.simple-empty','.loading-cover'])assert(css.includes(rule));
 const shell=fs.readFileSync('src/shell.html','utf8');assert(!/data-page="(?:cifras|partituras|letras|repertorio)"/.test(shell));
 const built=fs.readFileSync('dist/app.js','utf8');assert(built.includes("$$('[data-page]').forEach"));
});
