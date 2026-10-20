const form=document.querySelector('#login-form');
const error=document.querySelector('#login-error');
const submit=document.querySelector('#login-submit');
const password=document.querySelector('#password');
let localSetup=false;
const adminPath=location.pathname==='/admin/login';
const identity=document.querySelector('#identity');
const copy=document.querySelector('#login-description');
const kicker=document.querySelector('#login-kicker');
if(adminPath){
 document.title='Administração · Notivox';
 kicker.textContent='ÁREA ADMINISTRATIVA';
 document.querySelector('#login-title').innerHTML='Administração<br>do Notivox';
 copy.textContent='Entre com a conta de administrador autorizada.';
 document.querySelector('#identity-label').textContent='Usuário administrativo';
 identity.placeholder='Seu usuário administrativo';
 document.querySelector('#login-foot').textContent='Acesso restrito a administradores autorizados.';
}
document.querySelector('#password-toggle').addEventListener('click',event=>{
 const visible=password.type==='password';password.type=visible?'text':'password';
 event.currentTarget.textContent=visible?'Ocultar':'Mostrar';
 event.currentTarget.setAttribute('aria-label',visible?'Ocultar senha':'Mostrar senha');
 event.currentTarget.setAttribute('aria-pressed',String(visible));
});
form.addEventListener('submit',async event=>{
 event.preventDefault();error.textContent='';submit.disabled=true;submit.classList.add('is-loading');
 submit.setAttribute('aria-busy','true');submit.textContent='Entrando…';
 try{
  const response=await fetch(localSetup?'/api/setup':'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:identity.value.trim(),password:password.value,...(localSetup?{confirm:document.querySelector('#confirm').value}:{audience:adminPath?'admin':'member'})})});
  const body=await response.json();if(!response.ok)throw Error(body.error||'Não foi possível entrar.');
  location.replace(body.user.role==='admin'?'/admin':'/inicio');
 }catch(cause){error.textContent=cause.message||'Não foi possível conectar. Tente novamente.';}
 finally{submit.disabled=false;submit.classList.remove('is-loading');submit.removeAttribute('aria-busy');submit.textContent='Entrar';}
});
if(adminPath){
 fetch('/api/status',{cache:'no-store'}).then(async response=>{
  const status=await response.json();if(!response.ok)throw Error(status.error||'Serviço indisponível.');
  if(status.setupRequired){
   if(status.setupAvailable){
    localSetup=true;document.querySelector('#confirm-field').hidden=false;const confirm=document.querySelector('#confirm');confirm.required=true;
    password.minLength=4;password.autocomplete='new-password';document.querySelector('#login-title').textContent='Configurar primeiro administrador';
    copy.textContent='Crie a conta inicial neste servidor local. Essa configuração não fica disponível no site publicado.';submit.textContent='Criar administrador';
   }else{submit.disabled=true;error.textContent='O administrador inicial ainda não foi provisionado. Peça ao responsável pelo sistema para configurar o acesso.';}
  }
 }).catch(()=>{});
}
