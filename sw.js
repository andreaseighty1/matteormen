/* ═══════════════════════════════════════
   Matteormen — Service Worker v3.0
   Cachar spelet för offline-stöd
   ═══════════════════════════════════════ */
const CACHE = 'matteormen-v3';

/* Filer som cachas vid installation */
const PRECACHE = [
  '/index.html',
  '/manifest.json',
  '/matteormen_banner.png',
  '/matteormen_titel.mp3',
  '/matteormen_musik.mp3',
  '/matteormen_snabb.mp3',
  /* Ikoner */
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  /* Google Fonts (cachas runtime nedan om de laddas) */
];

/* ── Install: precacha alla lokala resurser ── */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(PRECACHE.filter(u => !u.startsWith('http'))))
      .then(() => self.skipWaiting())
  );
});

/* ── Activate: ta bort gamla cachar ── */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* ── Fetch: cache-first för lokalt, network-first för CDN ── */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  /* Google Fonts och andra externa resurser: network-first med cache-fallback */
  if (url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  /* Lokala resurser: cache-first */
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
