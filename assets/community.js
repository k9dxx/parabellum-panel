(() => {
 'use strict';
 const $=s=>document.querySelector(s), el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const names={conversa:'Conversa',projetos:'Projetos',duvidas:'Dúvidas'};
 let config,auth=null,page=0,lastCount=0,requestNumber=0,selected=null,working=false;
 const feed=$('#community-feed'),form=$('#community-form'),status=$('#community-status');
 async function publicRead(query){
  const response=await fetch(config.supabaseUrl+'/rest/v1/pblm_community_posts?'+query,{headers:{apikey:config.publishableKey},cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});
  if(!response.ok)throw Error('Não foi possível carregar o mural. Tente novamente.');return response.json();
 }
 const say=t=>{status.textContent=t;};
 function controls(){if(!feed)return;$('#community-prev').disabled=page===0;$('#community-next').disabled=lastCount<12;$('#community-page').textContent='Página '+(page+1);}
 function card(row,mine){
  const c=el('article',undefined,'community-card');
  const meta=el('div',undefined,'community-meta');meta.append(el('span',names[row.category]||'Conversa','community-category'),el('time',new Date(row.created_at).toLocaleDateString('pt-BR')));c.append(meta,el('h3',row.title),el('p',row.body,'community-body'),el('p','Por '+row.nickname+' · apelido escolhido pelo autor','muted'));
  if(mine){const actions=el('div',undefined,'community-actions'),edit=el('button','EDITAR','button'),remove=el('button','EXCLUIR','button');edit.type=remove.type='button';edit.onclick=()=>{if(working)return;selected=row.id;form.elements.nickname.value=row.nickname;form.elements.title.value=row.title;form.elements.body.value=row.body;form.elements.category.value=row.category;form.elements.accept.checked=false;$('#community-submit').textContent='SALVAR ALTERAÇÕES PÚBLICAS';form.scrollIntoView({behavior:'auto',block:'start'});};remove.onclick=async()=>{if(working||!confirm('Excluir esta publicação, seus comentários e curtidas? Esta ação não pode ser desfeita.'))return;await action(async()=>{const result=await auth.api('/rest/v1/pblm_community_posts?id=eq.'+row.id,'DELETE');if(!result.length)throw Error('Publicação não encontrada. Atualize a lista.');if(selected===row.id)reset();await mineList();await load();say('Publicação excluída.');});};actions.append(edit,remove);c.append(actions);}
  else {const report=el('a','Reportar publicação ↗','community-report');report.href='https://github.com/k9dxx/parabellum-panel/issues/new?'+new URLSearchParams({title:'Revisar publicação '+row.id,body:'Solicito revisão da publicação '+row.id+'.\nMotivo (não inclua dados pessoais): '});report.target='_blank';report.rel='noopener noreferrer';c.append(report);}
  document.dispatchEvent(new CustomEvent("pblm:post-card",{detail:{card:c,row}}));
  return c;
 }
 async function load(){
  if(!feed||!config)return;const seq=++requestNumber;say('Carregando publicações…');
  const params=new URLSearchParams({select:'id,nickname,title,body,category,created_at',order:'created_at.desc,id.desc',limit:'12',offset:String(page*12)});
  const category=$('#community-category').value,search=$('#community-search').value.trim().slice(0,80).replace(/[%*_\\]/g,'');
  if(category)params.set('category','eq.'+category);if(search)params.set('title','ilike.*'+search+'*');
  try{const rows=await publicRead(params);if(seq!==requestNumber)return;lastCount=rows.length;feed.replaceChildren();for(const row of rows)feed.append(card(row,false));if(!rows.length)feed.append(el('p','Nenhuma publicação por aqui. Abra a conversa com uma ideia, projeto ou dúvida.','empty-state'));say(rows.length+' publicação(ões) nesta página.');controls();}catch(e){if(seq===requestNumber){say(e.message);}}
 }
 function reset(){selected=null;form.reset();$('#community-submit').textContent='PUBLICAR NO MURAL';}
 async function mineList(){const target=$('#community-mine');const rows=await auth.api('/rest/v1/pblm_community_posts?'+new URLSearchParams({owner_id:'eq.'+auth.userId,order:'created_at.desc',limit:'100'}));target.replaceChildren();for(const row of rows)target.append(card(row,true));if(!rows.length)target.append(el('p','Você ainda não publicou no mural.','muted'));}
 async function action(fn){if(working)return;working=true;form.querySelectorAll('button').forEach(n=>n.disabled=true);try{await fn();}catch(e){say(e.message+' Se publicou há pouco, aguarde 60 segundos.');}finally{working=false;form.querySelectorAll('button').forEach(n=>n.disabled=false);}}
 if(form){
  document.addEventListener('pblm:authenticated',async e=>{auth=e.detail;$('#community-editor').hidden=false;try{await mineList();await load();say('Mural público: publique apenas o que deseja compartilhar com todos.');}catch(err){say(err.message);}});
  document.addEventListener('pblm:signedout',()=>{auth=null;reset();$('#community-mine').replaceChildren();$('#community-editor').hidden=true;});
  $('#community-reset').onclick=reset;
  form.onsubmit=e=>{e.preventDefault();if(!auth||!form.reportValidity())return;action(async()=>{const body={nickname:form.elements.nickname.value.trim(),title:form.elements.title.value.trim(),body:form.elements.body.value.trim(),category:form.elements.category.value};if(body.nickname.length<2||body.title.length<3||!body.body)throw Error('Preencha apelido, título e texto.');const path='/rest/v1/pblm_community_posts'+(selected?'?id=eq.'+selected:'');const result=await auth.api(path,selected?'PATCH':'POST',body);if(!result.length)throw Error('Publicação não encontrada.');reset();await mineList();await load();say('Publicação salva no mural público.');});};
 }
 if(feed){
  $('#community-filter').onsubmit=e=>{e.preventDefault();page=0;load();};$('#community-category').onchange=()=>{page=0;load();};$('#community-refresh').onclick=()=>load();$('#community-prev').onclick=()=>{if(page>0){page--;load();}};$('#community-next').onclick=()=>{if(lastCount===12){page++;load();}};
  (async()=>{try{const r=await fetch('assets/private-config.json',{cache:'no-store'});if(!r.ok)throw Error();config=await r.json();if(!config.enabled||config.supabaseUrl!=='https://mjfcjsokqulpziggqcrp.supabase.co')throw Error();await load();}catch{say('Mural indisponível no momento. Tente atualizar a página.');}})();
 }
})();
