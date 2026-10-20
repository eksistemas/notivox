import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import esbuild from 'esbuild';
import {app} from './app-harness.mjs';

function node(ui,selector){return ui.context.document.querySelector(selector);}
async function reader(){
 const ui=await app(),rendered=[],destroyed=[];
 const canvas=node(ui,'#pdf-canvas');canvas.getContext=()=>({});
 const tools=node(ui,'#pdf-reader .pdf-page-tools');tools.insertAdjacentHTML=(position,html)=>{tools.innerHTML+=html;};
 node(ui,'#pdf-reader .pdf-canvas-scroll').clientWidth=624;
 ui.context.fakeLibrary={getDocument:()=>({promise:Promise.resolve({numPages:3,loadingTask:{destroy:async()=>destroyed.push(true)},getPage:async number=>({getViewport:({scale})=>({width:600*scale,height:800*scale}),render:({viewport})=>{rendered.push({number,width:viewport.width});return {promise:Promise.resolve(),cancel(){}};}})})})};
 ui.run('loadPdfLibrary=async()=>fakeLibrary');
 ui.context.testFile={name:'bateria.pdf',size:100,arrayBuffer:async()=>new ArrayBuffer(4)};
 return {ui,rendered,destroyed};
}

test('associa múltiplas partituras ao ID existente, inclui Trompete e preserva músicas e repertório',async()=>{
 const ui=await app(),before=ui.run('JSON.stringify(state.songs[0])'),repertoire=ui.run('JSON.stringify(department().repertoire)'),count=ui.run('state.songs.length');
 assert.equal(await ui.run("attachScore({songId:'caminho',instrument:'Trompete',label:'Trompete',url:'https://example.com/download?id=trompete'})"),true);
 assert(ui.run("scoreFileButton(state.songs[0].resources.at(-1),'caminho')").includes('data-action="pdf-open"'));
 assert.equal(await ui.run("attachScore({songId:'caminho',instrument:'Bateria',label:'Bateria',url:'https://example.com/bateria.pdf'})"),true);
 assert.equal(ui.run('state.songs.length'),count);assert.equal(ui.run('JSON.stringify(department().repertoire)'),repertoire);
 const old=JSON.parse(before),after=JSON.parse(ui.run('JSON.stringify(state.songs[0])'));assert.deepEqual({...after,resources:old.resources},old);
 assert.equal(after.resources.length,old.resources.length+2);assert(ui.run("state.instruments.some(item=>item.name==='Trompete')"));
 ui.run("location.hash='#partituras';filters.instrument='Trompete';render()");assert(ui.elements.get('#song-grid').innerHTML.includes('Caminho de Fé'));
 ui.elements.get('#global-search').oninput({target:{value:'caminho'}});assert.equal(ui.run('page'),'acervo');assert.equal(ui.run('filters.material'),'partitura');assert.equal(ui.run('filters.instrument'),'Trompete');assert.equal(ui.run('catalogueSongs().length'),1);
 ui.run("filters.instrument='Piano';updateCatalogue()");assert.equal(ui.run('catalogueSongs().length'),0);
});
test('associação valida instrumento, arquivo e permissão sem modificar dados ao rejeitar',async()=>{
 const ui=await app(),before=ui.run('JSON.stringify(state)');
 await assert.rejects(ui.run("attachScore({songId:'missing',instrument:'Bateria',label:'Teste',url:'https://example.com/a.pdf'})"));
 await assert.rejects(ui.run("attachScore({songId:'caminho',instrument:'Bateria',label:'Teste'},{size:40000000,name:'grande.pdf'})"));
 await assert.rejects(ui.run("attachScore({songId:'caminho',instrument:'Bateria',label:'Teste'},{size:10,name:'a.exe'})"));
 ui.run("authenticatedUser={role:'viewer'}");await assert.rejects(ui.run("attachScore({songId:'caminho',instrument:'Bateria',label:'Teste',url:'https://example.com/a.pdf'})"));
 assert.equal(ui.run('JSON.stringify(state)'),before);
});
test('repertório oferece partituras em sua ordem e retorna sem alterar entradas ou tons',async()=>{
 const ui=await app();ui.run("state.songs[0].resources.push({id:'drums',type:'partitura',instrument:'Bateria',label:'Bateria.pdf',url:'https://example.com/bateria.pdf'});location.hash='#ensaio';render()");
 const html=ui.elements.get('#main').innerHTML,before=ui.run('JSON.stringify(department().repertoire)');assert(html.includes('data-resource="drums"'));assert(html.includes('Bateria.pdf · Bateria'));assert(html.indexOf('Caminho de Fé')<html.indexOf('Tua Luz Nos Guia'));
 ui.run('closeScorePdf(true)');assert.equal(ui.run('page'),'repertorio');assert.equal(ui.run('JSON.stringify(department().repertoire)'),before);
});
test('leitor reutiliza PDF existente, ajusta largura, aplica zoom e mantém limites de páginas',async()=>{
 const {ui,rendered,destroyed}=await reader(),before=ui.run('JSON.stringify(state)');
 await ui.run("openPdfFile(testFile,'caminho',{id:'drums',type:'partitura',instrument:'Bateria',label:'Bateria.pdf'},{repertoire:true})");
 assert(ui.elements.get('#pdf-reader').classList.contains('score-reader'));assert.equal(ui.run('pdfSession.score'),true);assert.equal(rendered.at(-1).width,600);
 assert.equal(node(ui,'#pdf-reader .pdf-review').hidden,true);assert(node(ui,'#pdf-reader .pdf-page-tools').innerHTML.includes('Voltar ao repertório'));
 await ui.click('score-zoom',null,{factor:'1.25'});await ui.run('renderPdfPage()');assert.equal(rendered.at(-1).width,750);
 await ui.click('score-fit');await ui.run('renderPdfPage()');assert.equal(rendered.at(-1).width,600);
 await ui.click('pdf-page',null,{direction:'1'});await ui.run('renderPdfPage()');assert.equal(ui.run('pdfSession.page'),2);
 await ui.click('pdf-page',null,{direction:'10'});await ui.run('renderPdfPage()');assert.equal(ui.run('pdfSession.page'),3);assert(node(ui,'#pdf-reader [data-action="pdf-page"][data-direction="1"]').disabled);
 await ui.click('pdf-page',null,{direction:'-10'});await ui.run('renderPdfPage()');assert.equal(ui.run('pdfSession.page'),1);assert(node(ui,'#pdf-reader [data-action="pdf-page"][data-direction="-1"]').disabled);
 assert.equal(ui.run('JSON.stringify(state)'),before);await ui.click('pdf-close');assert.equal(ui.run('pdfSession'),null);assert.equal(destroyed.length,1);
});
test('leitura de cifras PDF preserva formulário e modo anterior; falhas de página e tela cheia são controladas',async()=>{
 const {ui}=await reader();await ui.run("openPdfFile(testFile,'caminho')");assert.equal(ui.run('pdfSession.score'),false);assert(!ui.elements.get('#pdf-reader').classList.contains('score-reader'));
 ui.run("pdfSession.document.getPage=async()=>{throw Error('PDF danificado')}");await ui.run('renderPdfPage()');assert(node(ui,'#pdf-reader .pdf-status').textContent.includes('Não foi possível exibir'));
 await ui.run('scoreFullscreen()');assert(ui.elements.get('#toast').textContent.includes('não disponível'));
});
test('cancelar carregamento remoto impede abertura tardia; erro de rede permanece visível no leitor',async()=>{
 const ui=await app();ui.run("state.songs[0].resources.push({id:'pdf-score',type:'partitura',instrument:'Bateria',label:'Bateria.pdf',url:'https://example.com/bateria.pdf'})");
 let resolve;ui.context.fetch=()=>new Promise(done=>{resolve=done;});
 const pending=ui.run("openPdfResource('caminho','pdf-score')");assert(ui.elements.get('#pdf-reader').open);ui.run('closeScorePdf()');resolve({ok:true,blob:async()=>({})});await pending;assert(!ui.elements.get('#pdf-reader').open);assert.equal(ui.run('pdfSession'),null);
 ui.context.fetch=async()=>{throw Error('Falha de rede');};await ui.run("openPdfResource('caminho','pdf-score')");assert(node(ui,'#pdf-reader .pdf-status').textContent.includes('Falha de rede'));
});
test('estilos das partituras e versão compilada são válidos',()=>{for(const file of ['src/scores.css','dist/styles.css'])assert.equal(esbuild.transformSync(fs.readFileSync(file,'utf8'),{loader:'css',logLevel:'silent'}).warnings.length,0);});

