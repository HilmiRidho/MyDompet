const CACHE_NAME = 'mydompet-v1';
const assetsToCache = [
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './fontawesome-free-6.4.0-web/css/all.min.css',
  './fontawesome-free-6.4.0-web/webfonts/fa-brands-400.ttf',
  './fontawesome-free-6.4.0-web/webfonts/fa-brands-400.woff2',
  './fontawesome-free-6.4.0-web/webfonts/fa-regular-400.ttf',
  './fontawesome-free-6.4.0-web/webfonts/fa-regular-400.woff2',
  './fontawesome-free-6.4.0-web/webfonts/fa-solid-900.ttf',
  './fontawesome-free-6.4.0-web/webfonts/fa-solid-900.woff2',
  './fontawesome-free-6.4.0-web/webfonts/fa-v4compatibility.ttf',
  './fontawesome-free-6.4.0-web/webfonts/fa-v4compatibility.woff2',
  './fonts/Inter_18pt-Light.ttf',
  './fonts/Inter_18pt-Regular.ttf',
  './fonts/Inter_18pt-Medium.ttf',
  './fonts/Inter_18pt-SemiBold.ttf',
  './fonts/Inter_18pt-Bold.ttf',
  './icon/svg.svg',
  './icon/192.png',
  './icon/512.png'
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