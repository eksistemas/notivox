/* Sections are source slices: chord offsets and lyric bytes within each part never change. */
const SongSections=(()=>{
 const types=['Introdução','Estrofe','Pré-refrão','Refrão','Ponte','Instrumental','Final'];
 const kinds={verse:'Estrofe',chorus:'Refrão',bridge:'Ponte',intro:'Introdução',outro:'Final',prechorus:'Pré-refrão',instrumental:'Instrumental'};
 const opaqueKinds=new Set(['tab','grid','abc','ly','svg','textblock']);
 const labelName=value=>{const match=value.match(/\blabel\s*=\s*(?:"([^"]*)"|'([^']*)')/);return match?(match[1]??match[2]):value&&!/\w+=/.test(value)?value:null;};
 function name(value){if(typeof value!=='string')throw Error('Informe o nome da seção.');const label=value.trim();if(!label||ChordSheet.isInlineChord(label)||label.length>80||/[\r\n{}\[\]"'\\]/.test(label))throw Error('Use um nome de até 80 caracteres, sem colchetes, chaves, aspas ou quebras de linha.');return label;}
 function check(source){if(typeof source!=='string'||source.length>20000)throw Error('Use uma cifra de até 20.000 caracteres.');return source;}
 function scan(source){check(source);const sections=[],warnings=[],stack=[];let offset=0,opaque=null,dependent=false;
  for(const raw of source.match(/[^\n]*\n|[^\n]+$/g)||[]){const line=raw.replace(/\r?\n$/,''),directive=ChordSheet.directive?.(line);let marker=null;
   if(opaque){if(directive?.name==='end_of_'+opaque)opaque=null;offset+=raw.length;continue;}
   if(directive){const {name:command,value}=directive;
    if(command==='chorus'||(command==='transpose'&&!stack.length))dependent=true;
    if(command.startsWith('start_of_')){const kind=command.slice(9);if(opaqueKinds.has(kind)){opaque=kind;offset+=raw.length;continue;}if(Object.hasOwn(kinds,kind)){if(!stack.length)marker={kind:'directive',environment:kind,label:labelName(value)||kinds[kind]};stack.push(kind);}}
    else if(command.startsWith('end_of_')&&Object.hasOwn(kinds,command.slice(7))){if(stack.pop()!==command.slice(7))warnings.push('Confira o fechamento das seções ChordPro.');}
   }else if(!stack.length){const heading=ChordSheet.heading(line);if(heading)marker={kind:'heading',label:heading.name};}
   if(marker)sections.push({...marker,id:'section-'+offset,index:sections.length,start:offset,headerEnd:offset+raw.length,headerRaw:raw,line});offset+=raw.length;
  }
  if(stack.length||opaque)warnings.push('Há blocos sem fechamento; reorganize somente após corrigir a sintaxe.');
  for(let i=0;i<sections.length;i++){const section=sections[i];section.end=sections[i+1]?.start??source.length;section.raw=source.slice(section.start,section.end);section.separator=section.raw.match(/\r?\n$/)?.[0]||'';section.core=section.raw.slice(0,section.raw.length-section.separator.length);}
  return {sections,prefix:source.slice(0,sections[0]?.start??source.length),warnings:[...new Set(warnings)],dependent};
 }
 function find(source,id){const document=scan(source),section=document.sections.find(item=>item.id===id);if(!section)throw Error('Selecione novamente a seção.');return {document,section};}
 function rename(source,id,value){const label=name(value),{section}=find(source,id);let line=section.line;
  if(section.kind==='directive'){const d=ChordSheet.directive(line),attribute=/\blabel\s*=\s*(["'])(.*?)\1/.exec(line);if(attribute){const start=attribute.index+attribute[0].indexOf(attribute[1])+1;line=line.slice(0,start)+label+line.slice(start+attribute[2].length);}else if(d.value&&!/\w+=/.test(d.value)){const end=line.lastIndexOf('}'),start=line.lastIndexOf(d.value,end);line=line.slice(0,start)+label+line.slice(start+d.value.length);}else{const end=line.lastIndexOf('}');line=line.slice(0,end)+(d.value?' label="'+label+'"':': '+label)+line.slice(end);}}
  else{const bracket=/^(\s*)\[([^\]]+)\]/.exec(line);if(bracket)line=line.slice(0,bracket[1].length+1)+label+line.slice(bracket[1].length+1+bracket[2].length);else{const inline=/^(\s*)([^|:]+?)(\s*[:|])/.exec(line);if(inline){const start=inline[1].length;line=line.slice(0,start)+'['+label+']'+line.slice(start+inline[2].length);}else{const leading=line.match(/^\s*/)[0],trailing=line.match(/\s*$/)[0];line=leading+'['+label+']'+trailing;}}}
  const ending=section.headerRaw.slice(section.line.length);return check(source.slice(0,section.start)+line+ending+source.slice(section.headerEnd));
 }
 function move(source,id,direction){if(![-1,1].includes(direction))throw Error('Movimento de seção inválido.');const {document,section}=find(source,id),target=section.index+direction;if(document.warnings.length)throw Error(document.warnings.join(' '));if(target<0||target>=document.sections.length)return source;if(document.dependent)throw Error('Esta cifra usa repetição de refrão ou transposição global. Reorganize no modo ChordPro para revisar essas dependências sem mudar o resultado musical.');const ordered=document.sections.slice();[ordered[section.index],ordered[target]]=[ordered[target],ordered[section.index]];return check(document.prefix+ordered.map((item,index)=>item.core+document.sections[index].separator).join(''));}
 function insert(source,offset,value){const label=name(value),document=scan(source);let point=Math.max(0,Math.min(source.length,Math.trunc(offset)||0));point=point===0||point===source.length?point:source.lastIndexOf('\n',point-1)+1;const containing=document.sections.find(section=>section.start<=point&&point<section.end);if(containing?.kind==='directive'&&point>containing.start&&point<containing.end)throw Error('Para preservar o bloco ChordPro, insira a nova seção antes ou depois dele, ou ajuste a estrutura no modo ChordPro.');const newline=source.includes('\r\n')?'\r\n':'\n';return check(source.slice(0,point)+(point===source.length&&point>0&&!source.endsWith('\n')?newline:'')+'['+label+']'+newline+source.slice(point));}
 function importLyrics(source,lyrics){check(source);check(lyrics);const existing=scan(source);if(!existing.sections.length)return lyrics;if(existing.warnings.length)throw Error('Corrija os blocos ChordPro antes de acrescentar uma letra, para preservar suas seções.');const newline=source.includes('\r\n')?'\r\n':'\n',join=source&&!source.endsWith('\n')?newline:'';return check(source+join+(scan(lyrics).sections.length?'':'[Letra importada]'+newline)+lyrics);}
 return {types,scan,rename,move,insert,importLyrics,name};
})();
