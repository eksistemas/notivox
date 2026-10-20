import {assets} from './assets.mjs';
import {seed,validate,authorizeUpdate} from './domain.mjs';
import {fileRoutes} from './files.mjs';
import {backupRoutes} from './backup-server.mjs';
const te=new TextEncoder();
const hex=b=>[...new Uint8Array(b)].map(v=>v.toString(16).padStart(2,'0')).join('');
const random=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
const sha=async s=>hex(await crypto.subtle.digest('SHA-256',te.encode(s)));
async function hashPassword(password,salt){const k=await crypto.subtle.importKey('raw',te.encode(password),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:te.encode(salt),iterations:100000,hash:'SHA-512'},k,256));}
const eq=(a,b)=>{if(a.length!==b.length)return false;let v=0;for(let i=0;i<a.length;i++)v|=a.charCodeAt(i)^b.charCodeAt(i);return v===0};
function username(v){if(typeof v!=='string')throw Error('Usuário ou senha incorretos.');const value=v.trim().toLowerCase();if(value.includes('@'))return email(value);if(!/^[a-z0-9._-]{3,40}$/.test(value))throw Error('Usuário ou senha incorretos.');return value;}
function password(v){if(typeof v!=='string'||v.length<4||v.length>128)throw Error('A senha precisa ter de 4 a 128 caracteres.');return v;}
function email(value){const result=String(value||'').trim().toLowerCase();if(result.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result))fail('Informe um e-mail válido.');return result;}
const baseHeaders={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','X-Frame-Options':'SAMEORIGIN'};
const json=(v,status=200,extra={})=>new Response(JSON.stringify(v),{status,headers:{...baseHeaders,'Content-Type':'application/json; charset=utf-8',...extra}});
const redirect=to=>new Response(null,{status:303,headers:{...baseHeaders,Location:to}});
const fail=(message,status=400)=>{const e=Error(message);e.status=status;throw e};
function cookie(request,token,maxAge=28800){return 'adnipo_session='+token+'; Path=/; HttpOnly; SameSite=Strict; Max-Age='+maxAge+(new URL(request.url).protocol==='https:'?'; Secure':'');}
async function body(req){if(!req.headers.get('content-type')?.startsWith('application/json'))fail('Envie JSON válido.',415);const s=await req.text();if(s.length>2000000)fail('Conteúdo muito grande.',413);try{return JSON.parse(s)}catch{fail('Conteúdo inválido.');}}
async function session(request,db){const token=request.headers.get('cookie')?.match(/(?:^|;\s*)adnipo_session=([a-f0-9]{64})(?:;|$)/)?.[1];if(!token)return null;const tokenHash=await sha(token);return db.prepare('SELECT users.id, users.username, users.role, users.department_id AS departmentId, sessions.token_hash FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.token_hash=? AND sessions.expires>?').bind(tokenHash,Date.now()).first();}
async function newSession(req,db,user){const token=random();await db.batch([db.prepare('DELETE FROM sessions WHERE expires<?').bind(Date.now()),db.prepare('INSERT INTO sessions(token_hash,user_id,expires) VALUES(?,?,?)').bind(await sha(token),user.id,Date.now()+28800000)]);return json({user:{id:user.id,username:user.username,role:user.role,departmentId:user.departmentId||null}},200,{'Set-Cookie':cookie(req,token)});}
async function attempt(db,id){const now=Date.now();await db.prepare('INSERT INTO attempts(id,count,until) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET count=CASE WHEN attempts.until<? THEN 1 ELSE attempts.count+1 END, until=CASE WHEN attempts.until<? THEN excluded.until ELSE attempts.until END').bind(id,now+600000,now,now).run();return db.prepare('SELECT count,until FROM attempts WHERE id=?').bind(id).first();}
function asset(path){const a=assets[path];if(!a)return new Response('Não encontrado',{status:404,headers:baseHeaders});const bytes=Uint8Array.from(atob(a.data),c=>c.charCodeAt(0));return new Response(bytes,{headers:{...baseHeaders,'Content-Type':a.type}});}
export default {async fetch(req,env){try{const u=new URL(req.url),p=u.pathname,db=env.DB;
if(!['GET','HEAD','POST','PUT','DELETE'].includes(req.method))return json({error:'Método não permitido.'},405);
if(['POST','PUT','DELETE'].includes(req.method)&&req.headers.get('origin')!==u.origin)return json({error:'Origem não autorizada.'},403);
if(['GET','HEAD'].includes(req.method)&&['/manifest.webmanifest','/service-worker.js','/offline.html','/icons/app-192.png','/icons/app-512.png'].includes(p))return asset(p);
if(p==='/assets/pdf/pdf.js'||p==='/assets/pdf/pdf.worker.js')return asset(p);
if(p==='/theme.js')return asset(p);
if(p==='/styles.css'||p==='/login.js'||p==='/assets/logo.png')return asset(p);
if(!db)return json({error:'O serviço está temporariamente indisponível.'},503);
if(env.INITIAL_ADMIN_HASH&&env.INITIAL_ADMIN_SALT&&!await db.prepare("SELECT id FROM users WHERE role='admin' LIMIT 1").first()){const initialName=username(env.INITIAL_ADMIN_USERNAME||'admin');await db.prepare("INSERT INTO users(id,username,salt,password_hash,role) SELECT 1,?,?,?,'admin' WHERE NOT EXISTS(SELECT 1 FROM users WHERE role='admin')").bind(initialName,env.INITIAL_ADMIN_SALT,env.INITIAL_ADMIN_HASH).run();}
const loginRequired=env.REQUIRE_LOGIN!==false&&env.REQUIRE_LOGIN!=='false';
const signedIn=await session(req,db);
const me=signedIn||(loginRequired?null:{id:0,username:'Visitante',role:'member'});
if(['GET','HEAD'].includes(req.method)&&['/login','/login.html'].includes(p))return signedIn?redirect(signedIn.role==='admin'?'/#gerenciar':'/#inicio'):asset('/login.html');
if(['GET','HEAD'].includes(req.method)&&p==='/admin/login')return !signedIn?asset('/login.html'):redirect(signedIn.role==='admin'?'/#gerenciar':'/#inicio');
if(p==='/'&&!me)return redirect('/login');
if(p==='/api/status'&&req.method==='GET'){const exists=await db.prepare("SELECT id FROM users WHERE role='admin' LIMIT 1").first();return json({setupRequired:!exists,setupAvailable:env.LOCAL_ONLY===true,loginRequired});}
if(p==='/api/setup'&&req.method==='POST'){
const local=env.LOCAL_ONLY===true&&['127.0.0.1','localhost'].includes(u.hostname);
if(!local&&!req.headers.get('oai-authenticated-user-id'))fail('A configuração inicial precisa ser feita pelo proprietário autenticado.',403);
if(await db.prepare("SELECT id FROM users WHERE role='admin' LIMIT 1").first())fail('O administrador já foi configurado.',409);
const b=await body(req),name=username(b.username),pass=password(b.password);if(b.password!==b.confirm)fail('As senhas não coincidem.');
const salt=random(),hash=await hashPassword(pass,salt);
const result=await db.prepare("INSERT INTO users(id,username,salt,password_hash,role) SELECT 1,?,?,?,'admin' WHERE NOT EXISTS(SELECT 1 FROM users WHERE role='admin')").bind(name,salt,hash).run();if(!result.meta.changes)fail('O administrador já foi configurado.',409);return newSession(req,db,{id:1,username:name,role:'admin'});
}
if(p==='/api/signup'&&req.method==='POST'){
const b=await body(req);let name;try{name=username(b.username)}catch{fail('Informe um e-mail ou usuário válido.');}
if(typeof b.password!=='string'||b.password.length<8||b.password.length>128)fail('A senha precisa ter de 8 a 128 caracteres.');
if(b.password!==b.confirm)fail('As senhas não coincidem.');
const ip=req.headers.get('cf-connecting-ip')||req.headers.get('x-real-ip')||req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'shared';
const keys=[await sha('signup-ip:'+ip),await sha('signup-user:'+name)];const counters=await Promise.all(keys.map(k=>attempt(db,k)));
if(counters[0].count>20||counters[1].count>5)fail('Muitas tentativas de cadastro. Aguarde 10 minutos e tente novamente.',429);
if(await db.prepare('SELECT id FROM users WHERE username=?').bind(name).first())fail('Não foi possível criar a conta. Verifique os dados ou use outro usuário.',409);
const salt=random(),hash=await hashPassword(b.password,salt);
try{await db.prepare("INSERT INTO users(username,salt,password_hash,role) VALUES(?,?,?,'member')").bind(name,salt,hash).run();}
catch(error){const detail=String(error?.cause?.message||error?.message||'');if(error?.code==='23505'||error?.cause?.code==='23505'||/unique constraint|duplicate key/i.test(detail))fail('Não foi possível criar a conta. Verifique os dados ou use outro usuário.',409);throw error;}
return newSession(req,db,{id:(await db.prepare('SELECT id FROM users WHERE username=?').bind(name).first()).id,username:name,role:'member'});
}
if(p==='/api/login'&&req.method==='POST'){
const b=await body(req);let name;try{name=username(b.username)}catch{fail('Usuário ou senha incorretos.',401)}
const ip=req.headers.get('cf-connecting-ip')||req.headers.get('oai-authenticated-user-id')||'local';
const keys=[await sha('ip:'+ip),await sha('user:'+name)];const counters=await Promise.all(keys.map(k=>attempt(db,k)));
if(counters[0].count>30||counters[1].count>8)fail('Muitas tentativas. Aguarde 10 minutos e tente novamente.',429);
const user=await db.prepare('SELECT * FROM users WHERE username=?').bind(name).first();
const salt=user?.salt||'demo-salt-for-timing-000000000000000000000000000000';
const pass=typeof b.password==='string'&&b.password.length<=128?b.password:'';
const candidate=await hashPassword(pass,salt);
if(!user||!eq(candidate,user.password_hash))fail('Usuário ou senha incorretos.',401);
if(b.audience==='admin'&&user.role!=='admin')fail('Esta conta não tem acesso administrativo.',403);
if(b.audience==='member'&&user.role==='admin')fail('Use a entrada administrativa.',403);
await db.prepare('DELETE FROM attempts WHERE id=?').bind(keys[1]).run();return newSession(req,db,user);
}
if(p==='/api/email-login'&&req.method==='POST')fail('Entre com seu e-mail ou usuário e senha.',403);
if(!me){if(p.startsWith('/api/'))return json({error:'Entre com seu usuário e senha.'},401);return redirect(p==='/admin'||p.startsWith('/admin/')?'/admin/login':'/login');}
const fileResponse=await fileRoutes(req,env,me);if(fileResponse)return fileResponse;
const backupResponse=await backupRoutes(req,env,me);if(backupResponse)return backupResponse;
if(p==='/login')return redirect(me.role==='admin'?'/#gerenciar':'/#inicio');
if(p==='/admin'||p.startsWith('/admin/')){if(!signedIn)return redirect('/admin/login');if(me.role!=='admin')return redirect('/#inicio');}
if(p==='/admin'||p==='/admin/musicas')return signedIn?.role==='admin'?redirect('/#gerenciar'):signedIn?redirect('/#inicio'):redirect('/admin/login');
if(p==='/admin/musicas/nova')return signedIn?.role==='admin'?redirect('/#gerenciar/nova'):redirect('/admin/login');
const adminSongRoute=/^\/admin\/musicas\/([^/]+)$/.exec(p);if(adminSongRoute)return signedIn?.role==='admin'?redirect('/#gerenciar/musicas/'+encodeURIComponent(decodeURIComponent(adminSongRoute[1]))):redirect('/admin/login');
if(p==='/inicio'||p==='/repertorio')return redirect('/#'+p.slice(1));
const songRoute=/^\/musica\/([^/]+)$/.exec(p);if(songRoute)return redirect('/#musica/'+encodeURIComponent(decodeURIComponent(songRoute[1])));
if(p==='/api/me'&&req.method==='GET')return json({user:{id:me.id,username:me.username,role:me.role,departmentId:me.departmentId||null},loginRequired});
if(p==='/api/logout'&&req.method==='POST'){if(signedIn)await db.prepare('DELETE FROM sessions WHERE token_hash=?').bind(me.token_hash).run();return json({ok:true},200,{'Set-Cookie':cookie(req,'',0)});}
if(p==='/api/members'){
 if(me.role!=='admin')fail('Somente o administrador pode cadastrar e liberar e-mails.',403);
 if(req.method==='GET'){const all=await db.prepare("SELECT id,username AS email FROM users WHERE role='member' AND username LIKE '%@%' ORDER BY username").all();return json({members:all.results});}
 if(req.method==='POST'){
  const b=await body(req);
  if(b.action==='remove'){
   const user=await db.prepare("SELECT id FROM users WHERE id=? AND role='member' AND username LIKE '%@%'").bind(b.id).first();if(!user)fail('Cadastro não encontrado.',404);
   await db.batch([db.prepare('DELETE FROM sessions WHERE user_id=?').bind(user.id),db.prepare('DELETE FROM users WHERE id=?').bind(user.id)]);return json({ok:true});
  }
  const address=email(b.email),pass=password(b.password),salt=random(),hash=await hashPassword(pass,salt),existing=await db.prepare('SELECT id,role FROM users WHERE username=?').bind(address).first();
  if(existing){if(existing.role!=='member')fail('Este endereço já pertence a outra conta.',409);await db.batch([db.prepare('DELETE FROM sessions WHERE user_id=?').bind(existing.id),db.prepare('UPDATE users SET salt=?,password_hash=? WHERE id=?').bind(salt,hash,existing.id)]);return json({ok:true},200);}
  await db.prepare("INSERT INTO users(username,salt,password_hash,role) VALUES(?,?,?,'member')").bind(address,salt,hash).run();return json({ok:true},201);
 }
}
if(p==='/api/users'){
if(me.role!=='admin')fail('Somente o administrador pode gerenciar usuários.',403);
if(req.method==='GET'){const all=await db.prepare('SELECT id,username,role,department_id AS departmentId FROM users ORDER BY id').all();const row=await db.prepare('SELECT payload FROM app_data WHERE id=1').first();const songs=row?validate(JSON.parse(row.payload)).songs:[];const users=all.results.map(user=>{const songCount=songs.filter(song=>song.createdBy===user.id).length;return {...user,songCount,billingThreshold:20,billingEligible:songCount>20};});return json({users});}
if(req.method==='POST'){const b=await body(req),name=username(b.username),pass=password(b.password);if(!['admin','department_admin','member'].includes(b.role))fail('Perfil inválido.');const departmentId=b.role==='department_admin'?b.departmentId:null;if(b.role==='department_admin'){const row=await db.prepare('SELECT payload FROM app_data WHERE id=1').first();const data=row?validate(JSON.parse(row.payload)):seed;if(!data.departments.some(department=>department.id===departmentId))fail('Selecione um departamento válido.');}const existing=await db.prepare('SELECT id,password_hash FROM users WHERE username=?').bind(name).first();if(existing&&existing.password_hash!=='backup-disabled')fail('Usuario ja existe.',409);const salt=random();if(existing){await db.prepare('UPDATE users SET salt=?,password_hash=? WHERE id=?').bind(salt,await hashPassword(pass,salt),existing.id).run();return json({ok:true},200);}await db.prepare('INSERT INTO users(username,salt,password_hash,role,department_id) VALUES(?,?,?,?,?)').bind(name,salt,await hashPassword(pass,salt),b.role,departmentId).run();return json({ok:true},201);}
}
if(p==='/api/songs'&&req.method==='POST'){
if(me.role!=='member')fail('Este cadastro está disponível para contas de músico.',403);
const b=await body(req),input=b.song;if(!input||typeof input!=='object'||Array.isArray(input))fail('Informe os dados da música.');
await db.prepare('INSERT OR IGNORE INTO app_data(id,payload,revision) VALUES(1,?,1)').bind(JSON.stringify(seed)).run();const row=await db.prepare('SELECT payload,revision FROM app_data WHERE id=1').first();if(!row)fail('O acervo ainda não foi inicializado.',503);const current=validate(JSON.parse(row.payload));if(current.songs.length>=1000)fail('O acervo atingiu o limite de músicas.',409);
const departmentId=current.departments[0].id;const keyValue=typeof input.key==='string'?input.key:'C';const song={id:crypto.randomUUID(),createdBy:me.id,name:typeof input.name==='string'?input.name.trim():'',artist:typeof input.artist==='string'?input.artist.trim():'',key:keyValue,originalKey:typeof input.originalKey==='string'?input.originalKey:keyValue,category:typeof input.category==='string'?input.category.trim():'',notes:typeof input.notes==='string'?input.notes:'',lyrics:typeof input.lyrics==='string'?input.lyrics:'',chords:typeof input.chords==='string'?input.chords:'',scoreLink:typeof input.scoreLink==='string'?input.scoreLink.trim():'',gradeLink:typeof input.gradeLink==='string'?input.gradeLink.trim():'',projectionLink:typeof input.projectionLink==='string'?input.projectionLink.trim():'',voicesLink:typeof input.voicesLink==='string'?input.voicesLink.trim():'',videoLink:typeof input.videoLink==='string'?input.videoLink.trim():'',audioLink:'',pdfLink:typeof input.pdfLink==='string'?input.pdfLink.trim():'',bpm:Number(input.bpm||80),departmentIds:[departmentId],resources:[]};
if(input.audioFileId){if(typeof input.audioFileId!=='string'||!env.BUCKET)fail('Não foi possível validar o arquivo de áudio.',400);const object=await env.BUCKET.get('uploads/'+input.audioFileId+'/manifest');if(!object)fail('O arquivo de áudio não foi encontrado.',400);const manifest=await object.json();if(manifest.createdBy!==me.id||manifest.purpose!=='song-audio'||manifest.status!=='complete'||!['mp3','wav','m4a','ogg','aac','flac'].includes(manifest.name.split('.').at(-1).toLowerCase()))fail('O arquivo de áudio não está disponível para esta música.',403);song.resources.push({id:crypto.randomUUID(),type:'audio',instrument:'Geral',label:manifest.name,url:new URL('/api/media/'+manifest.id,u.origin).href,storage:'server',fileId:manifest.id});}
const next=structuredClone(current);next.songs.push(song);const validated=validate(next);const saved=await db.prepare('UPDATE app_data SET payload=?,revision=revision+1 WHERE id=1 AND revision=?').bind(JSON.stringify(validated),row.revision).run();if(!saved.meta.changes)fail('O acervo foi alterado ao mesmo tempo. Atualize e tente novamente.',409);return json({ok:true,id:song.id,revision:row.revision+1},201);
}
if(p==='/api/data'){
if(req.method==='GET'){
await db.prepare('INSERT OR IGNORE INTO app_data(id,payload,revision) VALUES(1,?,1)').bind(JSON.stringify(seed)).run();
const row=await db.prepare('SELECT payload,revision FROM app_data WHERE id=1').first();return json({data:validate(JSON.parse(row.payload)),revision:row.revision});
}
if(req.method==='PUT'){
if(!['admin','department_admin'].includes(me.role))fail('Este perfil permite apenas consulta.',403);
const b=await body(req),next=validate(b.data);if(!Number.isInteger(b.revision))fail('Revisão inválida.');
const row=await db.prepare('SELECT payload,revision FROM app_data WHERE id=1').first();if(!row||row.revision!==b.revision)fail('Os dados mudaram em outra janela. Atualize a página antes de salvar.',409);
if(!authorizeUpdate(me,validate(JSON.parse(row.payload)),next))fail('Voce pode organizar apenas a agenda e o repertorio da seu departamento.',403);
const result=await db.prepare('UPDATE app_data SET payload=?,revision=revision+1 WHERE id=1 AND revision=?').bind(JSON.stringify(next),b.revision).run();if(!result.meta.changes)fail('Os dados mudaram em outra janela. Atualize a página antes de salvar.',409);return json({ok:true,revision:b.revision+1});
}
}
if(p==='/'||p==='/index.html'||p==='/teste.index.html')return asset('/app.html');
if(p==='/app.js'||p==='/data.js'||/^\/assets\/voz-[0-3]\.wav$/.test(p))return asset(p);
return json({error:'Não encontrado.'},404);
}catch(e){const status=e.status||400;if(/SQLITE|D1|database/i.test(e.message)){console.error('ADNIPO: falha de armazenamento');return json({error:'Não foi possível acessar os dados. Tente novamente em instantes.'},503);}return json({error:e.message||'Não foi possível concluir.'},status);}}};
export {hashPassword};

