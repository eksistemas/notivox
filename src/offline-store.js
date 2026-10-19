/* Explicit, read-only download. No credentials or API response caching. */
const OfflinePack=(()=>{
 const pointer='acervo-offline-package-v1',prefix='acervo-offline-pack-',lifetime=8*60*60*1000;
 const supported=()=>typeof caches!=='undefined'&&typeof location!=='undefined'&&(location.protocol==='https:'||location.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(location.hostname));
 const pdf=resource=>['pdfLink'].includes(resource.id)||/\.pdf(?:$|[?#])/i.test(resource.url||'')||/\.pdf$/i.test(resource.label||'');
 async function read(){if(!supported())return null;const name=localStorage.getItem(pointer);if(!name?.startsWith(prefix))return null;const cache=await caches.open(name),response=await cache.match('/__offline_package__');if(!response)return null;const pack=await response.json();if(pack.expiresAt<=Date.now()){await clear();return null;}return {...pack,cacheName:name};}
 async function clear(){if(!supported())return;localStorage.removeItem(pointer);for(const name of await caches.keys())if(name.startsWith(prefix))await caches.delete(name);}
 async function file(url){const pack=await read();if(!pack)throw Error('A cópia offline expirou. Conecte-se para preparar novamente.');const response=await (await caches.open(pack.cacheName)).match(url);if(!response)throw Error('Este PDF não foi baixado. Prepare o repertório com internet.');return response.blob();}
 async function prepare({data,user,departmentId,revision,resources,readFile,fetchFile,progress=()=>{},verifyUser=async()=>{}}){
  if(!supported())throw Error('Disponível em HTTPS ou localhost, com armazenamento do navegador.');
  const group=data.departments.find(item=>item.id===departmentId);if(!group?.repertoire.length)throw Error('Adicione músicas ao repertório antes de baixar.');
  const ids=new Set(group.repertoire.map(entry=>entry.songId)),copy=structuredClone(data);copy.songs=copy.songs.filter(song=>ids.has(song.id));copy.words=[];copy.departments=[{...structuredClone(group),events:[],notices:[]}];copy.songs.forEach(song=>song.departmentIds=[departmentId]);
  const name=prefix+crypto.randomUUID(),cache=await caches.open(name),missing=[];let count=0,total=0,bytes=0;
  try{
   const jobs=copy.songs.flatMap(song=>resources(song).filter(pdf).map(resource=>({song,resource})));total=jobs.length;
   for(const {song,resource}of jobs){progress({count,total,label:resource.label});try{
    const blob=resource.storage==='local'?await readFile(resource.fileId):await fetchFile(resource.url);if(!blob||blob.size>30*1024*1024)throw Error('PDF ausente ou maior que 30 MB');
    const content=new Uint8Array(await blob.arrayBuffer());if(!new TextDecoder().decode(content.slice(0,1024)).includes('%PDF-'))throw Error('O endereço não retornou um PDF');
    if(bytes+blob.size>200*1024*1024)throw Error('Limite de 200 MB por repertório');
    const url=new URL('/__offline_files__/'+count+'-'+crypto.randomUUID()+'.pdf',location.origin).href;
    await cache.put(url,new Response(blob,{headers:{'Content-Type':'application/pdf'}}));bytes+=blob.size;count++;
    const existing=song.resources.find(item=>item.id===resource.id);if(existing){existing.url=url;delete existing.storage;delete existing.fileId;}else{song.resources.push({...resource,id:'offline-'+resource.id,url});if(['pdfLink','scoreLink','gradeLink'].includes(resource.id))song[resource.id]='';}
   }catch(error){if(error.name==='QuotaExceededError')throw error;missing.push({song:song.name,label:resource.label,reason:error.message});}}
   await verifyUser();
   const pack={version:1,user:{id:user.id,username:user.username,role:'member'},data:copy,revision,createdAt:Date.now(),expiresAt:Date.now()+lifetime,count,total,bytes,missing};
   await cache.put('/__offline_package__',new Response(JSON.stringify(pack),{headers:{'Content-Type':'application/json'}}));
   const previous=localStorage.getItem(pointer);localStorage.setItem(pointer,name);if(previous?.startsWith(prefix)&&previous!==name)try{await caches.delete(previous);}catch{}
   return pack;
  }catch(error){await caches.delete(name);throw error;}
 }
 return {supported,read,clear,file,prepare};
})();
