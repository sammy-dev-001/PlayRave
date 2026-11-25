// Service Worker for PlayRave - Offline Support
const CACHE_NAME = 'playrave-v1.3';
const STATIC_CACHE = 'playrave-static-v1.3';
const DYNAMIC_CACHE = 'playrave-dynamic-v1.3';

// Static asset shell
const STATIC_ASSETS = [
    '/manifest.json',
    '/favicon.ico'
];

// Install event - cache static assets and activate immediately
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
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

    // Network-first strategy for API calls, HTML documents, and app JS/CSS bundles
    const isCodeOrDoc =
        request.mode === 'navigate' ||
        url.pathname === '/' ||
        url.pathname.endsWith('.html') ||
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.css');

    if (url.pathname.startsWith('/api') || isCodeOrDoc) {
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
        if (request.mode === 'navigate') {
            const shell = await caches.match('/index.html');
            if (shell) return shell;
        }
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
