/* Bloco de Orçamento — service worker
   Rede primeiro (para receber atualizações), cache como reserva (para funcionar offline). */
const CACHE = 'bloco-orcamento-v1';
const ESSENCIAIS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ESSENCIAIS))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((chaves) => Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const externo = url.origin !== self.location.origin;

  e.respondWith(
    fetch(req)
      .then((resp) => {
        if (resp && resp.status === 200) {
          const copia = resp.clone();
          caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => {});
        }
        return resp;
      })
      .catch(() => {
        return caches.match(req).then((hit) => {
          if (hit) return hit;
          /* navegacao sem rede e sem cache: devolve o app */
          if (req.mode === 'navigate' || externo) return caches.match('./index.html');
          return new Response('', { status: 504, statusText: 'offline' });
        });
      })
  );
});
