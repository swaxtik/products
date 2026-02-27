const CACHE_NAME = 'jewelry-gallery-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/gallery.html',
    '/css/style.css',
    '/js/auth.js',
    '/js/db.js',
    '/js/gallery.js',
    '/js/admin.js',
    '/js/lightbox.js',
    '/js/theme.js',
    '/manifest.json'
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
                console.error('Cache installation failed:', error);
            })
    );
    self.skipWaiting();
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
    self.clients.claim();
});

// Fetch event - Network first, then cache
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip chrome-extension and other non-http requests
    if (!event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Check if we received a valid response
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // Clone the response
                const responseToCache = response.clone();

                caches.open(CACHE_NAME)
                    .then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                return response;
            })
            .catch(() => {
                // Network failed, try cache
                return caches.match(event.request)
                    .then((response) => {
                        if (response) {
                            return response;
                        }
                        
                        // If it's a navigation request and we don't have it cached,
                        // return the cached index.html
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                        
                        // For other requests, return a generic offline response
                        return new Response('Offline', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('Background sync triggered:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    console.log('Performing background sync...');
    
    try {
        // Here you could sync any offline changes when back online
        // For example, upload queued images or sync category changes
        
        // Send a message to all clients that sync is complete
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_COMPLETE',
                message: 'Background sync completed successfully'
            });
        });
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Push notifications (for future use)
self.addEventListener('push', (event) => {
    console.log('Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'New jewelry items available!',
        icon: '/manifest-icon-192.png',
        badge: '/manifest-icon-192.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 'jewelry-notification'
        },
        actions: [
            {
                action: 'explore',
                title: 'View Collections',
                icon: '/manifest-icon-192.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/manifest-icon-192.png'
            }
        ],
        requireInteraction: true,
        tag: 'jewelry-update'
    };

    event.waitUntil(
        self.registration.showNotification('Elegant Jewelry Gallery', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/gallery.html')
        );
    } else if (event.action === 'close') {
        // Just close the notification
        return;
    } else {
        // Default action - open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
    console.log('Service Worker received message:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
    console.log('Periodic sync triggered:', event.tag);
    
    if (event.tag === 'jewelry-sync') {
        event.waitUntil(doPeriodicSync());
    }
});

async function doPeriodicSync() {
    console.log('Performing periodic sync...');
    
    try {
        // Perform periodic maintenance tasks
        // For example, clean up old cached images or check for updates
        
        // Clean up old caches
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => name !== CACHE_NAME);
        
        await Promise.all(
            oldCaches.map(cacheName => caches.delete(cacheName))
        );
        
        console.log('Periodic sync completed');
    } catch (error) {
        console.error('Periodic sync failed:', error);
    }
}