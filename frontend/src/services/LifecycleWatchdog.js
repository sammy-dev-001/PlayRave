// ============================================================================
// LifecycleWatchdog.js — Cross-Platform Wake-Up & Resurrection Engine
// ============================================================================
// Solves:
//   1. Mobile OS & Browser Background Suspend: iOS/Android and mobile browsers
//      freeze the JavaScript event loop when backgrounded or locked.
//   2. Zombie TCP Sockets: When an app wakes up, the socket reports connected: true
//      even though carrier NAT closed the connection.
//   3. Debounces wake signals (visibilitychange, pageshow, focus, online, AppState)
//      to prevent hammering the server.
//   4. Proactively tests connection with a 2.5s volatile ping: if dead, closes
//      the engine to trigger an instant reconnect rather than waiting 30s.
// ============================================================================

import { AppState, Platform } from 'react-native';
import SocketService from './socket';

class LifecycleWatchdog {
    constructor() {
        this.initialized = false;
        this.appState = AppState.currentState;
        this.wakeListeners = new Set();
        this.debounceTimer = null;
        this.lastWakeTime = 0;
    }

    init() {
        if (this.initialized) return;
        this.initialized = true;

        console.log('[LifecycleWatchdog] Initializing cross-platform wake listeners...');

        // 1. React Native AppState listener (iOS / Android)
        AppState.addEventListener('change', (nextAppState) => {
            const wasBackground = /inactive|background/.test(this.appState);
            this.appState = nextAppState;
            if (wasBackground && nextAppState === 'active') {
                this.triggerWake('appstate-active');
            }
        });

        // 2. Web Wake-Up & Visibility Signals
        if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    this.triggerWake('visibility-visible');
                }
            });

            window.addEventListener('pageshow', (event) => {
                // event.persisted indicates page was restored from bfcache
                this.triggerWake(event.persisted ? 'pageshow-bfcache' : 'pageshow');
            });

            window.addEventListener('focus', () => {
                this.triggerWake('window-focus');
            });

            window.addEventListener('online', () => {
                this.triggerWake('network-online');
            });

            // Cordova / PWA resume event if present
            document.addEventListener('resume', () => {
                this.triggerWake('document-resume');
            }, false);
        }
    }

    /**
     * Debounced wake trigger: ignores redundant signals firing within 1000ms.
     */
    triggerWake(source) {
        if (Platform.OS === 'web' && typeof document !== 'undefined' && document.hidden) {
            return;
        }

        const now = Date.now();
        if (now - this.lastWakeTime < 1000) {
            return;
        }
        this.lastWakeTime = now;

        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            this.handleWake(source);
        }, 300);
    }

    /**
     * Core wake-up routine: tests the socket and resurrects it if zombie.
     */
    handleWake(source) {
        console.log(`[LifecycleWatchdog] App woke up from source: ${source}`);

        // If socket is reported connected, test with a volatile 2.5s ping
        if (SocketService.socket && SocketService.socket.connected) {
            SocketService.socket.volatile.timeout(2500).emit('app-ping', Date.now(), (err) => {
                if (err) {
                    console.warn('[LifecycleWatchdog] Socket zombie on wake. Closing engine to trigger reconnect...');
                    if (SocketService.socket.io && SocketService.socket.io.engine) {
                        SocketService.socket.io.engine.close();
                    }
                } else {
                    console.log('[LifecycleWatchdog] Socket verified alive on wake. Re-syncing room...');
                    SocketService.attemptRoomRejoin();
                }
            });
        } else {
            console.log('[LifecycleWatchdog] Socket was disconnected on wake. Reconnecting...');
            SocketService.reconnect();
        }

        // Notify registered subscribers
        this.wakeListeners.forEach((listener) => {
            try {
                listener(source);
            } catch (err) {
                console.error('[LifecycleWatchdog] Error in wake listener:', err);
            }
        });
    }

    /**
     * Subscribe to wake events
     */
    addWakeListener(callback) {
        this.wakeListeners.add(callback);
        return () => {
            this.wakeListeners.delete(callback);
        };
    }
}

export default new LifecycleWatchdog();
