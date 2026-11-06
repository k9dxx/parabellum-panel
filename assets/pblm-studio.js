/* ⛧ PBLM Studio — all content remains on the existing PARABELLUM portal. */
(() => {
'use strict';
const KEY='pblm.studio.signature.v1';
const PREFS='pblm.preferences.v1';
const EXP='pblm.experience.v1';
const presets=[
 {name:'Blood Legacy',detail:'Gothic vermelho',color:'#e21d32',theme:'dark',corners:'sharp',cards:'classic',density:'normal',animation:'cinematic'},
 {name:'Void AMOLED',detail:'Preto absoluto',color:'#d50c2b',theme:'amoled',corners:'sharp',cards:'glass',density:'compact',animation:'soft'},
 {name:'Royal Phantom',detail:'Violeta elite',color:'#8b5cf6',theme:'dark',corners:'rounded',cards:'glass',density:'normal',animation:'cinematic'},
 {name:'Neon Ghost',detail:'Azul cyber',color:'#327dff',theme:'dark',corners:'soft',cards:'glass',density:'compact',animation:'cinematic'},
 {name:'Obsidian Gold',detail:'Dourado escuro',color:'#d1a33c',theme:'amoled',corners:'rounded',cards:'classic',density:'normal',animation:'soft'},
 {name:'Rose Eclipse',detail:'Rosa futurista',color:'#e850a2',theme:'dark',corners:'rounded',cards:'glass',density:'normal',animation:'soft'}
];
const q=s=>document.querySelector(s);
const el=(tag,txt,cls)=>{const e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;if(cls)e.className=cls;return e;};
const safeRead=(key)=>{try{const v=JSON.parse(localStorage.getItem(key)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch{return {}}};
const safeStore=(key,obj)=>{try{localStorage.setItem(key,JSON.stringify(obj));return true;}catch{return false}};
const hex=s=>typeof s==='string'&&/^#[0-9a-f]{6}$/i.test(s);
const validTheme=(s)=>{
 if(!s||typeof s!=='object')throw Error('Tema inválido');
 const p=presets[0];let out={...p};
 for(const field of ['color','theme','corners','cards','density','animation']){
   if(typeof s[field]==='string')out[field]=s[field].slice(0,40);
 }
 if(!hex(out.color)||!['dark','light','amoled'].includes(out.theme)||!['sharp','soft','rounded'].includes(out.corners)||
   !['classic','glass'].includes(out.cards)||!['normal','compact'].includes(out.density)||
   !['off','soft','cinematic'].includes(out.animation))throw Error('Tema não reconhecido');
 return out;
};
const status=t=>{const s=q('#studio-status');if(s)s.textContent=t};
function applyPreset(p){
 try{
  const theme=validTheme(p);
  const old=safeRead(PREFS),exp=safeRead(EXP);
  const next={...old,color:theme.color,theme:theme.theme,glow:old.glow!==false,
    motion:theme.animation!=='off'};
  const more={...exp,cards:theme.cards,corners:theme.corners,density:theme.density,animation:theme.animation};
  if(!safeStore(PREFS,next)||!safeStore(EXP,more))throw Error('Sem armazenamento');
  status('✓ Tema "'+(p.name||'')+'" aplicado. Abra outra página para conferir a aparência.');
  const color=q('#color'),select=q('#theme'),motion=q('#motion');if(color){color.value=theme.color;color.dispatchEvent(new Event('input',{bubbles:true}));}if(select){select.value=theme.theme;select.dispatchEvent(new Event('change',{bubbles:true}));}if(motion){motion.checked=theme.animation!=='off';motion.dispatchEvent(new Event('change',{bubbles:true}));}
  window.location.reload();
 }catch(e){status('Não foi possível aplicar o tema: '+e.message);}
}
function currentTheme(){
 const a=safeRead(PREFS),b=safeRead(EXP);
 return validTheme({color:hex(a.color)?a.color:'#e21d32',theme:a.theme||'dark',corners:b.corners||'sharp',
   cards:b.cards||'classic',density:b.density||'normal',animation:b.animation||'cinematic'});
}
function signature(){
 const p=safeRead(KEY);
 return {
  nickname:typeof p.nickname==='string'?p.nickname.slice(0,40):'PBLM MEMBER',
  role:typeof p.role==='string'?p.role.slice(0,40):'Integrante',
  quote:typeof p.quote==='string'?p.quote.slice(0,90):'Disciplina. Lealdade. Respeito.'
 };
}
const CANVAS_W=1080,CANVAS_H=620;
function draw(data){
 const c=document.createElement('canvas');c.width=CANVAS_W;c.height=CANVAS_H;
 const ctx=c.getContext('2d');
 const color=currentTheme().color;
 let gradient=ctx.createLinearGradient(0,0,CANVAS_W,CANVAS_H);
 gradient.addColorStop(0,'#220d19');gradient.addColorStop(.6,'#09090c');gradient.addColorStop(1,'#280e1c');
 ctx.fillStyle=gradient;ctx.fillRect(0,0,CANVAS_W,CANVAS_H);
 ctx.strokeStyle=color;ctx.lineWidth=5;ctx.strokeRect(35,35,1010,550);
 ctx.fillStyle=color+'18';ctx.font='bold italic 360px Georgia';ctx.fillText('777',500,420);
 ctx.fillStyle='#f8e6ec';ctx.font='bold 35px sans-serif';ctx.fillText('⛧  PARABELLUM  /  PBLM.777',72,115);
 ctx.fillStyle=color;ctx.fillRect(72,145,215,7);
 ctx.fillStyle='#fff';ctx.font='bold 66px sans-serif';ctx.fillText(data.nickname.toUpperCase(),72,287,930);
 ctx.font='bold 29px sans-serif';ctx.fillStyle=color;ctx.fillText(data.role.toUpperCase(),75,354);
 ctx.fillStyle='#d3bdc6';ctx.font='27px sans-serif';ctx.fillText(data.quote,75,433,910);
 ctx.fillStyle='#98838d';ctx.font='20px sans-serif';ctx.fillText('PBLM / LEGACY',75,545);
 return c;
}
function preview(){
 const d=signature();
 q('#studio-sign-nick').value=d.nickname;q('#studio-sign-role').value=d.role;q('#studio-sign-quote').value=d.quote;
 const p=q('#studio-signature-preview');p.replaceChildren();
 const avatar=el('div',d.nickname.slice(0,1).toUpperCase(),'studio-avatar');
 const detail=el('div');detail.append(el('strong',d.nickname),el('p',d.role),el('small',d.quote));
 const header=el('div',undefined,'studio-signature');header.append(avatar,detail);
 p.append(el('b','⛧ PARABELLUM / PBLM.777'),header);
}
function mount(){
 const main=q('main.wrap');if(!main||q('#pblm-studio'))return;
 const container=el('section',undefined);container.id='pblm-studio';
 container.append(el('h2','⛧ PBLM STUDIO — SEU ESTILO'),el('p','Monte seu tema, compartilhe um código e crie um cartão de assinatura para divulgar.','studio-sub'),el('h3','Temas exclusivos'));
 const options=el('div',undefined,'studio-presets');
 for(const p of presets){
  const button=el('button',undefined,'studio-preset');button.type='button';button.style.setProperty('--preview-color',p.color);
  button.append(el('i'),el('b',p.name),el('small',p.detail));
  button.onclick=()=>applyPreset(p);
  options.append(button);
 }
 container.append(options,el('h3','Compartilhar meu tema'));
 const actions=el('div',undefined,'studio-tools');
 const copy=el('button','COPIAR CÓDIGO','btn'),paste=el('button','IMPORTAR CÓDIGO','btn secondary');
 copy.type=paste.type='button';actions.append(copy,paste);
 const entry=el('textarea',undefined,'studio-text');entry.id='studio-theme-code';entry.placeholder='Cole aqui o código PBLM-THEME para importar';
 entry.setAttribute('aria-label','Código de tema personalizado');
 copy.onclick=async()=>{
  const json=JSON.stringify(currentTheme());
  const base=Array.from(new TextEncoder().encode(json),x=>String.fromCharCode(x)).join('');
  const code='PBLM-THEME:'+btoa(base);entry.value=code;
  try{await navigator.clipboard.writeText(code);status('✓ Tema copiado. Envie o código para outro membro.');}
  catch{status('Código criado. Selecione e copie manualmente.');}
 };
 paste.onclick=()=>{
  try{
   const raw=entry.value.trim();
   if(!raw.startsWith('PBLM-THEME:')||raw.length>1600)throw Error('Formato incorreto');
   const decoded=atob(raw.slice('PBLM-THEME:'.length));
   const bytes=Uint8Array.from(decoded,x=>x.charCodeAt(0));
   applyPreset(validTheme(JSON.parse(new TextDecoder().decode(bytes))));
  }catch{status('Código inválido. Use um código PBLM-THEME exportado pelo Studio.');}
 };
 container.append(actions,entry,el('h3','Cartão de assinatura'));
 const fields=el('div',undefined,'studio-inputs');
 for(const [id,title,max] of [['nick','Nome de apresentação',40],['role','Título pessoal',40],['quote','Frase',90]]){
  const label=el('label',title);
  const input=el('input');input.id='studio-sign-'+id;input.maxLength=max;input.placeholder=title;
  input.addEventListener('input',()=>{
   const d={nickname:q('#studio-sign-nick').value.slice(0,40),role:q('#studio-sign-role').value.slice(0,40),quote:q('#studio-sign-quote').value.slice(0,90)};
   safeStore(KEY,d);
   const preview=q('#studio-signature-preview');if(preview){preview.replaceChildren();const avatar=el('span',d.nickname.slice(0,1).toUpperCase(),'studio-avatar');const info=el('div');info.append(el('strong',d.nickname),el('p',d.role),el('small',d.quote));const row=el('div',undefined,'studio-signature');row.append(avatar,info);preview.append(el('b','⛧ PARABELLUM / PBLM.777'),row);}
  });
  label.append(input);fields.append(label);
 }
 container.append(fields);
 const card=el('div',undefined,'studio-preview');card.id='studio-signature-preview';container.append(card);
 const download=el('button','BAIXAR CARTÃO PNG','btn');download.type='button';
 download.onclick=()=>{
  try{
   const c=draw(signature());
   c.toBlob(blob=>{
    if(!blob){status('Não foi possível gerar a imagem.');return;}
    const url=URL.createObjectURL(blob),a=el('a');
    a.href=url;a.download='PBLM-assinatura.png';document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),3000);status('Cartão gerado. Se seu navegador bloquear o download, abra esta página no Chrome.');
   },'image/png');
  }catch{status('Falha ao desenhar o cartão.');}
 };
 container.append(download,el('p','O cartão é local e não comprova cargo oficial. Compartilhe apenas dados que deseja tornar públicos.','studio-sub'));
 const feedback=el('p','', 'studio-status');feedback.id='studio-status';feedback.setAttribute('role','status');container.append(feedback);
 main.append(container);
 preview();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
