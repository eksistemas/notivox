const MusicTranspose=(()=>{
 const sharp=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'],flat=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
 const pitch={C:0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,Fb:4,'E#':5,F:5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11,Cb:11,'B#':0};
 function parseChord(value){if(typeof value!=='string'||value.length>128)return null;const normalized=value.replace(/♯/g,'#').replace(/♭/g,'b'),match=normalized.match(/^([A-G][#b]?)(.*?)(?:\/([A-G][#b]?))?$/);if(!match)return null;const suffix=match[2],token=/(?:maj|min|dim|aug|sus|add|omit|no|alt|dom|m|M|Δ|ø|°|º|\+|-|\d+|[#b]\d+|\/\d+|[(),]|\/(?=[#b\d]))/y;let index=0,depth=0;while(index<suffix.length){token.lastIndex=index;const part=token.exec(suffix);if(!part)return null;if(part[0]==='(')depth++;if(part[0]===')')depth--;if(depth<0||depth>8)return null;index=token.lastIndex;}if(depth)return null;return {root:match[1],bass:match[3]};}
 const pattern={test:value=>Boolean(parseChord(value))};
 function note(value,steps,flats){return (flats?flat:sharp)[((pitch[value]+steps)%12+12)%12];}
 function chord(value,steps,flats=false){const match=parseChord(value);if(!match||steps%12===0)return value;const {root,bass}=match;let result=note(root,steps,flats)+value.slice(root.length);if(bass)result=result.slice(0,-bass.length)+note(bass,steps,flats);return result;}
 function text(value,steps,flats=false){return value.split('\n').map(line=>{
  const label=line.match(/^(\s*(?:\[(?:Intro|Introdução|Estrofe|Pr[eé]-Refr[aã]o|Refrão|Verso|Ponte|Final|Primeira Parte|Segunda Parte)\]|(?:Intro|Introdução|Estrofe|Pr[eé]-Refr[aã]o|Refrão|Verso|Ponte|Final)\s*:)\s*)(.*)$/i);if(label)return label[1]+text(label[2],steps,flats);
  if(line.includes('['))return line.replace(/\[([^\]]+)\]/g,(all,item)=>pattern.test(item)?'['+chord(item,steps,flats)+']':all);
  return line.split('|').map(part=>{const tokens=part.trim().split(/\s+/).filter(Boolean);if(!tokens.length||!tokens.every(token=>pattern.test(token)||/^[():%–—-]+$/.test(token)))return part;return part.replace(/\S+/g,token=>chord(token,steps,flats));}).join('|');
 }).join('\n');}
 return {chord,text,note,isChord:value=>pattern.test(value)};
})();
let transposeSongId=null,transposeSteps=0,cifraFontSize=24;
function cifraToneControls(song){
 const key=MusicTranspose.chord(song.key,transposeSteps,readerToneFlats(song));
 const disabled=song.chords.trim()?'':'disabled';
 return button('− 1 tom','transpose','data-steps="-2" '+disabled,true)+button('− ½ tom','transpose','data-steps="-1" '+disabled,true)+'<strong role="status" aria-live="polite">Tom: '+esc(key)+'</strong>'+button('+ ½ tom','transpose','data-steps="1" '+disabled,true)+button('+ 1 tom','transpose','data-steps="2" '+disabled,true)+button('Tom original','transpose-reset',disabled,true);
}
function updateCifraReader(){
 const dialog=$('#cifra-reader');if(!dialog?.open)return;
 dialog.querySelector('#reader-title').textContent=currentSong.name;
 const repertoire=dialog.querySelector('.reader-repertoire');if(repertoire){repertoire.innerHTML=readerRepertoireControls();repertoire.hidden=!repertoire.innerHTML;}
 dialog.querySelector('.reader-tone').innerHTML=cifraToneControls(currentSong);
 const sheet=dialog.querySelector('.reader-sheet');sheet.innerHTML=currentSong.chords.trim()?renderReaderSheet(currentSong):'<div class="reader-missing">'+empty('Cifra em texto ainda não cadastrada')+button('Abrir materiais da música','cifra-resources','',true,'folder')+'</div>';sheet.style.fontSize=cifraFontSize+'px';dialog.querySelectorAll('[data-action="cifra-mode"]').forEach(control=>{control.setAttribute('aria-pressed',String(control.dataset.mode===readerMode));});
 dialog.querySelector('.reader-font-size').textContent=cifraFontSize+' px';
 updateReaderFocus();
 updateReaderWidth(dialog);
 const printMeta=dialog.querySelector('.reader-print-meta');if(printMeta)printMeta.textContent=(currentSong.artist?currentSong.artist+' · ':'')+'Tom: '+MusicTranspose.chord(currentSong.key,transposeSteps,readerToneFlats(currentSong));
}
function openCifraReader(){
 if(!currentSong||(!currentSong.chords.trim()&&!readerRepertoireContext)){toast('Cadastre a cifra em texto para acompanhar e alterar o tom.');return;}
 if(transposeSongId!==currentSong.id){stopCifraScroll();transposeSongId=currentSong.id;transposeSteps=0;}
 let dialog=$('#cifra-reader');
 if(!dialog){dialog=document.createElement('dialog');dialog.id='cifra-reader';dialog.className='cifra-reader';dialog.setAttribute('aria-labelledby','reader-title');document.body.append(dialog);
  dialog.addEventListener('close',()=>{stopCifraScroll();if(currentSong&&$('#detail').open){detail();$('#detail-content').querySelector('[data-action="cifra-reader"]')?.focus();}});
 }
 if(!dialog.open){dialog.innerHTML='<header class="reader-header"><div class="reader-title-row"><h2 id="reader-title" tabindex="-1" aria-live="polite">'+esc(currentSong.name)+'</h2><span class="reader-current-key key" role="status"></span><span class="reader-compact-scroll">'+button('Iniciar rolagem','cifra-scroll','aria-pressed="false"',true)+'</span>'+button('Modo músico','cifra-focus','aria-controls="reader-toolbar" aria-expanded="true" aria-pressed="false"',true)+button('Imprimir','cifra-print','',true,'file')+button('Voltar','cifra-reader-close','',true)+'</div><p class="reader-print-meta"></p><div class="reader-repertoire" role="group" aria-label="Navegação do repertório"></div><div class="reader-toolbar" id="reader-toolbar" role="group" aria-label="Ajustes da leitura"><div class="reader-tone transpose-toolbar" role="group" aria-label="Transposição"></div><div class="reader-font-controls" role="group" aria-label="Tamanho da letra">'+button('A−','cifra-font','data-size="-2" aria-label="Diminuir letra"',true)+'<span class="reader-font-size" role="status"></span>'+button('A+','cifra-font','data-size="2" aria-label="Aumentar letra"',true)+'</div><div class="reader-mode-controls" role="group" aria-label="Visualização da cifra">'+button('Cifra completa','cifra-mode','data-mode="complete" aria-pressed="true"',true)+button('Mapa de acordes','cifra-mode','data-mode="map" aria-pressed="false"',true)+'</div><label class="reader-width-control">Largura<select id="reader-width"><option value="narrow">Estreita</option><option value="standard">Padrão</option><option value="wide">Ampla</option><option value="full">Tela toda</option></select></label><div class="reader-scroll-controls">'+button('Iniciar rolagem','cifra-scroll','aria-pressed="false"',true,'play')+'<label class="scroll-speed">Velocidade<input id="reader-scroll-speed" type="range" min="5" max="80" value="24" step="1" aria-label="Velocidade de rolagem"><output id="reader-scroll-rate">24 px/s</output></label></div></div></header><div class="reader-scroll" tabindex="0" aria-label="Cifra para acompanhar"><div class="reader-sheet chord-sheet" aria-label="Conteúdo da cifra"></div></div>';dialog.showModal();}
 updateCifraReader();
 const speed=dialog.querySelector('#reader-scroll-speed');if(speed){speed.value=readerAutoScroll?.speed||24;dialog.querySelector('#reader-scroll-rate').textContent=speed.value+' px/s';speed.oninput=event=>{autoScroller().setSpeed(event.target.value);dialog.querySelector('#reader-scroll-rate').textContent=event.target.value+' px/s';};}scrollState(readerAutoScroll?.running||false);
}
function cifraContent(song){
 if(transposeSongId!==song.id){transposeSongId=song.id;transposeSteps=0;}
 const flats=/b/.test(song.key),key=MusicTranspose.chord(song.key,transposeSteps,flats);
 return pdfImportButton(song)+'<div class="transpose-toolbar" aria-label="Alterar tonalidade">'+cifraToneControls(song)+'</div>'+(song.chords.trim()?'<div class="asset-actions">'+button('Acompanhar em tela ampliada','cifra-reader','',false,'book')+'</div><p class="form-hint">Alterne entre cifra completa e mapa de acordes na tela ampliada. A consulta preserva o cadastro original.</p><div class="chord-sheet sheet-preview">'+(typeof renderFullSongSheet==='function'?renderFullSongSheet(song):renderReaderSheet(song))+'</div>':empty('Importe um PDF para extrair e conferir os acordes, ou cadastre sua cifra em texto.'))+(isAdmin()?button('Editor visual de acordes','song-chord-editor','data-id="'+esc(song.id)+'"',true,'edit'):'')+(isAdmin()?button('Cadastrar / editar cifra','edit','data-kind="songs" data-id="'+esc(song.id)+'"',true,'edit'):'');
}
document.addEventListener('click',event=>{
 const target=event.target.closest('[data-action]');if(!target||!currentSong)return;
 const action=target.dataset.action;
 if(action==='cifra-reader-close'){stopCifraScroll();$('#cifra-reader').close();return;}
 if(action==='cifra-reader'){openCifraReader();return;}
 if(action==='cifra-print'){stopCifraScroll();updateCifraReader();document.body.classList.add('printing-cifra');try{window.print();}finally{document.body.classList.remove('printing-cifra');}return;}
 if(action==='cifra-font'){cifraFontSize=Math.max(16,Math.min(48,cifraFontSize+Number(target.dataset.size)));updateCifraReader();return;}
 if(action==='transpose'||action==='transpose-reset'){
  if(!currentSong.chords.trim())return;
  if(transposeSongId!==currentSong.id){transposeSongId=currentSong.id;transposeSteps=0;}
  transposeSteps=action==='transpose-reset'?0:transposeSteps+Number(target.dataset.steps);
  openCifraReader();
  $('#cifra-reader').querySelector('[data-action="'+action+'"]'+(target.dataset.steps?'[data-steps="'+target.dataset.steps+'"]':''))?.focus();
 }
});

document.addEventListener('click',event=>{if(event.target.closest('[data-action=add-cifra]')&&isAdmin()&&departmentId)edit('songs');});
