const CACHE = "ilp-synthetic-offline-lab-v1";
const ASSETS = ["./index.html", "./style.css", "./app.mjs", "./store.mjs"];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin ||
      !url.pathname.startsWith(new URL("./", self.location.href).pathname)) return;
  event.respondWith(caches.match(event.request).then((response) => response || fetch(event.request)));
});
