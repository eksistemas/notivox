// Initial catalogue contains titles and source links, not third-party lyrics.
const gospelCatalogue=[
 ['Ele Me Ama','Livres Para Adorar','https://www.cifraclub.com.br/livres-para-adorar/ele-me-ama/'],
 ['Quando o Mundo Cai Ao Meu Redor','Livres Para Adorar','https://www.cifraclub.com.br/livres-para-adorar/quando-o-mundo-cai-ao-meu-redor/'],
 ['Lindo És','Livres Para Adorar','https://www.cifras.com.br/cifra/livres-para-adorar/lindo-es'],
 ['Quão Lindo És','Livres Para Adorar','https://www.cifraclub.com.br/livres-para-adorar/quao-lindo-es/'],
 ['Tudo Novo','Livres Para Adorar','https://www.cifraclub.com.br/livres-para-adorar/tudo-novo/'],
 ['Lugar Secreto','Gabriela Rocha','https://www.cifraclub.com.br/gabriela-rocha/lugar-secreto/simplificada.html'],
 ['Me Atraiu','Gabriela Rocha','https://www.cifraclub.com.br/gabriela-rocha/me-atraiu/indefinida-1.html'],
 ['Atos 2','Gabriela Rocha','https://www.cifraclub.com.br/gabriela-rocha/atos-2/versao-3.html'],
 ['Ressuscita-me','Aline Barros','https://www.cifraclub.com.br/aline-barros/ressuscita-me/simplificada.html'],
 ['Sonda-me, Usa-me','Aline Barros','https://www.cifraclub.com.br/aline-barros/sonda-me-usa-me/'],
 ['Casa do Pai','Aline Barros','https://www.cifraclub.com.br/aline-barros/casa-do-pai/intermedirio.html'],
 ['Povo Adquirido','Coral Resgate','https://www.cifraclub.com.br/coral-resgate/povo-adquirido/'],
 ['Vem Para o Altar','Coral Resgate','https://www.cifraclub.com.br/coral-resgate/vem-para-o-altar/'],
 ['Tudo Dele','Coral Resgate','https://www.cifraclub.com.br/coral-resgate/tudo-dele/'],
 ['Cantai','Coral Resgate','https://www.cifras.com.br/teclado/coral-resgate/cantai'],
 ['Faz Chover','Fernandinho','https://www.cifraclub.com.br/fernandinho/faz-chover/?autoplay=true'],
 ['Aos Olhos do Pai','Diante do Trono','https://www.cifraclub.com.br/diante-do-trono/aos-olhos-do-pai/'],
 ['É Tudo Sobre Você','MORADA','https://www.cifraclub.com.br/ministerio-morada/e-tudo-sobre-voce/'],
 ['Ousado Amor','Isaías Saad','https://www.cifraclub.com.br/isaias-saad/ousado-amor/academy-gospel.html']
];
function isGospelReference(url){return gospelCatalogue.some(item=>item[2]===url);}
function mergeGospelCatalogue(data,departmentId,selection=gospelCatalogue){
 const next=structuredClone(data),normalize=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 if(!next.departments.some(item=>item.id===departmentId))throw Error('Não foi possível acessar o acervo.');
 for(const [name,artist] of selection){
  let song=next.songs.find(item=>normalize(item.name)===normalize(name)&&(!item.artist||normalize(item.artist)===normalize(artist)));
  if(song){if(!song.departmentIds.includes(departmentId))song.departmentIds.push(departmentId);if(!song.artist)song.artist=artist;continue;}
  song={id:uid(),name,artist,key:'C',originalKey:'C',bpm:80,category:'Gospel',lyrics:'',chords:'',notes:'',scoreLink:'',gradeLink:'',projectionLink:'',voicesLink:'',videoLink:'',audioLink:'',pdfLink:'',departmentIds:[departmentId],resources:[]};next.songs.push(song);
 }
 return next;
}
function openGospelCatalogue(){
 if(!isAdmin()||!departmentId)return;
 let dialog=$('#gospel-catalogue');if(!dialog){dialog=document.createElement('dialog');dialog.id='gospel-catalogue';document.body.append(dialog);}
 dialog.innerHTML='<div class="dialog-head"><h2>Catálogo gospel inicial</h2><button class="button secondary" data-close="gospel-catalogue">Voltar</button></div><div class="tab-content"><p>'+gospelCatalogue.length+' títulos para iniciar seu acervo. Abra uma música aqui e cadastre sua cifra em texto para acompanhar, mudar o tom e imprimir.</p><div class="gospel-list">'+gospelCatalogue.map(([name,artist],index)=>'<div class="user-row"><div><strong>'+esc(name)+'</strong><p>'+esc(artist)+'</p></div>'+button('Abrir no app','open-gospel','data-index="'+index+'"',true,'music')+'</div>').join('')+'</div><div class="form-actions">'+button('Adicionar todos ao acervo','import-gospel')+'</div></div>';dialog.showModal();
}

async function openGospelSong(index){
 const entry=gospelCatalogue[index];if(!entry||!isAdmin())return;
 if(!await persist(mergeGospelCatalogue(state,departmentId,[entry])))return;
 $('#gospel-catalogue').close();const [name,artist]=entry;const song=state.songs.find(item=>item.name===name&&item.artist===artist);
 if(!song)return;page='cifras';location.hash='#cifras';render();openSong(song.id);
}
document.addEventListener('click',event=>{const target=event.target.closest('[data-action="open-gospel"]');if(target)openGospelSong(Number(target.dataset.index));});
document.addEventListener('click',async event=>{const target=event.target.closest('[data-action]');if(!target)return;if(target.dataset.action==='gospel-catalogue')openGospelCatalogue();if(target.dataset.action==='import-gospel'&&isAdmin()&&departmentId){target.disabled=true;try{if(await persist(mergeGospelCatalogue(state,departmentId))){$('#gospel-catalogue').close();render();toast('Catálogo gospel adicionado. Seus materiais existentes foram preservados.');}}catch(error){toast(error.message);}finally{target.disabled=false;}}});
