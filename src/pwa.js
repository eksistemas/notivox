const AppRuntime={version:'__APP_VERSION__',offline:false,installPrompt:null,registration:null,updating:false,wake:null,wakeRequested:false};
const originalRuntimeApi=api;
api=async function(path,options={}){
 const method=options.method||'GET';
 if(path==='/api/logout'){await OfflinePack.clear();if(AppRuntime.offline)return {ok:true,remoteSessionEnded:false};}
 if(AppRuntime.expired)throw Error('Cópia offline expirada. Conecte-se e reabra o aplicativo.');
 if(AppRuntime.offline&&method!=='GET')throw Error('Consulta offline: conecte-se e reabra o aplicativo para salvar.');
 try{const result=await originalRuntimeApi(path,options);if(path==='/api/me'&&location.protocol!=='file:'){try{const pack=await OfflinePack.read();if(pack&&pack.user.id!==result.user?.id)await OfflinePack.clear();}catch{recordRuntimeIssue({name:'SecurityError'});}}return result;}catch(error){
  if(method==='GET'&&['/api/me','/api/data'].includes(path)&&error.name==='TypeError'){
   const pack=await OfflinePack.read();if(pack){if(path==='/api/data'&&authenticatedUser&&authenticatedUser.id!==pack.user.id)throw Error('A cópia offline pertence a outra conta.');AppRuntime.offline=true;authenticatedUser=pack.user;return path==='/api/me'?{user:pack.user,offline:true}:{data:pack.data,revision:pack.revision};}
  }if(location.href==='/login')await OfflinePack.clear();throw error;
 }
};
const originalRuntimePersist=persist;
persist=async function(next){if(AppRuntime.offline||globalThis.navigator?.onLine===false){toast('Sem gravação offline. Seus cadastros permanecem como estavam; conecte-se antes de salvar.');return false;}return originalRuntimePersist(next);};
const originalRuntimeOpenPdf=openPdfResource;
openPdfResource=async function(songId,resourceId){
 if(!AppRuntime.offline)return originalRuntimeOpenPdf(songId,resourceId);
 const song=state.songs.find(item=>item.id===songId),resource=song&&Object.values(sections).flatMap(section=>materialResources(song,section.type)).find(item=>item.id===resourceId);if(!resource)return;
 try{const blob=await OfflinePack.file(resource.url);await openPdfFile(blob,songId,resource,{score:resource.type==='partitura',repertoire:page==='repertorio',trigger:document.activeElement});}catch(error){toast(error.message);}
};
function runtimeStatus(){return '<p class="runtime-status" role="status">'+(AppRuntime.offline?'Consulta offline · cópia preparada · alterações não são salvas':globalThis.navigator?.onLine===false?'Sem conexão · prepare uma cópia com internet para consultar offline':'Conectado · alterações salvas somente após confirmação do servidor')+'</p>';}
const runtimeBaseRender=renderCatalogue;
renderCatalogue=function(){if(AppRuntime.expired){$('#main').innerHTML='<h1>Cópia offline expirada</h1><p>Conecte-se e reabra o aplicativo para validar sua conta e baixar novamente.</p>';return;}runtimeBaseRender();const main=$('#main');main.insertAdjacentHTML?.('afterbegin',runtimeStatus());if(page==='configuracoes')main.insertAdjacentHTML?.('beforeend','<section class="panel settings-card"><h2>Ajuda e diagnóstico</h2><div class="asset-actions">'+button('Consultar cópia baixada','app-offline-open','',true)+button('Exportar diagnóstico','app-diagnostics','',true)+'</div><p class="form-hint">O diagnóstico contém apenas versão, horário e tipo dos erros técnicos; não inclui músicas, senhas ou dados da conta.</p></section>');};
const runtimeBaseSettings=settingsView;
settingsView=function(){return runtimeBaseSettings()+'<section class="panel settings-card"><h2>Aplicativo e uso offline</h2><p>Versão '+esc(AppRuntime.version)+'</p>'+runtimeStatus()+'<div class="asset-actions">'+button('Instalar aplicativo','app-install','',true)+button('Baixar repertório para uso offline','app-download','',true)+button('Conferir cópia offline','app-offline-status','',true)+button('Remover cópia deste dispositivo','app-offline-clear','',true)+button('Verificar atualização','app-update','',true)+'</div><p class="form-hint">A cópia de consulta inclui cifras, letras e PDFs baixados do repertório atual. Fica disponível por até 8 horas neste dispositivo; não salva edições nem substitui o backup. Prepare novamente antes do culto. Em aparelhos compartilhados, remova a cópia ao terminar.</p><p id="app-download-status" role="status"></p><label><input type="checkbox" id="app-wake" '+(AppRuntime.wakeRequested?'checked':'')+'> Manter tela ligada durante a leitura, quando suportado</label><p id="app-wake-status" role="status"></p></section>';};
async function downloadRepertoire(){
 if(AppRuntime.offline)throw Error('Conecte-se e reabra o aplicativo para baixar uma nova cópia.');
 if(!OfflinePack.supported())throw Error('Instalação e download offline exigem HTTPS ou localhost. Abra pelo servidor, não pelo arquivo HTML.');
 if(!globalThis.navigator?.serviceWorker)throw Error('Este navegador não oferece instalação e abertura offline.');
 let readyTimer;try{await Promise.race([navigator.serviceWorker.ready,new Promise((resolve,reject)=>{readyTimer=setTimeout(()=>reject(Error('A preparação do aplicativo ainda não terminou. Aguarde e tente novamente.')),15000);})]);}finally{clearTimeout(readyTimer);}
 const me=await originalRuntimeApi('/api/me'),latest=await originalRuntimeApi('/api/data');
 if(me.user?.id!==authenticatedUser?.id)throw Error('A conta mudou. Reabra o aplicativo.');
 const pack=await OfflinePack.prepare({data:validate(latest.data),user:me.user,departmentId,revision:latest.revision,resources:song=>Object.values(sections).flatMap(section=>materialResources(song,section.type)),readFile:localFileRead,fetchFile:async url=>{const response=await fetch(validURL(url),{cache:'no-store'});if(!response.ok||response.redirected)throw Error('PDF indisponível ou redirecionado');return response.blob();},verifyUser:async()=>{const current=await originalRuntimeApi('/api/me');if(current.user?.id!==me.user.id)throw Error('A conta mudou durante o download. Reabra o aplicativo.');},progress:progress=>{$('#app-download-status').textContent='Preparando PDFs '+progress.count+'/'+progress.total+' · '+progress.label;}});
 try{await navigator.storage?.persist?.();}catch{}
 $('#app-download-status').textContent='Cópia de consulta preparada: '+pack.data.songs.length+' músicas, '+pack.count+'/'+pack.total+' PDFs. Válida até '+new Date(pack.expiresAt).toLocaleTimeString('pt-BR')+'.'+(pack.missing.length?' Não baixados: '+pack.missing.map(item=>item.song+' — '+item.label+' ('+item.reason+')').join('; '):' Todos os PDFs foram baixados.');
}
async function setReadingWake(enabled){
 AppRuntime.wakeRequested=enabled;
 if(!enabled){await AppRuntime.wake?.release();AppRuntime.wake=null;return;}
 if(!globalThis.navigator?.wakeLock){AppRuntime.wakeRequested=false;toast('Este navegador não oferece o controle de tela ligada.');return;}
 if(document.visibilityState==='hidden'||!document.querySelector('#pdf-reader[open],#cifra-reader[open]'))return;
 if(AppRuntime.acquiringWake||AppRuntime.wake)return;AppRuntime.acquiringWake=true;
 try{const handle=await navigator.wakeLock.request('screen');if(!AppRuntime.wakeRequested||document.visibilityState==='hidden'||!document.querySelector('#pdf-reader[open],#cifra-reader[open]')){await handle.release();return;}AppRuntime.wake=handle;handle.addEventListener('release',()=>{if(AppRuntime.wake===handle)AppRuntime.wake=null;});}catch{AppRuntime.wakeRequested=false;toast('Não foi possível manter a tela ligada. Confira a economia de bateria.');}finally{AppRuntime.acquiringWake=false;}
}
async function runtimeInstall(){const prompt=AppRuntime.installPrompt;if(prompt){AppRuntime.installPrompt=null;await prompt.prompt();await prompt.userChoice;}else toast('No menu do navegador, escolha Instalar aplicativo ou Adicionar à Tela de Início. É necessário HTTPS ou localhost.');}
async function runtimeUpdate(){const registration=AppRuntime.registration;if(!registration)throw Error('Atualizações instaláveis estão disponíveis em HTTPS ou localhost.');await registration.update();if(registration.waiting){if(document.querySelector('dialog[open]'))throw Error('Feche o formulário ou leitor antes de atualizar.');AppRuntime.updating=true;registration.waiting.postMessage({type:'ACTIVATE_UPDATE'});}else toast('Nenhuma atualização pendente. Versão '+AppRuntime.version);}
document.addEventListener('click',async event=>{const target=event.target.closest('[data-action]');if(!target)return;
 const actions={'app-install':runtimeInstall,'app-download':downloadRepertoire,'app-update':runtimeUpdate,'app-offline-clear':async()=>{await OfflinePack.clear();toast('Cópia offline removida. O acervo do servidor foi preservado.');if(AppRuntime.offline)location.href='/login';},'app-offline-status':async()=>{const pack=await OfflinePack.read();toast(pack?'Cópia de '+new Date(pack.createdAt).toLocaleString('pt-BR')+' · '+pack.count+'/'+pack.total+' PDFs · '+pack.missing.length+' não baixados.':'Nenhuma cópia offline válida neste dispositivo.');}};
 if(actions[target.dataset.action]){target.disabled=true;try{await actions[target.dataset.action]();}catch(error){toast(error.message);}finally{target.disabled=false;}}
});
document.addEventListener('change',event=>{if(event.target.id==='app-wake')setReadingWake(event.target.checked);});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&AppRuntime.wakeRequested)setReadingWake(true);});
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();AppRuntime.installPrompt=event;});
function refreshRuntimeConnection(){const text=AppRuntime.offline?'Consulta offline · alterações não são salvas':globalThis.navigator?.onLine===false?'Sem conexão · alterações não são salvas':'Conectado · confirme o salvamento antes de sair';for(const element of document.querySelectorAll('.runtime-status'))element.textContent=text;}
window.addEventListener('online',()=>{refreshRuntimeConnection();if(AppRuntime.offline)toast('Conexão restabelecida. Reabra o aplicativo para validar sua conta e carregar os dados atuais.');});
window.addEventListener('offline',()=>{refreshRuntimeConnection();toast('Sem conexão. Alterações não serão gravadas. Use sua cópia de consulta preparada.');});
if(globalThis.navigator?.serviceWorker&&/^https?:$/.test(location.protocol))navigator.serviceWorker.register('/service-worker.js',{scope:'/'}).then(registration=>{AppRuntime.registration=registration;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(AppRuntime.updating)location.reload();});}).catch(()=>toast('Não foi possível preparar a instalação. O aplicativo online continua disponível.'));
function readingPositionKey(songId,resource){return 'acervo-reading-'+(authenticatedUser?.id??'local')+'-'+songId+'-'+(resource?.id||'pdf');}
const runtimeOriginalOpenPdfFile=openPdfFile;
openPdfFile=async function(file,songId='',resource=null,options={}){
 const key=readingPositionKey(songId,resource),saved=storage.read(key,1);await runtimeOriginalOpenPdfFile(file,songId,resource,options);
 if(pdfSession?.songId===songId&&Number.isInteger(saved)&&saved>1&&saved<=pdfSession.document.numPages){pdfSession.page=saved;await renderPdfPage();}
};
const runtimeOriginalRenderPdf=renderPdfPage;
renderPdfPage=async function(){const session=pdfSession;await runtimeOriginalRenderPdf();if(session&&pdfSession===session)try{storage.write(readingPositionKey(session.songId,session.existingResource),session.page);}catch{}};
if(typeof MutationObserver!=='undefined')new MutationObserver(()=>{const reading=document.querySelector('#pdf-reader[open],#cifra-reader[open]');if(AppRuntime.wakeRequested&&reading&&!AppRuntime.wake)setReadingWake(true);if(!reading&&AppRuntime.wake){AppRuntime.wake.release().catch(()=>{});AppRuntime.wake=null;}}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open']});
async function checkOfflineExpiry(){if(!AppRuntime.offline||AppRuntime.expired)return;try{if(await OfflinePack.read())return;}catch{}AppRuntime.expired=true;for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();releaseScorePdf();currentSong=null;state.songs=[];state.words=[];for(const group of state.departments){group.repertoire=[];group.events=[];group.notices=[];}authenticatedUser=null;render();}
setInterval(checkOfflineExpiry,60000);
function recordRuntimeIssue(reason){try{const known=['Error','TypeError','RangeError','QuotaExceededError','NetworkError','SecurityError'],name=known.includes(reason?.name)?reason.name:'UnknownError',issues=storage.read('acervo-diagnostics-v1',[]);storage.write('acervo-diagnostics-v1',[...(Array.isArray(issues)?issues:[]).slice(-29),{version:AppRuntime.version,time:new Date().toISOString(),name}]);}catch{}}
window.addEventListener('error',event=>recordRuntimeIssue(event.error));
window.addEventListener('unhandledrejection',event=>recordRuntimeIssue(event.reason));
async function openDownloadedCopy(){const pack=await OfflinePack.read();if(!pack)throw Error('Nenhuma cópia offline válida. Baixe o repertório com internet.');if(pack.user.id!==authenticatedUser?.id)throw Error('A cópia pertence a outra conta. Prepare novamente.');try{const me=await originalRuntimeApi('/api/me');if(me.user?.id!==pack.user.id){await OfflinePack.clear();throw Error('A conta mudou. Reabra o aplicativo.');}}catch(error){if(error.name!=='TypeError')throw error;}state=validate(pack.data);authenticatedUser=pack.user;revision=pack.revision;departmentId=state.departments[0].id;AppRuntime.offline=true;location.hash='#repertorio';render();}
document.addEventListener('click',async event=>{const target=event.target.closest('[data-action]');if(!target)return;if(target.dataset.action==='app-offline-open'){try{await openDownloadedCopy();}catch(error){toast(error.message);}}if(target.dataset.action==='app-diagnostics'){const payload={version:AppRuntime.version,issues:storage.read('acervo-diagnostics-v1',[])},url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='diagnostico-acervo.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}});
