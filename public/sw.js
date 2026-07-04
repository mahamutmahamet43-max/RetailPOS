const CACHE_NAME = "retailpos-v2"

const STATIC_ASSETS = ["/", "/offline"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch(() => console.warn("Failed to cache:", url))
        )
      )
    )
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  )
  self.clients.claim()
})

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    return caches.match("/offline")
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response("Offline", { status: 503 })
  }
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return

  const isNavigation = event.request.mode === "navigate"
  const isAsset = /\.(js|css|png|svg|ico|woff2?)$/.test(event.request.url)

  if (isNavigation) {
    event.respondWith(networkFirst(event.request))
  } else if (isAsset) {
    event.respondWith(cacheFirst(event.request))
  }
})
