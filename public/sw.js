// Service Worker for OpenTune PWA
const CACHE_NAME = "opentune-v2"
const STATIC_CACHE = "opentune-static-v2"
const DYNAMIC_CACHE = "opentune-dynamic-v2"
const IMAGE_CACHE = "opentune-images-v2"
const API_CACHE = "opentune-api-v2"

const STATIC_ASSETS = [
  "/dashboard",
  "/dashboard/search",
  "/dashboard/library",
  "/dashboard/history",
  "/dashboard/discover",
  "/manifest.json",
  "/icon-192.jpg",
  "/icon-512.jpg",
]

const CACHE_LIMITS = {
  [IMAGE_CACHE]: 100,
  [API_CACHE]: 50,
  [DYNAMIC_CACHE]: 50,
}

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...")
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("[SW] Caching static assets")
      return cache.addAll(STATIC_ASSETS).catch((error) => {
        console.error("[SW] Failed to cache some assets:", error)
        return Promise.resolve()
      })
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
        keys
          .filter(
            (key) =>
              key !== STATIC_CACHE &&
              key !== DYNAMIC_CACHE &&
              key !== IMAGE_CACHE &&
              key !== API_CACHE &&
              key.startsWith("opentune-"),
          )
          .map((key) => {
            console.log("[SW] Deleting old cache:", key)
            return caches.delete(key)
          }),
      )
    }),
  )
  self.clients.claim()
})

async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  if (keys.length > maxItems) {
    // Delete oldest entries
    const deleteCount = keys.length - maxItems
    for (let i = 0; i < deleteCount; i++) {
      await cache.delete(keys[i])
    }
    console.log(`[SW] Trimmed ${deleteCount} items from ${cacheName}`)
  }
}

function getCacheStrategy(url) {
  if (url.pathname.startsWith("/api/")) {
    return "network-first"
  }
  if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
    return "cache-first"
  }
  if (url.pathname.startsWith("/_next/")) {
    return "cache-first"
  }
  return "network-first"
}

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== "GET") return

  // Skip chrome extensions and other protocols
  if (!url.protocol.startsWith("http")) return

  if (url.hostname.includes("youtube.com") || url.hostname.includes("googlevideo.com")) {
    event.respondWith(fetch(request))
    return
  }

  // Skip external requests (except images)
  if (url.origin !== self.location.origin && !url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
    return
  }

  const strategy = getCacheStrategy(url)

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseClone)
              limitCacheSize(API_CACHE, CACHE_LIMITS[API_CACHE])
            })
          }
          return response
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log("[SW] Serving cached API response for:", url.pathname)
              return cachedResponse
            }
            return new Response(JSON.stringify({ error: "Offline" }), {
              status: 503,
              headers: { "Content-Type": "application/json" },
            })
          })
        }),
    )
    return
  }

  if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/) || url.searchParams.has("height")) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }

        return fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(IMAGE_CACHE).then((cache) => {
              cache.put(request, responseClone)
              limitCacheSize(IMAGE_CACHE, CACHE_LIMITS[IMAGE_CACHE])
            })
          }
          return response
        })
      }),
    )
    return
  }

  // Static assets and pages - cache first, network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Serve from cache but update in background
        fetch(request)
          .then((response) => {
            if (response.ok) {
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, response)
                limitCacheSize(DYNAMIC_CACHE, CACHE_LIMITS[DYNAMIC_CACHE])
              })
            }
          })
          .catch(() => {})
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
            limitCacheSize(DYNAMIC_CACHE, CACHE_LIMITS[DYNAMIC_CACHE])
          })

          return response
        })
        .catch(() => {
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
  console.log("[SW] Notification clicked, action:", event.action)
  event.notification.close()

  // Handle notification actions
  if (event.action === "play" || event.action === "pause") {
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes("/dashboard")) {
            client.postMessage({
              type: "MEDIA_ACTION",
              action: event.action,
            })
            return client.focus()
          }
        }
      }),
    )
    return
  }

  if (event.action === "next") {
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes("/dashboard")) {
            client.postMessage({
              type: "MEDIA_ACTION",
              action: "next",
            })
            return client.focus()
          }
        }
      }),
    )
    return
  }

  if (event.action === "previous") {
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes("/dashboard")) {
            client.postMessage({
              type: "MEDIA_ACTION",
              action: "previous",
            })
            return client.focus()
          }
        }
      }),
    )
    return
  }

  // Default action - open now playing
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/dashboard") && "focus" in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("/dashboard/now-playing")
      }
    }),
  )
})
