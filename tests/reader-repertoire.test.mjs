import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function reader(){
 const handlers=new Map(),nodes=new Map(),notices=[],classes=new Set(),seen=[];
 const node=key=>{if(!nodes.has(key))nodes.set(key,{innerHTML:'',textContent:'',style:{},value:'',scrollTop:100,disabled:false,attributes:{},focus(){this.focused=true;},setAttribute(name,value){this.attributes[name]=value;}});return nodes.get(key);};
 const dialog={open:false,innerHTML:'',querySelector:node,querySelectorAll:()=>[],classList:{toggle(name,on){if(on)classes.add(name);else classes.delete(name);}},showModal(){this.open=true;},close(){this.open=false;}};
 const songs=[{id:'a',name:'Primeira',artist:'Artista',key:'C',chords:'[C]Palavra [G/B]seguinte',lyrics:'',resources:[]},{id:'b',name:'Segunda',key:'Gm',chords:'[Gm]Menor [D/F#]teste',lyrics:'',resources:[]},{id:'c',name:'Sem cifra',key:'F',chords:'',lyrics:'Letra independente',resources:[{id:'pdf',type:'partitura'}]}];
 const state={songs,departments:[{id:'set',repertoire:[{songId:'b',key:'Bbm'},{songId:'a',key:'Eb'},{songId:'c',key:'F#'}]}]};
 const context=vm.createContext({state,currentSong:songs[0],currentTab:'cifra',localStorage:{getItem:()=>null,setItem(){}},department:()=>state.departments[0],rememberSong:id=>seen.push(id),toast:message=>notices.push(message),esc:value=>String(value??'').replaceAll('<','&lt;').replaceAll('>','&gt;'),button:(label,action,extra='')=>'<button data-action="'+action+'" '+extra+'>'+label+'</button>',empty:message=>'<p>'+message+'</p>',pdfImportButton:()=>'',isAdmin:()=>false,detail(){},document:{body:{classList:{add:name=>classes.add(name),remove:name=>classes.delete(name)}},addEventListener(type,fn){if(!handlers.has(type))handlers.set(type,[]);handlers.get(type).push(fn);}},window:{addEventListener(type,fn){handlers.set('window:'+type,[fn]);},matchMedia:()=>({matches:false})},$:selector=>selector==='#cifra-reader'?dialog:{open:false,querySelector:node}});
 for(const file of ['src/chord-sheet.js','src/auto-scroll.js','src/reader-controls.js','src/transpose.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
 return {context,state,dialog,nodes,classes,seen,notices,run:code=>vm.runInContext(code,context),click(action,extra={}){const target={dataset:{action,...extra}};for(const fn of handlers.get('click')||[])fn({target:{closest:selector=>selector==='[data-action]'?target:null}});},beforePrint(){handlers.get('window:beforeprint')[0]();}};
}

test('leitor segue ordem e tons individuais, incluindo entrada sem cifra, sem alterar cadastro',()=>{
 const ui=reader(),original=JSON.stringify(ui.state);ui.run("setReaderRepertoireContext('a',true);openCifraReader()");
 assert(ui.nodes.get('.reader-tone').innerHTML.includes('Tom: Eb'));assert(ui.nodes.get('.reader-sheet').innerHTML.includes('Eb'));assert(ui.nodes.get('.reader-repertoire').innerHTML.includes('2 / 3'));
 ui.context.mockScroll={running:true,speed:37,stop(){this.running=false;}};ui.run('readerAutoScroll=mockScroll');
 ui.click('cifra-repertoire',{direction:'1'});assert.equal(ui.context.currentSong.id,'c');assert.equal(ui.context.mockScroll.running,false);assert.equal(ui.context.mockScroll.speed,37);assert.equal(ui.nodes.get('.reader-scroll').scrollTop,0);assert(ui.nodes.get('.reader-sheet').innerHTML.includes('Cifra em texto'));assert(ui.nodes.get('.reader-sheet').innerHTML.includes('cifra-resources'));assert.equal(ui.run('moveReaderRepertoire(1)'),false);
 ui.click('cifra-repertoire',{direction:'-1'});assert.equal(ui.context.currentSong.id,'a');assert(ui.nodes.get('.reader-tone').innerHTML.includes('Tom: Eb'));
 ui.click('cifra-repertoire',{direction:'-1'});assert.equal(ui.context.currentSong.id,'b');assert(ui.nodes.get('.reader-tone').innerHTML.includes('Tom: Bbm'));assert(ui.nodes.get('.reader-sheet').innerHTML.includes('Bbm'));assert.equal(ui.run('moveReaderRepertoire(-1)'),false);
 assert.deepEqual(ui.seen,['c','a','b']);assert.equal(JSON.stringify(ui.state),original);
});

test('ajustes temporários de tom são individuais; modo, fonte e largura preservam acordes e palavras',()=>{
 const ui=reader(),original=JSON.stringify(ui.state);ui.run("setReaderRepertoireContext('a',true);openCifraReader()");ui.click('transpose',{steps:'1'});assert(ui.nodes.get('.reader-tone').innerHTML.includes('Tom: E'));
 const complete=ui.nodes.get('.reader-sheet').innerHTML;ui.run("changeReaderWidth('narrow')");assert.equal(ui.nodes.get('.reader-sheet').style.maxWidth,'680px');assert.equal(ui.nodes.get('.reader-sheet').innerHTML,complete);
 ui.click('cifra-font',{size:'2'});assert.equal(ui.nodes.get('.reader-sheet').style.fontSize,'26px');ui.click('cifra-mode',{mode:'map'});assert(ui.nodes.get('.reader-sheet').innerHTML.includes('E  B/Eb'));assert.equal(ui.run('transposeSteps'),4);
 ui.click('cifra-repertoire',{direction:'-1'});assert(ui.nodes.get('.reader-tone').innerHTML.includes('Tom: Bbm'));ui.click('cifra-repertoire',{direction:'1'});assert(ui.nodes.get('.reader-tone').innerHTML.includes('Tom: E'));assert.equal(ui.run('readerMode'),'map');assert.equal(ui.run('cifraFontSize'),26);assert.equal(ui.run('readerWidth'),'narrow');
 ui.click('transpose-reset');assert(ui.nodes.get('.reader-tone').innerHTML.includes('Tom: C'));ui.click('cifra-repertoire-tone');assert(ui.nodes.get('.reader-tone').innerHTML.includes('Tom: Eb'));
 ui.click('cifra-mode',{mode:'complete'});ui.run("changeReaderWidth('full')");assert.equal(ui.nodes.get('.reader-sheet').style.maxWidth,'none');assert(ui.nodes.get('.reader-sheet').innerHTML.includes('Palavra '));ui.run("changeReaderWidth('invalid')");assert.equal(ui.run('readerWidth'),'full');assert.equal(JSON.stringify(ui.state),original);
});

test('modo músico mantém navegação, impressão usa título e tom atuais e pausa rolagem',()=>{
 const ui=reader();ui.run("setReaderRepertoireContext('a',true);openCifraReader()");ui.click('cifra-focus');assert(ui.classes.has('musician-focus'));ui.click('cifra-repertoire',{direction:'-1'});assert.equal(ui.nodes.get('#reader-title').textContent,'Segunda');assert.equal(ui.nodes.get('.reader-current-key').textContent,'Tom: Bbm');assert(ui.classes.has('musician-focus'));
 ui.context.mockScroll={running:true,stop(){this.running=false;}};ui.run('readerAutoScroll=mockScroll');ui.beforePrint();assert.equal(ui.context.mockScroll.running,false);
 let printed=false;ui.context.window.print=()=>{printed=true;assert(ui.classes.has('printing-cifra'));assert.equal(ui.nodes.get('#reader-title').textContent,'Segunda');assert(ui.nodes.get('.reader-print-meta').textContent.includes('Tom: Bbm'));};ui.click('cifra-print');assert(printed);assert(!ui.classes.has('printing-cifra'));
 ui.click('cifra-focus');assert(!ui.classes.has('musician-focus'));assert.equal(ui.nodes.get('[data-action="cifra-focus"]').attributes['aria-expanded'],'true');
});

test('biblioteca mantém tom original; iniciar repertório é explícito e respeita mudanças de ordem',()=>{
 const ui=reader();ui.run('openCifraReader()');assert(ui.nodes.get('.reader-tone').innerHTML.includes('Tom: C'));assert(ui.nodes.get('.reader-repertoire').innerHTML.includes('Tocar repertório'));ui.click('cifra-repertoire-start');assert(ui.nodes.get('.reader-tone').innerHTML.includes('Tom: Eb'));
 ui.state.departments[0].repertoire.reverse();ui.click('cifra-repertoire',{direction:'1'});assert.equal(ui.context.currentSong.id,'b');ui.run("setReaderRepertoireContext('b',false);cifraContent(currentSong);updateCifraReader()");assert(ui.nodes.get('.reader-tone').innerHTML.includes('Tom: Gm'));
 ui.context.currentSong={id:'outside',name:'Fora',key:'C',chords:'C G',lyrics:''};ui.run('openCifraReader()');assert.equal(ui.nodes.get('.reader-repertoire').innerHTML,'');assert.equal(ui.run('moveReaderRepertoire(1)'),false);
});

test('tom maior/menor incompatível informa limite sem modificar a qualidade dos acordes',()=>{
 const ui=reader();ui.state.departments[0].repertoire[1].key='Am';ui.run("setReaderRepertoireContext('a',true);openCifraReader()");assert.equal(ui.run('transposeSteps'),0);assert(ui.notices.some(message=>message.includes('maior e menor')));assert.equal(ui.state.songs[0].key,'C');assert.equal(ui.state.songs[0].chords,'[C]Palavra [G/B]seguinte');
});
