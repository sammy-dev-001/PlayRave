// LANService.js - Local Area Network multiplayer support
// Handles local IP detection, server URL switching, and network discovery

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAN_SERVER_KEY = '@playrave_lan_server';

class LANService {
    constructor() {
        this.isLANMode = false;
        this.lanServerUrl = null;
        this.localIP = null;
    }

    // Get the device's local IP address (for display when hosting)
    async getLocalIP() {
        try {
            if (Platform.OS === 'web') {
                // On web, we can try to detect local IP via WebRTC
                return await this.getLocalIPWebRTC();
            }
            // For mobile, this would need a native module
            // For now, return placeholder - user will see it from their device settings
            return null;
        } catch (e) {
            console.error('Error getting local IP:', e);
            return null;
        }
    }

    // WebRTC trick to get local IP on web browsers
    async getLocalIPWebRTC() {
        return new Promise((resolve) => {
            try {
                const pc = new RTCPeerConnection({ iceServers: [] });
                pc.createDataChannel('');
                pc.createOffer().then(offer => pc.setLocalDescription(offer));

                pc.onicecandidate = (ice) => {
                    if (!ice || !ice.candidate || !ice.candidate.candidate) return;
                    const match = ice.candidate.candidate.match(/([0-9]{1,3}\.){3}[0-9]{1,3}/);
                    if (match) {
                        const ip = match[0];
                        // Filter out non-local IPs
                        if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
                            pc.close();
                            resolve(ip);
                        }
                    }
                };

                // Timeout after 3 seconds
                setTimeout(() => {
                    pc.close();
                    resolve(null);
                }, 3000);
            } catch (e) {
                resolve(null);
            }
        });
    }

    // Enable LAN mode with a specific server URL
    async enableLANMode(serverUrl) {
        // Validate URL format
        const urlPattern = /^https?:\/\/([0-9]{1,3}\.){3}[0-9]{1,3}(:[0-9]+)?$/;
        if (!urlPattern.test(serverUrl)) {
            throw new Error('Invalid IP address format. Use: http://192.168.x.x:4000');
        }

        this.isLANMode = true;
        this.lanServerUrl = serverUrl;

        // Save for persistence
        await AsyncStorage.setItem(LAN_SERVER_KEY, serverUrl);

        return true;
    }

    // Disable LAN mode (switch back to online)
    async disableLANMode() {
        this.isLANMode = false;
        this.lanServerUrl = null;
        await AsyncStorage.removeItem(LAN_SERVER_KEY);
    }

    // Check if there's a saved LAN server
    async checkSavedLANServer() {
        try {
            const saved = await AsyncStorage.getItem(LAN_SERVER_KEY);
            if (saved) {
                this.lanServerUrl = saved;
                this.isLANMode = true;
                return saved;
            }
        } catch (e) {
            console.error('Error checking saved LAN server:', e);
        }
        return null;
    }

    // Get current server URL (LAN or online)
    getServerUrl() {
        if (this.isLANMode && this.lanServerUrl) {
            return this.lanServerUrl;
        }
        // Default online server
        return 'https://playrave-59ud.onrender.com';
    }

    // Test connection to a LAN server
    async testConnection(serverUrl) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`${serverUrl}/health`, {
                method: 'GET',
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            return response.ok;
        } catch (e) {
            console.log('LAN connection test failed:', e.message);
            return false;
        }
    }

    // Generate join URL for QR code
    getJoinUrl(roomCode) {
        const baseUrl = this.isLANMode
            ? this.lanServerUrl
            : 'https://play-rave.vercel.app';
        return `${baseUrl}?join=${roomCode}`;
    }

    // Get display info for UI
    getConnectionInfo() {
        return {
            mode: this.isLANMode ? 'LAN' : 'Online',
            serverUrl: this.getServerUrl(),
            isLocal: this.isLANMode
        };
    }
}

// Export singleton
export default new LANService();
