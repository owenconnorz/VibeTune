const CACHE_NAME = "vibetune-v1"
const STATIC_CACHE = "vibetune-static-v1"
const MUSIC_CACHE = "vibetune-music-v1"

// Files to cache for offline functionality
const STATIC_FILES = ["/", "/manifest.json", "/icon-192.png", "/icon-512.png"]

// Install event - cache static files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_FILES))
      .then(() => self.skipWaiting()),
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
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE && cacheName !== MUSIC_CACHE) {
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => self.clients.claim()),
  )
})

// Fetch event - serve from cache when offline
self.addEventListener("fetch", (event) => {
  // Handle music/audio requests
  if (event.request.url.includes("audio") || event.request.url.includes("music")) {
    event.respondWith(
      caches.open(MUSIC_CACHE).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) {
            return response
          }
          return fetch(event.request).then((fetchResponse) => {
            cache.put(event.request, fetchResponse.clone())
            return fetchResponse
          })
        })
      }),
    )
    return
  }

  // Handle other requests
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response
      }
      return fetch(event.request)
    }),
  )
})

// Background sync for offline downloads
self.addEventListener("sync", (event) => {
  if (event.tag === "music-download") {
    event.waitUntil(syncMusicDownloads())
  }
})

// Push notifications for music updates
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "New music available!",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "music-notification",
    actions: [
      {
        action: "play",
        title: "Play Now",
        icon: "/icon-192.png",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification("VibeTune", options))
})

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "play") {
    event.waitUntil(clients.openWindow("/"))
  }
})

// Sync music downloads function
async function syncMusicDownloads() {
  try {
    // Get pending downloads from IndexedDB
    const pendingDownloads = await getPendingDownloads()

    for (const download of pendingDownloads) {
      try {
        await downloadMusic(download)
        await markDownloadComplete(download.id)
      } catch (error) {
        console.error("[SW] Download failed:", error)
      }
    }
  } catch (error) {
    console.error("[SW] Sync failed:", error)
  }
}

// Helper functions for IndexedDB operations
async function getPendingDownloads() {
  // Implementation would connect to IndexedDB
  return []
}

async function downloadMusic(download) {
  // Implementation would download music file
}

async function markDownloadComplete(id) {
  // Implementation would update IndexedDB
}
