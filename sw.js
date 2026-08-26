const CACHE_NAME = 'calc-areas-v35';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './styles.min.css',
  './app.js',
  './vendor/jspdf.umd.min.js',
  './vendor/jspdf.plugin.autotable.min.js',
  './icon-192.png',
  './icon-512.png'
];

// Instalación: Cachear todos los recursos locales
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activación: Eliminar cachés antiguas
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Estrategia: Cache-First con fallback a red
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => {
      return cached || fetch(e.request).then((response) => {
        // No cachear peticiones que no sean GET
        if (e.request.method !== 'GET') return response;
        // Cachear dinámicamente respuestas exitosas
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        return response;
      });
    }).catch(() => {
      // Fallback offline para navegación
      if (e.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});
