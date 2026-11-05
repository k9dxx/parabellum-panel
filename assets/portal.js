(() => {
  'use strict';
  const P=window.PBLM, q=s=>document.querySelector(s), all=s=>[...document.querySelectorAll(s)], el=P.create;
  let data=null, index=[], deepOpened=false, draft=null, published=null;
  all('.copy-command').forEach(button=>button.addEventListener('click',()=>P.copy(button.dataset.command)));
  const human={membros:'Integrantes',cargos:'Cargos',noticias:'Notícias',galeria:'Galeria',eventos:'Agenda',recursos:'Materiais',faq:'Ajuda'};
  const searchDialog=q('#search-dialog');
  function buildIndex() {
    index=[];
    for(const kind of Object.keys(P.routes))for(const item of data[kind])index.push({kind,id:P.recordId(item),title:item.titulo||item.nome||item.pergunta,text:item.resumo||item.descricao||item.resposta||item.categoria||'',href:P.itemLink(kind,item),item});
  }
  function row(record, allowSave=true) {
    const box=el('article',undefined,'result-row');
    const link=el('a');link.href=record.href;link.append(el('small',P.labels[record.kind],'eyebrow'),el('h3',record.title),el('p',record.text));box.append(link);
    if(allowSave&&record.kind!=='faq')box.append(P.saveButton(record.kind,record.id));return box;
  }
  function find(query,type='') {
    const words=normalize(query).trim().split(/\s+/).filter(Boolean);
    return index.filter(r=>(!type||r.kind===type)&&words.every(w=>normalize(r.title+' '+r.text+' '+P.labels[r.kind]).includes(w)))
      .sort((a,b)=>Number(normalize(b.title).includes(normalize(query)))-Number(normalize(a.title).includes(normalize(query))));
  }
  function quickSearch() {
    const query=q('#quick-search').value.trim(),target=q('#quick-results');
    target.replaceChildren();q('#all-results').href='explorar.html?'+new URLSearchParams({q:query});
    if(!data){target.append(el('p','Carregando a busca…'));return;}
    const results=find(query);q('#quick-count').textContent=results.length+' resultado(s)'+(!query?' · explore o portal':'');
    results.slice(0,6).forEach(r=>target.append(row(r,false)));
    if(!results.length)target.append(el('p','Nenhum resultado. Tente outro termo.','empty-state'));
  }
  all('.search-open').forEach(button=>button.addEventListener('click',()=>{closeMenu();searchDialog.showModal();quickSearch();q('#quick-search').focus();}));
  q('#quick-search').addEventListener('input',quickSearch);
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(!searchDialog.open){searchDialog.showModal();quickSearch();}q('#quick-search').focus();}});
  function explore() {
    if(!q('#explore-results')||!data)return;
    const query=q('#explore-query').value,type=q('#explore-type').value,target=q('#explore-results');
    const result=find(query,type);target.replaceChildren();q('#explore-count').textContent=result.length+' resultado(s) encontrado(s)';
    result.forEach(r=>target.append(row(r)));if(!result.length)target.append(el('p','Não encontramos esse conteúdo. Tente outro termo ou categoria.','empty-state'));
    const url=new URL(location.href);if(query.trim())url.searchParams.set('q',query.trim());else url.searchParams.delete('q');if(type)url.searchParams.set('tipo',type);else url.searchParams.delete('tipo');history.replaceState(null,'',url);
  }
  q('#explore-query')?.addEventListener('input',explore);q('#explore-type')?.addEventListener('change',explore);
  function favoriteList() {
    if(!q('#favorite-list')||!data)return;
    const type=q('#favorite-filter').value,target=q('#favorite-list'),saved=P.favorites();
    const list=index.filter(r=>(!type||r.kind===type)&&saved.some(f=>f.kind===r.kind&&f.id===r.id));
    target.replaceChildren();q('#favorite-count').textContent=list.length+' favorito(s) disponível(is)';
    list.forEach(r=>target.append(row(r)));
    if(!list.length){const box=el('div',undefined,'empty-state');box.append(el('h3','Um espaço para o que você gosta.'),el('p','Use o botão ♡ Salvar nos conteúdos do portal. Se um conteúdo for removido, ele deixa de aparecer aqui.'));const link=el('a','EXPLORAR O PORTAL ↗','button red');link.href='explorar.html';box.append(link);target.append(box);}
  }
  q('#favorite-filter')?.addEventListener('change',favoriteList);document.addEventListener('pblm:favorites',favoriteList);
  q('#export-favorites')?.addEventListener('click',()=>P.download('parabellum-favoritos.json',JSON.stringify({favoritos:P.favorites()},null,2),'application/json'));
  function resources() {
    if(!q('#resource-list')||!data)return;
    const category=q('#resource-filter').value,target=q('#resource-list');const list=data.recursos.filter(r=>(!category||r.categoria===category)&&P.safeFile(r.arquivo));target.replaceChildren();q('#resource-count').textContent=list.length+' material(is) disponível(is)';
    list.forEach(r=>{const card=el('article',undefined,'panel resource-card');card.id='material-'+r.id;card.append(el('b','↓','number'),el('small',r.categoria+' / '+r.formato,'eyebrow'),el('h3',r.titulo),el('p',r.descricao));const link=el('a','BAIXAR MATERIAL ↓','button red');link.href=r.arquivo;link.download=r.arquivo.split('/').pop();card.append(link,P.saveButton('recursos',r.id));target.append(card);});
    if(!list.length)target.append(el('p','Nenhum material nesta categoria.','empty-state'));
  }
  q('#resource-filter')?.addEventListener('change',resources);all('[data-color]').forEach(button=>button.addEventListener('click',()=>P.copy(button.dataset.color)));
  function events() {
    if(!q('#event-list')||!data)return;
    q('#event-timezone').textContent=Intl.DateTimeFormat().resolvedOptions().timeZone+' · datas no seu horário local';
    const filter=q('#event-filter').value,now=Date.now(),target=q('#event-list');
    const list=data.eventos.filter(e=>filter==='todos'||(filter==='passados'?Date.parse(e.fim)<now:Date.parse(e.fim)>=now)).sort((a,b)=>Date.parse(a.inicio)-Date.parse(b.inicio));
    if(filter==='passados')list.reverse();
    target.replaceChildren();q('#event-count').textContent=list.length+' encontro(s) publicado(s)';
    list.forEach(item=>{const card=el('article',undefined,'panel event-card');card.id='evento-'+item.id;const dt=new Date(item.inicio);card.append(el('div',dt.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}),'event-date'),el('h3',item.titulo),el('p',item.descricao),el('p',dt.toLocaleString('pt-BR',{dateStyle:'full',timeStyle:'short'})),el('small',item.local,'eyebrow'));const button=el('button','SALVAR NO CALENDÁRIO ↓','button red');button.addEventListener('click',()=>P.download('parabellum-'+item.id+'.ics',P.ics(item),'text/calendar;charset=utf-8'));card.append(button,P.saveButton('eventos',item.id));target.append(card);});
    if(!list.length){const box=el('div',undefined,'empty-state');box.append(el('h3','O próximo encontro começa aqui.'),el('p','Nenhum encontro publicado neste filtro. Quando a administração confirmar uma data, ela aparecerá nesta agenda.'));const link=el('a','SUGERIR UM ENCONTRO ↗','button');link.href='ajuda.html#contato';box.append(link);target.append(box);}
  }
  q('#event-filter')?.addEventListener('change',events);
  function faq() {
    if(!q('#faq-list')||!data)return;
    const query=normalize(q('#faq-search').value),target=q('#faq-list');const list=data.faq.filter(f=>normalize(f.pergunta+' '+f.resposta).includes(query));target.replaceChildren();q('#faq-count').textContent=list.length+' resposta(s) encontrada(s)';
    list.forEach(item=>{const details=el('details',undefined,'faq-item');details.id='duvida-'+item.id;details.append(el('summary',item.pergunta),el('p',item.resposta));target.append(details);});if(!list.length)target.append(el('p','Não encontrou sua dúvida? Use o formulário abaixo.','empty-state'));
  }
  q('#faq-search')?.addEventListener('input',faq);
  q('#contact-form')?.addEventListener('submit',e=>{e.preventDefault();const title=q('#contact-title').value.trim(),body=q('#contact-body').value.trim();if(!title||!body){P.toast('Preencha o título e a mensagem.');return;}const url=new URL('https://github.com/k9dxx/parabellum-panel/issues/new');url.searchParams.set('title','['+q('#contact-type').value+'] '+title);url.searchParams.set('body',body+'\n\nEnviado pelo portal PARABELLUM.');location.assign(url.href);});
  function deepLink() {
    if(deepOpened||!data)return;deepOpened=true;const params=new URLSearchParams(location.search);
    for(const [kind,[path,key]]of Object.entries(P.routes)) {
      const id=params.get(key);if(!id||!location.pathname.endsWith('/'+path))continue;
      const item=data[kind].find(i=>P.recordId(i)===id);if(!item){P.toast('Esse conteúdo não está mais disponível.');return;}
      if(kind==='noticias')newsDetail(item);
      if(kind==='membros'){const card=all('[data-member-id]').find(c=>c.dataset.memberId===id);card?.querySelector('button')?.click();}
      if(kind==='galeria'){const box=el('div');const img=el('img');img.src=item.arquivo;img.alt=item.titulo;box.append(el('h2',item.titulo),img,P.sharing(kind,item));showDetail(box);}
      if(kind==='recursos'){const card=document.getElementById('material-'+id);card?.scrollIntoView({block:'center'});card?.classList.add('highlight-card');}
      if(kind==='eventos'){q('#event-filter').value='todos';events();document.getElementById('evento-'+id)?.scrollIntoView({block:'center'});}
      if(kind==='faq'){const details=document.getElementById('duvida-'+id);if(details){details.open=true;details.scrollIntoView({block:'center'});}}
    }
  }
  const prefInputs={contrast:q('#pref-contrast'),motion:q('#pref-motion'),reading:q('#pref-reading')};
  for(const [key,input]of Object.entries(prefInputs))if(input){input.checked=P.preferences()[key]===true;input.addEventListener('change',()=>{if(!P.write('preferences',{...P.preferences(),[key]:input.checked})){input.checked=!input.checked;P.toast('Não foi possível salvar a preferência.');return;}P.applyPreferences();P.toast('Preferência salva neste navegador.');});}
  q('#reset-preferences')?.addEventListener('click',()=>{if(!P.write('preferences',{})){P.toast('Não foi possível restaurar as preferências.');return;}Object.values(prefInputs).forEach(input=>{if(input)input.checked=false;});P.applyPreferences();P.toast('Aparência padrão restaurada.');});
  q('#export-personal')?.addEventListener('click',()=>P.download('parabellum-dados-locais.json',JSON.stringify({favoritos:P.favorites(),preferencias:P.preferences(),anotacoes:P.read('notes','')},null,2),'application/json'));
  if(q('#local-notes')){const notes=P.read('notes','');q('#local-notes').value=typeof notes==='string'?notes:'';}
  q('#save-notes')?.addEventListener('click',()=>{q('#notes-status').textContent=P.write('notes',q('#local-notes').value)?'Salvo somente neste navegador.':'Não foi possível salvar neste navegador. Baixe o texto para guardar.';});
  q('#download-notes')?.addEventListener('click',()=>P.download('parabellum-anotacoes.txt',q('#local-notes').value));
  all('[data-text-action]').forEach(button=>button.addEventListener('click',()=>{const input=q('#text-counter');const action=button.dataset.textAction;input.value=action==='upper'?input.value.toLocaleUpperCase('pt-BR'):action==='lower'?input.value.toLocaleLowerCase('pt-BR'):input.value.trim().replace(/[ \t]+/g,' ');input.dispatchEvent(new Event('input'));input.focus();}));
  const top=q('#back-top');window.addEventListener('scroll',()=>{top.hidden=window.scrollY<450;},{passive:true});top.addEventListener('click',()=>{const reduced=P.preferences().motion||matchMedia('(prefers-reduced-motion:reduce)').matches;window.scrollTo({top:0,behavior:reduced?'instant':'smooth'});q('#conteudo').focus({preventScroll:true});});
  const fieldLabels={id:'Identificador (letras minúsculas, números e hífen)',nome:'Nome ou apelido',cargo:'Cargo',descricao:'Descrição',instagram:'Instagram (opcional)',titulo:'Título',categoria:'Categoria',data:'Data (AAAA-MM-DD)',resumo:'Resumo',paragrafos:'Parágrafos (separe com uma linha vazia)',arquivo:'Caminho do arquivo',inicio:'Início, com fuso horário',fim:'Fim, com fuso horário',local:'Local ou plataforma',formato:'Formato do material',pergunta:'Pergunta',resposta:'Resposta'};
  function editorKind(){return q('#editor-kind').value;}
  function draftSummary(){q('#draft-summary').textContent=Object.entries(human).map(([key,label])=>draft[key].length+' '+label.toLowerCase()).join(' · ')+' · somente rascunho local';}
  function editorRecords(selected='') {
    const select=q('#editor-record');select.replaceChildren(new Option('Novo registro',''));
    draft[editorKind()].forEach(item=>select.add(new Option(item.titulo||item.nome||item.pergunta,P.recordId(item))));select.value=selected;editorFields();draftSummary();
  }
  function editorFields() {
    const kind=editorKind(),id=q('#editor-record').value,item=draft[kind].find(i=>P.recordId(i)===id)||{},target=q('#editor-fields');target.replaceChildren();
    const fields=[...P.schemas[kind]];if(kind==='membros'){fields.unshift('id');fields.push('instagram');}if(kind==='noticias')fields.push('paragrafos');
    fields.forEach(key=>{const label=el('label',fieldLabels[key]);let input;if(key==='cargo'){input=el('select');draft.cargos.forEach(role=>input.add(new Option(role.nome,role.id)));}else input=el(['descricao','resumo','paragrafos','resposta'].includes(key)?'textarea':'input');input.name=key;input.id='field-'+key;input.required=key!=='instagram';input.maxLength=key==='paragrafos'?15000:2000;if(key==='id'){input.maxLength=80;input.pattern='[a-z0-9][a-z0-9_-]*';}if(key==='inicio'||key==='fim')input.placeholder='2026-11-15T19:00:00-03:00';if(key==='data')input.placeholder='AAAA-MM-DD';if(key==='arquivo')input.placeholder=kind==='galeria'?'assets/artes/nome.svg':'assets/downloads/nome.zip';input.value=key==='paragrafos'?(item.paragrafos||[]).join('\n\n'):item[key]||'';label.append(input);target.append(label);});
    q('#delete-record').disabled=!id;
  }
  function persistDraft(message) {const saved=P.write('draft',draft);q('#editor-status').textContent=message+(saved?' Rascunho guardado neste navegador.':' Não foi possível guardar no navegador; baixe o JSON antes de sair.');draftSummary();}
  function initEditor() {
    if(!q('#editor-kind')||draft)return;
    published=structuredClone(data);const stored=P.read('draft',null);
    try{draft=stored?P.validate(stored):structuredClone(data);}catch{draft=structuredClone(data);q('#editor-status').textContent='O rascunho anterior estava inválido. Carregamos a versão publicada.';}
    editorRecords();q('#editor-kind').addEventListener('change',()=>editorRecords());q('#editor-record').addEventListener('change',editorFields);
    q('#editor-form').addEventListener('submit',e=>{e.preventDefault();const kind=editorKind(),old=q('#editor-record').value,form=new FormData(e.target),item={};for(const [key,value]of form)item[key]=String(value).trim();if(kind==='noticias')item.paragrafos=item.paragrafos.split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean);if(!item.instagram)delete item.instagram;const next=structuredClone(draft);const at=next[kind].findIndex(i=>P.recordId(i)===old);if(at>=0)next[kind][at]=item;else next[kind].push(item);try{P.validate(next);draft=next;editorRecords(P.recordId(item));persistDraft('Registro salvo no rascunho. O site público não foi alterado.');}catch(error){q('#editor-status').textContent=error.message;}});
    q('#delete-record').addEventListener('click',()=>{const kind=editorKind(),id=q('#editor-record').value;if(!id)return;const next=structuredClone(draft);next[kind]=next[kind].filter(i=>P.recordId(i)!==id);try{P.validate(next);draft=next;editorRecords();persistDraft('Registro removido do rascunho. Você pode restaurar a versão publicada abaixo.');}catch(error){q('#editor-status').textContent=error.message;}});
    q('#download-content').addEventListener('click',()=>{try{P.validate(draft);P.download('conteudo.json',JSON.stringify(draft,null,2)+'\n','application/json');q('#editor-status').textContent='Arquivo preparado. Envie conteudo.json ao GitHub e salve na branch main para publicar.';}catch(error){q('#editor-status').textContent=error.message;}});
    q('#restore-content').addEventListener('click',()=>{draft=structuredClone(published);editorRecords();persistDraft('Rascunho restaurado com o conteúdo publicado.');});
    q('#import-content').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>1048576)throw new Error('Use um arquivo JSON de até 1 MB.');const parsed=JSON.parse(await file.text());P.validate(parsed);draft=parsed;editorRecords();persistDraft('Arquivo importado para o rascunho.');}catch(error){q('#editor-status').textContent='Não foi possível importar: '+error.message;}e.target.value='';});
  }
  function ready(payload) {
    data=payload;buildIndex();
    if(q('#explore-query')){const params=new URLSearchParams(location.search);q('#explore-query').value=params.get('q')||'';q('#explore-type').value=params.get('tipo')||'';explore();}
    if(q('#resource-filter')){const select=q('#resource-filter');select.replaceChildren(new Option('Todos os materiais',''));[...new Set(data.recursos.map(r=>r.categoria))].forEach(c=>select.add(new Option(c,c)));resources();}
    quickSearch();favoriteList();events();faq();initEditor();deepLink();
  }
  document.addEventListener('pblm:loaded',e=>ready(e.detail));if(window.PBLM_DATA)ready(window.PBLM_DATA);
  document.addEventListener('pblm:failed',()=>{for(const id of ['#explore-results','#quick-results','#resource-list','#event-list','#faq-list','#favorite-list']){const node=q(id);if(node)node.replaceChildren(el('p','Não foi possível carregar o conteúdo. Use Tentar novamente no final da página.','empty-state'));}});
})();
