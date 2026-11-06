/* ⛧ PBLM Social Hub. Works with existing Supabase-backed login on pessoal.html. */
(() => {
"use strict";
const $=sel=>document.querySelector(sel);
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
const CATEGORIES=['geral','projetos','jogos'];
const SUPABASE='https://mjfcjsokqulpziggqcrp.supabase.co';
let config=null,auth=null,me=null,channel='geral',room=null,chatTimer=null,dmTimer=null,waiting=false;
const notify=(text)=>{const node=$('#social-status');if(node)node.textContent=text};
const safe=(s,max=120)=>String(s||'').trim().slice(0,max);
const uuid=s=>typeof s==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
const localRest=async (table,params={})=>{
 if(!config)throw Error('Serviço não disponível');
 const url=new URL(config.supabaseUrl+'/rest/v1/'+table);
 for(const [k,v] of Object.entries(params))url.searchParams.set(k,String(v));
 const response=await fetch(url,{headers:{apikey:config.publishableKey},cache:'no-store',credentials:'omit'});
 if(!response.ok)throw Error('Falha na consulta: '+response.status);
 return response.json();
};
const privateRest=(table,params,method='GET',payload=null)=>{
 if(!auth)throw Error('Entre com GitHub na Área pessoal para continuar');
 const qs=new URLSearchParams(params||{}).toString();
 return auth.api('/rest/v1/'+table+(qs?'?'+qs:''),method,payload);
};
const dateLabel=x=>{try{return new Date(x).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}catch{return ''}};
const userCard=(profile,showActions=true)=>{
 const card=el('article',undefined,'social-person');
 const header=el('div',undefined,'social-person-head');
 const icon=el('span',(profile.display_name||'?').slice(0,1).toUpperCase(),'social-avatar');
 icon.style.background=profile.accent||'#e21d32';
 if(profile.avatar_url&&profile.avatar_url.startsWith('https://')){
   const img=el('img');img.src=profile.avatar_url;img.loading='lazy';img.alt='';img.referrerPolicy='no-referrer';
   img.addEventListener('error',()=>img.remove());icon.append(img);
 }
 const title=el('div');title.append(el('strong',profile.display_name),el('small','@'+profile.handle));
 header.append(icon,title);card.append(header,el('p',profile.bio||'Membro PARABELLUM','muted'));
 const actions=el('div',undefined,'social-actions');
 if(showActions){
   const link=el('button','VER CARTÃO','button');link.type='button';link.onclick=()=>showIdentity(profile);actions.append(link);
   if(auth&&auth.userId!==profile.user_id){
     const follow=el('button','SEGUIR','button');follow.type='button';
     follow.onclick=async()=>{
       follow.disabled=true;
       try{
         const own=await privateRest('pblm_follows',{follower_id:'eq.'+auth.userId,followed_id:'eq.'+profile.user_id,select:'followed_id'});
         if(own.length){await privateRest('pblm_follows',{follower_id:'eq.'+auth.userId,followed_id:'eq.'+profile.user_id},'DELETE');follow.textContent='SEGUIR';}
         else{await privateRest('pblm_follows',{},'POST',{follower_id:auth.userId,followed_id:profile.user_id});follow.textContent='SEGUINDO';}
       }catch(e){notify('Não foi possível seguir: '+e.message);}finally{follow.disabled=false;}
     };
     actions.append(follow);
     if(profile.allow_dm){
       const dm=el('button','MENSAGEM','button');dm.type='button';
       dm.onclick=()=>openDirect(profile);
       actions.append(dm);
     }
   }
 }
 card.append(actions);
 return card;
};
const showIdentity=(p)=>{
 const dlg=$('#social-identity-dialog');if(!dlg)return;
 const card=$('#social-identity-card');card.replaceChildren();
 const heading=el('div',undefined,'social-id-head');heading.style.borderColor=p.accent||'#e21d32';
 if(p.banner_url&&p.banner_url.startsWith('https://')){
   const cover=el('img');cover.src=p.banner_url;cover.alt='';cover.className='social-banner';cover.referrerPolicy='no-referrer';heading.append(cover);
 }
 const avatar=el('div',(p.display_name||'?')[0]?.toUpperCase(),'social-id-avatar');
 avatar.style.background=p.accent||'#e21d32';
 heading.append(avatar);card.append(heading,el('h2',p.display_name),el('p','@'+p.handle+' • PARABELLUM','muted'),el('p',p.bio||'Membro da comunidade'));
 const copy=el('button','COPIAR CARTÃO','button red');copy.type='button';
 copy.onclick=()=>{const text='⛧ PARABELLUM\n'+p.display_name+' (@'+p.handle+')\n'+(p.bio||'')+'\n'+location.origin+'/parabellum-panel/comunidade.html#membros';navigator.clipboard?.writeText(text).then(()=>notify('Cartão copiado.'),()=>notify('Cópia indisponível.'));};
 card.append(copy);dlg.showModal();
};
const profileFields=()=>{
 const prefix='#social-profile-';
 return {
   handle:$(prefix+'handle'),display:$(prefix+'display'),bio:$(prefix+'bio'),
   accent:$(prefix+'accent'),avatar:$(prefix+'avatar'),banner:$(prefix+'banner'),
   visible:$(prefix+'public'),dm:$(prefix+'dm')
 };
};
async function refreshSelf(){
 if(!auth)return;
 const rows=await privateRest('pblm_profiles',{user_id:'eq.'+auth.userId,select:'*'});
 me=rows[0]||null;
 const f=profileFields();if(!f.handle)return;
 if(me){f.handle.value=me.handle;f.display.value=me.display_name;f.bio.value=me.bio;
  f.accent.value=me.accent;f.avatar.value=me.avatar_url;f.banner.value=me.banner_url;
  f.visible.checked=me.is_public;f.dm.checked=me.allow_dm;}
 $('#social-profile-status').textContent=me?'Perfil carregado.':'Crie seu perfil para participar dos chats e do ranking.';
}
async function saveProfile(e){
 e.preventDefault();if(!auth)return;
 const f=profileFields();const payload={
   user_id:auth.userId,handle:safe(f.handle.value,24).toLowerCase(),
   display_name:safe(f.display.value,45),bio:safe(f.bio.value,280),
   accent:f.accent.value,
   avatar_url:safe(f.avatar.value,500),banner_url:safe(f.banner.value,500),
   is_public:f.visible.checked,allow_dm:f.dm.checked
 };
 const status=$('#social-profile-status');
 if(!/^[a-z0-9_]{3,24}$/.test(payload.handle)){status.textContent='Apelido: 3 a 24 letras minúsculas, números ou _. ';return;}
 if(payload.display_name.length<2){status.textContent='O nome público precisa de pelo menos dois caracteres.';return;}
 for(const name of ['avatar_url','banner_url'])if(payload[name]&&!/^https:\/\/[^ ]+$/i.test(payload[name])){status.textContent='Use imagens com endereço HTTPS.';return;}
 const button=$('#social-profile-submit');button.disabled=true;
 try{
   const records=await privateRest('pblm_profiles',me?{user_id:'eq.'+auth.userId}:{},me?'PATCH':'POST',payload);
   if(records?.length)me=records[0];
   else await refreshSelf();
   status.textContent='✓ Perfil salvo. Atualize a comunidade para ver as mudanças.';
 }catch(e){status.textContent='Falha ao salvar: '+e.message+'. O apelido pode já estar em uso.';}
 finally{button.disabled=false;}
}
async function loadDirectory(){
 const target=$('#social-directory');if(!target)return;
 target.replaceChildren(el('p','Carregando perfis…','muted'));
 try{
  const profiles=await localRest('pblm_profiles',{select:'user_id,handle,display_name,bio,accent,avatar_url,banner_url,is_public,allow_dm',is_public:'eq.true',order:'created_at.desc',limit:32});
  target.replaceChildren();
  for(const p of profiles)target.append(userCard(p));
  if(!profiles.length)target.append(el('p','Os perfis dos integrantes aparecerão aqui.','muted'));
 }catch(e){target.replaceChildren(el('p','Não foi possível carregar os perfis.','muted'));}
}
async function loadRank(){
 const target=$('#social-rank');if(!target)return;
 try{
  const ranks=await localRest('pblm_member_scores',{select:'handle,display_name,accent,posts,comments,xp',order:'xp.desc',limit:15});
  target.replaceChildren();
  for(const [index,p] of ranks.entries()){
    const row=el('div',undefined,'social-rank-row');const pos=el('b',String(index+1).padStart(2,'0'));
    const name=el('span',p.display_name+' · @'+p.handle);
    const score=el('strong',p.xp+' XP');score.style.color=p.accent||'#e21d32';
    row.append(pos,name,score);target.append(row);
  }
  if(!ranks.length)target.append(el('p','O ranking começa quando os membros criarem perfis e publicarem.','muted'));
 }catch{target.replaceChildren(el('p','Ranking indisponível.','muted'));}
}
async function loadChat(){
 const output=$('#social-chat-list');if(!output)return;
 try{
  const messages=await localRest('pblm_chat_messages',{select:'id,owner_id,channel,body,created_at',channel:'eq.'+channel,order:'created_at.desc',limit:50});
  const ids=[...new Set(messages.map(m=>m.owner_id))];
  const lookup=new Map();
  if(ids.length){
    const profiles=await localRest('pblm_profiles',{select:'user_id,display_name,handle',user_id:'in.('+ids.join(',')+')'});
    for(const p of profiles)lookup.set(p.user_id,p);
  }
  output.replaceChildren();
  for(const message of messages.reverse()){
    const p=lookup.get(message.owner_id);
    const item=el('article',undefined,'social-chat-message');
    item.append(el('small',(p?.display_name||'Integrante')+' · '+dateLabel(message.created_at)),el('p',message.body));
    if(auth?.userId===message.owner_id){
      const del=el('button','Excluir','social-small-button');del.type='button';
      del.onclick=async()=>{try{await privateRest('pblm_chat_messages',{id:'eq.'+message.id},'DELETE');await loadChat();}catch{notify('Não foi possível excluir.')}};
      item.append(del);
    }
    output.append(item);
  }
  if(!messages.length)output.append(el('p','Comece a conversa neste canal.','muted'));
 }catch{output.replaceChildren(el('p','Chat indisponível no momento.','muted'));}
}
async function sendChat(e){
 e.preventDefault();if(!auth||!me?.is_public){notify('Crie um perfil público na Área pessoal para conversar.');return;}
 const field=$('#social-chat-text');const body=safe(field.value,700);
 if(!body)return;
 const button=$('#social-chat-send');button.disabled=true;
 try{
  await privateRest('pblm_chat_messages',{},'POST',{channel,body});
  field.value='';await loadChat();notify('Mensagem enviada.');
 }catch(e){notify('Falha no envio. Aguarde alguns segundos e tente novamente.');}
 finally{button.disabled=false;}
}
async function openDirect(p){
 if(!auth){location.href='pessoal.html#social-profile';return;}
 if(!me){notify('Salve seu perfil primeiro.');return;}
 const a=[auth.userId,p.user_id].sort();
 try{
  const rows=await privateRest('pblm_dm_rooms',{participant_a:'eq.'+a[0],participant_b:'eq.'+a[1],select:'id'});
  if(rows.length)room=rows[0].id;
  else{
    const inserted=await privateRest('pblm_dm_rooms',{},'POST',{participant_a:a[0],participant_b:a[1]});
    room=inserted[0]?.id;
  }
  if(!room)throw Error('Sala não criada');
  $('#social-dm-target').textContent='Conversa privada com '+p.display_name;
  $('#social-dm').hidden=false;$('#social-dm').scrollIntoView({block:'start',behavior:'smooth'});
  await loadDirect();
  clearInterval(dmTimer);dmTimer=setInterval(()=>{if(document.visibilityState==='visible'&&room)loadDirect();},10000);
 }catch(e){notify('Não foi possível abrir conversa: '+e.message);}
}
async function loadDirect(){
 if(!room)return;
 const view=$('#social-dm-list');if(!view)return;
 try{
  const messages=await privateRest('pblm_dm_messages',{room_id:'eq.'+room,select:'owner_id,body,created_at',order:'created_at.desc',limit:'50'});
  view.replaceChildren();
  for(const msg of messages.reverse()){
   const item=el('article',undefined,'social-chat-message '+(msg.owner_id===auth.userId?'social-own':''));
   item.append(el('small',(msg.owner_id===auth.userId?'Você':'Integrante')+' · '+dateLabel(msg.created_at)),el('p',msg.body));view.append(item);
  }
  if(!messages.length)view.append(el('p','Conversa iniciada. Mensagens visíveis apenas aos participantes autenticados.','muted'));
 }catch{view.replaceChildren(el('p','Não foi possível carregar a conversa.','muted'));}
}
async function sendDirect(e){
 e.preventDefault();if(!room||!auth)return;
 const field=$('#social-dm-text'),body=safe(field.value,1500);if(!body)return;
 const button=$('#social-dm-send');button.disabled=true;
 try{await privateRest('pblm_dm_messages',{},'POST',{room_id:room,body});field.value='';await loadDirect();}
 catch{notify('Falha no envio privado. Tente novamente.');}finally{button.disabled=false;}
}
function initBindings(){
 if($('#social-profile-form'))$('#social-profile-form').addEventListener('submit',saveProfile);
 if($('#social-chat-form'))$('#social-chat-form').addEventListener('submit',sendChat);
 if($('#social-dm-form'))$('#social-dm-form').addEventListener('submit',sendDirect);
 if($('#social-dm-close'))$('#social-dm-close').onclick=()=>{room=null;$('#social-dm').hidden=true;clearInterval(dmTimer)};
 if($('#social-identity-close'))$('#social-identity-close').onclick=()=>$('#social-identity-dialog').close();
 if($('#social-chat-channel'))$('#social-chat-channel').addEventListener('change',e=>{channel=CATEGORIES.includes(e.target.value)?e.target.value:'geral';loadChat()});
 document.addEventListener('pblm:authenticated',async e=>{
   auth=e.detail;
   $('#social-personal-panel')?.removeAttribute('hidden');
   $('#social-chat-form')?.removeAttribute('hidden');
   await refreshSelf();loadDirectory();loadChat();
 });
 document.addEventListener('pblm:signedout',()=>{
   auth=null;me=null;room=null;clearInterval(dmTimer);$('#social-personal-panel')?.setAttribute('hidden','');
   $('#social-chat-form')?.setAttribute('hidden','');$('#social-dm')?.setAttribute('hidden','');
 });
 window.addEventListener('pagehide',()=>{clearInterval(chatTimer);clearInterval(dmTimer)});
}
(async()=>{
 try{
  const r=await fetch('assets/private-config.json',{cache:'no-store'});
  if(!r.ok)throw Error('Configuração indisponível');config=await r.json();
  if(!config.enabled||config.supabaseUrl!==SUPABASE)throw Error('Serviço diferente');
  if(document.readyState==='loading')await new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true}));
  initBindings();await Promise.allSettled([loadDirectory(),loadRank(),loadChat()]);
  if($('#social-chat-list'))chatTimer=setInterval(()=>{if(document.visibilityState==='visible')loadChat();},12000);
 }catch{notify('Serviço social indisponível.');}
})();
})();
