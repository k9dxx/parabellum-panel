'use strict';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const siteURL = 'https://k9dxx.github.io/parabellum-panel/';
let content = null;
const element = (tag, text, cls) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (cls) node.className = cls;
  return node;
};
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const dateText = value => {
  const date = new Date(value + 'T12:00:00');
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' });
};
$('#year').textContent = new Date().getFullYear();
const menu = $('#menu'), sidebar = $('#sidebar'), overlay = $('#menu-overlay');
function closeMenu() {
  sidebar.classList.remove('open'); sidebar.inert = matchMedia('(max-width:760px)').matches; overlay.hidden = true;
  menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label','Abrir menu');
}
menu.addEventListener('click', () => {
  const open = sidebar.classList.toggle('open');
  sidebar.inert = !open && matchMedia('(max-width:760px)').matches;
  overlay.hidden = !open;
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
});
overlay.addEventListener('click', closeMenu);
$$('#sidebar a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && sidebar.classList.contains('open')) { closeMenu(); menu.focus(); }
});
window.matchMedia('(max-width:760px)').addEventListener('change', closeMenu);
closeMenu();
const dialog = $('#detail');
function showDetail(node) {
  $('#detail-body').replaceChildren(node); dialog.showModal();
}
dialog.addEventListener('click', e => { if (e.target === dialog) {
  const r = dialog.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
}});
function roleName(id) { return content.cargos.find(r => r.id === id)?.nome || id; }
function renderMembers() {
  const target = $('#members-list'); if (!target) return;
  const query = normalize($('#member-search').value), role = $('#role-filter').value;
  const members = content.membros.filter(m => (!role || m.cargo === role) && normalize(m.nome+' '+m.descricao).includes(query));
  target.replaceChildren();
  $('#member-result').textContent = members.length + ' integrante(s) encontrado(s)';
  if (!members.length) target.append(element('p','Nenhum integrante encontrado. Tente outro nome ou cargo.','empty-state'));
  members.forEach(m => {
    const card = element('article', undefined, 'panel member-card');
    card.append(element('div',m.nome.slice(0,2).toUpperCase(),'avatar'), element('span',roleName(m.cargo),'tag'), element('h3',m.nome), element('p',m.descricao));
    const button = element('button','VER PERFIL ↗','button');
    button.addEventListener('click', () => {
      const detail = element('div');
      detail.append(element('small',roleName(m.cargo),'eyebrow'),element('h2',m.nome),element('p',m.descricao));
      if (m.instagram) {
        try {
          const url = new URL(m.instagram);
          if (url.protocol === 'https:' && ['www.instagram.com','instagram.com'].includes(url.hostname)) {
            const link=element('a','INSTAGRAM ↗','button red');
            link.href=url.href; link.target='_blank'; link.rel='noopener noreferrer'; detail.append(link);
          }
        } catch { /* An invalid optional social link is omitted. */ }
      }
      detail.append(PBLM.sharing('membros',m));showDetail(detail);
    });
    card.dataset.memberId=PBLM.recordId(m);card.append(button,PBLM.saveButton('membros',PBLM.recordId(m))); target.append(card);
  });
}
function renderRoles() {
  const target = $('#roles-list'); if (!target) return;
  target.replaceChildren();
  content.cargos.forEach((role,i) => {
    const card = element('article',undefined,'panel');
    const count = content.membros.filter(m => m.cargo === role.id).length;
    card.append(element('b',String(i+1).padStart(2,'0'),'number'),element('h3',role.nome),element('p',role.descricao),element('small',count+' integrante(s)','muted'));
    target.append(card);
    const option=element('option',role.nome);option.value=role.id;$('#role-filter').append(option);
  });
}
function newsDetail(item) {
  const box = element('article');
  box.append(element('small',item.categoria+' / '+dateText(item.data),'eyebrow'),element('h2',item.titulo));
  item.paragrafos.forEach(p => box.append(element('p',p)));
  box.append(PBLM.sharing('noticias',item));showDetail(box);
}
function renderNews() {
  const target=$('#news-list');if(!target)return;
  const query=normalize($('#news-search')?.value);
  let list=[...content.noticias].sort((a,b)=>b.data.localeCompare(a.data));
  list=list.filter(n=>normalize(n.titulo+' '+n.categoria+' '+n.resumo).includes(query));
  if(!$('#news-search'))list=list.slice(0,3);
  target.replaceChildren();
  if($('#news-result'))$('#news-result').textContent=list.length+' publicação(ões) encontrada(s)';
  if(!list.length)target.append(element('p','Nenhuma publicação encontrada.','empty-state'));
  list.forEach(n=>{
    const card=element('article',undefined,'panel news-card');
    card.append(element('small',n.categoria+' / '+dateText(n.data),'eyebrow'),element('h3',n.titulo),element('p',n.resumo));
    const button=element('button','LER COMUNICADO ↗','button');button.addEventListener('click',()=>newsDetail(n));card.append(button,PBLM.saveButton('noticias',n.id));target.append(card);
  });
}
function safeImage(path) {
  return typeof path === 'string' && /^assets\/artes\/[a-z0-9][a-z0-9._-]*\.(svg|png|jpg|jpeg|webp)$/i.test(path);
}
function renderGallery() {
  const target=$('#gallery-list');if(!target)return;
  const category=$('#gallery-filter').value;
  const list=content.galeria.filter(g=>(!category||g.categoria===category)&&safeImage(g.arquivo));
  target.replaceChildren();$('#gallery-result').textContent=list.length+' arte(s) encontrada(s)';
  if(!list.length)target.append(element('p','Nenhuma arte nesta categoria.','empty-state'));
  list.forEach(g=>{
    const card=element('article',undefined,'panel gallery-card');
    const img=element('img');img.src=g.arquivo;img.alt=g.titulo;img.loading='lazy';img.width=1200;img.height=900;
    card.append(img,element('small',g.categoria,'eyebrow'),element('h3',g.titulo));
    const button=element('button','AMPLIAR','button');
    button.addEventListener('click',()=>{
      const detail=element('div');const large=img.cloneNode();large.loading='eager';detail.append(element('h2',g.titulo),large);detail.append(PBLM.sharing('galeria',g));showDetail(detail);
    });
    const download=element('a','BAIXAR ARTE ↓','button red');download.href=g.arquivo;download.download=g.arquivo.split('/').pop();
    card.append(button,download,PBLM.saveButton('galeria',g.id));target.append(card);
  });
}
function validateData(data) { return PBLM.validate(data); }
async function loadContent() {
  $('#load-error').hidden=true;
  try {
    const response=await fetch('data/conteudo.json',{cache:'no-cache'});
    if(!response.ok)throw new Error('Falha ao carregar conteúdo');
    content=validateData(await response.json());
    $$('[data-count]').forEach(node=>{node.textContent=content[node.dataset.count].length;});
    if($('#role-filter'))$('#role-filter').replaceChildren(new Option('Todos os cargos',''));
    renderRoles();renderMembers();renderNews();
    if($('#gallery-filter')) {
      const select=$('#gallery-filter');select.replaceChildren(new Option('Todas as artes',''));
      [...new Set(content.galeria.map(g=>g.categoria))].forEach(category=>select.add(new Option(category,category)));
      renderGallery();
    }
    for(const node of $$('.load-failed'))node.remove();
    window.PBLM_DATA=content;document.dispatchEvent(new CustomEvent('pblm:loaded',{detail:content}));
  } catch {
    document.dispatchEvent(new Event('pblm:failed'));
    $('#load-error').hidden=false;
    $$('[data-count]').forEach(node=>{node.textContent='—';});
    for(const id of ['#members-list','#roles-list','#news-list','#gallery-list']) {
      if($(id))$(id).replaceChildren(element('p','Conteúdo indisponível. Use “Tentar novamente” abaixo.','empty-state load-failed'));
    }
  }
}
$('#retry').addEventListener('click',loadContent);
$('#member-search')?.addEventListener('input',()=>{if(content)renderMembers();});
$('#role-filter')?.addEventListener('change',()=>{if(content)renderMembers();});
$('#news-search')?.addEventListener('input',()=>{if(content)renderNews();});
$('#gallery-filter')?.addEventListener('change',()=>{if(content)renderGallery();});
$('#join-form')?.addEventListener('submit',e=>{
  e.preventDefault();const name=$('#nickname').value.trim();
  if(!name){$('#join-status').textContent='Informe um apelido para continuar.';return;}
  const url=new URL('https://github.com/k9dxx/parabellum-panel/issues/new');
  url.searchParams.set('title','Pedido de entrada: '+name);
  url.searchParams.set('body','Apelido público: '+name+'\n\nGostaria de participar da PARABELLUM. Li o código de conduta.\n\nAguardando avaliação da administração.');
  location.assign(url.href);
});
async function copyValue(value, field, status) {
  if(!value){status.textContent='Não há conteúdo para copiar.';return;}
  try { await navigator.clipboard.writeText(value);status.textContent='Copiado!'; }
  catch { field.focus();field.select();status.textContent='Selecione e copie o texto manualmente.'; }
}
$('#generate')?.addEventListener('click',()=>{
  const n=Math.max(12,Math.min(64,Math.trunc(Number($('#length').value)||20)));
  $('#length').value=n;
  const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%_-';
  const limit=256-(256%chars.length);let password='';
  try {
    while(password.length<n){const bytes=crypto.getRandomValues(new Uint8Array(n*2));for(const b of bytes){if(b<limit&&password.length<n)password+=chars[b%chars.length];}}
    $('#password').value=password;$('#toolmsg').textContent='Senha gerada localmente. Guarde-a em um lugar seguro.';
  } catch { $('#toolmsg').textContent='A geração segura está indisponível neste navegador. Tente abrir o portal em HTTPS.'; }
});
$('#copy')?.addEventListener('click',()=>copyValue($('#password').value,$('#password'),$('#toolmsg')));
$('#text-counter')?.addEventListener('input',()=>{
  const text=$('#text-counter').value;
  const length=[...text].length;
  $('#text-result').textContent=length+' caracteres · '+(text.trim()?text.trim().split(/\s+/).length:0)+' palavras';
});
$('#copy-text')?.addEventListener('click',()=>copyValue($('#text-counter').value,$('#text-counter'),$('#text-status')));
function tick(){const now=new Date();$('#clock').textContent=now.toLocaleTimeString('pt-BR');$('#today').textContent=now.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});}
if($('#clock')){tick();setInterval(tick,1000);}
$('#share')?.addEventListener('click',async()=>{
  if(navigator.share){try{await navigator.share({title:'⛧ PARABELLUM',url:siteURL});$('#share-status').textContent='Compartilhamento concluído.';return;}catch(e){if(e.name==='AbortError')return;}}
  await copyValue(siteURL,$('#site-url'),$('#share-status'));
});
const routes={explorar:'explorar.html',agenda:'agenda.html',materiais:'materiais.html',favoritos:'favoritos.html',ajuda:'ajuda.html',home:'index.html',membros:'comunidade.html#membros',cargos:'comunidade.html#cargos',regras:'comunidade.html#regras',noticias:'noticias.html',galeria:'galeria.html',ferramentas:'ferramentas.html',terminal:'ferramentas.html#terminal'};
$('#terminal-form')?.addEventListener('submit',e=>{
  e.preventDefault();const raw=$('#command').value.trim();if(!raw)return;
  const c=raw.toLowerCase(),out=$('#output');out.append(element('p','visitor@pblm:~$ '+raw));
  if(c==='clear')out.replaceChildren();
  else if(routes[c])location.assign(routes[c]);
  else {
    const answers={help:['help, about, date, status, clear, home, membros, cargos, regras, noticias, galeria, ferramentas, terminal, explorar, agenda, materiais, favoritos, ajuda'],about:['⛧ PARABELLUM / PBLM.777 — disciplina, lealdade e respeito.'],date:[new Date().toLocaleString('pt-BR')],status:[content?'Conteúdo carregado: '+content.membros.length+' membro(s), '+content.noticias.length+' notícia(s).':'Conteúdo ainda não carregado.','Terminal local ativo.']};
    (answers[c]||['Comando desconhecido. Digite help.']).forEach(line=>out.append(element('p',line)));
  }
  while(out.children.length>100)out.firstElementChild.remove();
  $('#command').value='';out.scrollTop=out.scrollHeight;
});
$('#clear')?.addEventListener('click',()=>$('#output').replaceChildren());
// Preserve links shared before the separate pages existed.
const oldHash=location.hash.slice(1);
if((location.pathname.endsWith('/')||location.pathname.endsWith('/index.html'))&&routes[oldHash])location.replace(routes[oldHash]);
loadContent();
