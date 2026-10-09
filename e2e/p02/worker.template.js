/* global __CACHE_NAME__, __FILES__ */
const CACHE = __CACHE_NAME__;
const FILES = __FILES__;
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE);
      await cache.addAll(FILES.map(path => new Request(path, { credentials: 'omit', cache: 'reload' })));
    } catch (error) {
      await caches.delete(CACHE);
      throw error;
    }
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('ilp-p02-lab-') && name !== CACHE).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !FILES.includes(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(url.pathname);
    return cached ?? fetch(event.request);
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type !== 'P02_VERIFY_CACHE' || !event.ports[0]) return;
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE);
      const responses = await Promise.all(FILES.map(path => cache.match(path)));
      event.ports[0].postMessage(responses.every(response => response?.ok === true));
    } catch { event.ports[0].postMessage(false); }
  })());
});
