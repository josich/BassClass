// Offline support: network first (so updates arrive), cache fallback when offline.
const CACHE = 'bassclass-v1';

self.addEventListener('install', () => self.skipWaiting());
// the drum kit and the piano have caches of their own (web/js/drums.js, piano.js): copies this cache made of
// the kit before are dropped
self.addEventListener('activate', (e) => e.waitUntil(Promise.all([
  self.clients.claim(),
  caches.open(CACHE).then((c) => c.keys().then((ks) => Promise.all(ks.filter((r) => r.url.includes('/audio/drums/')).map((r) => c.delete(r))))),
])));

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || /\/audio\/(drums|piano)\//.test(url.pathname)) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('./index.html'))),
  );
});
