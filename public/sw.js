const CACHE_NAME = 'vibetune-v1'
const STATIC_CACHE = 'vibetune-static-v1'
const DYNAMIC_CACHE = 'vibetune-dynamic-v1'

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
]

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error)
      })
  )
  
  self.skipWaiting()
})

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  
  self.clients.claim()
})

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Skip external requests
  if (url.origin !== self.location.origin) {
    return
  }
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses for a short time
          if (response.ok && response.status === 200) {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Return cached response if available
          return caches.match(request)
        })
    )
    return
  }
  
  // Handle static assets
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        
        return fetch(request)
          .then((response) => {
            // Cache successful responses
            if (response.ok) {
              const responseClone = response.clone()
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, responseClone)
              })
            }
            return response
          })
      })
      .catch(() => {
        // Return offline fallback for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/')
        }
      })
  )
})

// Background sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  try {
    console.log('[SW] Performing background sync')
    // Add background sync logic here
  } catch (error) {
    console.error('[SW] Background sync failed:', error)
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received')
  
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-192.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('VibeTune', options)
  )
})

// Notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event.action)
  
  event.notification.close()
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})