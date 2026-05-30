/* ═══════════════════════════════════════════════
   DocNear Service Worker – PWA Offline Support
   ═══════════════════════════════════════════════ */

const CACHE_NAME = "docnear-v1";
const ASSETS = [
  "./DocNear.html",
  "./DocNear.css",
  "./DocNear.js",
  "./manifest.json"
];

/* Install – cache all assets */
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

/* Activate – remove old caches */
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* Fetch – cache-first for assets, network-first for Supabase API */
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);

  // Supabase API → always network (live data)
  if (url.hostname.includes("supabase.co")) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(JSON.stringify([]), {headers: {"Content-Type":"application/json"}})
      )
    );
    return;
  }

  // Google Fonts → network with cache fallback
  if (url.hostname.includes("fonts.googleapis.com") || url.hostname.includes("fonts.gstatic.com")) {
    e.respondWith(
      caches.open(CACHE_NAME + "-fonts").then(cache =>
        cache.match(e.request).then(cached =>
          cached || fetch(e.request).then(res => { cache.put(e.request, res.clone()); return res; })
        )
      )
    );
    return;
  }

  // App files → cache first, fallback network
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).then(res => {
        if (res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      })
    ).catch(() => caches.match("./DocNear.html"))
  );
});
