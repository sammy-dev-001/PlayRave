// Service Worker Registration
// This file registers the service worker for offline support

// Flag to prevent repeated update notifications
let updateNotified = false;

export const register = async () => {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js', {
                scope: '/'
            });

            console.log('[SW] Service Worker registered successfully:', registration.scope);

            // Check for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('[SW] New service worker found, installing...');

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // Only show notification once
                        if (!updateNotified) {
                            updateNotified = true;
                            console.log('[SW] New content available, please refresh');

                            // Store that we've already notified
                            sessionStorage.setItem('sw-update-notified', 'true');

                            // Notify user of update
                            if (window.confirm('New version available! Refresh to update?')) {
                                newWorker.postMessage({ type: 'SKIP_WAITING' });
                                window.location.reload();
                            }
                            // If user cancels, don't show again in this session
                        }
                    }
                });
            });

            // Check if already notified in this session
            if (sessionStorage.getItem('sw-update-notified') === 'true') {
                updateNotified = true;
            }

            // Listen for controlling service worker change
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!refreshing) {
                    refreshing = true;
                    window.location.reload();
                }
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
