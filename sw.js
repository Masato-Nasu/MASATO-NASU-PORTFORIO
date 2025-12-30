const CACHE = 'portfolio-v3';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './works.json',
  './viewer.html',
  './viewer.js',
  './manifest.json',
  './assets/thumbs/portfolio.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // PDFはキャッシュしない（容量が増えるため）
  if (url.pathname.toLowerCase().endsWith('.pdf')) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(event.request);
    if (cached) return cached;
    const res = await fetch(event.request);
    // 同一オリジンのGETのみキャッシュ
    if (event.request.method === 'GET' && url.origin === location.origin) {
      cache.put(event.request, res.clone()).catch(()=>{});
    }
    return res;
  })());
});
