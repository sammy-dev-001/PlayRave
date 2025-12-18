import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Sound effects - short clips
const SOUNDS = {
    tick: 'https://cdn.freesound.org/previews/263/263133_4939433-lq.mp3',
    correct: 'https://cdn.freesound.org/previews/341/341695_5858296-lq.mp3',
    wrong: 'https://cdn.freesound.org/previews/350/350985_4502520-lq.mp3',
    gameStart: 'https://cdn.freesound.org/previews/270/270304_5123851-lq.mp3',
    winner: 'https://cdn.freesound.org/previews/387/387232_7255534-lq.mp3',
    elimination: 'https://cdn.freesound.org/previews/351/351565_5121236-lq.mp3',
    buttonClick: 'https://cdn.freesound.org/previews/242/242501_434738-lq.mp3',
    countdown: 'https://cdn.freesound.org/previews/417/417847_5121236-lq.mp3',
};
// Local audio assets - require() works with expo-asset on both web and native
const LOBBY_MUSIC = require('../../assets/sounds/neon-reverie-237942.mp3');

// Detect if running on web
const isWeb = typeof document !== 'undefined';

// Background music tracks - longer looping audio
const MUSIC = {
    lobby: LOBBY_MUSIC, // Neon Reverie - synthwave (local file)
    gameplay: 'https://cdn.freesound.org/previews/649/649152_5674468-lq.mp3', // Upbeat tension
    victory: 'https://cdn.freesound.org/previews/456/456966_7037-lq.mp3', // Victory fanfare
    defeat: 'https://cdn.freesound.org/previews/173/173859_2394245-lq.mp3', // Sad/loss sound
    gameOver: 'https://cdn.freesound.org/previews/320/320655_4766646-lq.mp3', // Epic winner reveal
};

class SoundService {
    sounds = {};
    currentMusic = null;
    currentMusicName = null;
    isMuted = false;
    isMusicMuted = false;
    isInitialized = false;

    async init() {
        if (this.isInitialized) return;

        try {
            // Reset mute preferences to unmuted by default
            // Clear any saved preferences
            await AsyncStorage.removeItem('soundMuted');
            await AsyncStorage.removeItem('musicMuted');
            this.isMuted = false;
            this.isMusicMuted = false;

            // Set audio mode
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
            });

            // Pre-load commonly used sounds
            await this.preloadSound('tick');
            await this.preloadSound('buttonClick');

            this.isInitialized = true;
            console.log('SoundService initialized');
        } catch (error) {
            console.log('SoundService init error:', error);
        }
    }

    async preloadSound(soundName) {
        if (this.sounds[soundName]) return;

        try {
            const { sound } = await Audio.Sound.createAsync(
                { uri: SOUNDS[soundName] },
                { shouldPlay: false, volume: 0.7 }
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
            if (this.sounds[soundName]) {
                await this.sounds[soundName].setPositionAsync(0);
                await this.sounds[soundName].playAsync();
                return;
            }

            const { sound } = await Audio.Sound.createAsync(
                { uri: SOUNDS[soundName] },
                { shouldPlay: true, volume: 0.7 }
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
        const isWeb = typeof document !== 'undefined';
        console.log('Platform detection:', isWeb ? 'web' : 'native');

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
                const status = await this.currentMusic.getStatusAsync();
                if (status.isPlaying) {
                    console.log('Track already playing on native, skipping');
                    return;
                }
            }
        }

        // Stop any existing music first
        await this.stopMusic();

        try {
            const source = MUSIC[trackName];
            console.log(`Playing music: ${trackName}, source:`, source, `isWeb: ${isWeb}`);
            if (isWeb) {
                // Resolve local asset to a URI using expo-asset if needed
                let uri;
                if (typeof source === 'string') {
                    uri = source;
                    console.log('Using string URL:', uri);
                } else {
                    console.log('Resolving local asset with expo-asset...');
                    const { Asset } = await import('expo-asset');
                    const asset = Asset.fromModule(source);
                    console.log('Asset before download:', asset);
                    await asset.downloadAsync();
                    uri = asset.localUri || asset.uri;
                    console.log('Resolved URI:', uri);
                }
                console.log('Creating web Audio with uri:', uri);
                const audio = new window.Audio(uri); // Use window.Audio to avoid conflict with expo-av
                audio.loop = loop;
                audio.volume = 0.5;

                // Add event listeners for debugging
                audio.oncanplaythrough = () => console.log('Audio can play through');
                audio.onerror = (e) => console.error('Audio error:', e, audio.error);
                audio.onplay = () => console.log('Audio playing!');

                await audio.play();
                this.currentMusic = audio;
                this.currentMusicName = trackName;
                console.log('Web audio started successfully!');
            } else {
                // Native playback via expo-av
                let audioSource;
                if (typeof source === 'string') {
                    audioSource = { uri: source };
                } else {
                    const { Asset } = await import('expo-asset');
                    const asset = Asset.fromModule(source);
                    await asset.downloadAsync();
                    audioSource = { uri: asset.localUri || asset.uri };
                }
                const { sound } = await Audio.Sound.createAsync(
                    audioSource,
                    { shouldPlay: true, volume: 0.5, isLooping: loop }
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
                // Check if it's a web HTMLAudioElement or expo-av Sound
                if (typeof this.currentMusic.pause === 'function' && typeof this.currentMusic.stopAsync !== 'function') {
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
                await this.currentMusic.pauseAsync();
            } catch (error) {
                // Ignore
            }
        }
    }

    async resumeMusic() {
        if (this.currentMusic && !this.isMusicMuted) {
            try {
                await this.currentMusic.playAsync();
            } catch (error) {
                // Ignore
            }
        }
    }

    // Convenience methods for specific tracks
    async playLobbyMusic() { await this.playMusic('lobby', true); }
    async playGameplayMusic() { await this.playMusic('gameplay', true); }
    async playVictoryMusic() { await this.playMusic('victory', false); }
    async playDefeatMusic() { await this.playMusic('defeat', false); }
    async playGameOverMusic() { await this.playMusic('gameOver', false); }

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