test('upload utiliza armazenamento existente e formulário coleta dados antes de desabilitar controles',async()=>{
 const ui=await app(),count=ui.run('state.songs.length');let received;
 ui.context.uploadMock=async(file,progress)=>{received=file;progress(100);return {storage:'local',fileId:'score-test',url:''};};
 ui.run('saveUploadedFile=uploadMock');await ui.click('score-attach','caminho');
 const dialog=node(ui,'#score-attachment'),form=node(ui,'#score-attachment-form'),input={disabled:false};form.querySelectorAll=()=>[input];
 const file={name:'piano.pdf',size:100};const values={songId:'caminho',instrument:'Piano',label:'Piano do ensaio',url:'',file};
 ui.context.FormData=class{constructor(){assert.equal(input.disabled,false);return new Map(Object.entries(values));}};
 await form.onsubmit({preventDefault(){},target:form});
 assert.equal(received,file);assert.equal(ui.run('state.songs.length'),count);assert.equal(ui.run('state.songs[0].resources.at(-1).storage'),'local');assert.equal(ui.run('state.songs[0].resources.at(-1).fileId'),'score-test');assert(!dialog.open);assert.equal(input.disabled,false);
});

test('tela cheia quando disponível entra e sai sem gravar no acervo',async()=>{
 const {ui}=await reader();await ui.run("openPdfFile(testFile,'caminho',{type:'partitura',instrument:'Piano',label:'piano.pdf'})");
 const dialog=node(ui,'#pdf-reader'),before=ui.run('JSON.stringify(state)');let enters=0,exits=0;
 ui.context.document.fullscreenEnabled=true;ui.context.document.documentElement.requestFullscreen=()=>{};
 dialog.requestFullscreen=async()=>{enters++;ui.context.document.fullscreenElement=dialog;};
 ui.context.document.exitFullscreen=async()=>{exits++;ui.context.document.fullscreenElement=null;};
 assert(ui.run('scoreReaderControls({})').includes('Tela cheia'));await ui.run('scoreFullscreen()');assert.equal(enters,1);await ui.run('scoreFullscreen()');assert.equal(exits,1);assert.equal(ui.run('JSON.stringify(state)'),before);
});

test('renderizações concorrentes descartam páginas antigas antes de usar o canvas',async()=>{
 const {ui,rendered}=await reader();await ui.run("openPdfFile(testFile,'caminho',{type:'partitura',instrument:'Voz',label:'voz.pdf'})");
 let resolve;ui.context.nextPage=()=>new Promise(done=>{resolve=done;});ui.run('pdfSession.document.getPage=nextPage');
 const first=ui.run('renderPdfPage()');await new Promise(done=>setImmediate(done));
 const lateResolve=resolve;ui.run('pdfSession.page=2');const second=ui.run('renderPdfPage()');await new Promise(done=>setImmediate(done));
 const fakePage={getViewport:({scale})=>({width:600*scale,height:800*scale}),render:()=>({promise:Promise.resolve(),cancel(){}})};
 resolve(fakePage);await second;const label=node(ui,'#pdf-page-label').textContent;lateResolve(fakePage);await first;
 assert.equal(label,'2 / 3');assert.equal(node(ui,'#pdf-page-label').textContent,label);assert.equal(rendered.length,1);
});
