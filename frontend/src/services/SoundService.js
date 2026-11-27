import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Sound files configuration
 * 
 * For optimal performance, download these sounds and place them in assets/sounds/:
 * - tick.mp3 (short tick sound)
 * - correct.mp3 (success/correct answer)
 * - wrong.mp3 (error/wrong answer)
 * - game-start.mp3 (game starting fanfare)
 * - winner.mp3 (winner announcement)
 * - elimination.mp3 (player eliminated)
 * - button-click.mp3 (UI button click)
 * - countdown.mp3 (countdown beep)
 * 
 * Once local files are added, update SOUNDS to use require() instead of URLs.
 */

// Sound effects - currently using CDN, ideally should be local
const SOUNDS = {
    tick: { uri: 'https://cdn.freesound.org/previews/268/268822_4486188-lq.mp3' },
    correct: { uri: 'https://cdn.freesound.org/previews/341/341695_5858296-lq.mp3' },
    wrong: { uri: 'https://cdn.freesound.org/previews/415/415764_6067155-lq.mp3' },
    gameStart: { uri: 'https://cdn.freesound.org/previews/270/270304_5123851-lq.mp3' },
    winner: { uri: 'https://cdn.freesound.org/previews/511/511484_10207393-lq.mp3' },
    elimination: { uri: '' },
    buttonClick: { uri: 'https://cdn.freesound.org/previews/263/263133_2064400-lq.mp3' },
    countdown: { uri: '' },
};

// Aliases for common sound names across various screens
const SOUND_ALIASES = {
    click: 'buttonClick',
    button_click: 'buttonClick',
    'game-start': 'gameStart',
    game_start: 'gameStart',
    victory: 'winner',
    win: 'winner',
    'times-up': 'wrong',
    time_up: 'wrong',
    error: 'wrong',
    success: 'correct',
};

// Local audio assets
const LOBBY_MUSIC = require('../../assets/sounds/neon-reverie-237942.mp3');

// Detect if running on web
const isWeb = typeof document !== 'undefined';

// Background music tracks
const MUSIC = {
    lobby: LOBBY_MUSIC,
    gameplay: { uri: 'https://cdn.freesound.org/previews/649/649152_5674468-lq.mp3' },
    victory: { uri: 'https://cdn.freesound.org/previews/456/456966_7037-lq.mp3' },
    defeat: { uri: 'https://cdn.freesound.org/previews/173/173859_2394245-lq.mp3' },
    gameOver: { uri: 'https://cdn.freesound.org/previews/320/320655_4766646-lq.mp3' },
};

class SoundService {
    sounds = {};
    currentMusic = null;
    currentMusicName = null;
    isMuted = false;
    isMusicMuted = false;
    isInitialized = false;
    isPreloading = false;
    soundVolume = 0.7;
    musicVolume = 0.5;

    async init() {
        if (this.isInitialized) return;

        try {
            // Set audio mode via expo-audio
            await setAudioModeAsync({
                playsInSilentMode: true,
                shouldPlayInBackground: false,
                interruptionMode: 'duckOthers',
            });

            // Load mute preferences
            const [soundMuted, musicMuted] = await Promise.all([
                AsyncStorage.getItem('soundMuted'),
                AsyncStorage.getItem('musicMuted'),
            ]);

            this.isMuted = soundMuted === 'true';
            this.isMusicMuted = musicMuted === 'true';

            // Pre-load commonly used sounds in the background
            this.preloadAllSounds();

            this.isInitialized = true;
            console.log('SoundService initialized');
        } catch (error) {
            console.log('SoundService init error:', error);
        }
    }

    /**
     * Preload all sound effects for instant playback
     */
    async preloadAllSounds() {
        if (this.isPreloading) return;
        this.isPreloading = true;

        const soundNames = Object.keys(SOUNDS);
        const loadPromises = soundNames.map(name => this.preloadSound(name));

        try {
            await Promise.allSettled(loadPromises);
            console.log('All sounds preloaded');
        } catch (error) {
            console.log('Some sounds failed to preload:', error);
        }

        this.isPreloading = false;
    }

    async preloadSound(soundName) {
        if (this.sounds[soundName]) return;

        try {
            const source = SOUNDS[soundName];
            // Skip if no source or empty URI
            if (!source || (typeof source === 'object' && !source.uri)) {
                return;
            }

            const player = createAudioPlayer(source);
            player.volume = this.soundVolume;
            this.sounds[soundName] = player;
        } catch (error) {
            console.log(`Failed to preload ${soundName}:`, error);
        }
    }

