const backupPreferenceKeys=['acervo-musical-theme','acervo-musical-favorites','acervo-musical-recent','acervo-musical-reader-mode'];
let backupBusy=false;
function backupPreferences(){const result={};for(const key of backupPreferenceKeys){const value=localStorage.getItem(key);if(value!==null)result[key]=value;}return AcervoBackup.settings(result);}
function downloadBackup(backup,prefix='acervo-completo'){const url=URL.createObjectURL(new Blob([JSON.stringify(backup)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=prefix+'-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function captureBackup(){if(location.protocol!=='file:'){const result=await api('/api/backup');result.backup.payload.settings=backupPreferences();result.backup=await AcervoBackup.seal(result.backup.payload);await AcervoBackup.verify(result.backup,validate);return result;}const current=localApi('/api/data'),saved=storage.read('acervo-musical-local-v1',{});const backup=await AcervoBackup.make({data:current.data,users:saved.backupUsers||[],settings:backupPreferences(),source:'local',readFile:localFileRead});await AcervoBackup.verify(backup,validate);return {backup,revision:current.revision};}
async function exportData(){if(!isAdmin()||backupBusy)return;backupBusy=true;try{toast('Preparando backup completo…');const {backup}=await captureBackup();downloadBackup(backup);toast('Backup completo verificado. Guarde o arquivo em local seguro.');}catch(error){toast('Backup não concluído: '+error.message);}finally{backupBusy=false;}}
async function importCompleteBackup(event){const file=event.target.files?.[0];if(!file||!isAdmin()||backupBusy)return;backupBusy=true;try{
 if(file.size>96*1024*1024)throw Error('O arquivo excede o limite de 96 MB.');
 const backup=JSON.parse(await file.text()),p=await AcervoBackup.verify(backup,validate);
 // Snapshot is also downloaded, so recovery does not depend exclusively on the device/server.
 const current=await captureBackup();
 if(!confirm('Backup validado: '+p.data.songs.length+' músicas, '+p.files.length+' anexos e '+p.users.length+' usuários. Restaurar substituirá os cadastros atuais. Uma cópia completa atual será preservada. Credenciais não são importadas; o administrador atual será mantido no servidor. Confirmar restauração?'))return;
 downloadBackup(current.backup,'acervo-antes-da-restauracao');
 if(location.protocol==='file:'){
  await AcervoBackup.restoreLocal({backup,validate,revision:current.revision,readCurrent:async()=>{const value=localApi('/api/data'),saved=storage.read('acervo-musical-local-v1',{});return {...value,users:saved.backupUsers||[],settings:backupPreferences()};},readFile:localFileRead,storeFile:localFileStore,readStored:localFileRead,commit:async value=>{storage.write('acervo-musical-local-v1',value);}});
 }else{
  const mapping={};for(const attachment of p.files){const upload=await saveUploadedFile(new File([AcervoBackup.decode(attachment.base64)],attachment.name,{type:attachment.type}),progress=>toast('Preparando '+attachment.name+': '+progress+'%'));mapping[attachment.id]=upload.fileId;}
  const plan=structuredClone(backup);for(const attachment of plan.payload.files)delete attachment.base64;
  const result=await api('/api/backup/restore',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({backup:plan,mapping,revision:current.revision})});
  toast('Restauração concluída. Cópia anterior: '+result.recoveryId);
 }
 // Preferences are ancillary; the authoritative restored values remain in the local record.
 try{for(const key of backupPreferenceKeys){if(p.settings[key]!==undefined)localStorage.setItem(key,p.settings[key]);else localStorage.removeItem(key);}}catch{toast('Acervo restaurado; não foi possível aplicar todas as preferências.');}
 location.reload();
 }catch(error){toast('Restauração não concluída: '+error.message);}finally{backupBusy=false;event.target.value='';}}
$('#import-file').addEventListener('change',importCompleteBackup);
