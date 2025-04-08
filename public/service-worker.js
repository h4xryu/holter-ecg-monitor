// Service Worker for ECG Arrhythmia Classification Web App

const CACHE_NAME = "ecg-app-v1"
const ASSETS_TO_CACHE = ["/", "/index.html", "/globals.css", "/placeholder.svg", "/favicon.ico"]

// Install event - cache assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE)
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
            if (cacheName !== CACHE_NAME) {
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

// Fetch event - serve from cache or network
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response
          }

          // Clone the response as it can only be consumed once
          const responseToCache = response.clone()

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
        .catch(() => {
          // If fetch fails (offline), try to return the offline page
          if (event.request.mode === "navigate") {
            return caches.match("/offline.html")
          }
        })
    }),
  )
})

// Handle background sync for pending operations
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-classifications") {
    event.waitUntil(syncClassifications())
  }
})

// Function to sync pending classifications when online
async function syncClassifications() {
  try {
    const db = await openDatabase()
    const pendingClassifications = await db.getAll("pendingClassifications")

    for (const classification of pendingClassifications) {
      try {
        // In a real app, this would send data to a server
        console.log("Syncing classification:", classification)

        // After successful sync, remove from pending
        await db.delete("pendingClassifications", classification.id)
      } catch (error) {
        console.error("Failed to sync classification:", error)
      }
    }
  } catch (error) {
    console.error("Error during sync:", error)
  }
}

// Simple IndexedDB wrapper for the service worker
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ecg-offline-db", 1)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      db.createObjectStore("pendingClassifications", { keyPath: "id" })
    }

    request.onsuccess = (event) => {
      const db = event.target.result
      resolve({
        getAll: (storeName) => {
          return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, "readonly")
            const store = transaction.objectStore(storeName)
            const request = store.getAll()

            request.onsuccess = () => resolve(request.result)
            request.onerror = () => reject(request.error)
          })
        },
        delete: (storeName, id) => {
          return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, "readwrite")
            const store = transaction.objectStore(storeName)
            const request = store.delete(id)

            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
          })
        },
      })
    }

    request.onerror = () => reject(request.error)
  })
}