    // === Sound Effects ===
    async play(soundName) {
        if (this.isMuted) return;
        const target = SOUND_ALIASES[soundName] || soundName;
        if (!SOUNDS[target]) {
            console.log(`Sound ${soundName} not found`);
            return;
        }

        try {
            const source = SOUNDS[target];
            if (!source || (typeof source === 'object' && !source.uri)) {
                return;
            }

            // Use preloaded player if available
            const preloaded = this.sounds[target];
            if (preloaded) {
                try {
                    preloaded.volume = this.soundVolume;
                    await preloaded.seekTo(0);
                    preloaded.play();
                    return;
                } catch (e) {
                    console.log(`Preloaded sound ${target} not ready, creating new player`);
                }
            }

            // Fallback: create a short-lived player instance
            const player = createAudioPlayer(source);
            player.volume = this.soundVolume;
            const sub = player.addListener('playbackStatusUpdate', (status) => {
                if (status?.didJustFinish) {
                    try { sub?.remove?.(); } catch (_) { /* ignore */ }
                    try { player.remove(); } catch (_) { /* ignore */ }
                }
            });
            player.play();
        } catch (error) {
            console.log(`Error playing ${soundName}:`, error);
        }
    }

    // Convenience methods for sound effects
    async playTick() { await this.play('tick'); }
    async playCorrect() { await this.play('correct'); }
    async playWrong() { await this.play('wrong'); }
    async playGameStart() { await this.play('gameStart'); }
    async playWinner() { await this.play('winner'); }
    async playElimination() { await this.play('elimination'); }
    async playButtonClick() { await this.play('buttonClick'); }
    async playCountdown() { await this.play('countdown'); }

    // === Background Music ===

    /**
     * Resumes a suspended AudioContext created by Agora or other Web Audio API
     * consumers. Browsers suspend AudioContexts until a user gesture occurs;
     * calling this inside a user-initiated handler unblocks both Agora audio
     * and HTML5 Audio element playback.
     */
    async _resumeAudioContext() {
        if (typeof window === 'undefined') return;
        try {
            // Resume any existing AudioContext (Agora creates one globally)
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return;
            // Walk all contexts Agora might have registered on window
            // (Agora attaches its context to window.__agoraAudioContext__ in some versions)
            const ctx = window.__agoraAudioContext__ ||
                        (this._sharedAudioCtx && this._sharedAudioCtx.state !== 'closed'
                            ? this._sharedAudioCtx : null);
            if (ctx && ctx.state === 'suspended') {
                await ctx.resume();
                console.log('Shared AudioContext resumed');
            }
        } catch (e) {
            // Non-fatal — audio may still play fine
        }
    }

    async playMusic(trackName, loop = true) {
        console.log(`playMusic called: ${trackName}, isMusicMuted: ${this.isMusicMuted}`);

        if (this.isMusicMuted) {
            console.log('Music is muted, skipping playback');
            return;
        }
        if (!MUSIC[trackName]) {
            console.log(`Music track ${trackName} not found`);
            return;
        }

        // Don't restart if same track is already playing
        if (this.currentMusicName === trackName && this.currentMusic) {
            if (isWeb) {
                if (!this.currentMusic.paused) {
                    console.log('Track already playing on web, skipping');
                    return;
                }
            } else if (this.currentMusic.playing) {
                console.log('Track already playing on native, skipping');
                return;
            }
        }

        // Stop any existing music first
        await this.stopMusic();

        try {
            const source = MUSIC[trackName];
            console.log(`Playing music: ${trackName}`);

            if (isWeb) {
                // Web playback using HTML5 Audio
                let uri;
                if (typeof source === 'object' && source.uri) {
                    uri = source.uri;
                } else if (typeof source === 'number') {
                    // Local asset - resolve using expo-asset
                    const { Asset } = await import('expo-asset');
                    const asset = Asset.fromModule(source);
                    await asset.downloadAsync();
                    uri = asset.localUri || asset.uri;
                } else {
                    uri = source;
                }

                const audio = new window.Audio(uri);
                audio.loop = loop;
                audio.volume = this.musicVolume;

                // Early registration so stopMusic can catch it
                this.currentMusic = audio;
                this.currentMusicName = trackName;

                audio.oncanplaythrough = () => console.log('Audio can play through');
                audio.onerror = (e) => console.error('Audio error:', e);
                audio.onplay = () => console.log('Audio playing!');

                // Final check before playback start
                if (this.isMusicMuted) {
                    console.log('Muted during load, stopping web audio');
                    audio.pause();
                    this.currentMusic = null;
                    this.currentMusicName = null;
                    return;
                }

                // Resume any suspended AudioContext (e.g. from Agora SDK)
                await this._resumeAudioContext();

                try {
                    await audio.play();
                    console.log('Web audio started successfully!');
                } catch (err) {
                    // AbortError: play() was interrupted (e.g. track switched quickly)
                    // NotAllowedError: autoplay blocked — needs user gesture
                    if (err.name === 'AbortError') {
                        console.log('Audio play aborted, retrying...');
                        await new Promise(r => setTimeout(r, 150));
                        if (this.currentMusic === audio && !this.isMusicMuted) {
                            await audio.play().catch(e => console.log('Audio retry failed:', e));
                        }
                    } else {
                        console.log('Audio play error:', err.name, err.message);
                    }
                }
            } else {
                // Native playback via expo-audio
                let audioSource = source;
                if (typeof source === 'number') {
                    const { Asset } = await import('expo-asset');
                    const asset = Asset.fromModule(source);
                    await asset.downloadAsync();
                    audioSource = asset.localUri ? { uri: asset.localUri } : source;
                }

                // Final check before creation
                if (this.isMusicMuted) {
                    console.log('Muted during load, skipping native creation');
                    return;
                }

                const player = createAudioPlayer(audioSource);
                player.loop = loop;
                player.volume = this.musicVolume;

                // Final check after creation
                if (this.isMusicMuted) {
                    console.log('Muted during native creation, stopping');
                    try { player.remove(); } catch (_) { /* ignore */ }
                    this.currentMusic = null;
                    return;
                }

                player.play();
                this.currentMusic = player;
                this.currentMusicName = trackName;
                console.log('Native audio started');
            }
        } catch (error) {
            console.log(`Error playing music ${trackName}:`, error);
        }
    }

