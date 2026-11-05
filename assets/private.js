(() => {
  'use strict';
  const q=s=>document.querySelector(s),P=window.PBLM;
  let config=null,session=null,selected=null,page=0,rows=[],busy=false;
  const size=25,status=q('#private-status');
  function message(text){status.textContent=text;}
  function clearEditor(){selected=null;q('#private-note-title').value='';q('#private-note-body').value='';q('#private-editor-title').textContent='Nova anotação';}
  function clearSession(){session=null;rows=[];clearEditor();q('#private-notes').replaceChildren();q('#private-account').textContent='';q('#private-workspace').hidden=true;q('#private-auth').hidden=false;}
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
  const flowKey='pblm.github.pkce';
  const callbackURL=location.origin+location.pathname;
  function base64url(bytes){return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
  q('#private-github').addEventListener('click',async()=>{
    if(busy)return;lock(true);
    try{
      const settings=await raw('/auth/v1/settings');
      if(!settings.external?.github)throw new Error('O login GitHub ainda precisa ser ativado pela administração.');
      const verifier=base64url(crypto.getRandomValues(new Uint8Array(32)));
      const challenge=base64url(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier))));
      sessionStorage.setItem(flowKey,JSON.stringify({verifier,created:Date.now()}));
      const url=new URL(config.supabaseUrl+'/auth/v1/authorize');
      url.search=new URLSearchParams({provider:'github',redirect_to:callbackURL,code_challenge:challenge,code_challenge_method:'s256',scopes:'user:email'}).toString();
      location.assign(url.href);
    }catch(e){error(e);lock(false);}
  });
  async function finishGitHub(code){
    const saved=sessionStorage.getItem(flowKey);sessionStorage.removeItem(flowKey);
    const pending=saved?JSON.parse(saved):null;
    if(!pending||!pending.verifier||Date.now()-pending.created>600000)throw new Error('Tentativa de login expirada. Toque em Entrar com GitHub novamente.');
    const result=await raw('/auth/v1/token?grant_type=pkce','POST',{auth_code:code,code_verifier:pending.verifier});
    if(!result.access_token||!result.refresh_token)throw new Error('O login não foi concluído.');
    const user=await raw('/auth/v1/user','GET',null,result.access_token);
    if(!user?.id||user.is_anonymous)throw new Error('Conta inválida.');
    session={accessToken:result.access_token,refreshToken:result.refresh_token,expiresAt:Date.now()+result.expires_in*1000};
    q('#private-account').textContent=user.email||'Conta GitHub';q('#private-auth').hidden=true;q('#private-workspace').hidden=false;page=0;
    message('Sessão ativa. Suas anotações são restritas à sua conta pelo banco de dados.');await list();
  }
  q('#private-note-form').addEventListener('submit',async e=>{e.preventDefault();if(busy)return;const title=q('#private-note-title').value.trim(),body=q('#private-note-body').value;if(!title||title.length>120||body.length>20000){message('Use um título de até 120 caracteres e texto de até 20.000 caracteres.');return;}lock(true);try{const result=await api(selected?notePath(selected):'/rest/v1/pblm_private_notes',selected?'PATCH':'POST',{title,body});if(!result?.length)throw new Error('A anotação não foi salva. Atualize a lista e tente novamente.');clearEditor();page=0;q('#private-view').value='active';await list();message('Anotação salva na sua conta.');}catch(e){error(e);}finally{lock(false);if(session)updatePager();}});
  q('#private-logout').addEventListener('click',async()=>{if(busy)return;lock(true);let remote=false;try{await raw('/auth/v1/logout?scope=local','POST',null,await access());remote=true;}catch{}finally{clearSession();lock(false);message(remote?'Sessão encerrada.':'Sessão removida desta página. A confirmação de saída no servidor não foi recebida.');}});
  const params=new URLSearchParams(location.search),authCode=params.get('code'),authError=params.has('error')||location.hash.includes('error=');
  if(authCode||authError||/(?:access_token|refresh_token)=/.test(location.hash))history.replaceState(null,'',location.pathname);
  (async()=>{try{
    const response=await fetch('assets/private-config.json',{cache:'no-store',credentials:'omit'});
    if(!response.ok)throw new Error('Configuração indisponível.');config=await response.json();
    if(!usableConfig(config)){message('Área pessoal em configuração. O login GitHub será liberado após conectar o serviço.');return;}
    q('#private-auth').hidden=false;
    if(authError){sessionStorage.removeItem(flowKey);throw new Error('Login cancelado ou recusado. Tente novamente.');}
    if(authCode){await finishGitHub(authCode);return;}
    const settings=await raw('/auth/v1/settings');
    q('#private-github').disabled=!settings.external?.github;
    message(settings.external?.github?'Entre com GitHub para acessar suas anotações.':'O botão está preparado. A administração ainda precisa conectar o GitHub ao serviço de login.');
  }catch(e){error(e);}})();
})();
