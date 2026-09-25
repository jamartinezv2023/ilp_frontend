const CACHE = "ilp-review-v2";
const ASSETS = ["./index.html", "./style.css", "./manifest.webmanifest", "../brand/ILP_horizontal.svg", "../favicon-32x32.png", "../android-chrome-192x192.png", "../android-chrome-512x512.png"];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("ilp-review-") && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  const url = new URL(event.request.url);
  if (!ASSETS.some((asset) => url.href === new URL(asset, self.registration.scope).href)) return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
