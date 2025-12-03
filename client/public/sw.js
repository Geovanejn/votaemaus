const CACHE_NAME = 'emaus-vota-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.png',
  '/logo.png',
  '/logo-ump.png',
  '/logo-animated.webp',
  '/logo-original.png'
];

const API_CACHE_DURATION = 5 * 60 * 1000;

const CACHEABLE_API_ROUTES = [
  '/api/study/verses',
  '/api/study/achievements',
  '/api/study/profile',
  '/api/study/leaderboard',
  '/api/missions'
];

const CACHE_STRATEGIES = {
  static: 'cache-first',
  api: 'network-first',
  images: 'cache-first',
  fonts: 'cache-first'
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (url.origin !== location.origin) {
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    const isCacheableApi = CACHEABLE_API_ROUTES.some(route => 
      url.pathname.startsWith(route)
    );
    
    if (isCacheableApi) {
      event.respondWith(networkFirstWithCacheExpiry(request));
    } else {
      event.respondWith(networkFirst(request));
    }
    return;
  }

  if (request.destination === 'font') {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.destination === 'document' || 
      request.destination === 'script' || 
      request.destination === 'style') {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  event.respondWith(networkFirst(request));
});

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Cache first failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    if (request.destination === 'document') {
      const cachedIndex = await caches.match('/');
      if (cachedIndex) {
        return cachedIndex;
      }
    }
    
    return new Response(JSON.stringify({ 
      error: 'Offline',
      message: 'Voce esta offline. Por favor, verifique sua conexao.'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

async function networkFirstWithCacheExpiry(request) {
  const cache = await caches.open(CACHE_NAME);
  const cacheKey = request.url;
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-at', Date.now().toString());
      
      const body = await responseToCache.blob();
      const cachedResponseWithMeta = new Response(body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      cache.put(cacheKey, cachedResponseWithMeta);
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      if (cachedAt) {
        const age = Date.now() - parseInt(cachedAt);
        if (age < API_CACHE_DURATION) {
          console.log('[SW] Serving fresh cached API response:', cacheKey);
          return cachedResponse;
        } else {
          console.log('[SW] Cache expired, deleting stale entry:', cacheKey);
          cache.delete(cacheKey);
          return new Response(JSON.stringify({ 
            error: 'Offline',
            message: 'Cache expirado. Conecte-se para atualizar os dados.',
            cached: true,
            expired: true
          }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      console.log('[SW] Serving cached API response (no timestamp):', cacheKey);
      return cachedResponse;
    }
    
    return new Response(JSON.stringify({ 
      error: 'Offline',
      message: 'Voce esta offline. Por favor, verifique sua conexao.',
      cached: false
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[SW] Cache cleared');
    });
  }
});
