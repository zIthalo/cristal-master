// Service worker: deixa o app instalável e abre a tela mesmo sem rede.
// Páginas e arquivos: rede primeiro, cache como reserva. Chamadas /api/ nunca vão para o cache
// (saldo e FIFO precisam ser sempre os dados reais do servidor).
// Aula 08: versão v5 (caminhos relativos). Inclui o css/integracao.css e busca sempre a versão nova no servidor
// (cache: 'no-cache'), para alteração de CSS/JS aparecer ao recarregar a página.
const CACHE = 'cristalmaster-v5';
// Caminhos relativos à pasta do sw.js: funcionam servidos pelo Spring (/) e pelo Live Server (/src/main/resources/static/).
const BASE = ['./', 'css/estilo.css', 'css/integracao.css', 'js/app.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASE)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then((r) => {
        if (r.ok) { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)); }
        return r;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./')))
  );
});
