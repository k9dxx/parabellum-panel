/* PBLM Guide — local navigation assistant, not a generative AI. */
(() => {
'use strict';
const node=(tag,text,klass)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=text;if(klass)x.className=klass;return x;};
const destinations=[
  {words:['inicio','portal','home','principal'],title:'Início PARABELLUM',url:'index.html',text:'Voltar à página principal'},
  {words:['comunidade','membros','integrantes','cargos','perfis'],title:'Membros e perfis',url:'comunidade.html#social-profiles',text:'Encontre integrantes e cartões de identidade'},
  {words:['conversa','chat','mensagem','canais','grupo'],title:'Conversas',url:'comunidade.html#social-chat',text:'Explore os canais públicos da comunidade'},
  {words:['privada','dm','direta','login','entrar'],title:'Área pessoal',url:'pessoal.html#social-chat',text:'Entre para conversar, criar perfil e consultar notas'},
  {words:['aparencia','personalizar','tema','cores','studio','visual'],title:'PBLM Studio',url:'preferencias.html#pblm-studio',text:'Temas compartilháveis, cartões e aparência'},
  {words:['noticias','novidades','noticia'],title:'Notícias',url:'noticias.html',text:'Veja os comunicados publicados'},
  {words:['evento','agenda','encontro'],title:'Agenda',url:'agenda.html',text:'Consulte os próximos eventos e encontros'},
  {words:['ranking','xp','nivel','conquistas'],title:'Ranking PBLM',url:'comunidade.html#social-rankings',text:'Pontuação baseada em participação real no mural'},
  {words:['galeria','foto','imagem','arte','wallpaper'],title:'Galeria PARABELLUM',url:'galeria.html',text:'Explore a identidade visual'},
  {words:['android','apk','aplicativo','instalar','baixar'],title:'Aplicativo Android',url:'https://github.com/k9dxx/parabellum-panel/releases/latest',text:'Consulte a versão mais recente do APK assinado'}
];
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function init(){
 if(document.getElementById('pblm-guide'))return;
 const root=node('div',undefined,'pblm-guide');root.id='pblm-guide';
 const button=node('button','⛧','pblm-guide-launch');button.type='button';
 button.setAttribute('aria-label','Abrir guia PARABELLUM');
 button.setAttribute('aria-expanded','false');
 button.setAttribute('aria-controls','pblm-guide-panel');
 const panel=node('section',undefined,'pblm-guide-panel');panel.id='pblm-guide-panel';panel.hidden=true;panel.setAttribute('aria-label','Guia interativo PARABELLUM');
 const top=node('div',undefined,'pblm-guide-header');top.append(node('strong','⛧ PBLM GUIDE'));
 const close=node('button','×');close.type='button';close.setAttribute('aria-label','Fechar guia');top.append(close);
 const description=node('p','Seu assistente de navegação. Encontre páginas, ferramentas e conteúdos do portal sem precisar procurar nos menus.','pblm-guide-sub');
 const input=node('input');input.type='search';input.maxLength=70;input.placeholder='Ex.: perfil, chat, ranking, temas…';input.setAttribute('aria-label','Pesquisar no guia');
 const result=node('div',undefined,'pblm-guide-results');
 const note=node('small','Guia local de navegação — não é um modelo de IA e não lê suas mensagens privadas.');
 const render=query=>{
  result.replaceChildren();
  const text=normalize(query).trim();
  const choices=destinations.filter(d=>!text||normalize(d.words.join(' ')+d.title+' '+d.text).includes(text)||
    d.words.some(w=>text.includes(w)));
  for(const match of choices.slice(0,7)){
   const link=node('a',undefined);link.href=match.url;link.className='pblm-guide-result';
   link.append(node('strong',match.title),node('small',match.text));result.append(link);
  }
  if(!choices.length)result.append(node('p','Não encontrei. Experimente: comunidade, tema, ranking, eventos, chat ou aplicativo.'));
 };
 const show=()=>{
   const isOpen=!panel.hidden;
   panel.hidden=isOpen;button.setAttribute('aria-expanded',String(!isOpen));
   if(!isOpen){render(input.value);input.focus();}
 };
 button.onclick=show;close.onclick=()=>{panel.hidden=true;button.setAttribute('aria-expanded','false');button.focus()};
 input.oninput=()=>render(input.value);
 panel.append(top,description,input,result,note);
 root.append(button,panel);document.body.append(root);
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){panel.hidden=true;button.setAttribute('aria-expanded','false');button.focus()}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
