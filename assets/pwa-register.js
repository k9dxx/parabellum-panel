(() => {
  'use strict';
  if (!('serviceWorker' in navigator)) return;
  const scope = '/parabellum-panel/';
  if (!location.pathname.startsWith(scope)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(scope + 'sw.js', {scope}).catch(error => {
      console.warn('PBLM PWA: service worker indisponível', error);
    });
  }, {once:true});
  let promptEvent = null;
  window.addEventListener('beforeinstallprompt', event => {
    if (matchMedia('(display-mode: standalone)').matches) return;
    event.preventDefault();
    promptEvent = event;
    const sidebar = document.querySelector('.sidebar-bottom');
    if (!sidebar || document.getElementById('pblm-install-app')) return;
    const button = document.createElement('button');
    button.id = 'pblm-install-app';
    button.className = 'button red';
    button.type = 'button';
    button.textContent = '⛧ INSTALAR APLICATIVO';
    button.addEventListener('click', async () => {
      if (!promptEvent) return;
      const prompt = promptEvent;
      promptEvent = null;
      button.disabled = true;
      try { await prompt.prompt(); await prompt.userChoice; }
      catch(error) { console.warn('PBLM PWA: instalação não iniciada', error); }
      button.remove();
    });
    sidebar.insertBefore(button, sidebar.firstChild);
  });
  window.addEventListener('appinstalled', () => {
    promptEvent = null;
    document.getElementById('pblm-install-app')?.remove();
  });
})();
