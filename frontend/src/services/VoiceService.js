// VoiceService.js - Agora SDK voice chat implementation
// Supports both Web (agora-rtc-sdk-ng) and Native (react-native-agora)
// IMPORTANT: Native SDK is isolated to prevent web build errors

import { Platform } from 'react-native';

// Agora App ID - Get this from https://console.agora.io/
const AGORA_APP_ID = 'f258296bc0cd4d729d2a1f2f8b8df5b2';

class VoiceService {
    constructor() {
        this.client = null; // Web client
        this.engine = null; // Native engine
        this.localAudioTrack = null; // Web audio track
        this.isJoined = false;
        this.isMuted = false;
        this.channelName = null;
        this.onUserJoined = null;
        this.onUserLeft = null;
        this.onAudioVolumeIndication = null;
        this.isInitialized = false;
        this.isWeb = Platform.OS === 'web';
    }

    async init() {
        // Check if Agora App ID is set
        if (!AGORA_APP_ID || AGORA_APP_ID === 'YOUR_AGORA_APP_ID') {
            console.warn('VoiceService: Agora App ID not configured. Voice chat disabled.');
            return false;
        }

        try {
            if (this.isWeb) {
                return await this.initWeb();
            } else {
                // Native not supported in web build - skip silently
                console.log('VoiceService: Native SDK not available in web build');
                return false;
            }
        } catch (error) {
            console.error('VoiceService: Initialization error:', error);
            return false;
        }
    }

    async initWeb() {
        try {
            // Dynamic import for web SDK
            const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;

            this.client = AgoraRTC.createClient({
                mode: 'rtc',
                codec: 'vp8'
            });

            // Set up event listeners
            this.client.on('user-joined', (user) => {
                console.log('VoiceService: User joined:', user.uid);
                if (this.onUserJoined) {
                    this.onUserJoined(user.uid);
                }
            });

            this.client.on('user-left', (user) => {
                console.log('VoiceService: User left:', user.uid);
                if (this.onUserLeft) {
                    this.onUserLeft(user.uid);
                }
            });

            this.client.on('user-published', async (user, mediaType) => {
                if (mediaType === 'audio') {
                    await this.client.subscribe(user, mediaType);
                    user.audioTrack?.play();
                    console.log('VoiceService: Subscribed to user audio:', user.uid);
                }
            });

            this.client.on('user-unpublished', (user, mediaType) => {
                if (mediaType === 'audio') {
                    console.log('VoiceService: User unpublished audio:', user.uid);
                }
            });

            // Enable volume indicator
            this.client.enableAudioVolumeIndicator();
            this.client.on('volume-indicator', (volumes) => {
                if (this.onAudioVolumeIndication) {
                    this.onAudioVolumeIndication(volumes);
                }
            });

            this.isInitialized = true;
            console.log('VoiceService: Web SDK initialized successfully');
            return true;
        } catch (error) {
            console.error('VoiceService: Web SDK initialization error:', error);
            return false;
        }
    }

    async joinChannel(channelName, uid = 0) {
        if (!this.isInitialized) {
            console.warn('VoiceService: Not initialized');
            return false;
        }

        try {
            this.channelName = channelName;

            if (this.isWeb) {
                return await this.joinChannelWeb(channelName, uid);
            }
            return false;
        } catch (error) {
            console.error('VoiceService: Join channel error:', error);
            return false;
        }
    }

    async joinChannelWeb(channelName, uid) {
        try {
            const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;

            // Join the channel
            await this.client.join(AGORA_APP_ID, channelName, null, uid || null);

            // Create and publish local audio track
            this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
            await this.client.publish([this.localAudioTrack]);

            this.isJoined = true;
            console.log('VoiceService: Joined web channel:', channelName);
            return true;
        } catch (error) {
            console.error('VoiceService: Web join error:', error);
            return false;
        }
    }

    async leaveChannel() {
        if (!this.isJoined) {
            return;
        }

        try {
            if (this.isWeb) {
                if (this.localAudioTrack) {
                    this.localAudioTrack.stop();
                    this.localAudioTrack.close();
                    this.localAudioTrack = null;
                }
                await this.client?.leave();
            }

            this.isJoined = false;
            this.channelName = null;
            console.log('VoiceService: Left channel');
        } catch (error) {
            console.error('VoiceService: Leave channel error:', error);
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;

        if (this.isWeb && this.localAudioTrack) {
            this.localAudioTrack.setEnabled(!this.isMuted);
        }

        console.log('VoiceService: Muted:', this.isMuted);
        return this.isMuted;
    }

    setMuted(muted) {
        this.isMuted = muted;

        if (this.isWeb && this.localAudioTrack) {
            this.localAudioTrack.setEnabled(!muted);
        }
    }

    async destroy() {
        await this.leaveChannel();
        this.client = null;
        this.isInitialized = false;
    }

    // Check if voice chat is available
    isAvailable() {
        return this.isInitialized;
    }
}

// Export singleton instance
export default new VoiceService();
