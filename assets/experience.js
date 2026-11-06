/* PARABELLUM Experience — personalização local, preservando todas as páginas e seus dados. */
(() => {
  'use strict';
  const KEY='pblm.experience.v1';
  const defaults={cards:'classic',corners:'sharp',density:'normal',animation:'cinematic',wallpaper:true};
  let wallpaperUrl=null;
  const root=document.documentElement;
  const $=(selector)=>document.querySelector(selector);
  const node=(tag,text,className)=>{
    const n=document.createElement(tag);
    if(text!==undefined)n.textContent=text;
    if(className)n.className=className;
    return n;
  };
  function read(){
    let saved={};
    try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch{}
    return {
      cards:['classic','glass'].includes(saved.cards)?saved.cards:defaults.cards,
      corners:['sharp','soft','rounded'].includes(saved.corners)?saved.corners:defaults.corners,
      density:['normal','compact'].includes(saved.density)?saved.density:defaults.density,
      animation:['off','soft','cinematic'].includes(saved.animation)?saved.animation:defaults.animation,
      wallpaper:saved.wallpaper!==false
    };
  }
  function save(p){
    try{localStorage.setItem(KEY,JSON.stringify(p));return true;}catch{return false;}
  }
  function legacyMotion(){
    try{
      const p=JSON.parse(localStorage.getItem('pblm.preferences.v1')||'{}');
      return p.motion!==false;
    }catch{return true;}
  }
  function apply(){
    const p=read();
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.classList.toggle('pblm-rounded',p.corners==='rounded');
    root.classList.toggle('pblm-soft',p.corners==='soft');
    root.classList.toggle('pblm-compact',p.density==='compact');
    root.classList.toggle('pblm-glass',p.cards==='glass');
    root.classList.toggle('pblm-experience-motion',p.animation!=='off'&&legacyMotion()&&!reduced);
    root.classList.toggle('pblm-soft-motion',p.animation==='soft'&&legacyMotion()&&!reduced);
    root.classList.toggle('pblm-cinematic-motion',p.animation==='cinematic'&&legacyMotion()&&!reduced);
    root.classList.toggle('pblm-wallpaper',Boolean(wallpaperUrl)&&p.wallpaper);
    root.style.setProperty('--pblm-wallpaper',wallpaperUrl?'url("'+wallpaperUrl+'")':'none');
  }
  function db(){
    return new Promise((resolve,reject)=>{
      if(!('indexedDB' in window)){reject(new Error('Armazenamento não suportado'));return;}
      const request=indexedDB.open('pblm-experience-assets',1);
      request.onupgradeneeded=()=>{
        const database=request.result;
        if(!database.objectStoreNames.contains('images'))database.createObjectStore('images');
      };
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error);
    });
  }
  async function storage(method,value){
    const database=await db();
    return new Promise((resolve,reject)=>{
      const transaction=database.transaction('images',method==='get'?'readonly':'readwrite');
      const store=transaction.objectStore('images');
      const request=method==='put'?store.put(value,'wallpaper'):method==='delete'?store.delete('wallpaper'):store.get('wallpaper');
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error);
      transaction.oncomplete=()=>database.close();
      transaction.onabort=()=>{database.close();reject(transaction.error);};
    });
  }
  function setWallpaperBlob(blob){
    if(wallpaperUrl)URL.revokeObjectURL(wallpaperUrl);
    wallpaperUrl=blob instanceof Blob&&blob.type.startsWith('image/')?URL.createObjectURL(blob):null;
    apply();
    const image=$('#pblm-exp-wallpaper');
    if(image){
      if(wallpaperUrl){image.src=wallpaperUrl;image.hidden=false;}
      else{image.removeAttribute('src');image.hidden=true;}
    }
  }
  const introTimer=()=>{};
  function reveals(){
    if(!root.classList.contains('pblm-experience-motion')||!('IntersectionObserver' in window))return;
    const elements=[...document.querySelectorAll('.feature-card,.discovery-card,.news-card,.stats article,.resource-card')];
    if(!elements.length)return;
    const observer=new IntersectionObserver(items=>{
      for(const item of items)if(item.isIntersecting){
        item.target.classList.add('pblm-visible');
        observer.unobserve(item.target);
      }
    },{threshold:.07,rootMargin:'0px 0px 36px 0px'});
    for(const element of elements){
      element.classList.add('pblm-reveal');
      observer.observe(element);
    }
    // Never leave content invisible if the browser throttles observers.
    setTimeout(()=>{elements.forEach(x=>x.classList.add('pblm-visible'));observer.disconnect();},2000);
  }
  function select(labelText,options,value,change){
    const label=node('label',labelText);
    const select=document.createElement('select');
    for(const [v,title] of options){
      const option=node('option',title);
      option.value=v;select.append(option);
    }
    select.value=value;
    select.addEventListener('change',()=>change(select.value));
    label.append(select);
    return label;
  }
  function mount(){
    const main=$('main.wrap');
    if(!main||!$('#theme')||$('#pblm-experience-settings'))return;
    const panel=node('section',undefined,'panel');
    panel.id='pblm-experience-settings';
    panel.append(node('h2','✦ Interface avançada'));
    panel.append(node('p','Personalize cards, animações, espaçamento e fundo do portal. As alterações valem apenas neste navegador.','sub'));
    const grid=node('div',undefined,'pblm-exp-row');
    const p=read();
    const fields=[
      ['cards','Estilo dos cards',[['classic','Original PBLM'],['glass','Glass / neon']]],
      ['corners','Bordas',[['sharp','Retas / hacker'],['soft','Levemente arredondadas'],['rounded','Arredondadas']]],
      ['density','Espaçamento',[['normal','Confortável'],['compact','Compacto']]],
      ['animation','Animações',[['off','Desligadas'],['soft','Suaves'],['cinematic','Cinematográficas']]]
    ];
    const feedback=node('p','', 'status');
    feedback.setAttribute('role','status');
    for(const [key,label,options] of fields){
      grid.append(select(label,options,p[key],value=>{
        const next={...read(),[key]:value};
        if(!save(next)){feedback.textContent='Não foi possível salvar neste navegador.';return;}
        apply();feedback.textContent='✓ Aparência atualizada.';
      }));
    }
    panel.append(grid);
    const wallpaperTitle=node('h2','▧ Papel de parede pessoal');
    wallpaperTitle.style.marginTop='24px';panel.append(wallpaperTitle);
    panel.append(node('p','Selecione uma imagem do seu celular (até 4 MB). Ela fica armazenada localmente neste aparelho, nunca é enviada ao portal.','pblm-exp-tip'));
    const preview=node('img');
    preview.id='pblm-exp-wallpaper';preview.className='pblm-exp-wallpaper-preview';preview.alt='Prévia do fundo selecionado';preview.hidden=true;
    panel.append(preview);
    const actions=node('div',undefined,'pblm-exp-actions');
    const upload=document.createElement('input');
    upload.type='file';upload.accept='image/png,image/jpeg,image/webp';
    upload.setAttribute('aria-label','Escolher papel de parede');
    upload.style.maxWidth='100%';
    upload.addEventListener('change',async()=>{
      const file=upload.files&&upload.files[0];
      if(!file)return;
      if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>4*1024*1024){
        feedback.textContent='Use PNG, JPG ou WebP de até 4 MB.';upload.value='';return;
      }
      try{
        await storage('put',file);
        if(!save({...read(),wallpaper:true})){feedback.textContent='O navegador não permitiu salvar as preferências.';return;}
        setWallpaperBlob(file);feedback.textContent='✓ Papel de parede salvo neste aparelho.';
      }catch{feedback.textContent='Não foi possível salvar a imagem. Verifique o espaço disponível.';}
      upload.value='';
    });
    actions.append(upload);
    const remove=node('button','Remover fundo','btn secondary');
    remove.type='button';
    remove.addEventListener('click',async()=>{
      try{await storage('delete');setWallpaperBlob(null);feedback.textContent='Fundo removido.';}
      catch{feedback.textContent='Não foi possível remover o fundo.';}
    });
    actions.append(remove);
    const showWallpaper=document.createElement('label');
    const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=p.wallpaper;
    checkbox.addEventListener('change',()=>{
      if(!save({...read(),wallpaper:checkbox.checked})){feedback.textContent='Erro ao salvar.';return;}
      apply();feedback.textContent='Preferência salva.';
    });
    showWallpaper.append(checkbox,document.createTextNode(' Mostrar meu fundo'));
    actions.append(showWallpaper);
    panel.append(actions,feedback);
    panel.append(node('p','No APK Android, use ⚙ na barra superior do aplicativo para trocar a animação de entrada e escolher uma foto para o atalho da tela inicial.','pblm-exp-tip'));
    const sections=[...main.children];
    const visual=sections.find(x=>x.querySelector('h2')?.textContent?.includes('Visualização'));
    if(visual)main.insertBefore(panel,visual);else main.append(panel);
  }
  apply();
  storage('get').then(setWallpaperBlob).catch(()=>{});
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{mount();reveals();},{once:true});
  }else{mount();reveals();}
  window.addEventListener('pageshow',apply);
})();
