(() => {
  'use strict';
  const namespace = 'pblm.v2.';
  const labels = { membros:'Integrante', noticias:'Notícia', galeria:'Arte', eventos:'Encontro', recursos:'Material', faq:'Ajuda' };
  const routes = { membros:['comunidade.html','membro'], noticias:['noticias.html','noticia'], galeria:['galeria.html','arte'], eventos:['agenda.html','evento'], recursos:['materiais.html','material'], faq:['ajuda.html','duvida'] };
  const schemas = {
    membros:['nome','cargo','descricao'], cargos:['id','nome','descricao'],
    noticias:['id','titulo','categoria','data','resumo'], galeria:['id','titulo','categoria','arquivo'],
    eventos:['id','titulo','descricao','inicio','fim','local'],
    recursos:['id','titulo','categoria','descricao','arquivo','formato'], faq:['id','pergunta','resposta']
  };
  const create = (tag,text,cls) => { const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el; };
  const slug = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const recordId = item => item.id || slug(item.nome);
  const read = (key, fallback) => { try { const value=localStorage.getItem(namespace+key);return value===null?fallback:JSON.parse(value); } catch { return fallback; } };
  const write = (key,value) => { try { localStorage.setItem(namespace+key,JSON.stringify(value));return true; } catch { return false; } };
  let toastTimer;
  function toast(message) { const el=document.querySelector('#toast');if(!el)return;el.textContent=message;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{el.hidden=true;},4500); }
  function favorites() { const value=read('favorites',[]);return Array.isArray(value)?value.filter(v=>v&&typeof v.kind==='string'&&typeof v.id==='string'&&routes[v.kind]):[]; }
  function isSaved(kind,id) { return favorites().some(f=>f.kind===kind&&f.id===id); }
  function refreshSaveButtons() { document.querySelectorAll('[data-save-kind]').forEach(b=>{const saved=isSaved(b.dataset.saveKind,b.dataset.saveId);b.textContent=saved?'♥ SALVO':'♡ SALVAR';b.setAttribute('aria-pressed',String(saved));}); }
  function saveButton(kind,id) {
    const button=create('button','','button save-button');button.type='button';button.dataset.saveKind=kind;button.dataset.saveId=id;
    const saved=isSaved(kind,id);button.textContent=saved?'♥ SALVO':'♡ SALVAR';button.setAttribute('aria-pressed',String(saved));
    button.addEventListener('click',()=>{
      const list=favorites();const old=list.findIndex(f=>f.kind===kind&&f.id===id);
      if(old>=0)list.splice(old,1);else list.push({kind,id});
      if(!write('favorites',list)){toast('Este navegador não permitiu salvar os favoritos.');return;}
      refreshSaveButtons();document.dispatchEvent(new Event('pblm:favorites'));toast(old>=0?'Removido dos favoritos.':'Salvo nos favoritos deste navegador.');
    });return button;
  }
  function itemLink(kind,item) { const [path,param]=routes[kind];return path+'?'+new URLSearchParams({[param]:recordId(item)}); }
  async function copy(text) { try { await navigator.clipboard.writeText(text);toast('Copiado!');return true; } catch { toast('Cópia indisponível. Selecione o endereço ou texto e copie manualmente.');return false; } }
  function sharing(kind,item) {
    const box=create('div',undefined,'share-row');const label=create('label','Link deste conteúdo');const input=create('input');input.readOnly=true;input.value=new URL(itemLink(kind,item),location.href).href;input.setAttribute('aria-label','Link deste conteúdo');label.append(input);
    const button=create('button','COPIAR LINK','button');button.type='button';button.addEventListener('click',async()=>{if(!await copy(input.value)){input.focus();input.select();}});
    box.append(label,button,saveButton(kind,recordId(item)));return box;
  }
  function download(name,text,type='text/plain;charset=utf-8') { const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=create('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000); }
  function safeFile(path) { return typeof path==='string'&&/^assets\/downloads\/[a-z0-9][a-z0-9._-]*\.(zip|txt|css|pdf|svg|png|jpg|webp)$/i.test(path); }
  function validate(data) {
    if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('O conteúdo precisa ser um objeto JSON.');
    for(const [kind,fields] of Object.entries(schemas)) {
      if(!Array.isArray(data[kind]))throw new Error('A lista '+kind+' está ausente.');
      const seen=new Set();
      for(const item of data[kind]) {
        if(!item||fields.some(k=>typeof item[k]!=='string'||!item[k].trim()))throw new Error('Preencha todos os campos em '+kind+'.');
        const id=recordId(item);if(!/^[a-z0-9][a-z0-9_-]*$/.test(id)||seen.has(id))throw new Error('Identificador inválido ou repetido em '+kind+'.');seen.add(id);
        if(kind==='noticias'&&(!/^\d{4}-\d{2}-\d{2}$/.test(item.data)||!Number.isFinite(Date.parse(item.data+'T12:00:00'))||!Array.isArray(item.paragrafos)||!item.paragrafos.length||item.paragrafos.some(p=>typeof p!=='string'||!p.trim())))throw new Error('Revise a data e os parágrafos da notícia.');
        if(kind==='galeria'&&!/^assets\/artes\/[a-z0-9][a-z0-9._-]*\.(svg|png|jpg|jpeg|webp)$/i.test(item.arquivo))throw new Error('Revise o caminho da arte.');
        if(kind==='recursos'&&!safeFile(item.arquivo))throw new Error('Revise o caminho do material.');
        if(kind==='membros'&&item.instagram) { const u=new URL(item.instagram);if(u.protocol!=='https:'||!['instagram.com','www.instagram.com'].includes(u.hostname))throw new Error('Use um endereço HTTPS do Instagram.'); }
        if(kind==='eventos') { const re=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2})$/;if(!re.test(item.inicio)||!re.test(item.fim)||!Number.isFinite(Date.parse(item.inicio))||!Number.isFinite(Date.parse(item.fim))||Date.parse(item.fim)<=Date.parse(item.inicio))throw new Error('Use início e fim válidos, com fuso horário, em ordem cronológica.'); }
      }
    }
    const roles=new Set(data.cargos.map(c=>c.id));if(data.membros.some(m=>!roles.has(m.cargo)))throw new Error('Um integrante usa um cargo que não existe.');return data;
  }
  const preferences = () => { const value=read('preferences',{});return value&&typeof value==='object'&&!Array.isArray(value)?value:{}; };
  function applyPreferences() { const p=preferences();document.documentElement.classList.toggle('high-contrast',p.contrast===true);document.documentElement.classList.toggle('reduce-motion',p.motion===true);document.documentElement.classList.toggle('reading-mode',p.reading===true); }
  applyPreferences();window.addEventListener('storage',event=>{if(event.key?.startsWith(namespace)){applyPreferences();refreshSaveButtons();document.dispatchEvent(new Event('pblm:favorites'));}});
  function ics(event) {
    const escape=s=>String(s).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
    const date=d=>new Date(d).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
    const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//PARABELLUM//Agenda//PT-BR','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:'+escape(event.id)+'@parabellum-panel','DTSTAMP:'+date(new Date()),'DTSTART:'+date(event.inicio),'DTEND:'+date(event.fim),'SUMMARY:'+escape(event.titulo),'DESCRIPTION:'+escape(event.descricao),'LOCATION:'+escape(event.local),'END:VEVENT','END:VCALENDAR'];
    // Fold at 70 UTF-8 bytes without splitting a multibyte character.
    return lines.map(line=>{let result='',row='',bytes=0;for(const char of line){const n=new TextEncoder().encode(char).length;if(bytes+n>70){result+=row+'\r\n';row=' ';bytes=1;}row+=char;bytes+=n;}return result+row;}).join('\r\n')+'\r\n';
  }
  window.PBLM={labels,routes,schemas,create,slug,recordId,read,write,toast,favorites,isSaved,saveButton,sharing,itemLink,download,copy,safeFile,validate,preferences,applyPreferences,ics,refreshSaveButtons};
})();
