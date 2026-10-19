/* One musical sheet: existing storage fields remain compatible and untouched. */
function songLyricText(song){
 if(song?.lyrics?.trim())return song.lyrics;
 const model=ChordSheet.parse(song?.chords||''),lines=[];
 for(const block of model.blocks){if(block.type==='line')lines.push(block.segments.map(segment=>segment.lyric).join(''));else if(block.type==='lyric')lines.push(block.text);else if((block.type==='space'||block.type==='section')&&lines.length&&lines.at(-1)!=='')lines.push('');}
 while(lines.at(-1)==='')lines.pop();return lines.join('\n');
}
function renderFullSongSheet(song){return ChordSheet.render(ChordSheet.transposed(readerModel(song),transposeSteps,readerToneFlats(song)),esc);}
function combinedSongSheetMarkup(){return '<section class="combined-song-preview"><div class="combined-sheet-heading"><h3>Uma cifra, com acordes sobre a letra</h3><span>Prévia de leitura</span></div><p class="form-hint">Cole a música completa no campo acima: acordes na linha de cima e letra na linha de baixo. Também aceita ChordPro e o editor visual.</p><div id="combined-song-status" class="form-hint" role="status"></div><div id="combined-song-preview" class="chord-sheet sheet-preview" aria-label="Prévia da cifra com acordes sobre as palavras"></div></section>';}
function refreshCombinedSongPreview(){
 if(editTarget?.kind!=='songs'||!$('#editor').open)return;
 const source=$('#editor').querySelector('[name="chords"]')?.value||'',separate=$('#editor').querySelector('[name="lyrics"]')?.value||'',model=ChordSheet.parse(source);
 $('#combined-song-preview').innerHTML=source.trim()?ChordSheet.render(model,esc):'<p class="combined-sheet-empty">A cifra completa aparecerá aqui, com cada acorde acima da palavra correspondente.</p>';
 $('#combined-song-status').textContent=!model.hasAlignedLyrics&&separate.trim()&&!model.hasLyrics?'Este cadastro tem uma grade e uma letra separadas. Use o editor visual para escolher onde cada acorde entra. Nenhuma posição será inventada.':model.hasAlignedLyrics?'Acordes e letra estão na mesma cifra. As posições serão preservadas ao mudar o tom.':'';
}
const combinedBaseEdit=edit;
edit=function(kind,id){combinedBaseEdit(kind,id);if(kind!=='songs'||editTarget?.kind!=='songs'||!$('#editor').open)return;const source=$('#editor').querySelector('[name="chords"]');if(source){source.oninput=refreshCombinedSongPreview;source.setAttribute?.('spellcheck','false');source.setAttribute?.('placeholder','C       G\nMinha canção\n\n[Refrão]\nAm      F\nOutra frase');}refreshCombinedSongPreview();};
const combinedBaseEditorAction=chordEditorAction;
chordEditorAction=function(action,target){combinedBaseEditorAction(action,target);if(action==='chord-editor-apply')refreshCombinedSongPreview();};
const combinedBaseSection=sectionMaterialContent;
sectionMaterialContent=function(song,section=currentSection()){return combinedBaseSection(song.lyrics?.trim()?song:{...song,lyrics:songLyricText(song)},section);};
