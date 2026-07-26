const CACHE_NAME = 'drift-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/config/shapes.js',
  './js/config/powers.js',
  './js/config/abilities.js',
  './js/config/upgrades.js',
  './js/core/save.js',
  './js/core/audio.js',
  './js/core/performance.js',
  './js/core/entities.js',
  './js/core/physics.js',
  './js/core/render.js',
  './js/systems/powers.js',
  './js/systems/abilities.js',
  './js/systems/autotapper.js',
  './js/ui/research.js',
  './js/ui/upgrades.js',
  './js/ui/powersPanel.js',
  './js/ui/stats.js',
  './js/ui/settings.js',
  './js/ui/ui.js',
  './js/main.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return res;
      }).catch(() => cached);
    })
  );
});
