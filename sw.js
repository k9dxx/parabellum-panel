'use strict';
const VERSION = 'pblm-pwa-20261106-v4';
const CACHE = 'pblm-shell-' + VERSION;
const BASE = '/parabellum-panel/';
const SHELL = [
  BASE, BASE + 'index.html', BASE + 'offline.html',
  BASE + 'manifest.webmanifest', BASE + 'assets/icons/pblm-192.png',
  BASE + 'assets/icons/pblm-512.png',
  BASE + 'assets/style.css?v=20261105-1',
  BASE + 'assets/core.js?v=20261105-1',
  BASE + 'assets/app.js?v=20261104-3',
  BASE + 'assets/portal.js?v=20261104-3',
  BASE + 'assets/pwa-register.js',
  BASE + 'assets/experience.js?v=20261106-2',
  BASE + 'assets/pblm-studio.js?v=20261106-1',
  BASE + 'assets/pblm-studio.css?v=20261106-1',
  BASE + 'assets/social-hub.js?v=20261106-1',
  BASE + 'assets/social-hub.css?v=20261106-1',
  BASE + 'assets/experience.css?v=20261106-2',
  BASE + 'data/conteudo.json'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('pblm-shell-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || request.headers.has('Authorization')) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  const path = url.pathname.slice(BASE.length);
  if (/(^|\/)(painel|pessoal)\.html$/.test(path) || path.startsWith('.github/') || path.startsWith('android-app/')) return;
  const allowed = request.mode === 'navigate' || /\.(?:html|css|js|json|webmanifest|svg|png|jpe?g|webp)$/.test(path) || path === '';
  if (!allowed || request.headers.has('Range')) return;
  event.respondWith((async () => {
    try {
      const network = await fetch(request);
      if (network.ok && network.type === 'basic' && request.cache !== 'no-store') {
        const cache = await caches.open(CACHE);
        await cache.put(request, network.clone());
      }
      return network;
    } catch {
      const cached = await caches.match(request, {ignoreSearch:true});
      if (cached) return cached;
      if (request.mode === 'navigate') return (await caches.match(BASE + 'offline.html')) || Response.error();
      return Response.error();
    }
  })());
});
