// Service Worker for PlayRave - Offline Support
const CACHE_NAME = 'playrave-v1.1'; // Bumped version
const STATIC_CACHE = 'playrave-static-v1.1';
const DYNAMIC_CACHE = 'playrave-dynamic-v1.1';

// Assets to cache for offline use
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.ico'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            // We NO LONGER skipWaiting here automatically to avoid reload loops
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name.startsWith('playrave-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip chrome extensions and other non-http(s) requests
    if (!url.protocol.startsWith('http')) return;

    // Network-only for socket.io (very important to avoid interference)
    if (url.pathname.includes('socket.io')) {
        return; 
    }

    // Network-first strategy for API calls
    if (url.pathname.startsWith('/api')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Cache-first strategy for static assets
    event.respondWith(cacheFirst(request));
});

// Cache-first strategy
async function cacheFirst(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);

    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);
        // Cache successful responses from our own domain
        if (response.status === 200 && new URL(request.url).origin === self.location.origin) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const staticCached = await caches.match(request);
        if (staticCached) return staticCached;

        if (request.mode === 'navigate') {
            return caches.match('/index.html');
        }

        throw error;
    }
}

// Network-first strategy
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) return cached;
        throw error;
    }
}

// Listen for messages from clients
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(cacheNames.map((name) => caches.delete(name)));
            })
        );
    }
});
