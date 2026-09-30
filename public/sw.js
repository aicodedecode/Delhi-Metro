// Delhi Metro offline shell — cache-first for static assets, network-first for pages.
const CACHE = "delhi-metro-v1";
const SHELL = ["/", "/stations", "/lines", "/manifest.webmanifest", "/icons/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request).catch(() => new Response(JSON.stringify({ error: "offline" }), { headers: { "Content-Type": "application/json" } })));
    return;
  }
  event.respondWith(
    fetch(request)
      .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(request, copy)); return res; })
      .catch(() => caches.match(request).then((hit) => hit || caches.match("/")))
  );
});
