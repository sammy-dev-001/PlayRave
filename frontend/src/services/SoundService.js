import { Audio } from 'expo-av';
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
    tick: { uri: 'https://cdn.freesound.org/previews/263/263133_4939433-lq.mp3' },
    correct: { uri: 'https://cdn.freesound.org/previews/341/341695_5858296-lq.mp3' },
    wrong: { uri: 'https://cdn.freesound.org/previews/350/350985_4502520-lq.mp3' },
    gameStart: { uri: 'https://cdn.freesound.org/previews/270/270304_5123851-lq.mp3' },
    winner: { uri: 'https://cdn.freesound.org/previews/387/387232_7255534-lq.mp3' },
    elimination: { uri: 'https://cdn.freesound.org/previews/351/351565_5121236-lq.mp3' },
    buttonClick: { uri: 'https://cdn.freesound.org/previews/242/242501_434738-lq.mp3' },
    countdown: { uri: 'https://cdn.freesound.org/previews/417/417847_5121236-lq.mp3' },
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
            // Set audio mode
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
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
            const { sound } = await Audio.Sound.createAsync(
                source,
                { shouldPlay: false, volume: this.soundVolume }
            );
            this.sounds[soundName] = sound;
        } catch (error) {
            console.log(`Failed to preload ${soundName}:`, error);
        }
    }

    // === Sound Effects ===
    async play(soundName) {
        if (this.isMuted) return;
        if (!SOUNDS[soundName]) {
            console.log(`Sound ${soundName} not found`);
            return;
        }

        try {
            // Use preloaded sound if available
            if (this.sounds[soundName]) {
                await this.sounds[soundName].setPositionAsync(0);
                await this.sounds[soundName].playAsync();
                return;
            }

            // Fallback: create and play new sound instance
            const source = SOUNDS[soundName];
            const { sound } = await Audio.Sound.createAsync(
                source,
                { shouldPlay: true, volume: this.soundVolume }
            );

            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.didJustFinish) {
                    sound.unloadAsync();
                }
            });
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
            } else {
                try {
                    const status = await this.currentMusic.getStatusAsync();
                    if (status.isPlaying) {
                        console.log('Track already playing on native, skipping');
                        return;
                    }
                } catch (e) {
                    // Sound object may be invalid, continue to recreate
                }
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

                audio.oncanplaythrough = () => console.log('Audio can play through');
                audio.onerror = (e) => console.error('Audio error:', e);
                audio.onplay = () => console.log('Audio playing!');

                await audio.play();
                this.currentMusic = audio;
                this.currentMusicName = trackName;
                console.log('Web audio started successfully!');
            } else {
                // Native playback via expo-av
                let audioSource;
                if (typeof source === 'object' && source.uri) {
                    audioSource = source;
                } else if (typeof source === 'number') {
                    // Local asset
                    const { Asset } = await import('expo-asset');
                    const asset = Asset.fromModule(source);
                    await asset.downloadAsync();
                    audioSource = { uri: asset.localUri || asset.uri };
                }

                const { sound } = await Audio.Sound.createAsync(
                    audioSource,
                    { shouldPlay: true, volume: this.musicVolume, isLooping: loop }
                );
                this.currentMusic = sound;
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
                if (typeof this.currentMusic.pause === 'function' &&
                    typeof this.currentMusic.stopAsync !== 'function') {
                    // Web HTMLAudioElement
                    this.currentMusic.pause();
                    this.currentMusic.currentTime = 0;
                    this.currentMusic.src = '';
                    console.log('Web audio stopped');
                } else {
                    // Native expo-av Sound
                    await this.currentMusic.stopAsync();
                    await this.currentMusic.unloadAsync();
                    console.log('Native audio stopped');
                }
            } catch (error) {
                console.log('Error stopping music:', error);
            }
            this.currentMusic = null;
            this.currentMusicName = null;
        }
    }

    async pauseMusic() {
        if (this.currentMusic) {
            try {
                if (typeof this.currentMusic.pause === 'function' &&
                    typeof this.currentMusic.pauseAsync !== 'function') {
                    this.currentMusic.pause();
                } else {
                    await this.currentMusic.pauseAsync();
                }
            } catch (error) {
                console.log('Error pausing music:', error);
            }
        }
    }

    async resumeMusic() {
        if (this.currentMusic && !this.isMusicMuted) {
            try {
                if (typeof this.currentMusic.play === 'function' &&
                    typeof this.currentMusic.playAsync !== 'function') {
                    await this.currentMusic.play();
                } else {
                    await this.currentMusic.playAsync();
                }
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
        // Update volume on all preloaded sounds
        for (const sound of Object.values(this.sounds)) {
            try {
                await sound.setVolumeAsync(this.soundVolume);
            } catch (e) {
                // Ignore
            }
        }
    }

    async setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.currentMusic) {
            try {
                if (typeof this.currentMusic.volume !== 'undefined') {
                    this.currentMusic.volume = this.musicVolume;
                } else {
                    await this.currentMusic.setVolumeAsync(this.musicVolume);
                }
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
        }
        return this.isMusicMuted;
    }

    getMuted() { return this.isMuted; }
    getMusicMuted() { return this.isMusicMuted; }

    async cleanup() {
        await this.stopMusic();
        for (const sound of Object.values(this.sounds)) {
            try {
                await sound.unloadAsync();
            } catch (error) {
                // Ignore cleanup errors
            }
        }
        this.sounds = {};
    }
}

export default new SoundService();