    async stopMusic() {
        if (this.currentMusic) {
            try {
                if (typeof this.currentMusic.remove === 'function') {
                    // Native expo-audio AudioPlayer
                    this.currentMusic.pause();
                    this.currentMusic.remove();
                    console.log('Native audio stopped');
                } else if (typeof this.currentMusic.pause === 'function') {
                    // Web HTMLAudioElement
                    this.currentMusic.pause();
                    this.currentMusic.currentTime = 0;
                    this.currentMusic.src = '';
                    console.log('Web audio stopped');
                }
            } catch (error) {
                console.log('Error stopping music:', error);
            }
            this.currentMusic = null;
        }
        // Always clear the track name so the same track can be replayed
        this.currentMusicName = null;
    }

    async pauseMusic() {
        if (this.currentMusic) {
            try {
                this.currentMusic.pause();
            } catch (error) {
                console.log('Error pausing music:', error);
            }
        }
    }

    async resumeMusic() {
        if (this.currentMusic && !this.isMusicMuted) {
            try {
                await this.currentMusic.play();
            } catch (error) {
                console.log('Error resuming music:', error);
            }
        }
    }

    // Convenience methods for specific tracks
    async playLobbyMusic() { await this.playMusic('lobby', true); }
    async playGameplayMusic() { await this.playMusic('gameplay', true); }
    async playVictoryMusic() { await this.playMusic('victory', false); }
    async playDefeatMusic() { await this.playMusic('defeat', false); }
    async playGameOverMusic() { await this.playMusic('gameOver', false); }

    // === Volume Controls ===
    async setSoundVolume(volume) {
        this.soundVolume = Math.max(0, Math.min(1, volume));
        for (const sound of Object.values(this.sounds)) {
            try {
                sound.volume = this.soundVolume;
            } catch (e) {
                // Ignore
            }
        }
    }

    async setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.currentMusic) {
            try {
                this.currentMusic.volume = this.musicVolume;
            } catch (e) {
                // Ignore
            }
        }
    }

    // === Mute Controls ===
    async toggleMute() {
        this.isMuted = !this.isMuted;
        await AsyncStorage.setItem('soundMuted', this.isMuted.toString());
        return this.isMuted;
    }

    async toggleMusicMute() {
        this.isMusicMuted = !this.isMusicMuted;
        await AsyncStorage.setItem('musicMuted', this.isMusicMuted.toString());

        if (this.isMusicMuted) {
            await this.stopMusic();
        } else if (this.currentMusicName) {
            // Resume the last track if unmuting
            await this.playMusic(this.currentMusicName, true);
        }
        return this.isMusicMuted;
    }

    getMuted() { return this.isMuted; }
    getMusicMuted() { return this.isMusicMuted; }

    async cleanup() {
        await this.stopMusic();
        for (const sound of Object.values(this.sounds)) {
            try {
                sound.remove?.();
            } catch (error) {
                // Ignore cleanup errors
            }
        }
        this.sounds = {};
    }
}

export default new SoundService();
