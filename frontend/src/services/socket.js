import io from 'socket.io-client';
import Constants from 'expo-constants';

// Auto-detect the server IP from Expo's manifest
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

    console.log('Could not auto-detect IP, falling back to localhost');
    return 'http://localhost:4000';
};

const SOCKET_URL = getServerUrl();
console.log('Socket connecting to:', SOCKET_URL);

// Connection states
const ConnectionState = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    RECONNECTING: 'reconnecting',
    ERROR: 'error',
};

class SocketService {
    socket = null;
    pendingListeners = [];
    connectionState = ConnectionState.DISCONNECTED;
    connectionStateListeners = [];

    // Reconnection settings with exponential backoff
    reconnectAttempts = 0;
    maxReconnectAttempts = 10;
    baseReconnectDelay = 1000;
    maxReconnectDelay = 30000;

    // Connection quality monitoring
    pingInterval = null;
    lastPingTime = null;
    latency = null;
    latencyListeners = [];

    // Room rejoin data
    lastRoomId = null;
    lastPlayerData = null;

    /**
     * Connect to the socket server with enhanced reconnection logic
     */
    connect() {
        console.log('Connecting to socket...', SOCKET_URL);
        this.setConnectionState(ConnectionState.CONNECTING);

        this.socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            timeout: 10000,
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: this.baseReconnectDelay,
            reconnectionDelayMax: this.maxReconnectDelay,
        });

        this.socket.on('connect', () => {
            console.log('SocketService connected:', this.socket.id);
            this.reconnectAttempts = 0;
            this.setConnectionState(ConnectionState.CONNECTED);

            // Start ping monitoring
            this.startPingMonitoring();

            // Register any pending listeners
            if (this.pendingListeners.length > 0) {
                console.log('Registering', this.pendingListeners.length, 'pending listeners');
                this.pendingListeners.forEach(({ event, cb }) => {
                    this.socket.on(event, cb);
                    console.log('Registered pending listener for:', event);
                });
                this.pendingListeners = [];
            }

            // Auto-rejoin room if we were in one
            this.attemptRoomRejoin();
        });

        this.socket.on('disconnect', (reason) => {
            console.log('SocketService disconnected:', reason);
            this.setConnectionState(ConnectionState.DISCONNECTED);
            this.stopPingMonitoring();

            // If server disconnected us, attempt reconnection
            if (reason === 'io server disconnect') {
                this.socket.connect();
            }
        });

        this.socket.on('connect_error', (err) => {
            console.log('Socket connection error:', err.message);
            this.reconnectAttempts++;
            this.setConnectionState(ConnectionState.ERROR);

            // Calculate exponential backoff delay
            const delay = Math.min(
                this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts),
                this.maxReconnectDelay
            );
            console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
        });

        this.socket.on('reconnecting', (attemptNumber) => {
            console.log('Reconnecting... attempt:', attemptNumber);
            this.setConnectionState(ConnectionState.RECONNECTING);
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log('Reconnected after', attemptNumber, 'attempts');
            this.reconnectAttempts = 0;
            this.setConnectionState(ConnectionState.CONNECTED);
        });

        this.socket.on('reconnect_failed', () => {
            console.log('Reconnection failed after max attempts');
            this.setConnectionState(ConnectionState.ERROR);
        });

        // Handle pong for latency measurement
        this.socket.on('pong', () => {
            if (this.lastPingTime) {
                this.latency = Date.now() - this.lastPingTime;
                this.notifyLatencyListeners();
            }
        });
    }

    /**
     * Set connection state and notify listeners
     */
    setConnectionState(state) {
        this.connectionState = state;
        this.connectionStateListeners.forEach(listener => {
            try {
                listener(state);
            } catch (error) {
                console.error('Error in connection state listener:', error);
            }
        });
    }

    /**
     * Subscribe to connection state changes
     */
    onConnectionStateChange(callback) {
        this.connectionStateListeners.push(callback);
        // Immediately call with current state
        callback(this.connectionState);

        // Return unsubscribe function
        return () => {
            this.connectionStateListeners = this.connectionStateListeners.filter(cb => cb !== callback);
        };
    }

    /**
     * Subscribe to latency updates
     */
    onLatencyChange(callback) {
        this.latencyListeners.push(callback);
        if (this.latency !== null) {
            callback(this.latency);
        }

        return () => {
            this.latencyListeners = this.latencyListeners.filter(cb => cb !== callback);
        };
    }

    notifyLatencyListeners() {
        this.latencyListeners.forEach(listener => {
            try {
                listener(this.latency);
            } catch (error) {
                console.error('Error in latency listener:', error);
            }
        });
    }

    /**
     * Start ping monitoring for connection quality
     */
    startPingMonitoring() {
        this.stopPingMonitoring();

        this.pingInterval = setInterval(() => {
            if (this.socket && this.socket.connected) {
                this.lastPingTime = Date.now();
                this.socket.emit('ping');
            }
        }, 5000); // Ping every 5 seconds
    }

    stopPingMonitoring() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    /**
     * Store room data for auto-rejoin
     */
    setRoomData(roomId, playerData) {
        this.lastRoomId = roomId;
        this.lastPlayerData = playerData;
    }

    clearRoomData() {
        this.lastRoomId = null;
        this.lastPlayerData = null;
    }

    /**
     * Attempt to rejoin room after reconnection
     */
    attemptRoomRejoin() {
        if (this.lastRoomId && this.lastPlayerData && this.socket?.connected) {
            console.log('Attempting to rejoin room:', this.lastRoomId);
            this.socket.emit('join-room', {
                roomId: this.lastRoomId,
                playerName: this.lastPlayerData.name,
                avatar: this.lastPlayerData.avatar,
                avatarColor: this.lastPlayerData.avatarColor,
                isRejoin: true,
            });
        }
    }

    /**
     * Get current connection state
     */
    getConnectionState() {
        return this.connectionState;
    }

    /**
     * Get current latency
     */
    getLatency() {
        return this.latency;
    }

    /**
     * Check if connected
     */
    isConnected() {
        return this.socket?.connected && this.connectionState === ConnectionState.CONNECTED;
    }

    disconnect() {
        this.stopPingMonitoring();
        this.clearRoomData();
        if (this.socket) {
            this.socket.disconnect();
        }
    }

    /**
     * Emit with error handling
     */
    emit(event, data) {
        console.log('SocketService.emit called:', event, data);
        if (this.socket) {
            this.socket.emit(event, data);
            console.log('Event emitted successfully');
        } else {
            console.error('Socket is null, cannot emit event');
        }
    }

    /**
     * Safe emit with retry on failure
     */
    safeEmit(event, data, retries = 3, delay = 1000) {
        return new Promise((resolve, reject) => {
            const attemptEmit = (attemptsLeft) => {
                if (!this.socket?.connected) {
                    if (attemptsLeft > 0) {
                        console.log(`Socket not connected, retrying in ${delay}ms...`);
                        setTimeout(() => attemptEmit(attemptsLeft - 1), delay);
                    } else {
                        reject(new Error('Failed to emit: socket not connected'));
                    }
                    return;
                }

                this.socket.emit(event, data);
                resolve();
            };

            attemptEmit(retries);
        });
    }

    on(event, cb) {
        if (this.socket && this.socket.connected) {
            this.socket.on(event, cb);
            console.log('Listener registered immediately for:', event);
        } else {
            console.log('Socket not ready, queueing listener for:', event);
            this.pendingListeners.push({ event, cb });
        }
    }

    off(event, cb) {
        if (this.socket) {
            this.socket.off(event, cb);
        }
        this.pendingListeners = this.pendingListeners.filter(
            listener => !(listener.event === event && listener.cb === cb)
        );
    }

    getSocketUrl() {
        return SOCKET_URL;
    }
}

// Export connection states for consumers
export { ConnectionState };
export default new SocketService();
