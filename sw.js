/* ═══════════════════════════════════════════════
   DocNear – Service Worker v4
   File: sw.js (same folder as DocNear.html)
   ═══════════════════════════════════════════════ */

const CACHE_NAME = "docnear-v4";
const STATIC_ASSETS = [
  "./DocNear.html",
  "./DocNear.css",
  "./DocNear.js",
  "./manifest.json"
];

/* ── Install: cache static files ── */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn("SW: Cache addAll partial fail:", err);
      }))
      .then(() => self.skipWaiting())
  );
});

/* ── Activate: delete old caches ── */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ── Fetch: smart cache strategy ── */
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  /* HTML pages → Network First */
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match("./DocNear.html"))
    );
    return;
  }
  /* Supabase API → always network (live data) */
  if (url.hostname.includes("supabase.co")) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify([]), {
          headers: { "Content-Type": "application/json" }
        })
      )
    );
    return;
  }

  /* Google Fonts, Razorpay → network with cache fallback */
  if (url.hostname.includes("fonts.g") ||
      url.hostname.includes("checkout.razorpay") ||
      url.hostname.includes("fonts.gstatic")) {
    event.respondWith(
      caches.open(CACHE_NAME + "-ext").then(cache =>
        cache.match(event.request).then(cached =>
          cached || fetch(event.request).then(res => {
            if (res.ok) cache.put(event.request, res.clone());
            return res;
          }).catch(() => new Response("", { status: 503 }))
        )
      )
    );
    return;
  }

  /* App files → cache first, network fallback */
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        if (res.ok && event.request.method === "GET") {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return res;
      }).catch(() =>
        caches.match("./DocNear.html") ||
        new Response("<h2>DocNear — Offline</h2><p>Please check your connection.</p>",
          { headers: { "Content-Type": "text/html" } })
      );
    })
  );
});
