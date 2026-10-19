/* Incremental library layer: existing readers, permissions and persistence remain authoritative. */
const SmartLibrary=(()=>{
 const parsed=new WeakMap();
 function modelFor(song){const source=song.chords||'',cached=parsed.get(song);if(cached?.source===source)return cached.model;const model=ChordSheet.parse(source);parsed.set(song,{source,model});return model;}
 const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
 function content(song){
  const model=modelFor(song);
  const chords=model.blocks.some(block=>block.type==='grid'||block.segments?.some(segment=>segment.chord)),lyrics=Boolean((song.lyrics||'').trim()||model.hasLyrics);
  return chords&&lyrics?'complete':chords||lyrics?'partial':'reference';
 }
 function pdf(song){return Boolean(song.pdfLink)||(song.resources||[]).some(resource=>/\.pdf(?:[?#]|$)/i.test(resource.url||'')||/\.pdf$/i.test(resource.label||''))||/\.pdf(?:[?#]|$)/i.test(song.scoreLink||'')||/\.pdf(?:[?#]|$)/i.test(song.gradeLink||'');}
 function matches(song){
  if(filters.key&&song.key!==filters.key&&song.originalKey!==filters.key)return false;
  if(filters.content&&content(song)!==filters.content)return false;
  if(!filters.material)return true;
  if(filters.material==='pdf')return pdf(song);
  return materialResources(song,filters.material).length>0||(filters.material==='cifra'&&Boolean(song.chords.trim()))||(filters.material==='letra'&&Boolean(song.lyrics.trim()||modelFor(song).hasLyrics));
 }
 function duplicates(songs,name,artist){return songs.filter(song=>normalize(song.name)===normalize(name)&&normalize(song.artist)===normalize(artist));}
 function importDraft(source){
  if(typeof source!=='string'||!source.trim())throw Error('Informe a cifra em texto ou ChordPro.');
  if(source.length>20000)throw Error('Use no máximo 20.000 caracteres.');
  if(/^\s*\{(?:new_song|ns)(?:\s*[:}]|\s)/mi.test(source))throw Error('Importe uma música por vez. Separe o documento em músicas.');
  const model=ChordSheet.parse(source),meta=model.metadata||{};
  const first=name=>meta[name]?.[0]||'';
  return {source,name:first('title'),artist:first('artist')||first('subtitle'),key:first('key'),warnings:model.warnings||[]};
 }
 return {normalize,content,pdf,matches,duplicates,importDraft};
})();
function librarySelect(id,label,options,value){return '<label>'+label+'<select id="'+id+'">'+options.map(([key,text])=>'<option value="'+esc(key)+'" '+(key===(value||'')?'selected':'')+'>'+esc(text)+'</option>').join('')+'</select></label>';}
function libraryTools(){return '<div class="smart-library-filters">'+librarySelect('key-filter','Tom da cifra ou original',[['','Todos os tons'],...keys.map(key=>[key,key])],filters.key)+librarySelect('material-filter','Material',[['','Todos os materiais'],['cifra','Com cifra'],['letra','Com letra'],['partitura','Com partitura'],['pdf','Com PDF']],filters.material)+librarySelect('content-filter','Conteúdo em texto',[['','Todos os conteúdos'],['complete','Cifra e letra completas'],['partial','Texto parcial'],['reference','Apenas referências / arquivos']],filters.content)+button('Limpar filtros','library-clear','',true)+'</div>';}
const baseCatalogueSongs=catalogueSongs;
catalogueSongs=function(){return baseCatalogueSongs().filter(SmartLibrary.matches);};
const baseCatalogueView=catalogueView;
catalogueView=function(){return baseCatalogueView().replace('<div class="module-toolbar">',libraryTools()+'<div class="module-toolbar">').replace('<div class="library-actions">','<div class="library-actions">'+(isAdmin()?button('Importar texto / ChordPro','library-import','',true,'download'):''));};
const baseCatalogueCards=catalogueCards;
catalogueCards=function(list){return list.map(song=>{
 const status=SmartLibrary.content(song),label={complete:'Cifra e letra completas',partial:'Texto parcial',reference:'Apenas referências / arquivos'}[status];
 const included=department().repertoire.some(entry=>entry.songId===song.id);
 const action=canManage()?button(included?'Já no repertório':'Adicionar ao repertório','library-repertoire','data-id="'+esc(song.id)+'" '+(included?'disabled':''),true,'list'):'';
 return baseCatalogueCards([song]).replace('<div class="materials">','<p class="library-status '+status+'">'+label+'</p><div class="materials">').replace('</div></article>',action+'</div></article>');
}).join('');};
const baseRenderCatalogue=renderCatalogue;
renderCatalogue=function(){
 baseRenderCatalogue();
 for(const [id,key]of [['key-filter','key'],['material-filter','material'],['content-filter','content']]){const control=$('#'+id);if(control)control.onchange=event=>{filters[key]=event.target.value;cataloguePage=1;updateCatalogue();};}
 const search=$('#global-search');if(search)search.oninput=event=>{filters.query=event.target.value;cataloguePage=1;if(page!=='acervo'&&page!=='partituras'){location.hash='#acervo';render();}else updateCatalogue();};
};
function openLibraryImport(){
 if(!isAdmin()||recording)return;
 let dialog=$('#library-import');if(!dialog){dialog=document.createElement('dialog');dialog.id='library-import';document.body.append(dialog);}
 dialog.innerHTML='<div class="dialog-head"><h2>Importar texto / ChordPro</h2>'+button('Voltar','library-import-close','',true)+'</div><form class="tab-content" id="library-import-form"><p>Importe uma música própria ou conteúdo que você tem autorização para usar. Revise o cadastro antes de salvar.</p><label>Arquivo de texto<input id="library-text-file" type="file" accept=".txt,.cho,.chopro,.chordpro,text/plain"></label><label>Cifra / ChordPro<textarea id="library-text-source" required maxlength="20000" rows="14" spellcheck="false" placeholder="{title: Minha música}&#10;{key: C}&#10;[C]Minha letra"></textarea></label><p id="library-import-error" role="alert"></p><button class="button" type="submit">Revisar cadastro</button></form>';
 dialog.showModal();
 const source=$('#library-text-source'),error=$('#library-import-error');
 $('#library-text-file').onchange=async event=>{try{const file=event.target.files[0];if(!file)return;if(file.size>100000)throw Error('Arquivo muito grande. Limite: 100 KB e 20.000 caracteres.');const text=await file.text();SmartLibrary.importDraft(text);source.value=text;error.textContent='';}catch(problem){error.textContent=problem.message;}};
 $('#library-import-form').onsubmit=event=>{event.preventDefault();try{const draft=SmartLibrary.importDraft(source.value);dialog.close();edit('songs');const form=$('#edit-form');form.querySelector('[name="chords"]').value=draft.source;form.querySelector('[name="name"]').value=draft.name;form.querySelector('[name="artist"]').value=draft.artist;if(keys.includes(draft.key))form.querySelector('[name="key"]').value=draft.key;if(typeof refreshCombinedSongPreview==='function')refreshCombinedSongPreview();toast(draft.warnings.length?'Texto preservado. Revise as diretivas e os dados antes de salvar.':'Revise título, artista, tom e cifra antes de salvar.');}catch(problem){error.textContent=problem.message;}};
}
// Stop accidental duplicate creation without merging or replacing any existing record.
const baseConfirmSongTextChanges=confirmSongTextChanges;
confirmSongTextChanges=function(id,values){
 if(!id&&SmartLibrary.duplicates(state.songs,values.name,values.artist).length){toast('Já existe uma música com este título e artista. Abra o cadastro existente ou diferencie o título para outra versão.');return false;}
 return baseConfirmSongTextChanges(id,values);
};
document.addEventListener('click',async event=>{
 const target=event.target.closest('[data-action]');if(!target)return;
 switch(target.dataset.action){
  case 'library-import':openLibraryImport();break;
  case 'library-import-close':$('#library-import').close();break;
  case 'library-clear':Object.assign(filters,{query:'',category:'',instrument:'',key:'',material:'',content:''});cataloguePage=1;render();break;
  case 'library-repertoire':if(canManage())await mutateRepertoire('add',target.dataset.id);break;
 }
});
