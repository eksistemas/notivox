const navigationTrail=[];
let navigationPosition=null;
function rememberNavigation(){const current={page,query:filters.query,instrument:filters.instrument,category:filters.category};if(navigationPosition&&navigationPosition.page!==page)navigationTrail.push(navigationPosition);navigationPosition=current;}
function goHome(){filters.query='';filters.category='';filters.instrument='';location.hash='#acervo';render();toggleMenu(false);}
function goBack(){const previous=navigationTrail.pop();if(!previous){goHome();return;}filters.query=previous.query||'';filters.instrument=previous.instrument||'';filters.category=previous.category||'';navigationPosition=null;location.hash='#'+previous.page;render();toggleMenu(false);$('#main').focus();}
function syncNavigationContext(){
 departmentId=state.departments[0].id;
 $('#current-page-label').textContent=currentSection()?.title||({cadastroemail:'Cadastro por e-mail',acessos:'Liberação de acessos',instrumentos:'Instrumentos e vozes'}[page])||'Acervo geral';
 $('#current-page-label').classList.toggle('home-heading',false);$('#storage-label').textContent=location.protocol==='file:'?'Salvo neste navegador':'Acervo compartilhado';
 $$('[data-section-nav]').forEach(link=>{link.setAttribute('aria-disabled','false');link.classList.remove('nav-unavailable');});
 $$('[data-admin-only]').forEach(element=>{element.hidden=!isAdmin();});$$('[data-visitor-only]').forEach(element=>{element.hidden=isAdmin();});
}
function renderCatalogue(){
 page=location.hash.slice(1)||'acervo';if(['selecionar','louvores','inicio'].includes(page))page='acervo';if(!sections[page]&&!['acervo','cadastroemail','acessos','instrumentos'].includes(page))page='acervo';if(!isAdmin()&&['cadastroemail','acessos','instrumentos'].includes(page))page='acervo';
 rememberNavigation();syncNavigationContext();$$('[data-icon]').forEach(span=>{span.innerHTML=icon(sections[span.dataset.icon]?.icon||'folder');});$$('nav a').forEach(link=>{const active=link.dataset.page===page;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
 $('#main').innerHTML=page==='cadastroemail'?registrationView():page==='acessos'?accessView():page==='instrumentos'?instrumentRegistryView():catalogueView();const search=$('#global-search');if(search){search.value=filters.query;search.oninput=event=>{filters.query=event.target.value;updateCatalogue();};}bindPilotForms();bindInstrumentForm();
 if(sections[page]||page==='acervo'){updateCatalogue();for(const [id,key]of [['instrument-filter','instrument'],['genre-filter','category']])if($('#'+id)){$('#'+id).value=filters[key]||'';$('#'+id).onchange=event=>{filters[key]=event.target.value;updateCatalogue();};}}
}
function chooseDepartment(){goHome();}
async function bootCatalogue(){
 const cover=document.createElement('div');cover.className='loading-cover';cover.textContent='Abrindo o acervo…';document.body.append(cover);
 try{const me=await api('/api/me');authenticatedUser=me.user;const response=await api('/api/data');state=validate(response.data);revision=response.revision;departmentId=state.departments[0].id;
 $('.topbar').innerHTML='<button class="icon-button menu-toggle" id="menu-toggle" aria-label="Abrir menu" aria-controls="sidebar" aria-expanded="false">'+icon('menu')+'</button><button class="button secondary navigation-back" data-action="go-back">← Voltar</button><div class="page-context" id="current-page-label">Acervo geral</div><div class="account-bar">'+(isAdmin()&&location.protocol!=='file:'?button('Usuários','users','',true):'')+(me.user?.id?button('Sair','logout','',true):'')+'<span class="badge" id="storage-label"></span></div>';
 $('#menu-toggle').onclick=()=>toggleMenu(!document.body.classList.contains('menu-open'));$('#menu-backdrop').onclick=()=>toggleMenu(false);render();cover.remove();
 }catch(error){cover.innerHTML='<div><h2>Não foi possível abrir o acervo</h2><p>'+esc(error.message)+'</p><button class="button" onclick="location.reload()">Tentar novamente</button></div>';}
}
document.addEventListener('click',event=>{const target=event.target.closest('[data-action]');if(!target)return;if(target.dataset.action==='go-home'){event.preventDefault();goHome();}if(target.dataset.action==='go-back')goBack();if(target.dataset.action==='resources')editResources(target.dataset.id);if(target.dataset.action==='remove-resource')removeResource(target.dataset.song,target.dataset.id);});
