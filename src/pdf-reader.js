const PdfCifra=(()=>{
 function lines(items){
  const rows=[];for(const item of items){if(!item.str?.trim()||!item.transform)continue;const x=item.transform[4],y=item.transform[5],height=Math.abs(item.height||item.transform[3]||10);let row=rows.find(row=>Math.abs(row.y-y)<=Math.max(2,Math.min(row.height,height)*.25));if(!row){row={y,height,items:[]};rows.push(row);}row.items.push({...item,x});}
  return rows.sort((a,b)=>b.y-a.y).map(row=>{row.items.sort((a,b)=>a.x-b.x);const units=row.items.map(item=>item.width/Math.max(1,item.str.length)).filter(value=>value>1).sort((a,b)=>a-b);const unit=units[Math.floor(units.length/2)]||5;let result='',end=row.items[0].x;for(const item of row.items){const gap=Math.max(0,item.x-end);result+=' '.repeat(Math.min(120,Math.round(gap/unit)))+item.str;end=item.x+(item.width||item.str.length*unit);}return result.trimEnd();}).join('\n');
 }
 function inspect(text){const chords=[];for(const line of text.split('\n')){const tokens=line.replace(/^\s*\[(?:Intro|Introdução|Refrão|Verso|Ponte|Final|Primeira Parte|Segunda Parte)\]\s*/i,'').split(/[\s|]+/).filter(Boolean);if(tokens.length&&tokens.every(token=>MusicTranspose.isChord(token)||/^[:%()-]+$/.test(token)))chords.push(...tokens.filter(token=>MusicTranspose.isChord(token)));for(const match of line.matchAll(/\[([^\]]+)\]/g))if(MusicTranspose.isChord(match[1]))chords.push(match[1]);}const explicit=text.match(/(?:tom|tonalidade)\s*:\s*([A-G][#b]?m?)(?=\s|$)/i);return {count:chords.length,key:explicit?.[1]||null};}
 return {lines,inspect};
})();
let pdfLibraryPromise=null,pdfSession=null,pdfGeneration=0;
function loadPdfLibrary(){
 if(pdfLibraryPromise)return pdfLibraryPromise;
 const script=src=>new Promise((resolve,reject)=>{const element=document.createElement('script');element.src=src;element.onload=resolve;element.onerror=()=>reject(Error('Não foi possível carregar o leitor de PDF.'));document.head.append(element);});
 pdfLibraryPromise=(async()=>{await script('assets/pdf/pdf.worker.js');await script('assets/pdf/pdf.js');return window.pdfjsLib;})().catch(error=>{pdfLibraryPromise=null;throw error;});return pdfLibraryPromise;
}
function pdfDialog(){let dialog=$('#pdf-reader');if(!dialog){dialog=document.createElement('dialog');dialog.id='pdf-reader';dialog.className='pdf-reader';dialog.setAttribute('aria-labelledby','pdf-reader-title');document.body.append(dialog);dialog.addEventListener('close',()=>{if(dialog.open)return;pdfGeneration++;const session=pdfSession;pdfSession=null;session?.renderTask?.cancel();session?.document?.loadingTask.destroy().catch(()=>{});});}return dialog;}
function pdfImportButton(song){return isAdmin()?button('Importar PDF e preparar cifra','pdf-import','data-song="'+esc(song?.id||'')+'"',true,'file'):'';}
function choosePdf(songId=''){
 const input=document.createElement('input');input.type='file';input.accept='.pdf,application/pdf';input.onchange=()=>{if(input.files?.[0])openPdfFile(input.files[0],songId);};input.click();
}
async function openPdfResource(songId,resourceId){
 const song=state.songs.find(item=>item.id===songId);if(!song)return;
 const resource=Object.values(sections).flatMap(section=>materialResources(song,section.type)).find(item=>item.id===resourceId);if(!resource)return;
 const options={score:resource.type==='partitura',repertoire:page==='repertorio',trigger:document.activeElement};
 const dialog=pdfDialog();releaseScorePdf();if(dialog.open)dialog.close();const generation=++pdfGeneration;
 dialog.innerHTML='<header class="reader-header"><h2>Carregando '+esc(resource.label)+'</h2>'+button('Voltar','pdf-close','',true)+'</header><p class="pdf-status" role="status">Buscando o arquivo PDF…</p>';dialog.showModal();
 try{let file;if(resource.storage==='local')file=await localFileRead(resource.fileId);else{const response=await fetch(validURL(resource.url));if(!response.ok)throw Error('Não foi possível ler o PDF.');file=await response.blob();}if(generation!==pdfGeneration)return;if(!file)throw Error('PDF não encontrado neste navegador.');await openPdfFile(file,songId,resource,options);}catch(error){if(generation===pdfGeneration)dialog.querySelector('.pdf-status').textContent=error.message+' Para links externos, confirme a permissão de leitura pelo aplicativo (CORS) ou envie o PDF pelo cadastro de partituras.';}
}
async function openPdfFile(file,songId='',existingResource=null,options={}){
 const dialog=pdfDialog();if(dialog.open)closeScorePdf();const generation=++pdfGeneration;
 const song=state.songs.find(item=>item.id===songId),score=Boolean(options.score||existingResource?.type==='partitura');
 dialog.classList.toggle('score-reader',score);
 dialog.innerHTML='<header class="reader-header"><div><span class="eyebrow">LEITOR DE PDF</span><h2 id="pdf-reader-title">'+esc(song?.name||file.name||'Importar cifra')+'</h2></div>'+button('Voltar','pdf-close','',true)+'</header><div class="pdf-status" role="status">Abrindo PDF…</div><div class="pdf-workspace" hidden><section class="pdf-original"><div class="pdf-page-tools">'+button('← Página','pdf-page','data-direction="-1"',true)+'<span id="pdf-page-label"></span>'+button('Página →','pdf-page','data-direction="1"',true)+'</div><div class="pdf-canvas-scroll"><canvas id="pdf-canvas" aria-label="Página original do PDF"></canvas></div></section><section class="pdf-review"><h3>Preparar cifra para mudar o tom</h3><p>Confira o texto extraído e selecione o tom dos acordes. O PDF original será preservado.</p><form id="pdf-cifra-form"><label>Nome da música<input name="name" value="'+esc(song?.name||file.name?.replace(/\.pdf$/i,'')||'')+'" maxlength="200" required></label><label>Tom da cifra<select name="key">'+keys.map(key=>'<option '+(key===(song?.key||'C')?'selected':'')+'>'+esc(key)+'</option>').join('')+'</select></label><label>Cifra extraída<textarea id="pdf-extracted-text" name="chords" maxlength="20000" rows="16" placeholder="O texto extraído aparecerá aqui. Você pode corrigir acordes e letras antes de usar."></textarea></label><p id="pdf-extraction-hint" role="status"></p><p id="pdf-save-status" role="alert"></p>'+button('Extrair / preparar cifra','pdf-extract','',true)+(isAdmin()?'<button class="button" type="submit">Salvar e acompanhar</button>':'<button class="button" type="submit">Acompanhar sem salvar</button>')+'</form></section></div>';dialog.showModal();
 if(score){dialog.querySelector('.pdf-review').hidden=true;dialog.querySelector('.pdf-page-tools').insertAdjacentHTML('beforeend',scoreReaderControls(options));$('#pdf-reader-title').textContent=(song?.name||file.name||'Partitura')+' · '+(existingResource?.instrument||'Geral')+' · '+(existingResource?.label||'PDF');}
 try{
  if(file.size>30*1024*1024)throw Error('Escolha um PDF de até 30 MB para ler no aplicativo.');
  const library=await loadPdfLibrary();const document=await library.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false,useSystemFonts:true}).promise;
  if(generation!==pdfGeneration){await document.loadingTask.destroy();return;}
  pdfSession={document,file,songId,existingResource,page:1,extracted:false,renderTask:null,generation,busy:false,score,zoom:1,fitWidth:score,renderVersion:0,options};
  dialog.querySelector('.pdf-status').textContent=score?'Partitura pronta para leitura.':'Leia o original e toque em Extrair / preparar cifra.';dialog.querySelector('.pdf-workspace').hidden=false;
  $('#pdf-cifra-form').onsubmit=savePdfCifra;
  await renderPdfPage();
 }catch(error){if(generation===pdfGeneration)dialog.querySelector('.pdf-status').textContent=error.name==='PasswordException'?'Este PDF está protegido por senha. Importe uma cópia desbloqueada.':error.message;}
}
async function renderPdfPage(){
 const session=pdfSession;if(!session)return;const version=session.renderVersion=(session.renderVersion||0)+1;
 const previous=session.renderTask;previous?.cancel();try{await previous?.promise;}catch{}
 if(pdfSession!==session||version!==session.renderVersion)return;
 const status=$('#pdf-reader').querySelector('.pdf-status');status.textContent='Carregando página '+session.page+'…';
 try{
  const pageNumber=session.page,page=await session.document.getPage(pageNumber);if(pdfSession!==session||version!==session.renderVersion)return;
  const canvas=$('#pdf-canvas'),container=$('#pdf-reader').querySelector('.pdf-canvas-scroll'),base=page.getViewport({scale:1});
  const width=Math.max(200,(container.clientWidth||800)-24),scale=Math.min(4,Math.max(.2,(session.fitWidth?width/base.width:1.35)*(session.zoom||1)));
  const viewport=page.getViewport({scale});canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
  $('#pdf-page-label').textContent=pageNumber+' / '+session.document.numPages;
  if(session.score){$('#score-zoom-label').textContent=Math.round(scale*100)+'%';$('#pdf-reader').querySelector('[data-action="score-fit"]').setAttribute('aria-pressed',String(session.fitWidth&&session.zoom===1));}
  for(const direction of [-1,1])$('#pdf-reader').querySelector('[data-action="pdf-page"][data-direction="'+direction+'"]').disabled=direction<0?pageNumber===1:pageNumber===session.document.numPages;
  const task=page.render({canvasContext:canvas.getContext('2d'),viewport});session.renderTask=task;await task.promise;
  if(pdfSession===session&&version===session.renderVersion){status.textContent='Página '+pageNumber+' de '+session.document.numPages;container.scrollTop=0;}
 }catch(error){if(pdfSession===session&&version===session.renderVersion&&error.name!=='RenderingCancelledException')status.textContent='Não foi possível exibir a página. Tente outra página ou reabra o PDF.';}
}
async function extractPdfCifra(){
 const session=pdfSession;if(!session||session.busy)return;
 if(session.document.numPages>100){$('#pdf-extraction-hint').textContent='Escolha um PDF com até 100 páginas para extrair a cifra.';return;}
 session.busy=true;const pages=[];
 try{for(let index=1;index<=session.document.numPages;index++){if(pdfSession!==session)return;$('#pdf-extraction-hint').textContent='Extraindo página '+index+' de '+session.document.numPages+'…';const page=await session.document.getPage(index),content=await page.getTextContent();pages.push(PdfCifra.lines(content.items));}
  if(pdfSession!==session)return;const text=pages.join('\n\n');$('#pdf-extracted-text').value=text;session.extracted=true;const result=PdfCifra.inspect(text);
  if(result.key&&keys.includes(result.key))$('#pdf-cifra-form').querySelector('[name=key]').value=result.key;
  $('#pdf-extraction-hint').textContent=!text.trim()?'Este PDF não contém texto selecionável. A leitura de fotos e PDFs escaneados precisa de OCR, que ainda não está disponível. Você pode inserir a cifra no campo acima.':!result.count?'Texto extraído, mas não identifiquei linhas de acordes. Confira se o arquivo é uma cifra; notas no pentagrama não são convertidas.':result.count+' acordes identificados. Confira o texto e o tom antes de acompanhar.';
  if(text.length>20000)$('#pdf-extraction-hint').textContent+=' O texto excede 20.000 caracteres. Reduza para a música que deseja salvar.';
 }catch(error){if(pdfSession===session)$('#pdf-extraction-hint').textContent='Não foi possível extrair: '+error.message;}finally{session.busy=false;}
}
async function savePdfCifra(event){
 event.preventDefault();const session=pdfSession;if(!session||session.busy)return;const values=new FormData(event.target),name=String(values.get('name')).trim(),chords=String(values.get('chords')).trim(),key=String(values.get('key'));
 if(!name||!chords||chords.length>20000){$('#pdf-save-status').textContent='Informe o nome e uma cifra de até 20.000 caracteres.';return;}
 if(!PdfCifra.inspect(chords).count){$('#pdf-save-status').textContent='Não identifiquei acordes para transpor. Use linhas como C G Am F ou acordes entre colchetes, como [C].';return;}
 if(isAdmin()&&!confirm('Salvar a cifra preparada nesta música? Confira o texto e o tom. A cifra existente será substituída somente após esta confirmação. O PDF e a letra separada serão preservados.'))return;
 session.busy=true;const submit=event.target.querySelector('[type=submit]');submit.disabled=true;
 try{
  let song=state.songs.find(item=>item.id===session.songId);
  if(isAdmin()){
   const next=structuredClone(state);song=next.songs.find(item=>item.id===session.songId);
   if(!song){song={id:uid(),name,artist:'',key,originalKey:key,bpm:80,category:'',lyrics:'',chords:'',notes:'',scoreLink:'',gradeLink:'',projectionLink:'',voicesLink:'',videoLink:'',audioLink:'',pdfLink:'',departmentIds:[state.departments[0].id],resources:[]};next.songs.push(song);}
   if(!session.existingResource){const file=session.file.name?session.file:new File([session.file],name+'.pdf',{type:'application/pdf'});const info=await saveUploadedFile(file,progress=>{$('#pdf-save-status').textContent='Guardando PDF… '+progress+'%';});song.resources.push({id:uid(),type:'cifra',instrument:'Geral',label:file.name,...info});}
   song.name=name;song.key=key;song.chords=chords;if(!await persist(next))return;currentSong=state.songs.find(item=>item.id===song.id);
  }else currentSong={...(song||{id:'pdf-consulta',artist:''}),name,key,chords};
  $('#pdf-reader').close();transposeSongId=currentSong.id;transposeSteps=0;currentTab='cifra';if(isAdmin()){location.hash='#cifras';render();if($('#detail').open)detail();}openCifraReader();
 }catch(error){$('#pdf-save-status').textContent=error.message;}finally{session.busy=false;submit.disabled=false;}
}
document.addEventListener('click',event=>{const target=event.target.closest('[data-action]');if(!target)return;const action=target.dataset.action;if(action==='pdf-import')choosePdf(target.dataset.song);if(action==='pdf-open')openPdfResource(target.dataset.song,target.dataset.resource);if(action==='pdf-close')closeScorePdf();if(action==='pdf-extract')extractPdfCifra();if(action==='pdf-page'&&pdfSession){pdfSession.page=Math.max(1,Math.min(pdfSession.document.numPages,pdfSession.page+Number(target.dataset.direction)));renderPdfPage();}});
function scoreReaderControls(options={}){return button('− Zoom','score-zoom','data-factor="0.8" aria-label="Reduzir partitura"',true)+'<output id="score-zoom-label" aria-live="polite"></output>'+button('+ Zoom','score-zoom','data-factor="1.25" aria-label="Ampliar partitura"',true)+button('Ajustar à largura','score-fit','aria-pressed="true"',true)+((document.fullscreenEnabled&&document.documentElement.requestFullscreen)?button('Tela cheia','score-fullscreen','',true):'')+(options.repertoire?button('Voltar ao repertório','score-return','',true):'');}
function releaseScorePdf(){pdfGeneration++;const session=pdfSession;pdfSession=null;session?.renderTask?.cancel();session?.document?.loadingTask.destroy().catch(()=>{});return session;}
function closeScorePdf(repertoire=false){
 const session=releaseScorePdf(),dialog=$('#pdf-reader');dialog.close();
 if(document.fullscreenElement===dialog)document.exitFullscreen?.().catch(()=>{});
 if(repertoire){if($('#detail').open)$('#detail').close();location.hash='#repertorio';render();}
 session?.options?.trigger?.focus?.();
}
async function scoreFullscreen(){try{const dialog=$('#pdf-reader');if(document.fullscreenElement)await document.exitFullscreen();else if(dialog.requestFullscreen)await dialog.requestFullscreen();else toast('Tela cheia não disponível neste navegador.');}catch{toast('Não foi possível ativar a tela cheia neste navegador.');}}
