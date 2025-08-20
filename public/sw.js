const CACHE_NAME = "vibetune-v1"
const STATIC_CACHE = "vibetune-static-v1"
const DYNAMIC_CACHE = "vibetune-dynamic-v1"

// Assets to cache immediately
const STATIC_ASSETS = ["/", "/library", "/settings", "/manifest.json", "/icon-192x192.png", "/icon-512x512.png"]

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        return self.skipWaiting()
      }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        return self.clients.claim()
      }),
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Handle API requests
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return fetch(request)
          .then((response) => {
            // Cache successful API responses
            if (response.status === 200) {
              cache.put(request, response.clone())
            }
            return response
          })
          .catch(() => {
            // Return cached response if network fails
            return cache.match(request).then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse
              }
              // Return offline fallback for API requests
              return new Response(
                JSON.stringify({
                  error: "Offline",
                  message: "No internet connection",
                  cached: false,
                }),
                {
                  status: 503,
                  headers: { "Content-Type": "application/json" },
                },
              )
            })
          })
      }),
    )
    return
  }

  // Handle static assets and pages
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response
          }

          // Cache the response
          const responseToCache = response.clone()
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseToCache)
          })

          return response
        })
        .catch(() => {
          // Return offline page for navigation requests
          if (request.mode === "navigate") {
            return caches.match("/")
          }
          return new Response("Offline", { status: 503 })
        })
    }),
  )
})

// Background sync for when connection is restored
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(
      // Sync any pending data when connection is restored
      syncPendingData(),
    )
  }
})

// Push notifications (for future use)
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: "/icon-192x192.png",
      badge: "/icon-96x96.png",
      vibrate: [100, 50, 100],
      data: data.data || {},
    }

    event.waitUntil(self.registration.showNotification(data.title, options))
  }
})

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  event.waitUntil(clients.openWindow("/"))
})

// Helper function for background sync
async function syncPendingData() {
  // Implement any pending data synchronization here
  // For example, sync offline playlist changes, downloads, etc.
  return Promise.resolve()
}
