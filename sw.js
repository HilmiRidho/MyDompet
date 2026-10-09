const CACHE_NAME = 'mydompet-v1';
const assetsToCache = [
  './index.html',
  './style.css',
  './script.js',
  './manifest.json'
];

// Install Service Worker dan Cache File
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(assetsToCache);
    })
  );
});

// Fetching assets from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});