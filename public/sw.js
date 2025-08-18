// public/sw.js - SERVICE WORKER CORREGIDO

const CACHE_NAME = 'dhermica-v1';
const urlsToCache = [
  '/',
  '/admin/dashboard',
  '/admin/appointments',
  '/admin/clients',
  '/admin/treatments',
  '/admin/professionals',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
});

// Interceptar requests - VERSIÓN CORREGIDA
self.addEventListener('fetch', event => {
  // Solo procesar requests GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  // No cachear requests a APIs externas
  if (event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('firebase.googleapis.com') ||
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('_next/static/chunks')) {
    return;
  }
  
  // Solo cachear requests del mismo origen
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Devolver del cache si existe
        if (response) {
          return response;
        }
        
        // Hacer fetch del request original
        return fetch(event.request).then(response => {
          // Verificar que la respuesta es válida antes de cachear
          if (!response || 
              response.status !== 200 || 
              response.type !== 'basic' ||
              response.headers.get('content-type')?.includes('text/event-stream')) {
            return response;
          }
          
          // Solo cachear ciertos tipos de archivos
          const url = new URL(event.request.url);
          const isStaticAsset = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/.test(url.pathname);
          const isPageRequest = !url.pathname.includes('.') || url.pathname.endsWith('.html');
          
          if (isStaticAsset || isPageRequest) {
            // Clonar la respuesta para cachear
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                // Usar try/catch para evitar errores de caché
                try {
                  cache.put(event.request, responseToCache);
                } catch (error) {
                  console.log('Error caching:', error);
                }
              })
              .catch(error => {
                console.log('Cache error:', error);
              });
          }
          
          return response;
        }).catch(error => {
          console.log('Fetch error:', error);
          // Devolver respuesta del cache si el fetch falla
          return caches.match(event.request);
        });
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});