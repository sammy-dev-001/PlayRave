export const register = async () => {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js', {
                scope: '/'
            });

            console.log('[SW] Service Worker registered successfully:', registration.scope);

            // When a new SW is found, force it to activate immediately
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('[SW] New service worker found, installing...');

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('[SW] New content available - activating immediately...');
                        // Force the waiting SW to activate NOW
                        newWorker.postMessage({ type: 'SKIP_WAITING' });
                    }
                });
            });




            return registration;
        } catch (error) {
            console.error('[SW] Service Worker registration failed:', error);
        }
    } else {
        console.log('[SW] Service Workers not supported');
    }
};

export const unregister = async () => {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.ready;
            await registration.unregister();
            console.log('[SW] Service Worker unregistered');
        } catch (error) {
            console.error('[SW] Error unregistering service worker:', error);
        }
    }
};

export const clearCache = async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
        console.log('[SW] Cache clear requested');
    }
};

// Check if app is running in standalone mode (installed as PWA)
export const isStandalone = () => {
    return window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone ||
        document.referrer.includes('android-app://');
};

// Check online/offline status
export const getNetworkStatus = () => {
    return {
        online: navigator.onLine,
        effectiveType: navigator.connection?.effectiveType || 'unknown',
        downlink: navigator.connection?.downlink || 0,
        rtt: navigator.connection?.rtt || 0
    };
};
