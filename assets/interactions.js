(() => {
 'use strict';
 const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 let auth=null,generation=0;
 const config=fetch('assets/private-config.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();});
 config.catch(()=>{});
 document.addEventListener('pblm:authenticated',e=>{auth=e.detail;generation++;});
 document.addEventListener('pblm:signedout',()=>{auth=null;generation++;document.querySelectorAll('.community-interactions').forEach(n=>n.remove());});
 async function read(path){const cfg=await config;const r=await fetch(cfg.supabaseUrl+'/rest/v1/'+path,{headers:{apikey:cfg.publishableKey},cache:'no-store',credentials:'omit'});if(!r.ok)throw Error('Não foi possível carregar as interações.');return r.json();}
 document.addEventListener('pblm:post-card',e=>{
  const {card,row}=e.detail,epoch=generation;
  const root=node('section',undefined,'community-interactions'),actions=node('div',undefined,'community-actions');
  const like=node('button','Carregando curtidas…','button'),show=node('button','COMENTÁRIOS','button'),message=node('p','','muted'),comments=node('div');
  like.type=show.type='button';like.disabled=true;like.setAttribute('aria-pressed','false');show.setAttribute('aria-expanded','false');message.setAttribute('role','status');comments.hidden=true;
  actions.append(like,show);root.append(actions,message,comments);card.append(root);
  let liked=false,busy=false,offset=0,ready=false;
  const current=()=>epoch===generation;
  async function refreshLike(){
   const counts=await read('pblm_community_like_counts?post_id=eq.'+row.id);
   if(!current())return;
   liked=false;
   if(auth){const own=await auth.api('/rest/v1/pblm_community_likes?'+new URLSearchParams({select:'post_id',post_id:'eq.'+row.id,owner_id:'eq.'+auth.userId}));if(!current())return;liked=own.length>0;}
   ready=true;like.textContent=(liked?'♥ CURTIDO':'♡ CURTIR')+' · '+(counts[0]?.total||0);like.setAttribute('aria-pressed',String(liked));like.disabled=false;
  }
  refreshLike().catch(()=>{if(current()){like.textContent='TENTAR CARREGAR CURTIDAS';like.disabled=false;}});
  like.onclick=async()=>{
   if(busy||!current())return;
   if(!ready){busy=true;like.disabled=true;try{await refreshLike();}catch{message.textContent='Falha ao carregar curtidas. Tente novamente.';}finally{busy=false;like.disabled=false;}return;}
   if(!auth){location.href='pessoal.html#community-editor';return;}
   busy=true;like.disabled=true;message.textContent='';
   try{
    const own=await auth.api('/rest/v1/pblm_community_likes?post_id=eq.'+row.id+'&owner_id=eq.'+auth.userId);
    if(!current())return;
    if(own.length)await auth.api('/rest/v1/pblm_community_likes?post_id=eq.'+row.id+'&owner_id=eq.'+auth.userId,'DELETE');
    else await auth.api('/rest/v1/pblm_community_likes','POST',{post_id:row.id});
    if(current())await refreshLike();
   }catch{if(current())message.textContent='Não foi possível alterar a curtida. Atualize as conversas e tente novamente.';}
   finally{busy=false;if(current())like.disabled=false;}
  };
  const list=node('div'),more=node('button','CARREGAR MAIS','button');more.type='button';more.hidden=true;
  async function loadComments(reset=false){
   if(reset){offset=0;list.replaceChildren();}more.disabled=true;
   try{
    const rows=await read('pblm_community_comments?'+new URLSearchParams({post_id:'eq.'+row.id,order:'created_at.desc,id.desc',limit:'20',offset:String(offset)}));if(!current())return;
    if(reset&&!rows.length)list.append(node('p','Nenhum comentário ainda.','muted'));
    for(const comment of rows){
     const item=node('article',undefined,'community-comment');item.append(node('strong',comment.nickname+' · apelido autodeclarado'),node('p',comment.body,'community-body'),node('small',new Date(comment.created_at).toLocaleString('pt-BR')));
     if(auth&&comment.owner_id===auth.userId){const del=node('button','EXCLUIR MEU COMENTÁRIO','button');del.type='button';del.onclick=async()=>{if(!auth||!confirm('Excluir seu comentário permanentemente?'))return;del.disabled=true;try{await auth.api('/rest/v1/pblm_community_comments?id=eq.'+comment.id,'DELETE');if(current())await loadComments(true);}catch{message.textContent='Não foi possível excluir. Tente novamente.';del.disabled=false;}};item.append(del);}
     const report=node('a','Reportar comentário ↗','community-report');report.href='https://github.com/k9dxx/parabellum-panel/issues/new?'+new URLSearchParams({title:'Revisar comentário '+comment.id,body:'Publicação: '+row.id+'\nComentário: '+comment.id+'\nMotivo (não inclua dados pessoais): '});report.target='_blank';report.rel='noopener noreferrer';item.append(report);list.append(item);
    }
    offset+=rows.length;more.hidden=rows.length<20;
   }catch{if(current()){message.textContent='Falha ao carregar comentários. Feche e abra os comentários para tentar novamente.';}}
   finally{more.disabled=false;}
  }
  more.onclick=()=>loadComments();
  show.onclick=async()=>{
   comments.hidden=!comments.hidden;show.setAttribute('aria-expanded',String(!comments.hidden));if(comments.hidden)return;
   comments.replaceChildren(list,more);
   if(auth){
    const form=node('form',undefined,'community-comment-form');
    const nick=node('input'),body=node('textarea'),accept=node('input');nick.required=true;nick.minLength=2;nick.maxLength=40;nick.autocomplete='nickname';body.required=true;body.maxLength=1000;body.rows=3;accept.type='checkbox';accept.required=true;
    function field(text,input){const label=node('label',text);label.append(input);return label;}
    const consent=field('Meu apelido e comentário serão públicos.',accept);consent.className='community-consent';const send=node('button','PUBLICAR COMENTÁRIO','button red');send.type='submit';
    form.append(field('Apelido público',nick),field('Comentário (até 1.000 caracteres)',body),consent,node('p','Aguarde 15 segundos entre comentários. Até 500 comentários por conta.','muted'),send);
    form.onsubmit=async ev=>{ev.preventDefault();if(!auth||send.disabled||!form.reportValidity())return;const nickname=nick.value.trim(),text=body.value.trim();if(nickname.length<2||!text){message.textContent='Preencha apelido e comentário.';return;}send.disabled=true;try{await auth.api('/rest/v1/pblm_community_comments','POST',{post_id:row.id,nickname,body:text});if(!current())return;body.value='';accept.checked=false;message.textContent='Comentário publicado.';await loadComments(true);}catch{if(current())message.textContent='Não foi possível publicar. Aguarde 15 segundos e tente novamente; confira se o post ainda existe e se atingiu o limite de comentários.';}finally{send.disabled=false;}};
    comments.append(form);
   }else{const login=node('a','ENTRAR PARA COMENTAR OU CURTIR ↗','button');login.href='pessoal.html#community-editor';comments.append(login);}
   await loadComments(true);
  };
 });
})();
