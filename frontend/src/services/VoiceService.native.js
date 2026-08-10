// VoiceService.native.js - Agora SDK voice chat implementation for mobile
import { Platform } from 'react-native';
import { createAgoraRtcEngine, ChannelProfileType, ClientRoleType } from 'react-native-agora';

const AGORA_APP_ID = 'f258296bc0cd4d729d2a1f2f8b8df5b2';

const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || 'https://playrave-backend.onrender.com';

class VoiceService {
    constructor() {
        this.engine = null;
        this.isJoined = false;
        this.isMuted = false;
        this.channelName = null;
        this.onUserJoined = null;
        this.onUserLeft = null;
        this.onAudioVolumeIndication = null;
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return true;
        try {
            this.engine = createAgoraRtcEngine();
            this.engine.initialize({
                appId: AGORA_APP_ID,
            });

            this.engine.registerEventHandler({
                onJoinChannelSuccess: (_connection, elapsed) => {
                    console.log('VoiceService: Native Joined channel');
                    this.isJoined = true;
                },
                onUserJoined: (_connection, remoteUid, elapsed) => {
                    console.log('VoiceService: Native User joined:', remoteUid);
                    if (this.onUserJoined) this.onUserJoined({ uid: remoteUid });
                },
                onUserOffline: (_connection, remoteUid, reason) => {
                    console.log('VoiceService: Native User left:', remoteUid);
                    if (this.onUserLeft) this.onUserLeft({ uid: remoteUid });
                },
                onAudioVolumeIndication: (_connection, speakers, totalVolume) => {
                    if (this.onAudioVolumeIndication) {
                        const volumes = speakers.map(s => ({
                            uid: s.uid === 0 ? 'local' : s.uid,
                            level: s.volume
                        }));
                        this.onAudioVolumeIndication(volumes);
                    }
                }
            });

            this.engine.enableAudio();
            this.engine.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting);
            this.engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
            this.engine.enableAudioVolumeIndication(200, 3, true);

            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('VoiceService: Native Init Error', error);
            return false;
        }
    }

    async joinChannel(channelName, uid = 0) {
        if (!this.isInitialized) {
            await this.init();
        }

        try {
            let token = '';
            try {
                const resp = await fetch(
                    `${BACKEND_URL}/api/agora/token?channel=${encodeURIComponent(channelName)}&uid=${uid || 0}`
                );
                if (resp.ok) {
                    const data = await resp.json();
                    token = data.token || ''; 
                }
            } catch (tokenErr) {
                console.warn('VoiceService: Native Token fetch failed:', tokenErr.message);
            }

            this.engine.joinChannel(token, channelName, uid, {
                channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
                clientRoleType: ClientRoleType.ClientRoleBroadcaster,
                publishMicrophoneTrack: true,
                autoSubscribeAudio: true,
            });

            this.channelName = channelName;
            this.isJoined = true;
            return true;
        } catch (error) {
            console.error('VoiceService: Native Join Error', error);
            return false;
        }
    }

    async leaveChannel() {
        if (!this.isInitialized || !this.isJoined) return true;
        try {
            this.engine.leaveChannel();
            this.isJoined = false;
            this.channelName = null;
            return true;
        } catch (error) {
            console.error('VoiceService: Native Leave Error', error);
            return false;
        }
    }

    async toggleMute() {
        if (!this.isInitialized) return false;
        try {
            this.isMuted = !this.isMuted;
            this.engine.muteLocalAudioStream(this.isMuted);
            return this.isMuted;
        } catch (error) {
            console.error('VoiceService: Native Mute Error', error);
            return false;
        }
    }

    setCallbacks({ onUserJoined, onUserLeft, onAudioVolumeIndication }) {
        if (onUserJoined) this.onUserJoined = onUserJoined;
        if (onUserLeft) this.onUserLeft = onUserLeft;
        if (onAudioVolumeIndication) this.onAudioVolumeIndication = onAudioVolumeIndication;
    }

    isAvailable() {
        return true; 
    }

    destroy() {
        if (this.engine) {
            if (this.isJoined) {
                this.leaveChannel();
            }
            this.engine.release();
            this.engine = null;
            this.isInitialized = false;
        }
    }
}

export default new VoiceService();
