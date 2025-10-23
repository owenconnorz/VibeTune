// Service Worker for VibeTune PWA
const CACHE_NAME = "vibetune-v1"
const STATIC_CACHE = "vibetune-static-v1"
const DYNAMIC_CACHE = "vibetune-dynamic-v1"

// Assets to cache on install
const STATIC_ASSETS = [
  "/dashboard",
  "/dashboard/search",
  "/dashboard/library",
  "/dashboard/history",
  "/manifest.json",
  "/icon-192.jpg",
  "/icon-512.jpg",
]

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...")
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("[SW] Caching static assets")
      return cache.addAll(STATIC_ASSETS)
    }),
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...")
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE).map((key) => caches.delete(key)),
      )
    }),
  )
  self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== "GET") return

  // Skip chrome extensions and other protocols
  if (!url.protocol.startsWith("http")) return

  // Skip external requests
  if (url.origin !== self.location.origin) return

  // API requests - network first, cache fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }
            // Return a basic error response if no cache available
            return new Response(JSON.stringify({ error: "Offline" }), {
              status: 503,
              headers: { "Content-Type": "application/json" },
            })
          })
        }),
    )
    return
  }

  // Static assets and pages - cache first, network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === "error") {
            return response
          }

          const responseClone = response.clone()
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone)
          })

          return response
        })
        .catch(() => {
          // If offline and no cache, return to dashboard
          if (url.pathname === "/") {
            return caches.match("/dashboard")
          }
          return new Response("Offline", { status: 503 })
        })
    }),
  )
})

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }

  // Handle media session updates from the client
  if (event.data && event.data.type === "UPDATE_MEDIA_SESSION") {
    const { title, artist, artwork } = event.data
    console.log("[SW] Media session updated:", title, artist)
  }
})

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-queue") {
    console.log("[SW] Background sync: queue")
    event.waitUntil(syncQueue())
  }
})

async function syncQueue() {
  try {
    // Sync any pending queue items when back online
    const cache = await caches.open(DYNAMIC_CACHE)
    console.log("[SW] Queue synced")
  } catch (error) {
    console.error("[SW] Error syncing queue:", error)
  }
}

self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked")
  event.notification.close()

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes("/dashboard") && "focus" in client) {
          return client.focus()
        }
      }
      // Open new window if no existing window
      if (clients.openWindow) {
        return clients.openWindow("/dashboard/now-playing")
      }
    }),
  )
})
