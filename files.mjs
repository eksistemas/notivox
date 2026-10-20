export const PART_SIZE=1024*1024,MAX_FILE_SIZE=200*1024*1024;
const types={pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',txt:'text/plain; charset=utf-8',mp3:'audio/mpeg',wav:'audio/wav',m4a:'audio/mp4',ogg:'audio/ogg',aac:'audio/aac',flac:'audio/flac',mp4:'video/mp4',webm:'video/webm',mov:'video/quicktime',doc:'application/octet-stream',docx:'application/octet-stream',ppt:'application/octet-stream',pptx:'application/octet-stream',zip:'application/zip',musicxml:'application/octet-stream',mxl:'application/octet-stream',mscz:'application/octet-stream'};
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const json=(value,status=200)=>Response.json(value,{status,headers});
const error=(message,status)=>{throw Object.assign(Error(message),{status});};
const key=id=>'uploads/'+id+'/manifest';
const partKey=(id,index)=>'uploads/'+id+'/part-'+index;
export async function fileRoutes(request,env,user){
 const path=new URL(request.url).pathname;if(!path.startsWith('/api/uploads')&&!path.startsWith('/api/media/'))return null;
 const bucket=env.BUCKET;if(!bucket)return json({error:'O armazenamento de arquivos ainda não está disponível.'},503);
 if(!user)return json({error:'Acesso não autorizado.'},401);
 if(path==='/api/uploads'&&request.method==='POST'){
 const meta=await request.json();const name=typeof meta.name==='string'?meta.name.trim():'';const ext=name.split('.').at(-1).toLowerCase();if(!name||name.length>200||!types[ext])error('Formato de arquivo não permitido.',400);if(!Number.isInteger(meta.size)||meta.size<1||meta.size>MAX_FILE_SIZE)error('Selecione um arquivo de até 200 MB.',400);
 const audioExtensions=['mp3','wav','m4a','ogg','aac','flac'];const purpose=meta.purpose==='song-audio'?'song-audio':'catalogue';if(user.role!=='admin'&&(purpose!=='song-audio'||!audioExtensions.includes(ext)))error('Músicos podem enviar apenas arquivos de áudio para novas músicas.',403);if(purpose==='song-audio'&&!audioExtensions.includes(ext))error('Formato de áudio inválido.',400);
 const id=crypto.randomUUID();const manifest={id,name,size:meta.size,mime:types[ext],parts:Math.ceil(meta.size/PART_SIZE),createdBy:user.id,createdAt:Date.now(),status:'pending',purpose};await bucket.put(key(id),JSON.stringify(manifest));return json({id,partSize:PART_SIZE},201);
 }
 const route=/^\/api\/(uploads|media)\/([a-f0-9-]{36})(?:\/(\d+|complete|cancel))?$/.exec(path);if(!route)return json({error:'Arquivo não encontrado.'},404);
 const [,scope,id,action]=route;const object=await bucket.get(key(id));if(!object)return json({error:'Arquivo não encontrado.'},404);const manifest=await object.json();
 if(scope==='uploads'&&!action&&request.method==='DELETE'){
 if(user.role!=='admin'&&!(manifest.createdBy===user.id&&manifest.purpose==='song-audio'))error('Sem permissão para remover este arquivo.',403);
 if(manifest.status!=='complete')error('Somente arquivos concluídos podem ser removidos.',409);
 const row=await env.DB?.prepare('SELECT payload FROM app_data WHERE id=1').first();if(!row?.payload)error('Não foi possível verificar as referências ao arquivo.',503);let data;try{data=JSON.parse(row.payload);}catch{error('Não foi possível verificar as referências ao arquivo.',409);}const referenced=data.songs?.some(song=>(song.resources||[]).some(resource=>resource.fileId===id));if(referenced)error('O arquivo ainda está associado ao acervo.',409);
 await bucket.delete([key(id),...Array.from({length:manifest.parts},(_,index)=>partKey(id,index))]);return json({ok:true});
 }
 if(scope==='uploads'){
 if(manifest.createdBy!==user.id)error('Envio não autorizado.',403);
 if(action==='cancel'&&request.method==='POST'){if(manifest.status==='complete')error('O arquivo já foi concluído.',409);await bucket.delete([key(id),...Array.from({length:manifest.parts},(_,index)=>partKey(id,index))]);return json({ok:true});}
 if(manifest.status!=='pending')error('O arquivo já foi concluído.',409);if(Date.now()-manifest.createdAt>86400000)error('O envio expirou. Selecione o arquivo novamente.',410);
 if(action==='complete'&&request.method==='POST'){
 let size=0;for(let index=0;index<manifest.parts;index++){const part=await bucket.head(partKey(id,index));const expected=Math.min(PART_SIZE,manifest.size-index*PART_SIZE);if(!part||part.size!==expected)error('O arquivo ainda não foi enviado por completo.',409);size+=part.size;}if(size!==manifest.size)error('Tamanho de arquivo inválido.',400);manifest.status='complete';await bucket.put(key(id),JSON.stringify(manifest));return json({id,url:'/api/media/'+id,name:manifest.name,size:manifest.size});
 }
 const index=Number(action);if(!/^\d+$/.test(action||'')||request.method!=='POST'||!Number.isInteger(index)||index>=manifest.parts)error('Parte de arquivo inválida.',400);
 const expected=Math.min(PART_SIZE,manifest.size-index*PART_SIZE);const buffer=await request.arrayBuffer();if(buffer.byteLength!==expected)error('Tamanho da parte inválido.',400);await bucket.put(partKey(id,index),buffer);return json({ok:true});
 }
 if(!['GET','HEAD'].includes(request.method)||action||manifest.status!=='complete')return json({error:'Arquivo não encontrado.'},404);
 let start=0,end=manifest.size-1,status=200;const range=request.headers.get('range');if(range){const match=/^bytes=(\d*)-(\d*)$/.exec(range);if(!match||(!match[1]&&!match[2]))return new Response(null,{status:416,headers:{...headers,'Content-Type':'application/octet-stream','Content-Range':'bytes */'+manifest.size}});if(match[1]){start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}else start=Math.max(0,manifest.size-Number(match[2]));if(start>end||start>=manifest.size)return new Response(null,{status:416,headers:{...headers,'Content-Type':'application/octet-stream','Content-Range':'bytes */'+manifest.size}});status=206;}
 const resultHeaders={...headers,'Content-Type':manifest.mime,'Content-Length':String(end-start+1),'Accept-Ranges':'bytes','Content-Disposition':(manifest.mime==='application/octet-stream'||manifest.mime==='application/zip'?'attachment':'inline')+"; filename*=UTF-8''"+encodeURIComponent(manifest.name)};if(status===206)resultHeaders['Content-Range']='bytes '+start+'-'+end+'/'+manifest.size;
 let offset=start,reader=null;const stream=new ReadableStream({async pull(controller){try{while(true){if(reader){const chunk=await reader.read();if(!chunk.done){controller.enqueue(chunk.value);return;}reader=null;}if(offset>end){controller.close();return;}const index=Math.floor(offset/PART_SIZE),localOffset=offset%PART_SIZE,length=Math.min(PART_SIZE-localOffset,end-offset+1);const part=await bucket.get(partKey(id,index),{range:{offset:localOffset,length}});if(!part)throw Error('Arquivo incompleto.');offset+=length;reader=part.body.getReader();}}catch(error){controller.error(error);}},async cancel(){if(reader)await reader.cancel();}});
 return new Response(request.method==='HEAD'?null:stream,{status,headers:resultHeaders});
}
