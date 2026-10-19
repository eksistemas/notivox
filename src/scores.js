/* Score workflow uses the existing resource model, uploads, PDF.js and permissions. */
const scoreInstruments=['Bateria','Baixo','Guitarra','Violão','Teclado','Piano','Saxofone','Trompete','Voz'];
function scoreResources(song){return materialResources(song,'partitura');}
function scoreFileButton(resource,songId){
 const pdf=resource.id==='pdfLink'||/\.pdf(?:$|[?#])/i.test(resource.url||'')||/\.pdf$/i.test(resource.label||'');
 return pdf?button(resource.label+' · '+resource.instrument,'pdf-open','data-song="'+esc(songId)+'" data-resource="'+esc(resource.id)+'"',true,'file'):resourceButton(resource,'file',songId);
}
function scoreLinks(song){return '<div class="score-files" aria-label="Partituras de '+esc(song.name)+'">'+scoreResources(song).map(resource=>scoreFileButton(resource,song.id)).join('')+'</div>';}
const scoreBaseRepertoireView=repertoireView;
repertoireView=function(){let index=0;const entries=department().repertoire.filter(entry=>state.songs.some(song=>song.id===entry.songId));return scoreBaseRepertoireView().replace(/<div class="repertoire-notes">/g,match=>{const entry=entries[index++],song=state.songs.find(song=>song.id===entry.songId);return scoreLinks(song)+match;});};
const scoreBaseSectionContent=sectionMaterialContent;
sectionMaterialContent=function(song,section=currentSection()){
 if(section?.type!=='partitura')return scoreBaseSectionContent(song,section);
 const resources=scoreResources(song).filter(resource=>!filters.instrument||resource.instrument===filters.instrument);
 return '<h3>Partituras por instrumento</h3><div class="score-files">'+resources.map(resource=>scoreFileButton(resource,song.id)).join('')+'</div>'+(!resources.length?empty('Nenhuma partitura para este instrumento'):'')+(isAdmin()?button('Associar partitura','score-attach','data-id="'+esc(song.id)+'"',true,'plus'):'');
};
const scoreBaseCatalogueView=catalogueView;
catalogueView=function(){const html=scoreBaseCatalogueView();return page==='partituras'?html.replace('<div class="library-actions">','<div class="library-actions">'+(isAdmin()?button('Associar partitura à música','score-attach','',true,'plus'):'')):html;};
async function attachScore(values,file,onProgress=()=>{}){
 if(!isAdmin())throw Error('Somente administradores podem associar partituras.');
 const songId=String(values.songId||''),instrument=String(values.instrument||'').trim(),label=String(values.label||'').trim();
 if(!state.songs.some(song=>song.id===songId))throw Error('Escolha uma música cadastrada.');
 if(!instrument||instrument.length>100)throw Error('Escolha um instrumento válido.');
 if(!label||label.length>200)throw Error('Informe o nome do material (até 200 caracteres).');
 let info;if(file?.size){if(file.size>30*1024*1024||!(/\.pdf$/i.test(file.name)))throw Error('Escolha um arquivo PDF de até 30 MB.');info=await saveUploadedFile(file,onProgress);}else{const url=validURL(String(values.url||'').trim());if(!url)throw Error('Selecione um PDF ou informe o link.');info={url};}
 const next=structuredClone(state),song=next.songs.find(song=>song.id===songId);if(!song)throw Error('Música não encontrada.');
 if(!next.instruments.some(item=>item.name===instrument))next.instruments.push({id:uid(),name:instrument,kind:instrument==='Voz'?'voice':'instrument'});
 const resource={id:uid(),type:'partitura',instrument,label:label+(/\.pdf$/i.test(label)?'':'.pdf'),...info};song.resources.push(resource);
 if(!await persist(next))return false;return true;
}
function openScoreAttachment(songId=''){
 if(!isAdmin())return;let dialog=$('#score-attachment');if(!dialog){dialog=document.createElement('dialog');dialog.id='score-attachment';document.body.append(dialog);}
 const instruments=[...new Set([...instrumentOptions(),...scoreInstruments])];
 dialog.innerHTML='<div class="dialog-head"><h2>Associar partitura</h2>'+button('Voltar','score-attachment-close','',true)+'</div><form id="score-attachment-form" class="tab-content score-form"><label>Música cadastrada<select name="songId" required><option value="">Escolha uma música</option>'+state.songs.map(song=>'<option value="'+esc(song.id)+'" '+(song.id===songId?'selected':'')+'>'+esc(song.name)+' · '+esc(song.artist)+'</option>').join('')+'</select></label><label>Instrumento / voz<select name="instrument">'+instruments.map(name=>'<option value="'+esc(name)+'">'+esc(name)+'</option>').join('')+'</select></label><label>Nome do material<input name="label" required maxlength="200" placeholder="Ex.: Bateria — versão do ensaio"></label><label>Arquivo PDF (até 30 MB)<input name="file" type="file" accept=".pdf,application/pdf"></label><label>Ou endereço do PDF<input name="url" type="url" placeholder="https://…"></label><p class="form-hint">O arquivo será associado à música escolhida. Os outros materiais serão preservados. Links externos dependem de permissão de leitura do site de origem.</p><p id="score-upload-status" role="status"></p><button class="button" type="submit">Associar partitura</button></form>';
 dialog.showModal();let sending=false;dialog.oncancel=event=>{if(sending)event.preventDefault();};
 $('#score-attachment-form').onsubmit=async event=>{event.preventDefault();if(sending)return;sending=true;const data=new FormData(event.target),controls=[...event.target.querySelectorAll('input,select,button')],back=dialog.querySelector('[data-action="score-attachment-close"]');controls.forEach(item=>item.disabled=true);back.disabled=true;
 try{if(await attachScore(Object.fromEntries(data),data.get('file'),percent=>{$('#score-upload-status').textContent='Enviando PDF… '+percent+'%';})){dialog.close();render();if($('#detail').open){currentSong=state.songs.find(song=>song.id===currentSong?.id);detail();}toast('Partitura associada.');}else $('#score-upload-status').textContent='Não foi possível salvar. Confira sua conexão e tente novamente.';}catch(error){$('#score-upload-status').textContent=error.message;}finally{sending=false;back.disabled=false;controls.forEach(item=>item.disabled=false);}};
}
document.addEventListener('click',event=>{const target=event.target.closest('[data-action]');if(!target)return;
 if(target.dataset.action==='score-attach')openScoreAttachment(target.dataset.id);
 if(target.dataset.action==='score-attachment-close')$('#score-attachment').close();
 if(target.dataset.action==='score-return')closeScorePdf(true);
 if(target.dataset.action==='score-fullscreen')scoreFullscreen();
 if(target.dataset.action==='score-fit'&&pdfSession){pdfSession.fitWidth=true;pdfSession.zoom=1;renderPdfPage();}
 if(target.dataset.action==='score-zoom'&&pdfSession){const factor=Number(target.dataset.factor);if(![.8,1.25].includes(factor))return;pdfSession.zoom=Math.max(.25,Math.min(4,pdfSession.zoom*factor));renderPdfPage();}
});
window.addEventListener('resize',()=>{if(pdfSession?.score&&pdfSession.fitWidth)renderPdfPage();});
