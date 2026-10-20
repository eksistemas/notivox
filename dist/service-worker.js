const CACHE='acervo-shell-cdaca79319a1';
const ASSETS=["/assets/logo.png","/offline.html","/app.js","/data.js","/styles.css","/theme.js","/manifest.webmanifest","/icons/app-192.png","/icons/app-512.png","/assets/pdf/pdf.js","/assets/pdf/pdf.worker.js"];
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);for(const path of ASSETS){const response=await fetch(path,{cache:'reload'});if(!response.ok||response.redirected)throw Error('Instalação incompleta: '+path);await cache.put(path,response);}})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith('acervo-shell-')&&name!==CACHE)await caches.delete(name);await self.clients.claim();})()));
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE')self.skipWaiting();});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/')||url.pathname.startsWith('/login'))return;
 if(request.mode==='navigate'&&['/','/index.html','/teste.index.html','/offline.html'].includes(url.pathname)){event.respondWith(fetch(request).catch(async()=>{const cache=await caches.open(CACHE);return await cache.match('/offline.html')||Response.error();}));return;}
 if(ASSETS.includes(url.pathname)&&!url.search)event.respondWith((async()=>{const cache=await caches.open(CACHE);return await cache.match(url.pathname)||fetch(request);})());
});
