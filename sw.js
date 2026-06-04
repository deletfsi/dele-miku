const CACHE_NAME = 'dele-miku-image-cache-v20260604-1';
const IMAGE_PATH_RE = /\.(?:avif|webp|png|jpe?g|gif|svg)$/i;
const CORE_IMAGES = [
  '/assets/0logo-512.webp',
  '/assets/hero-mobile.webp',
  '/assets/hero.webp'
];

async function cacheImage(url) {
  const cache = await caches.open(CACHE_NAME);
  const request = new Request(url, { mode: 'same-origin', credentials: 'same-origin' });
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => Promise.allSettled(CORE_IMAGES.map((src) => cache.add(src))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'CACHE_IMAGES' || !Array.isArray(event.data.sources)) return;
  event.waitUntil(Promise.allSettled(event.data.sources.map((src) => cacheImage(new URL(src, self.location.origin).href))));
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const isImage = request.destination === 'image' || IMAGE_PATH_RE.test(url.pathname);
  if (!isImage) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
