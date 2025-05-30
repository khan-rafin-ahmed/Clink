// Service Worker for Thirstee Push Notifications
const CACHE_NAME = 'thirstee-v1'
const urlsToCache = [
  '/',
  '/thirstee-logo.svg',
  '/manifest.json'
]

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  )
})

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
      })
  )
})

// Push event for notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from Thirstee!',
    icon: '/thirstee-logo.svg',
    badge: '/thirstee-logo.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Event',
        icon: '/thirstee-logo.svg'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/thirstee-logo.svg'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('Thirstee', options)
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    )
  } else if (event.action === 'close') {
    // Just close the notification
    event.notification.close()
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})
