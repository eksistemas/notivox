window.AcervoTheme=(()=>{
 const key='acervo-musical-theme',media=window.matchMedia?.('(prefers-color-scheme: dark)');let choice='system';
 try{const saved=localStorage.getItem(key);if(['system','light','dark'].includes(saved))choice=saved;}catch{}
 function apply(){const value=choice==='system'?(media?.matches?'dark':'light'):choice;document.documentElement.dataset.theme=value;document.documentElement.style.colorScheme=value;}
 function set(value){if(!['system','light','dark'].includes(value))return;choice=value;try{localStorage.setItem(key,value);}catch{}apply();}
 media?.addEventListener?.('change',()=>{if(choice==='system')apply();});apply();return {set,get:()=>choice};
})();
