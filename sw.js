const CACHE_NAME="docnear-v1";

self.addEventListener("install",event=>{
  event.waitUntil(
    caches.open(CACHE_NAME)
  );
});

self.addEventListener("fetch",event=>{
  event.respondWith(
    fetch(event.request).catch(()=>{
      return caches.match(event.request);
    })
  );
});
