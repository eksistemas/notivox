const navigationTrail=[];
let navigationPosition=null;
function rememberNavigation(){const current={page,query:filters.query,instrument:filters.instrument,category:filters.category};if(navigationPosition&&navigationPosition.page!==page)navigationTrail.push(navigationPosition);navigationPosition=current;}
function goHome(){filters.query='';filters.category='';filters.instrument='';location.hash='#inicio';render();}
function goBack(){const previous=navigationTrail.pop();if(!previous){goHome();return;}filters.query=previous.query||'';filters.instrument=previous.instrument||'';filters.category=previous.category||'';navigationPosition=null;location.hash='#'+previous.page;render();$('#main').focus();}
function syncNavigationContext(){
 departmentId=state.departments[0].id;
 const currentPage=$('#current-page-label');if(currentPage)currentPage.textContent=currentSection()?.title||viewTitles[page]||'Acervo geral';
 $('#storage-label').textContent=location.protocol==='file:'?'Neste dispositivo':'Acervo compartilhado';
 $$('[data-section-nav]').forEach(link=>link.setAttribute('aria-disabled','false'));
 $$('[data-admin-only]').forEach(element=>{element.hidden=!isAdmin();});$$('[data-visitor-only]').forEach(element=>{element.hidden=isAdmin();});
}
function renderCatalogue(){
 const requested=location.hash.slice(1);page=requested||'inicio';if(['selecionar','louvores'].includes(page))page='acervo';
 if(!sections[page]&&!Object.hasOwn(viewTitles,page))page='inicio';
 if(!isAdmin()&&['cadastroemail','acessos','instrumentos'].includes(page))page='inicio';
 rememberNavigation();syncNavigationContext();$$('[data-icon]').forEach(span=>{span.innerHTML=icon(sections[span.dataset.icon]?.icon||({inicio:'home',acervo:'folder',favoritos:'star',repertorio:'list',configuracoes:'settings',cadastroemail:'users',acessos:'users',instrumentos:'music'}[span.dataset.icon])||'folder');});
 $$('nav a').forEach(link=>{const active=link.dataset.page===page;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
 const views={inicio:dashboardView,repertorio:repertoireView,configuracoes:settingsView,cadastroemail:registrationView,acessos:accessView,instrumentos:instrumentRegistryView};
 $('#main').innerHTML=views[page]?views[page]():catalogueView();
 const search=$('#global-search');if(search){search.value=filters.query;search.oninput=event=>{filters.query=event.target.value;filters.category='';filters.instrument='';if(page!=='acervo'){location.hash='#acervo';render();}else updateCatalogue();};}
 bindPilotForms();bindInstrumentForm();bindExperience();
 if(sections[page]||['acervo','favoritos'].includes(page)){updateCatalogue();for(const [id,key]of [['instrument-filter','instrument'],['genre-filter','category']]){const control=$('#'+id);if(control){control.value=filters[key]||'';control.onchange=event=>{filters[key]=event.target.value;updateCatalogue();};}}}
}
function chooseDepartment(){goHome();}
async function bootCatalogue(){
 const cover=document.createElement('div');cover.className='loading-cover';cover.textContent='Abrindo seu acervo…';document.body.append(cover);
 try{const me=await api('/api/me');authenticatedUser=me.user;const response=await api('/api/data');state=validate(response.data);revision=response.revision;departmentId=state.departments[0].id;
 const user=me.user?.username||'Usuário',role=isAdmin()?'Administrador':'Consulta',initial=user.trim().slice(0,1).toUpperCase();
 $('.topbar').innerHTML='<button class="icon-button menu-toggle" id="menu-toggle" aria-label="Abrir menu" aria-controls="sidebar" aria-expanded="false">'+icon('menu')+'</button><div class="page-context" id="current-page-label">Início</div><label class="header-search" for="global-search"><span class="sr-only">Pesquisar em todo o acervo</span>'+icon('search')+'<input type="search" id="global-search" placeholder="Buscar músicas, artistas ou gêneros…" autocomplete="off"><kbd aria-hidden="true">/</kbd></label><div class="account-bar"><span class="avatar" aria-hidden="true">'+esc(initial)+'</span><span class="user-identity"><strong>'+esc(user)+'</strong><small>'+role+'</small></span><a class="icon-button" href="#configuracoes" aria-label="Configurações">'+icon('settings')+'</a>'+(me.user?.id?button('Sair','logout','',true):'')+'</div>';
 $('#menu-toggle').onclick=()=>toggleMenu(!document.body.classList.contains('menu-open'));$('#menu-backdrop').onclick=()=>toggleMenu(false);render();cover.remove();
 }catch(error){cover.innerHTML='<div><h2>Não foi possível abrir o acervo</h2><p>'+esc(error.message)+'</p><button class="button" onclick="location.reload()">Tentar novamente</button></div>';}
}
document.addEventListener('click',event=>{const target=event.target.closest('[data-action]');if(target){if(target.dataset.action==='go-home'){event.preventDefault();goHome();}if(target.dataset.action==='go-back')goBack();if(target.dataset.action==='resources')editResources(target.dataset.id);if(target.dataset.action==='remove-resource')removeResource(target.dataset.song,target.dataset.id);}if(event.target.closest('a[href^="#"]')&&document.body.classList.contains('menu-open'))toggleMenu(false);});
document.addEventListener('keydown',event=>{if(event.key==='/'&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!event.target.matches('input,textarea,select,[contenteditable]')&&!document.querySelector('dialog[open]')){event.preventDefault();$('#global-search')?.focus();}});
