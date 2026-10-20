import {assets} from '../dist/server/assets.mjs';
const noStore={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','X-Frame-Options':'SAMEORIGIN'};
const json=(error,status)=>Response.json({error},{status,headers:noStore});
function localAsset(path,method='GET'){const a=assets[path];if(!a)return json('Não encontrado.',404);return new Response(method==='HEAD'?null:Uint8Array.from(atob(a.data),c=>c.charCodeAt(0)),{headers:{...noStore,'Content-Type':a.type}});}
async function configuredCloudBackend(){
if(!['NOTIVOX_DATABASE_URL','SUPABASE_URL','SUPABASE_SECRET_KEY'].some(key=>process.env[key]))return null;
return (await import('./supabase-backend.mjs')).getSupabaseBackend();
}
export function createHandler({getToken=()=>process.env.ADNIPO_BACKEND_TOKEN,getBackend=()=>process.env.ADNIPO_BACKEND_URL,fetchImpl=globalThis.fetch,getCloudBackend=configuredCloudBackend}={}){
return async function handle(request){
try{
const url=new URL(request.url);
let path=url.searchParams.get('path')||url.pathname;
if(path==='/api/site')path='/';
if(!path.startsWith('/'))path='/'+path;
const allowed=new Set(['/','/index.html','/teste.index.html','/login','/styles.css','/theme.js','/login.js','/app.js','/data.js','/assets/logo.png','/assets/pdf/pdf.js','/assets/pdf/pdf.worker.js','/api/status','/api/setup','/api/login','/api/email-login','/api/members','/api/me','/api/logout','/api/users','/api/data','/api/backup','/api/backup/restore','/api/backup/recovery']);
const appRoute=['/inicio','/repertorio','/admin','/admin/login','/admin/musicas','/admin/musicas/nova'].includes(path)||/^\/(?:musica\/[^/]+|admin\/musicas\/[^/]+)$/.test(path);if(appRoute)allowed.add(path);
const pwaAssets=['/manifest.webmanifest','/service-worker.js','/offline.html','/icons/app-192.png','/icons/app-512.png'];
for(const path of pwaAssets)allowed.add(path);
const fileRoute=/^\/api\/(?:uploads(?:\/[a-f0-9-]{36}(?:\/(?:\d+|complete|cancel))?)?|media\/[a-f0-9-]{36})$/.test(path);
if(!allowed.has(path)&&!fileRoute&&!/^\/assets\/voz-[0-3]\.wav$/.test(path))return json('Não encontrado.',404);
const method=request.method;
if(!['GET','HEAD','POST','PUT','DELETE'].includes(method))return json('Método não permitido.',405);
if(['POST','PUT','DELETE'].includes(method)&&request.headers.get('origin')!==url.origin)return json('Origem não autorizada.',403);
if(['GET','HEAD'].includes(method)&&pwaAssets.includes(path))return localAsset(path,method);
if(['GET','HEAD'].includes(method)&&['/styles.css','/theme.js','/login.js','/assets/logo.png','/assets/pdf/pdf.js','/assets/pdf/pdf.worker.js'].includes(path))return localAsset(path,method);
const cloud=await getCloudBackend();
if(cloud){
 const target=new URL(path,url.origin);
 if(path==='/api/backup/recovery')target.searchParams.set('id',url.searchParams.get('id')||'');
 const headers=new Headers(request.headers);headers.delete('oai-authenticated-user-id');headers.delete('cf-connecting-ip');
 let body;
 if(['POST','PUT'].includes(method)){
  if(Number(request.headers.get('content-length')||0)>2000000)return json('Conteúdo muito grande.',413);
  body=await request.arrayBuffer();if(body.byteLength>2000000)return json('Conteúdo muito grande.',413);
 }
 return await cloud.fetch(new Request(target,{method,headers,...(body?{body}:{})}));
}
const token=getToken(),configuredBackend=getBackend();
if((!token||!configuredBackend)&&['GET','HEAD'].includes(method)&&appRoute)return localAsset('/login.html',method);
if(!token||!configuredBackend){if(['GET','HEAD'].includes(method)&&['/','/index.html','/teste.index.html','/login'].includes(path))return localAsset('/login.html',method);return json('Sistema em configuração. O administrador precisa concluir a conexão do servidor na Vercel.',503);}
const backendURL=new URL(configuredBackend);
if(backendURL.protocol!=='https:'||backendURL.username||backendURL.password||backendURL.pathname!=='/'||backendURL.search||backendURL.hash)return json('Endereço do servidor inválido.',503);
const BACKEND=backendURL.origin;
const headers=new Headers({'OAI-Sites-Authorization':'Bearer '+token});
headers.set('X-Acervo-Public-Origin',url.origin);
const contentType=request.headers.get('content-type');if(contentType)headers.set('Content-Type',contentType);
const range=request.headers.get('range');if(range&&path.startsWith('/api/media/'))headers.set('Range',range);
const session=request.headers.get('cookie')?.match(/(?:^|;\s*)(adnipo_session=[a-f0-9]{64})(?:;|$)/)?.[1];if(session)headers.set('Cookie',session);
let body;
if(['POST','PUT'].includes(method)){if(Number(request.headers.get('content-length')||0)>2000000)return json('Conteúdo muito grande.',413);body=await request.arrayBuffer();if(body.byteLength>2000000)return json('Conteúdo muito grande.',413);headers.set('Origin',BACKEND);}else if(method==='DELETE')headers.set('Origin',BACKEND);
const query=path==='/api/backup/recovery'?'?id='+encodeURIComponent(url.searchParams.get('id')||''):'';
const upstream=await fetchImpl(BACKEND+path+query,{method,headers,body,redirect:'manual',signal:AbortSignal.timeout((path.startsWith('/api/media/')||path.startsWith('/api/backup'))?300000:20000)});
const target=upstream.headers.get('location');const type=upstream.headers.get('content-type')||'';
if(target&&!(target.startsWith('/')&&!target.startsWith('//')))return json('Não foi possível autenticar a conexão do servidor.',503);
if(upstream.status>=500)return json('O servidor dos materiais está indisponível. Tente novamente em instantes.',503);
if(['GET','HEAD'].includes(method)&&upstream.status===200){
const interfacePath=['/','/index.html','/teste.index.html'].includes(path)?'/app.html':path;
if(['/app.html','/app.js','/data.js'].includes(interfacePath)||/^\/assets\/voz-[0-3]\.wav$/.test(interfacePath))return localAsset(interfacePath,method);
}
const resultHeaders=new Headers(noStore);
for(const name of ['Content-Type','Location',...(fileRoute?['Content-Length','Content-Range','Content-Disposition','Accept-Ranges']:[])]){const value=upstream.headers.get(name);if(value)resultHeaders.set(name,value);}
for(const value of upstream.headers.getSetCookie?.()||[]){if(value.startsWith('adnipo_session='))resultHeaders.append('Set-Cookie',value);}
if(!type&&!target)return json('Resposta inválida do servidor.',502);
return new Response(method==='HEAD'||[204,304].includes(upstream.status)?null:upstream.body,{status:upstream.status,headers:resultHeaders});
}catch(error){console.error('ADNIPO: falha na conexão da Vercel com o servidor.',error.name);return json('Não foi possível conectar ao servidor. Tente novamente.',503);}
};
}
