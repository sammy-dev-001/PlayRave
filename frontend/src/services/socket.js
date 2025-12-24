import io from 'socket.io-client';
import Constants from 'expo-constants';

// Auto-detect the server IP from Expo's manifest
// This gets the same IP that Expo uses to serve the app
const getServerUrl = () => {
    // For web deployment (Vercel), use the production backend URL
    if (typeof window !== 'undefined' && window.location &&
        (window.location.hostname.includes('vercel.app') ||
            window.location.hostname.includes('playrave'))) {
        console.log('Using production backend URL for web deployment');
        return 'https://playrave.onrender.com';
    }

    // Check for production backend URL from environment variable
    if (typeof process !== 'undefined' && process.env.EXPO_PUBLIC_BACKEND_URL) {
        console.log('Using production backend URL:', process.env.EXPO_PUBLIC_BACKEND_URL);
        return process.env.EXPO_PUBLIC_BACKEND_URL;
    }

    // For development: extract IP from Expo's debugger host
    const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;

    if (debuggerHost) {
        // debuggerHost format is "192.168.x.x:8081", we just need the IP
        const ip = debuggerHost.split(':')[0];
        console.log('Auto-detected server IP:', ip)
        return `http://${ip}:4000`;
    }

    // Fallback for web or if detection fails
    if (typeof window !== 'undefined' && window.location) {
        const hostname = window.location.hostname;
        if (hostname && hostname !== 'localhost') {
            return `http://${hostname}:4000`;
        }
    }

    // Final fallback to localhost
    console.log('Could not auto-detect IP, falling back to localhost');
    return 'http://localhost:4000';
};

const SOCKET_URL = getServerUrl();
console.log('Socket connecting to:', SOCKET_URL);

class SocketService {
    socket = null;
    pendingListeners = []; // Queue for listeners added before connection

    connect() {
        console.log('Connecting to socket...', SOCKET_URL);
        this.socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            timeout: 10000,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        this.socket.on('connect', () => {
            console.log('SocketService connected:', this.socket.id);

            // Register any pending listeners
            if (this.pendingListeners.length > 0) {
                console.log('Registering', this.pendingListeners.length, 'pending listeners');
                this.pendingListeners.forEach(({ event, cb }) => {
                    this.socket.on(event, cb);
                    console.log('Registered pending listener for:', event);
                });
                this.pendingListeners = [];
            }
        });

        this.socket.on('disconnect', () => {
            console.log('SocketService disconnected');
        });

        this.socket.on('connect_error', (err) => {
            console.log('Socket connection error', err.message);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }

    emit(event, data) {
        console.log('SocketService.emit called:', event, data);
        if (this.socket) {
            this.socket.emit(event, data);
            console.log('Event emitted successfully');
        } else {
            console.error('Socket is null, cannot emit event');
        }
    }

    on(event, cb) {
        if (this.socket && this.socket.connected) {
            // Socket is ready, register immediately
            this.socket.on(event, cb);
            console.log('Listener registered immediately for:', event);
        } else {
            // Socket not ready, queue the listener
            console.log('Socket not ready, queueing listener for:', event);
            this.pendingListeners.push({ event, cb });
        }
    }

    off(event, cb) {
        if (this.socket) {
            this.socket.off(event, cb);
        }
        // Also remove from pending listeners if it's there
        this.pendingListeners = this.pendingListeners.filter(
            listener => !(listener.event === event && listener.cb === cb)
        );
    }

    getSocketUrl() {
        return SOCKET_URL;
    }
}

export default new SocketService();
