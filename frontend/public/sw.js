const CACHE_NAME = 'playrave-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('PlayRave: Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.log('PlayRave: Cache failed', error);
            })
    );
    // Activate immediately - don't wait for old SW to die
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('PlayRave: Clearing old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Take control of all pages immediately
    self.clients.claim();
});

// Fetch event - Network-first for JS/CSS, cache-first for static assets
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests, socket connections, and chrome extensions
    if (event.request.method !== 'GET' ||
        event.request.url.includes('socket.io') ||
        event.request.url.includes('api.qrserver.com') ||
        event.request.url.startsWith('chrome-extension://')) {
        return;
    }

    const url = new URL(event.request.url);
    const isCodeFile = url.pathname.endsWith('.js') || url.pathname.endsWith('.css');

    if (isCodeFile) {
        // NETWORK-FIRST for JS/CSS: Always get latest code from server.
        // Only fall back to cache when offline.
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response && response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request);
                })
        );
    } else {
        // CACHE-FIRST for static assets (images, fonts, icons)
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    if (response) {
                        return response;
                    }
                    return fetch(event.request).then((response) => {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                        return response;
                    });
                })
                .catch(() => {
                    if (event.request.mode === 'navigate') {
                        return caches.match('/index.html');
                    }
                })
        );
    }
});
