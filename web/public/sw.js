const CACHE_NAME = `nfl-own-your-team-${self.location.hostname === 'localhost' ? 'dev' : 'prod'}-v${Date.now()}`;
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/app/dashboard',
  '/app/leagues',
  '/teams',
  '/rules'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Failed to open cache:', error);
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch Event - Network First with Cache Fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests and non-GET requests
  if (url.origin !== location.origin || request.method !== 'GET') {
    return;
  }

  // In development (localhost), skip caching entirely
  if (self.location.hostname === 'localhost') {
    event.respondWith(fetch(request));
    return;
  }

  // Different strategies for different types of requests (production only)
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network First
    event.respondWith(networkFirstWithFallback(request));
  } else if (url.pathname.startsWith('/static/')) {
    // Static assets - Cache First
    event.respondWith(cacheFirstWithUpdate(request));
  } else {
    // Pages - Stale While Revalidate
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Push Event for notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let notificationData = {
    title: 'NFL Own Your Team',
    body: 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'default',
    data: {}
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('Error parsing push data:', error);
      notificationData.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    requireInteraction: true,
    actions: notificationData.actions || [
      {
        action: 'view',
        title: 'View',
        icon: '/favicon.ico'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationOptions)
  );
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  if (action === 'dismiss') {
    return;
  }

  const urlToOpen = data.url || '/app/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      // If no existing window/tab, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background Sync
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Message Event for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Cache Strategies

// Network First with Cache Fallback (for API requests)
async function networkFirstWithFallback(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network request failed, falling back to cache:', error);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return a custom offline response for API requests
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'You are currently offline. Please check your connection.' 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Cache First with Background Update (for static assets)
async function cacheFirstWithUpdate(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Return cached version immediately
    // Update cache in background
    fetch(request).then(async (networkResponse) => {
      if (networkResponse.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse);
      }
    }).catch(() => {
      // Ignore network errors for background updates
    });
    
    return cachedResponse;
  }
  
  // If not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return a generic offline page or error
    return new Response(
      '<h1>Offline</h1><p>This content is not available offline.</p>',
      { 
        headers: { 'Content-Type': 'text/html' },
        status: 503,
        statusText: 'Service Unavailable'
      }
    );
  }
}

// Stale While Revalidate (for pages)
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // Return cached response if network fails
    return cachedResponse;
  });
  
  // Return cached version immediately if available, otherwise wait for network
  return cachedResponse || fetchPromise;
}

// Background Sync Function
async function doBackgroundSync() {
  try {
    // Get any pending requests from IndexedDB or local storage
    // This would typically sync offline actions when back online
    console.log('Performing background sync...');
    
    // Example: Sync pending auction bids, league updates, etc.
    const pendingRequests = await getPendingRequests();
    
    for (const request of pendingRequests) {
      try {
        await fetch(request.url, request.options);
        await removePendingRequest(request.id);
      } catch (error) {
        console.error('Failed to sync request:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Helper functions for background sync
async function getPendingRequests() {
  // This would typically read from IndexedDB
  // For now, return empty array
  return [];
}

async function removePendingRequest(id) {
  // This would typically remove from IndexedDB
  console.log('Removing pending request:', id);
}

// Utility function to check if response should be cached
function shouldCache(response) {
  return response.status === 200 && 
         response.type === 'basic' &&
         response.headers.get('cache-control') !== 'no-cache';
}

console.log('Service Worker loaded successfully');
