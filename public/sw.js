const CACHE_NAME = "retailpos-v2"
const STATIC_ASSETS = [
  "/",
  "/offline",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch(() => {
            console.warn("Failed to cache:", url)
          })
        )
      )
    })
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return

  const isNavigation = event.request.mode === "navigate"

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const cloned = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              if (isNavigation) {
                cache.put(event.request, cloned)
              } else if (/\.(js|css|png|svg|ico|woff2?)$/.test(event.request.url)) {
                cache.put(event.request, cloned)
              }
            })
          }
          return response
        })
        .catch(() => {
          if (isNavigation) {
            return caches.match("/offline")
          }
          return new Response("Offline", { status: 503 })
        })

      return cached || fetchPromise
    })
  )
})
