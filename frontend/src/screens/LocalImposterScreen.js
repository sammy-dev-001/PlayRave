import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Animated,
    Alert,
    Platform,
    TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { useTheme } from '../context/ThemeContext';
import HapticService from '../services/HapticService';
import SoundService from '../services/SoundService';
import { getRandomWordPair, IMPOSTER_CATEGORIES } from '../data/imposterWords';
import { getAvatarEmoji } from '../utils/avatarUtils';

const DEFAULT_NAMES = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
const TIMER_OPTIONS = [
    { label: '2 Mins', seconds: 120 },
    { label: '3 Mins', seconds: 180 },
    { label: '5 Mins', seconds: 300 },
    { label: 'No Limit', seconds: 0 },
];

const LocalImposterScreen = ({ route, navigation }) => {
    const { COLORS } = useTheme();
    const styles = useMemo(() => getStyles(COLORS), [COLORS]);

    // Route params (if arriving from LocalPartySetupScreen)
    const incomingPlayers = route?.params?.players;

    // --- SETUP STATE ---
    const [phase, setPhase] = useState('setup'); // 'setup' | 'pass' | 'reveal' | 'discussion' | 'voting' | 'elimination' | 'gameover'
    const [players, setPlayers] = useState(() => {
        if (incomingPlayers && incomingPlayers.length >= 3) {
            return incomingPlayers.map((p, idx) => ({
                id: p.id || `p_${idx + 1}`,
                name: p.name || `Player ${idx + 1}`,
                avatar: p.avatar || idx
            }));
        }
        return DEFAULT_NAMES.map((name, idx) => ({
            id: `p_${idx + 1}`,
            name,
            avatar: idx
        }));
    });
    const [newPlayerName, setNewPlayerName] = useState('');
    const [imposterCount, setImposterCount] = useState(1);
    const [gameMode, setGameMode] = useState('undercover'); // 'undercover' (decoy word) | 'spyfall' (no word)
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [timerSeconds, setTimerSeconds] = useState(180);

    // --- IN-GAME STATE ---
    const [currentPair, setCurrentPair] = useState(null);
    const [playerRoles, setPlayerRoles] = useState([]); // [{ id, name, isImposter, word, eliminated: false }]
    const [currentRevealIndex, setCurrentRevealIndex] = useState(0);
    const [isWordRevealed, setIsWordRevealed] = useState(false);
    const [usedPairs, setUsedPairs] = useState([]);

    // Discussion Timer
    const [timeLeft, setTimeLeft] = useState(180);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [startingPlayerName, setStartingPlayerName] = useState('');

    // Voting / Elimination
    const [accusedPlayer, setAccusedPlayer] = useState(null);
    const [winner, setWinner] = useState(null); // 'civilians' | 'imposters'
    const [imposterGuessedRight, setImposterGuessedRight] = useState(false);

    // Animations
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const cardScaleAnim = useRef(new Animated.Value(1)).current;
    const revealOpacityAnim = useRef(new Animated.Value(0)).current;

    // Pulse animation for holding down card
    useEffect(() => {
        if (isWordRevealed) {
            Animated.sequence([
                Animated.timing(cardScaleAnim, { toValue: 1.04, duration: 160, useNativeDriver: true }),
                Animated.timing(cardScaleAnim, { toValue: 1.0, duration: 160, useNativeDriver: true })
            ]).start();
            Animated.timing(revealOpacityAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true
            }).start();
        } else {
            Animated.timing(revealOpacityAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true
            }).start();
        }
    }, [isWordRevealed]);

    // Timer Effect
    useEffect(() => {
        let interval = null;
        if (phase === 'discussion' && isTimerRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        setIsTimerRunning(false);
                        SoundService.play('times-up');
                        HapticService.trigger('notificationError');
                        return 0;
                    }
                    if (prev === 11 || prev === 6) {
                        SoundService.play('tick');
                        HapticService.trigger('impactLight');
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [phase, isTimerRunning, timeLeft]);

    // --- SETUP HANDLERS ---
    const addPlayer = () => {
        const trimmed = newPlayerName.trim();
        if (!trimmed) return;
        if (players.length >= 12) {
            Alert.alert('Max Players', 'The Imposter supports up to 12 players.');
            return;
        }
        setPlayers(prev => [
            ...prev,
            { id: `p_${Date.now()}`, name: trimmed, avatar: prev.length % 12 }
        ]);
        setNewPlayerName('');
        HapticService.trigger('impactLight');
    };

    const removePlayer = (id) => {
        if (players.length <= 3) {
            Alert.alert('Minimum Required', 'The Imposter requires at least 3 players.');
            return;
        }
        setPlayers(prev => prev.filter(p => p.id !== id));
        HapticService.trigger('impactLight');
    };

    // --- GAME INITIALIZATION ---
    const startGame = () => {
        if (players.length < 3) {
            Alert.alert('Need More Players', 'You need at least 3 players to play.');
            return;
        }

        // Pick word pair
        const pair = getRandomWordPair(selectedCategory, usedPairs);
        setCurrentPair(pair);
        setUsedPairs(prev => [...prev, pair]);

        // Decide imposter count (1, or 2 if players >= 6)
        const effectiveImposterCount = Math.min(imposterCount, Math.floor(players.length / 2));

        // Randomly pick imposters
        const shuffledIndices = [...Array(players.length).keys()].sort(() => Math.random() - 0.5);
        const imposterIndices = new Set(shuffledIndices.slice(0, effectiveImposterCount));

        const assigned = players.map((p, idx) => {
            const isImp = imposterIndices.has(idx);
            let word = '';
            if (isImp) {
                word = gameMode === 'undercover' ? pair.imposterWord : null;
            } else {
                word = pair.normalWord;
            }
            return {
                ...p,
                isImposter: isImp,
                word,
                eliminated: false
            };
        });

        // Random starter
        const starter = players[Math.floor(Math.random() * players.length)].name;
        setStartingPlayerName(starter);

        setPlayerRoles(assigned);
        setCurrentRevealIndex(0);
        setIsWordRevealed(false);
        setTimeLeft(timerSeconds);
        setIsTimerRunning(timerSeconds > 0);
        setPhase('pass');
        SoundService.play('game-start');
        HapticService.trigger('impactHeavy');
    };

    // --- REVEAL CYCLE ---
    const handleRevealWord = () => {
        setIsWordRevealed(true);
        HapticService.trigger('impactMedium');
        SoundService.play('click');
    };

    const handleHideAndPass = () => {
        setIsWordRevealed(false);
        HapticService.trigger('impactLight');

        if (currentRevealIndex + 1 < playerRoles.length) {
            setCurrentRevealIndex(prev => prev + 1);
            setPhase('pass');
        } else {
            // All players saw their cards -> start discussion
            setPhase('discussion');
            SoundService.play('countdown');
            HapticService.trigger('notificationSuccess');
        }
    };

    // --- VOTING & ELIMINATION ---
    const handleSelectSuspect = (player) => {
        if (player.eliminated) return;
        HapticService.trigger('impactMedium');
        setAccusedPlayer(player);
    };

    const confirmElimination = () => {
        if (!accusedPlayer) return;

        const updated = playerRoles.map(p =>
            p.id === accusedPlayer.id ? { ...p, eliminated: true } : p
        );
        setPlayerRoles(updated);
        setPhase('elimination');

        if (accusedPlayer.isImposter) {
            SoundService.play('victory');
            HapticService.trigger('notificationSuccess');
        } else {
            SoundService.play('error');
            HapticService.trigger('notificationError');
        }
    };

    const evaluateGameOutcome = (imposterGuessedSecret = false) => {
        if (imposterGuessedSecret) {
            setImposterGuessedRight(true);
            setWinner('imposters');
            setPhase('gameover');
            return;
        }

        const remainingImposters = playerRoles.filter(p => p.isImposter && !p.eliminated);
        const remainingCivilians = playerRoles.filter(p => !p.isImposter && !p.eliminated);

        if (remainingImposters.length === 0) {
            // Civilians caught all imposters!
            setWinner('civilians');
            setPhase('gameover');
        } else if (remainingCivilians.length <= remainingImposters.length) {
            // Imposters equal or outnumber civilians -> Imposter victory!
            setWinner('imposters');
            setPhase('gameover');
        } else {
            // More rounds can be played
            setAccusedPlayer(null);
            setPhase('discussion');
        }
    };

    const handlePlayAgain = () => {
        startGame();
    };

    const handleExitGame = () => {
        Alert.alert(
            'Exit Imposter',
            'Are you sure you want to exit to game selection?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Exit',
                    style: 'destructive',
                    onPress: () => navigation.goBack()
                }
            ]
        );
    };

    // Format seconds to MM:SS
    const formatTime = (secs) => {
        const mins = Math.floor(secs / 60);
        const rem = secs % 60;
        return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
    };

    // ==========================================
    // RENDER: SETUP
    // ==========================================
    if (phase === 'setup') {
        return (
            <NeonContainer style={styles.container}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <NeonText glowColor={COLORS.hotPink} style={styles.titleText}>
                        THE IMPOSTER
                    </NeonText>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <NeonText style={styles.subtitleText}>
                        Pass-the-phone party deception. Find who doesn't belong!
                    </NeonText>

                    {/* PLAYER LIST */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="people" size={20} color={COLORS.neonCyan} />
                            <NeonText glowColor={COLORS.neonCyan} style={styles.sectionTitle}>
                                Players ({players.length}/12)
                            </NeonText>
                        </View>

                        <View style={styles.playerChipsContainer}>
                            {players.map((p, idx) => (
                                <View key={p.id} style={styles.playerChip}>
                                    <NeonText style={styles.playerChipAvatar}>{getAvatarEmoji(p.avatar)}</NeonText>
                                    <NeonText style={styles.playerChipName} numberOfLines={1}>{p.name}</NeonText>
                                    {players.length > 3 && (
                                        <TouchableOpacity onPress={() => removePlayer(p.id)} style={styles.chipRemove}>
                                            <Ionicons name="close-circle" size={18} color={COLORS.hotPink} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                        </View>

                        {/* Add Player Input */}
                        {players.length < 12 && (
                            <View style={styles.addPlayerRow}>
                                <TextInput
                                    style={styles.addPlayerInput}
                                    placeholder="Add Player Name..."
                                    placeholderTextColor={COLORS.textMuted}
                                    value={newPlayerName}
                                    onChangeText={setNewPlayerName}
                                    onSubmitEditing={addPlayer}
                                    maxLength={16}
                                />
                                <TouchableOpacity style={styles.addPlayerButton} onPress={addPlayer}>
                                    <Ionicons name="add" size={24} color={COLORS.textPrimary} />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* GAME MODE */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="finger-print" size={20} color={COLORS.electricPurple} />
                            <NeonText glowColor={COLORS.electricPurple} style={styles.sectionTitle}>
                                Game Mode
                            </NeonText>
                        </View>

                        <View style={styles.optionRow}>
                            <TouchableOpacity
                                style={[styles.modeCard, gameMode === 'undercover' && styles.modeCardActive]}
                                onPress={() => { setGameMode('undercover'); HapticService.trigger('impactLight'); }}
                            >
                                <Ionicons name="shuffle" size={24} color={gameMode === 'undercover' ? COLORS.neonCyan : COLORS.textMuted} />
                                <NeonText style={[styles.modeTitle, gameMode === 'undercover' && { color: COLORS.neonCyan }]}>
                                    Undercover
                                </NeonText>
                                <NeonText style={styles.modeDesc}>
                                    Imposter gets a similar decoy word!
                                </NeonText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modeCard, gameMode === 'spyfall' && styles.modeCardActive]}
                                onPress={() => { setGameMode('spyfall'); HapticService.trigger('impactLight'); }}
                            >
                                <Ionicons name="eye-off" size={24} color={gameMode === 'spyfall' ? COLORS.hotPink : COLORS.textMuted} />
                                <NeonText style={[styles.modeTitle, gameMode === 'spyfall' && { color: COLORS.hotPink }]}>
                                    Classic Spy
                                </NeonText>
                                <NeonText style={styles.modeDesc}>
                                    Imposter gets NO word at all!
                                </NeonText>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* IMPOSTER COUNT */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="skull" size={20} color={COLORS.hotPink} />
                            <NeonText glowColor={COLORS.hotPink} style={styles.sectionTitle}>
                                Imposters
                            </NeonText>
                        </View>
                        <View style={styles.pillRow}>
                            <TouchableOpacity
                                style={[styles.pill, imposterCount === 1 && styles.pillActive]}
                                onPress={() => { setImposterCount(1); HapticService.trigger('impactLight'); }}
                            >
                                <NeonText style={[styles.pillText, imposterCount === 1 && styles.pillTextActive]}>
                                    1 Imposter
                                </NeonText>
                            </TouchableOpacity>
                            {players.length >= 6 && (
                                <TouchableOpacity
                                    style={[styles.pill, imposterCount === 2 && styles.pillActive]}
                                    onPress={() => { setImposterCount(2); HapticService.trigger('impactLight'); }}
                                >
                                    <NeonText style={[styles.pillText, imposterCount === 2 && styles.pillTextActive]}>
                                        2 Imposters
                                    </NeonText>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* CATEGORY SELECTOR */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="grid" size={20} color={COLORS.limeGlow} />
                            <NeonText glowColor={COLORS.limeGlow} style={styles.sectionTitle}>
                                Word Theme
                            </NeonText>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                            {IMPOSTER_CATEGORIES.map(cat => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[styles.categoryPill, selectedCategory === cat && styles.categoryPillActive]}
                                    onPress={() => { setSelectedCategory(cat); HapticService.trigger('impactLight'); }}
                                >
                                    <NeonText style={[styles.categoryPillText, selectedCategory === cat && styles.categoryPillTextActive]}>
                                        {cat}
                                    </NeonText>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* DISCUSSION TIMER */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="timer" size={20} color={COLORS.neonCyan} />
                            <NeonText glowColor={COLORS.neonCyan} style={styles.sectionTitle}>
                                Discussion Timer
                            </NeonText>
                        </View>
                        <View style={styles.pillRow}>
                            {TIMER_OPTIONS.map(opt => (
                                <TouchableOpacity
                                    key={opt.label}
                                    style={[styles.pill, timerSeconds === opt.seconds && styles.pillActive]}
                                    onPress={() => { setTimerSeconds(opt.seconds); HapticService.trigger('impactLight'); }}
                                >
                                    <NeonText style={[styles.pillText, timerSeconds === opt.seconds && styles.pillTextActive]}>
                                        {opt.label}
                                    </NeonText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={{ height: 20 }} />
                    <NeonButton
                        title="START PASS & PLAY"
                        onPress={startGame}
                        color={COLORS.neonCyan}
                        glow={true}
                        style={styles.startButton}
                    />
                    <View style={{ height: 40 }} />
                </ScrollView>
            </NeonContainer>
        );
    }

    // ==========================================
    // RENDER: PASS PHONE
    // ==========================================
    if (phase === 'pass') {
        const targetPlayer = playerRoles[currentRevealIndex];
        return (
            <NeonContainer style={styles.container}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={handleExitGame} style={styles.iconButton}>
                        <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <NeonText glowColor={COLORS.neonCyan} style={styles.smallStepBadge}>
                        PLAYER {currentRevealIndex + 1} OF {playerRoles.length}
                    </NeonText>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.centerCardArea}>
                    <View style={styles.passPhoneCard}>
                        <NeonText style={styles.passAvatar}>
                            {getAvatarEmoji(targetPlayer.avatar)}
                        </NeonText>
                        <NeonText style={styles.passSubtext}>
                            Pass the phone to
                        </NeonText>
                        <NeonText glowColor={COLORS.neonCyan} style={styles.passPlayerName}>
                            {targetPlayer.name}
                        </NeonText>

                        <View style={styles.privacyNotice}>
                            <Ionicons name="eye-off-outline" size={22} color={COLORS.hotPink} />
                            <NeonText style={styles.privacyText}>
                                Make sure nobody else is peeking at the screen!
                            </NeonText>
                        </View>

                        <NeonButton
                            title="I AM READY, SHOW MY WORD"
                            onPress={() => {
                                setPhase('reveal');
                                handleRevealWord();
                            }}
                            color={COLORS.hotPink}
                            glow={true}
                            style={styles.revealButton}
                        />
                    </View>
                </View>
            </NeonContainer>
        );
    }

    // ==========================================
    // RENDER: SECRET REVEAL
    // ==========================================
    if (phase === 'reveal') {
        const targetPlayer = playerRoles[currentRevealIndex];
        const isImp = targetPlayer.isImposter;

        return (
            <NeonContainer style={styles.container}>
                <View style={styles.headerRow}>
                    <View style={{ width: 40 }} />
                    <NeonText glowColor={isImp ? COLORS.hotPink : COLORS.limeGlow} style={styles.titleText}>
                        CONFIDENTIAL
                    </NeonText>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.centerCardArea}>
                    <Animated.View style={[
                        styles.secretCard,
                        isImp ? styles.secretCardImposter : styles.secretCardCivilian,
                        { transform: [{ scale: cardScaleAnim }] }
                    ]}>
                        <NeonText style={styles.secretRoleTag}>
                            {isImp && gameMode === 'spyfall' ? '🚨 YOU ARE THE IMPOSTER' : '🤫 YOUR SECRET WORD'}
                        </NeonText>

                        {isImp && gameMode === 'spyfall' ? (
                            <View style={styles.imposterBlankContainer}>
                                <Ionicons name="skull" size={64} color={COLORS.hotPink} />
                                <NeonText glowColor={COLORS.hotPink} style={styles.imposterHeroText}>
                                    NO WORD!
                                </NeonText>
                                <NeonText style={styles.categoryBadge}>
                                    Category: {currentPair.category}
                                </NeonText>
                                <NeonText style={styles.hintText}>
                                    You have no secret word! Listen to other players' clues and bluff your way through without getting caught!
                                </NeonText>
                            </View>
                        ) : (
                            <View style={styles.wordRevealContainer}>
                                <NeonText glowColor={isImp ? COLORS.electricPurple : COLORS.limeGlow} style={styles.secretWordText}>
                                    {targetPlayer.word}
                                </NeonText>
                                <NeonText style={styles.categoryBadge}>
                                    Theme: {currentPair.category}
                                </NeonText>
                                <NeonText style={styles.hintText}>
                                    {isImp
                                        ? "Give subtle clues that match your word, but pay close attention to others to see if their word is different!"
                                        : "Give a 1-word or 1-sentence clue about this word without making it too obvious for the Imposter!"}
                                </NeonText>
                            </View>
                        )}

                        <View style={{ height: 24 }} />
                        <NeonButton
                            title="I GOT IT (HIDE & PASS)"
                            onPress={handleHideAndPass}
                            color={COLORS.neonCyan}
                            glow={true}
                            style={styles.hidePassButton}
                        />
                    </Animated.View>
                </View>
            </NeonContainer>
        );
    }

    // ==========================================
    // RENDER: DISCUSSION / INTERROGATION
    // ==========================================
    if (phase === 'discussion') {
        const alivePlayers = playerRoles.filter(p => !p.eliminated);

        return (
            <NeonContainer style={styles.container}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={handleExitGame} style={styles.iconButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <NeonText glowColor={COLORS.limeGlow} style={styles.titleText}>
                        INTERROGATION
                    </NeonText>
                    <TouchableOpacity
                        onPress={() => setIsTimerRunning(prev => !prev)}
                        style={styles.iconButton}
                    >
                        <Ionicons
                            name={isTimerRunning ? 'pause' : 'play'}
                            size={24}
                            color={COLORS.neonCyan}
                        />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* TIMER BANNER */}
                    {timerSeconds > 0 && (
                        <View style={[styles.timerCard, timeLeft <= 30 && styles.timerCardCritical]}>
                            <Ionicons
                                name="time-outline"
                                size={28}
                                color={timeLeft <= 30 ? COLORS.hotPink : COLORS.neonCyan}
                            />
                            <NeonText
                                glowColor={timeLeft <= 30 ? COLORS.hotPink : COLORS.neonCyan}
                                style={styles.timerDigits}
                            >
                                {formatTime(timeLeft)}
                            </NeonText>
                            <TouchableOpacity
                                style={styles.addTimeBtn}
                                onPress={() => setTimeLeft(prev => prev + 60)}
                            >
                                <NeonText style={styles.addTimeText}>+60s</NeonText>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* FIRST SPEAKER CARD */}
                    <View style={styles.starterCard}>
                        <Ionicons name="mic" size={22} color={COLORS.limeGlow} />
                        <NeonText style={styles.starterText}>
                            <NeonText style={{ color: COLORS.limeGlow, fontWeight: 'bold' }}>{startingPlayerName}</NeonText> gives the first clue! Go around clockwise.
                        </NeonText>
                    </View>

                    {/* RULES REMINDER */}
                    <View style={styles.rulesCard}>
                        <NeonText style={styles.ruleTitle}>🗣️ Rules of the Round:</NeonText>
                        <NeonText style={styles.ruleBullet}>• Each player gives 1 short clue about their word.</NeonText>
                        <NeonText style={styles.ruleBullet}>• Never say the word itself or spell it out!</NeonText>
                        <NeonText style={styles.ruleBullet}>• Interrogate suspicious clues and inconsistencies.</NeonText>
                    </View>

                    {/* ACTIVE PLAYERS LIST */}
                    <View style={styles.sectionCard}>
                        <NeonText glowColor={COLORS.neonCyan} style={styles.sectionTitle}>
                            Suspects ({alivePlayers.length} Active)
                        </NeonText>
                        <View style={styles.suspectsGrid}>
                            {alivePlayers.map(p => (
                                <View key={p.id} style={styles.suspectPill}>
                                    <NeonText style={styles.suspectAvatar}>{getAvatarEmoji(p.avatar)}</NeonText>
                                    <NeonText style={styles.suspectName} numberOfLines={1}>{p.name}</NeonText>
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={{ height: 20 }} />
                    <NeonButton
                        title="VOTE & ACCUSE AN IMPOSTER"
                        onPress={() => {
                            setIsTimerRunning(false);
                            setPhase('voting');
                            SoundService.play('click');
                            HapticService.trigger('impactHeavy');
                        }}
                        color={COLORS.hotPink}
                        glow={true}
                        style={styles.voteNavButton}
                    />
                    <View style={{ height: 40 }} />
                </ScrollView>
            </NeonContainer>
        );
    }

    // ==========================================
    // RENDER: VOTING / SELECT SUSPECT
    // ==========================================
    if (phase === 'voting') {
        const alivePlayers = playerRoles.filter(p => !p.eliminated);

        return (
            <NeonContainer style={styles.container}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => setPhase('discussion')} style={styles.iconButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <NeonText glowColor={COLORS.hotPink} style={styles.titleText}>
                        ACCUSATION
                    </NeonText>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <NeonText style={styles.votingPrompt}>
                        Point fingers or discuss, then tap who the group chooses to accuse!
                    </NeonText>

                    <View style={styles.votingGrid}>
                        {alivePlayers.map(p => {
                            const isSelected = accusedPlayer?.id === p.id;
                            return (
                                <TouchableOpacity
                                    key={p.id}
                                    style={[styles.votingCard, isSelected && styles.votingCardSelected]}
                                    onPress={() => handleSelectSuspect(p)}
                                >
                                    <NeonText style={styles.votingAvatar}>{getAvatarEmoji(p.avatar)}</NeonText>
                                    <NeonText style={styles.votingName} numberOfLines={1}>{p.name}</NeonText>
                                    {isSelected && (
                                        <View style={styles.targetBadge}>
                                            <Ionicons name="radio-button-on" size={18} color={COLORS.hotPink} />
                                            <NeonText style={styles.targetBadgeText}>ACCUSED</NeonText>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {accusedPlayer && (
                        <View style={styles.confirmBox}>
                            <NeonText style={styles.confirmText}>
                                Eliminate <NeonText style={{ color: COLORS.hotPink, fontWeight: 'bold' }}>{accusedPlayer.name}</NeonText>?
                            </NeonText>
                            <NeonButton
                                title={`ELIMINATE ${accusedPlayer.name.toUpperCase()}`}
                                onPress={confirmElimination}
                                color={COLORS.hotPink}
                                glow={true}
                                style={styles.confirmButton}
                            />
                        </View>
                    )}
                    <View style={{ height: 40 }} />
                </ScrollView>
            </NeonContainer>
        );
    }

    // ==========================================
    // RENDER: ELIMINATION REVEAL
    // ==========================================
    if (phase === 'elimination') {
        const isImp = accusedPlayer?.isImposter;

        return (
            <NeonContainer style={styles.container}>
                <View style={styles.centerCardArea}>
                    <View style={[styles.eliminationCard, isImp ? styles.eliminationCardImposter : styles.eliminationCardCivilian]}>
                        <NeonText style={styles.eliminationAvatar}>{getAvatarEmoji(accusedPlayer.avatar)}</NeonText>
                        <NeonText style={styles.eliminationName}>{accusedPlayer.name}</NeonText>

                        {isImp ? (
                            <View style={styles.eliminationResultBox}>
                                <Ionicons name="skull" size={48} color={COLORS.hotPink} />
                                <NeonText glowColor={COLORS.hotPink} style={styles.eliminationVerdict}>
                                    BUSTED!
                                </NeonText>
                                <NeonText style={styles.eliminationSub}>
                                    {accusedPlayer.name} was indeed an Imposter!
                                </NeonText>

                                {/* Imposter Final Word Guess Chance */}
                                <View style={styles.guessBox}>
                                    <NeonText style={styles.guessTitle}>🚨 Imposter's Final Chance:</NeonText>
                                    <NeonText style={styles.guessDesc}>
                                        If {accusedPlayer.name} can correctly state the Civilians' secret word right now, the Imposter steals the victory!
                                    </NeonText>
                                    <View style={styles.guessActionRow}>
                                        <TouchableOpacity
                                            style={[styles.guessBtn, { borderColor: COLORS.limeGlow }]}
                                            onPress={() => evaluateGameOutcome(true)}
                                        >
                                            <NeonText style={{ color: COLORS.limeGlow, fontWeight: 'bold' }}>
                                                They Guessed It! 🏆
                                            </NeonText>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.guessBtn, { borderColor: COLORS.hotPink }]}
                                            onPress={() => evaluateGameOutcome(false)}
                                        >
                                            <NeonText style={{ color: COLORS.hotPink, fontWeight: 'bold' }}>
                                                They Failed ❌
                                            </NeonText>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.eliminationResultBox}>
                                <Ionicons name="heart-dislike" size={48} color={COLORS.neonCyan} />
                                <NeonText glowColor={COLORS.neonCyan} style={styles.eliminationVerdict}>
                                    INNOCENT!
                                </NeonText>
                                <NeonText style={styles.eliminationSub}>
                                    {accusedPlayer.name} was an Innocent Civilian!
                                </NeonText>
                                <View style={{ height: 20 }} />
                                <NeonButton
                                    title="CONTINUE HUNT"
                                    onPress={() => evaluateGameOutcome(false)}
                                    color={COLORS.neonCyan}
                                    glow={true}
                                />
                            </View>
                        )}
                    </View>
                </View>
            </NeonContainer>
        );
    }

    // ==========================================
    // RENDER: GAME OVER / VICTORY
    // ==========================================
    if (phase === 'gameover') {
        const isCiviliansWin = winner === 'civilians';

        return (
            <NeonContainer style={styles.container}>
                <View style={styles.headerRow}>
                    <View style={{ width: 40 }} />
                    <NeonText glowColor={isCiviliansWin ? COLORS.limeGlow : COLORS.hotPink} style={styles.titleText}>
                        GAME OVER
                    </NeonText>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* VICTORY BANNER */}
                    <View style={[styles.victoryBanner, isCiviliansWin ? styles.civiliansWinBanner : styles.impostersWinBanner]}>
                        <Ionicons
                            name={isCiviliansWin ? 'shield-checkmark' : 'skull'}
                            size={56}
                            color={isCiviliansWin ? COLORS.limeGlow : COLORS.hotPink}
                        />
                        <NeonText
                            glowColor={isCiviliansWin ? COLORS.limeGlow : COLORS.hotPink}
                            style={styles.victoryTitle}
                        >
                            {isCiviliansWin ? 'CIVILIANS WIN!' : 'IMPOSTERS WIN!'}
                        </NeonText>
                        <NeonText style={styles.victorySubtitle}>
                            {imposterGuessedRight
                                ? 'The Imposter was caught but stole the victory by guessing the secret word!'
                                : isCiviliansWin
                                    ? 'The group successfully rooted out the Imposters!'
                                    : 'The Imposters outsmarted the civilians!'}
                        </NeonText>
                    </View>

                    {/* WORDS SUMMARY */}
                    <View style={styles.sectionCard}>
                        <NeonText glowColor={COLORS.neonCyan} style={styles.sectionTitle}>
                            Word Reveal
                        </NeonText>
                        <View style={styles.wordSummaryRow}>
                            <View style={styles.wordSummaryBox}>
                                <NeonText style={styles.wordSummaryLabel}>Civilian Word:</NeonText>
                                <NeonText glowColor={COLORS.limeGlow} style={styles.wordSummaryValue}>
                                    {currentPair.normalWord}
                                </NeonText>
                            </View>
                            {gameMode === 'undercover' && (
                                <View style={styles.wordSummaryBox}>
                                    <NeonText style={styles.wordSummaryLabel}>Imposter Word:</NeonText>
                                    <NeonText glowColor={COLORS.hotPink} style={styles.wordSummaryValue}>
                                        {currentPair.imposterWord}
                                    </NeonText>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* PLAYERS ROSTER */}
                    <View style={styles.sectionCard}>
                        <NeonText glowColor={COLORS.electricPurple} style={styles.sectionTitle}>
                            Final Roles
                        </NeonText>
                        {playerRoles.map(p => (
                            <View key={p.id} style={styles.rosterRow}>
                                <View style={styles.rosterLeft}>
                                    <NeonText style={styles.rosterAvatar}>{getAvatarEmoji(p.avatar)}</NeonText>
                                    <NeonText style={styles.rosterName}>{p.name}</NeonText>
                                </View>
                                <View style={[styles.rosterTag, p.isImposter ? styles.rosterTagImposter : styles.rosterTagCivilian]}>
                                    <NeonText style={[styles.rosterTagText, p.isImposter ? { color: COLORS.hotPink } : { color: COLORS.limeGlow }]}>
                                        {p.isImposter ? 'IMPOSTER' : 'CIVILIAN'}
                                    </NeonText>
                                </View>
                            </View>
                        ))}
                    </View>

                    <View style={{ height: 20 }} />
                    <NeonButton
                        title="PLAY NEXT ROUND"
                        onPress={handlePlayAgain}
                        color={COLORS.neonCyan}
                        glow={true}
                        style={styles.actionBtn}
                    />
                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => setPhase('setup')}>
                        <NeonText style={styles.secondaryBtnText}>Change Settings / Players</NeonText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
                        <NeonText style={[styles.secondaryBtnText, { color: COLORS.textMuted }]}>Exit Game</NeonText>
                    </TouchableOpacity>
                    <View style={{ height: 40 }} />
                </ScrollView>
            </NeonContainer>
        );
    }

    return null;
};

// ==========================================
// STYLES
// ==========================================
const getStyles = (COLORS) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 12 : 16,
        paddingBottom: 12
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    titleText: {
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 1
    },
    subtitleText: {
        color: COLORS.textSecondary,
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 16
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 24
    },
    sectionCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 16,
        marginBottom: 16
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8
    },
    playerChipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12
    },
    playerChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)'
    },
    playerChipAvatar: {
        fontSize: 16,
        marginRight: 6
    },
    playerChipName: {
        color: COLORS.textPrimary,
        fontSize: 13,
        fontWeight: '600',
        maxWidth: 100
    },
    chipRemove: {
        marginLeft: 6
    },
    addPlayerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6
    },
    addPlayerInput: {
        flex: 1,
        height: 42,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 12,
        paddingHorizontal: 12,
        color: COLORS.textPrimary,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        fontSize: 14
    },
    addPlayerButton: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: COLORS.neonCyan,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8
    },
    optionRow: {
        flexDirection: 'row',
        gap: 12
    },
    modeCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center'
    },
    modeCardActive: {
        borderColor: COLORS.neonCyan,
        backgroundColor: 'rgba(0, 255, 255, 0.08)'
    },
    modeTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginTop: 6
    },
    modeDesc: {
        fontSize: 11,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginTop: 4
    },
    pillRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    },
    pill: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    pillActive: {
        borderColor: COLORS.hotPink,
        backgroundColor: 'rgba(255, 0, 127, 0.15)'
    },
    pillText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '600'
    },
    pillTextActive: {
        color: COLORS.hotPink,
        fontWeight: 'bold'
    },
    categoryScroll: {
        gap: 8,
        paddingVertical: 4
    },
    categoryPill: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    categoryPillActive: {
        borderColor: COLORS.limeGlow,
        backgroundColor: 'rgba(57, 255, 20, 0.15)'
    },
    categoryPillText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '600'
    },
    categoryPillTextActive: {
        color: COLORS.limeGlow,
        fontWeight: 'bold'
    },
    startButton: {
        marginTop: 8
    },

    // PASS STYLES
    centerCardArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20
    },
    passPhoneCard: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: 'rgba(0, 255, 255, 0.3)',
        padding: 28,
        alignItems: 'center'
    },
    passAvatar: {
        fontSize: 64,
        marginBottom: 12
    },
    passSubtext: {
        fontSize: 15,
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 2
    },
    passPlayerName: {
        fontSize: 32,
        fontWeight: '900',
        marginTop: 4,
        marginBottom: 20,
        textAlign: 'center'
    },
    privacyNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 0, 127, 0.1)',
        borderRadius: 14,
        padding: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 0, 127, 0.25)'
    },
    privacyText: {
        fontSize: 12,
        color: COLORS.textPrimary,
        marginLeft: 10,
        flex: 1
    },
    smallStepBadge: {
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1.5
    },
    revealButton: {
        width: '100%'
    },

    // SECRET CARD
    secretCard: {
        width: '100%',
        borderRadius: 24,
        borderWidth: 2,
        padding: 28,
        alignItems: 'center'
    },
    secretCardCivilian: {
        backgroundColor: 'rgba(20, 40, 25, 0.85)',
        borderColor: COLORS.limeGlow
    },
    secretCardImposter: {
        backgroundColor: 'rgba(40, 15, 25, 0.85)',
        borderColor: COLORS.hotPink
    },
    secretRoleTag: {
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1.5,
        color: COLORS.textSecondary,
        marginBottom: 16
    },
    wordRevealContainer: {
        alignItems: 'center',
        width: '100%'
    },
    secretWordText: {
        fontSize: 36,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 8
    },
    imposterBlankContainer: {
        alignItems: 'center',
        width: '100%'
    },
    imposterHeroText: {
        fontSize: 34,
        fontWeight: '900',
        marginTop: 8,
        marginBottom: 8
    },
    categoryBadge: {
        fontSize: 13,
        color: COLORS.textSecondary,
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginTop: 6,
        marginBottom: 16
    },
    hintText: {
        fontSize: 13,
        color: COLORS.textPrimary,
        textAlign: 'center',
        lineHeight: 18,
        paddingHorizontal: 8
    },
    hidePassButton: {
        width: '100%'
    },

    // DISCUSSION
    timerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 255, 255, 0.08)',
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: COLORS.neonCyan,
        paddingVertical: 14,
        paddingHorizontal: 20,
        marginBottom: 16
    },
    timerCardCritical: {
        backgroundColor: 'rgba(255, 0, 127, 0.12)',
        borderColor: COLORS.hotPink
    },
    timerDigits: {
        fontSize: 32,
        fontWeight: '900',
        marginHorizontal: 14,
        letterSpacing: 2
    },
    addTimeBtn: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.1)'
    },
    addTimeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.textPrimary
    },
    starterCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(57, 255, 20, 0.08)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(57, 255, 20, 0.3)',
        padding: 12,
        marginBottom: 16
    },
    starterText: {
        fontSize: 13,
        color: COLORS.textPrimary,
        marginLeft: 10,
        flex: 1
    },
    rulesCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 14,
        marginBottom: 16
    },
    ruleTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 6
    },
    ruleBullet: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginVertical: 2
    },
    suspectsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 6
    },
    suspectPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 16,
        paddingVertical: 6,
        paddingHorizontal: 10
    },
    suspectAvatar: {
        fontSize: 16,
        marginRight: 6
    },
    suspectName: {
        fontSize: 12,
        color: COLORS.textPrimary,
        fontWeight: '600'
    },
    voteNavButton: {
        marginTop: 10
    },

    // VOTING
    votingPrompt: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 18
    },
    votingGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between'
    },
    votingCard: {
        width: '48%',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.1)',
        padding: 16,
        alignItems: 'center',
        position: 'relative'
    },
    votingCardSelected: {
        borderColor: COLORS.hotPink,
        backgroundColor: 'rgba(255, 0, 127, 0.12)'
    },
    votingAvatar: {
        fontSize: 40,
        marginBottom: 8
    },
    votingName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.textPrimary
    },
    targetBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8
    },
    targetBadgeText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: COLORS.hotPink,
        marginLeft: 4
    },
    confirmBox: {
        marginTop: 24,
        alignItems: 'center'
    },
    confirmText: {
        fontSize: 16,
        color: COLORS.textPrimary,
        marginBottom: 12
    },
    confirmButton: {
        width: '100%'
    },

    // ELIMINATION
    eliminationCard: {
        width: '100%',
        borderRadius: 24,
        borderWidth: 2,
        padding: 24,
        alignItems: 'center'
    },
    eliminationCardImposter: {
        backgroundColor: 'rgba(40, 15, 25, 0.9)',
        borderColor: COLORS.hotPink
    },
    eliminationCardCivilian: {
        backgroundColor: 'rgba(15, 30, 40, 0.9)',
        borderColor: COLORS.neonCyan
    },
    eliminationAvatar: {
        fontSize: 56,
        marginBottom: 8
    },
    eliminationName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 12
    },
    eliminationResultBox: {
        alignItems: 'center',
        width: '100%'
    },
    eliminationVerdict: {
        fontSize: 32,
        fontWeight: '900',
        marginTop: 8,
        marginBottom: 4
    },
    eliminationSub: {
        fontSize: 14,
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: 16
    },
    guessBox: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: 14,
        marginTop: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    guessTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: COLORS.hotPink,
        marginBottom: 4
    },
    guessDesc: {
        fontSize: 12,
        color: COLORS.textSecondary,
        lineHeight: 16,
        marginBottom: 12
    },
    guessActionRow: {
        flexDirection: 'row',
        gap: 10
    },
    guessBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1.5,
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)'
    },

    // VICTORY / GAMEOVER
    victoryBanner: {
        borderRadius: 20,
        borderWidth: 2,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20
    },
    civiliansWinBanner: {
        backgroundColor: 'rgba(20, 50, 30, 0.7)',
        borderColor: COLORS.limeGlow
    },
    impostersWinBanner: {
        backgroundColor: 'rgba(50, 15, 30, 0.7)',
        borderColor: COLORS.hotPink
    },
    victoryTitle: {
        fontSize: 30,
        fontWeight: '900',
        marginTop: 10,
        marginBottom: 6,
        letterSpacing: 1.5
    },
    victorySubtitle: {
        fontSize: 13,
        color: COLORS.textPrimary,
        textAlign: 'center',
        lineHeight: 18,
        paddingHorizontal: 8
    },
    wordSummaryRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8
    },
    wordSummaryBox: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 14,
        padding: 12,
        alignItems: 'center'
    },
    wordSummaryLabel: {
        fontSize: 11,
        color: COLORS.textMuted,
        textTransform: 'uppercase',
        marginBottom: 4
    },
    wordSummaryValue: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    rosterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)'
    },
    rosterLeft: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    rosterAvatar: {
        fontSize: 20,
        marginRight: 10
    },
    rosterName: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary
    },
    rosterTag: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 10,
        borderWidth: 1
    },
    rosterTagCivilian: {
        borderColor: 'rgba(57, 255, 20, 0.4)',
        backgroundColor: 'rgba(57, 255, 20, 0.08)'
    },
    rosterTagImposter: {
        borderColor: 'rgba(255, 0, 127, 0.4)',
        backgroundColor: 'rgba(255, 0, 127, 0.08)'
    },
    rosterTagText: {
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 1
    },
    actionBtn: {
        marginBottom: 12
    },
    secondaryBtn: {
        paddingVertical: 12,
        alignItems: 'center'
    },
    secondaryBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.neonCyan
    }
});

export default LocalImposterScreen;

