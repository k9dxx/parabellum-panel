const $=s=>document.querySelector(s);
const all=s=>document.querySelectorAll(s);
$('#year').textContent=new Date().getFullYear();
$('#menu').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
all('.nav').forEach(a=>a.addEventListener('click',()=>{
 all('.nav').forEach(n=>n.classList.remove('active'));
 a.classList.add('active');
 $('#current').textContent=a.textContent.trim().toUpperCase();
 $('#sidebar').classList.remove('open');
}));
function clock(){ $('#clock').textContent=new Date().toLocaleTimeString('pt-BR'); }
clock();setInterval(clock,1000);

$('#generate').addEventListener('click',()=>{
 const n=Math.max(12,Math.min(64,Number($('#length').value)||20));
 const chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%_-';
 const bytes=new Uint32Array(n);
 crypto.getRandomValues(bytes);
 $('#password').value=Array.from(bytes,b=>chars[b%chars.length]).join('');
 $('#toolmsg').textContent='Senha gerada localmente. Guarde-a com segurança.';
});
$('#copy').addEventListener('click',async()=>{
 const p=$('#password');
 if(!p.value){$('#toolmsg').textContent='Gere uma senha primeiro.';return;}
 try{await navigator.clipboard.writeText(p.value);$('#toolmsg').textContent='Copiada.';}
 catch{$('#toolmsg').textContent='Selecione e copie a senha manualmente.';}
});

const out=$('#output');
function line(t){const p=document.createElement('p');p.textContent=t;out.appendChild(p);}
$('#terminal-form').addEventListener('submit',e=>{
 e.preventDefault();const c=$('#command').value.trim().toLowerCase();
 if(!c)return;
 line('visitor@pblm:~$ '+c);
 const answers={
 help:['Comandos: help, about, date, status, clear'],
 about:['PARABELLUM PBLM.777 — interface local.'],
 date:['Horário local: '+new Date().toLocaleString('pt-BR')],
 status:['Interface: ativa','Banco de dados: não conectado','Autenticação: não configurada']
 };
 if(c==='clear')out.replaceChildren();
 else (answers[c]||['Comando desconhecido. Digite help.']).forEach(line);
 $('#command').value='';
});
$('#clear').addEventListener('click',()=>out.replaceChildren());
