(() => {
  'use strict';
  const q=s=>document.querySelector(s),P=window.PBLM;
  let config=null,session=null,selected=null,page=0,rows=[],busy=false;
  const size=25,status=q('#private-status');
  function message(text){status.textContent=text;}
  function clearEditor(){selected=null;q('#private-note-title').value='';q('#private-note-body').value='';q('#private-editor-title').textContent='Nova anotação';}
  function clearSession(){session=null;rows=[];clearEditor();q('#private-notes').replaceChildren();q('#private-account').textContent='';q('#private-workspace').hidden=true;q('#private-auth').hidden=false;q('#private-password').value='';}
  function lock(value){busy=value;document.querySelectorAll('#private-auth button,#private-workspace button').forEach(b=>{b.disabled=value;});}
  function usableConfig(c){
    if(!c||c.enabled!==true)return false;
    const url=new URL(c.supabaseUrl);
    if(url.protocol!=='https:'||!/^([a-z0-9-]+)\.supabase\.co$/.test(url.hostname)||url.pathname!=='/'||url.search||url.hash||url.username||url.password)throw new Error('Configuração do serviço inválida.');
    const key=c.publishableKey;
    if(typeof key!=='string')throw new Error('Chave pública ausente.');
    if(key.startsWith('sb_publishable_'))return true;
    if(key.split('.').length===3){try{const part=key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');if(JSON.parse(atob(part)).role==='anon')return true;}catch{}}
    throw new Error('Somente chaves públicas publishable ou anon são aceitas.');
  }
  async function raw(path,method='GET',body=null,token=null){
    const headers={apikey:config.publishableKey};if(body!==null)headers['Content-Type']='application/json';if(token)headers.Authorization='Bearer '+token;if(path.startsWith('/rest/'))headers.Prefer='return=representation';
    const response=await fetch(config.supabaseUrl.replace(/\/$/,'')+path,{method,headers,body:body===null?undefined:JSON.stringify(body),cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});
    if(!response.ok){if(response.status===429)throw new Error('Muitas tentativas. Aguarde antes de tentar novamente.');if(response.status===401||response.status===403)throw new Error('Acesso não autorizado. Confira seu login e a confirmação do e-mail.');throw new Error('O serviço não concluiu o pedido. Confira a conexão ou tente novamente.');}
    const text=await response.text();return text?JSON.parse(text):null;
  }
  async function access(){
    if(!session)throw new Error('Entre na sua conta para continuar.');
    if(Date.now()>session.expiresAt-30000){try{const next=await raw('/auth/v1/token?grant_type=refresh_token','POST',{refresh_token:session.refreshToken});session={...session,accessToken:next.access_token,refreshToken:next.refresh_token,expiresAt:Date.now()+next.expires_in*1000};}catch{clearSession();throw new Error('Sua sessão terminou. Entre novamente.');}}
    return session.accessToken;
  }
  async function api(path,method='GET',body=null){return raw(path,method,body,await access());}
  function notePath(id){if(!/^[0-9a-f-]{36}$/i.test(id))throw new Error('Identificador de anotação inválido.');return '/rest/v1/pblm_private_notes?id=eq.'+id;}
  function error(e){message(e instanceof TypeError?'Não foi possível conectar ao serviço. Tente novamente.':e.message);}
  async function list(){
    const trash=q('#private-view').value==='trash';
    rows=await api('/rest/v1/pblm_private_notes?select=id,title,body,created_at,updated_at,deleted_at&deleted_at='+ (trash?'not.is.null':'is.null')+'&order=updated_at.desc&limit='+size+'&offset='+(page*size));
    const target=q('#private-notes');target.replaceChildren();
    if(!rows.length)target.append(P.create('p',trash?'Sua lixeira está vazia.':'Nenhuma anotação nesta página.','empty-state'));
    for(const item of rows){const card=P.create('article',undefined,'private-note-card');card.append(P.create('h3',item.title),P.create('p',item.body.slice(0,180)));const edit=P.create('button',trash?'RESTAURAR':'EDITAR','button');edit.type='button';edit.addEventListener('click',async()=>{
      if(busy)return;
      if(trash){lock(true);try{const result=await api(notePath(item.id),'PATCH',{deleted_at:null});if(!result?.length)throw new Error('A anotação não está mais disponível.');await list();message('Anotação restaurada.');}catch(e){error(e);}finally{lock(false);updatePager();}}
      else {selected=item.id;q('#private-note-title').value=item.title;q('#private-note-body').value=item.body;q('#private-editor-title').textContent='Editar anotação';q('#private-note-title').focus();}
    });card.append(edit);
    if(!trash){const remove=P.create('button','MOVER PARA LIXEIRA','button');remove.type='button';remove.addEventListener('click',async()=>{if(busy)return;lock(true);try{const result=await api(notePath(item.id),'PATCH',{deleted_at:new Date().toISOString()});if(!result?.length)throw new Error('A anotação não está mais disponível.');if(selected===item.id)clearEditor();await list();message('Anotação movida para a lixeira.');}catch(e){error(e);}finally{lock(false);updatePager();}});card.append(remove);}target.append(card);}
    q('#private-list-status').textContent=rows.length+' anotação(ões) nesta página';updatePager();
  }
  function updatePager(){q('#private-page').textContent='Página '+(page+1);q('#private-prev').disabled=busy||page===0;q('#private-next').disabled=busy||rows.length<size;}
  async function navigate(delta){if(busy)return;const before=page;page+=delta;lock(true);try{await list();}catch(e){page=before;error(e);}finally{lock(false);updatePager();}}
  q('#private-prev').addEventListener('click',()=>navigate(-1));q('#private-next').addEventListener('click',()=>navigate(1));
  q('#private-view').addEventListener('change',async()=>{page=0;lock(true);try{await list();}catch(e){error(e);}finally{lock(false);updatePager();}});
  q('#private-new').addEventListener('click',clearEditor);
  q('#private-login').addEventListener('submit',async e=>{
    e.preventDefault();if(busy)return;lock(true);
    try{const result=await raw('/auth/v1/token?grant_type=password','POST',{email:q('#private-email').value.trim(),password:q('#private-password').value});q('#private-password').value='';
      if(!result.access_token||!result.refresh_token||!result.user?.email_confirmed_at)throw new Error('Confirme seu e-mail antes de entrar.');
      session={accessToken:result.access_token,refreshToken:result.refresh_token,expiresAt:Date.now()+result.expires_in*1000};q('#private-account').textContent=result.user.email;q('#private-auth').hidden=true;q('#private-workspace').hidden=false;page=0;message('Sessão ativa. Suas anotações são restritas à sua conta pelo banco de dados.');await list();
    }catch(e){q('#private-password').value='';error(e);}finally{lock(false);if(session)updatePager();}
  });
  q('#private-signup').addEventListener('submit',async e=>{e.preventDefault();if(busy)return;lock(true);try{const password=q('#signup-password').value;if(password.length<12)throw new Error('Use uma senha com pelo menos 12 caracteres.');await raw('/auth/v1/signup?redirect_to='+encodeURIComponent(new URL('pessoal.html',location.href).href),'POST',{email:q('#signup-email').value.trim(),password});message('Se o cadastro estiver disponível para esse endereço, você receberá uma confirmação por e-mail. Depois de confirmar, entre na sua conta.');}catch(e){error(e);}finally{q('#signup-password').value='';lock(false);}});
  q('#private-note-form').addEventListener('submit',async e=>{e.preventDefault();if(busy)return;const title=q('#private-note-title').value.trim(),body=q('#private-note-body').value;if(!title||title.length>120||body.length>20000){message('Use um título de até 120 caracteres e texto de até 20.000 caracteres.');return;}lock(true);try{const result=await api(selected?notePath(selected):'/rest/v1/pblm_private_notes',selected?'PATCH':'POST',{title,body});if(!result?.length)throw new Error('A anotação não foi salva. Atualize a lista e tente novamente.');clearEditor();page=0;q('#private-view').value='active';await list();message('Anotação salva na sua conta.');}catch(e){error(e);}finally{lock(false);if(session)updatePager();}});
  q('#private-logout').addEventListener('click',async()=>{if(busy)return;lock(true);let remote=false;try{await raw('/auth/v1/logout?scope=local','POST',null,await access());remote=true;}catch{}finally{clearSession();lock(false);message(remote?'Sessão encerrada.':'Sessão removida desta página. A confirmação de saída no servidor não foi recebida.');}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){q('#private-password').value='';q('#signup-password').value='';}});
  // Confirmation redirects may include tokens. This page does not adopt or persist them.
  if(/(?:access_token|refresh_token|error_description)=/.test(location.hash))history.replaceState(null,'',location.pathname+location.search);
  (async()=>{try{const response=await fetch('assets/private-config.json',{cache:'no-store',credentials:'omit'});if(!response.ok)throw new Error('Configuração indisponível.');config=await response.json();if(!usableConfig(config)){message('Área pessoal ainda não ativada. O serviço de login e armazenamento protegido precisa ser conectado. Nenhum dado pessoal é enviado por esta página enquanto isso.');return;}q('#private-auth').hidden=false;message('Entre na sua conta para acessar suas anotações. Os dados ficam no serviço protegido, fora do repositório público.');}catch(e){message('Área pessoal indisponível. A configuração precisa ser concluída pela administração.');}})();
})();
