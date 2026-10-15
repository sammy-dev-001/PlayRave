import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    View, StyleSheet, ScrollView, Modal,
    TouchableOpacity, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import WhotCard from '../components/WhotCard';
import WhotToast from '../components/WhotToast';
import { useTheme } from '../context/ThemeContext';

// ─── Deck ─────────────────────────────────────────────────────────────────────
const SHAPE_COLORS = {
    circle: '#e74c3c',
    triangle: '#2ecc71',
    cross: '#3498db',
    square: '#f39c12',
    star: '#9b59b6',
    whot: '#8B0000',
};
const SHAPE_NUMBERS = {
    circle:   [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14],
    triangle: [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14],
    cross:    [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14],
    square:   [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14],
    star:     [1, 2, 3, 4, 5, 7, 8],
};
const SHAPES = ['circle', 'triangle', 'cross', 'square', 'star'];

const makeCard = (shape, number) => ({
    id: `${shape}-${number}-${Math.random().toString(36).slice(2, 8)}`,
    shape, number, color: SHAPE_COLORS[shape],
});

const buildDeck = () => {
    const deck = [];
    Object.entries(SHAPE_NUMBERS).forEach(([shape, nums]) =>
        nums.forEach(n => deck.push(makeCard(shape, n)))
    );
    for (let i = 0; i < 5; i++) deck.push(makeCard('whot', 20));
    return deck;
};

const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

// ─── Card Rule Helpers ────────────────────────────────────────────────────────
const isWhotCard   = (c) => c.shape === 'whot';
const isPickTwo    = (c) => c.number === 2 && c.shape !== 'whot';
const isPickThree  = (c) => c.number === 5 && c.shape !== 'whot';
const isGenMarket  = (c) => c.number === 14 && c.shape !== 'whot';
const isHoldOn     = (c) => c.number === 1 && c.shape !== 'whot';
const isSuspension = (c) => c.number === 8 && c.shape !== 'whot';

const canPlay = (card, topCard, calledShape, attackStack, isGeneralMarket = false) => {
    if (isGeneralMarket) return false; // General Market is unblockable: must pick from market
    if (attackStack > 0) {
        if (isPickTwo(card) && isPickTwo(topCard)) return true;
        if (isPickThree(card) && isPickThree(topCard)) return true;
        return false;
    }
    if (isWhotCard(card)) return true;
    const targetShape = calledShape || topCard?.shape;
    if (targetShape && card.shape === targetShape) return true;
    if (topCard && card.number === topCard.number && topCard.shape !== 'whot') return true;
    return false;
};

const getPlayable = (hand, topCard, calledShape, attackStack, isGeneralMarket = false) =>
    hand.filter(c => canPlay(c, topCard, calledShape, attackStack, isGeneralMarket));

// ─── AI Logic ─────────────────────────────────────────────────────────────────
const scoreCard = (card, handSize) => {
    if (isPickThree(card)) return 100;
    if (isPickTwo(card))   return 80;
    if (isGenMarket(card)) return 65;
    if (isHoldOn(card))    return 55;
    if (isSuspension(card)) return 45;
    if (isWhotCard(card))  return handSize <= 2 ? 90 : 15;
    return card.number >= 10 ? 35 : 25;
};

const aiPickCard = (playable, hand, difficulty, playerHandSize = 5) => {
    if (!playable.length) return null;
    if (difficulty === 'easy') return playable[Math.floor(Math.random() * playable.length)];
    if (difficulty === 'medium') {
        const attacks = playable.filter(c => isPickTwo(c) || isPickThree(c));
        if (attacks.length) return attacks[0];
        const nonWhot = playable.filter(c => !isWhotCard(c));
        return nonWhot.length ? nonWhot[0] : playable[0];
    }
    
    // HARD difficulty heuristics
    if (playerHandSize <= 2) {
        // Player is about to win, desperately try to skip or attack
        const defense = playable.filter(c => isPickTwo(c) || isPickThree(c) || isHoldOn(c) || isSuspension(c) || isGenMarket(c));
        if (defense.length) {
            return defense.sort((a, b) => scoreCard(b, hand.length) - scoreCard(a, hand.length))[0];
        }
    }

    return [...playable].sort((a, b) => {
        let scoreA = scoreCard(a, hand.length);
        let scoreB = scoreCard(b, hand.length);
        
        // Bonus for playing a shape we have more of (shape control)
        const aShapeCount = hand.filter(c => c.shape === a.shape && c.id !== a.id).length;
        const bShapeCount = hand.filter(c => c.shape === b.shape && c.id !== b.id).length;
        scoreA += aShapeCount * 5;
        scoreB += bShapeCount * 5;

        // If player has few cards (<= 2), heavily prioritize attacks
        if (playerHandSize <= 2) {
            if (isPickTwo(a) || isPickThree(a) || isGenMarket(a) || isHoldOn(a) || isSuspension(a)) scoreA += 50;
            if (isPickTwo(b) || isPickThree(b) || isGenMarket(b) || isHoldOn(b) || isSuspension(b)) scoreB += 50;
        }

        return scoreB - scoreA;
    })[0];
};

const aiPickShape = (hand) => {
    const counts = {};
    hand.forEach(c => { if (c.shape !== 'whot') counts[c.shape] = (counts[c.shape] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.length ? sorted[0][0] : 'circle';
};

const AI_DELAY = { easy: [600, 1000], medium: [900, 1400], hard: [1500, 2200] };

// ─── Component ────────────────────────────────────────────────────────────────
const WhotVsAIScreen = ({ route, navigation }) => {
    const { COLORS } = useTheme();
    const styles = useMemo(() => getStyles(COLORS), [COLORS]);
    const { difficulty = 'medium', players } = route.params;
    const playerName = players?.[0]?.name || 'You';

    // ── Game State ────────────────────────────────────────────────────────────
    const [playerHand, setPlayerHand] = useState([]);
    const [aiHandCount, setAiHandCount] = useState(0);
    const [topCard, setTopCard]         = useState(null);
    const [calledShape, setCalledShape] = useState(null);
    const [currentTurn, setCurrentTurn] = useState('player');
    const [attackStack, setAttackStack] = useState(0);
    const [isGeneralMarket, setIsGeneralMarket] = useState(false);
    const [skipNext, setSkipNext]       = useState(false);
    const [winner, setWinner]           = useState(null);
    const [isThinking, setIsThinking]   = useState(false);
    const [showWhotPicker, setShowWhotPicker] = useState(false);
    const [pendingCard, setPendingCard] = useState(null);
    const [toast, setToast]             = useState({ visible: false, message: '', icon: '', color: '' });
    const [scores, setScores]           = useState({ player: 0, ai: 0 });
    const [deckCount, setDeckCount]     = useState(0);

    // Mutable refs (AI hand, deck — not exposed in UI directly)
    const aiHandRef  = useRef([]);
    const deckRef    = useRef([]);

    // ── Pulse animation ───────────────────────────────────────────────────────
    const pulseAnim = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        const p = Animated.loop(Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.1, duration: 550, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 550, useNativeDriver: true }),
        ]));
        p.start();
        return () => p.stop();
    }, []);

    // ── Toast ─────────────────────────────────────────────────────────────────
    const showToast = useCallback((cfg) => setToast({ ...cfg, visible: true }), []);
    const hideToast = useCallback(() => setToast(p => ({ ...p, visible: false })), []);

    // ── Draw from deck ────────────────────────────────────────────────────────
    const drawCards = useCallback((count) => {
        const drawn = [];
        for (let i = 0; i < count; i++) {
            if (deckRef.current.length === 0) {
                deckRef.current = shuffle(buildDeck()); // refill if exhausted
            }
            drawn.push(deckRef.current.pop());
        }
        setDeckCount(deckRef.current.length);
        return drawn;
    }, []);

    // ── Init / New Round ──────────────────────────────────────────────────────
    const initGame = useCallback(() => {
        const deck = shuffle(buildDeck());
        const pHand = deck.splice(0, 5);
        const aHand = deck.splice(0, 5);

        // First non-special card as top card
        const idx = deck.findIndex(c =>
            !isWhotCard(c) && !isPickTwo(c) && !isPickThree(c) &&
            !isGenMarket(c) && !isHoldOn(c) && !isSuspension(c)
        );
        const [top] = deck.splice(idx >= 0 ? idx : 0, 1);

        deckRef.current  = deck;
        aiHandRef.current = aHand;
        setDeckCount(deck.length);

        setPlayerHand(pHand);
        setAiHandCount(aHand.length);
        setTopCard(top);
        setCalledShape(null);
        setAttackStack(0);
        setIsGeneralMarket(false);
        setSkipNext(false);
        setWinner(null);
        setCurrentTurn('player');
        setIsThinking(false);
        setShowWhotPicker(false);
        setPendingCard(null);
    }, []);

    useEffect(() => { initGame(); }, []);

    // ── Player plays a card ───────────────────────────────────────────────────
    const commitPlayerCard = useCallback((card, chosenShape) => {
        const newHand = playerHand.filter(c => c.id !== card.id);

        // Win!
        if (newHand.length === 0) {
            setPlayerHand([]);
            setTopCard(card);
            setCalledShape(chosenShape);
            setWinner('player');
            setScores(prev => ({ ...prev, player: prev.player + 1 }));
            showToast({ message: '🏆 YOU WIN!', icon: '🎉', color: COLORS.limeGlow });
            return;
        }

        const finalHand   = newHand;
        let nextAttack  = 0;
        let nextSkip    = false;

        if (isPickTwo(card)) {
            nextAttack = attackStack + 2;
            showToast({ message: `AI picks ${nextAttack}!`, icon: '⚡', color: COLORS.hotPink });
        } else if (isPickThree(card)) {
            nextAttack = attackStack + 3;
            showToast({ message: `AI picks ${nextAttack}!`, icon: '🔥', color: COLORS.hotPink });
        } else if (isGenMarket(card)) {
            showToast({ message: 'General Market! AI goes to market 🛒', icon: '🛒', color: COLORS.neonCyan });
        } else if (isHoldOn(card) || isSuspension(card)) {
            nextSkip = true;
            showToast({ message: 'AI skips their turn!', icon: '✋', color: COLORS.limeGlow });
        } else if (isWhotCard(card)) {
            showToast({ message: `You called: ${(chosenShape || '').toUpperCase()}!`, icon: '🎯', color: COLORS.electricPurple });
        }

        if (finalHand.length === 1) {
            setTimeout(() => showToast({ message: `${playerName}: LAST CARD! 🃏`, icon: '🃏', color: COLORS.limeGlow }), 150);
        }

        setPlayerHand(finalHand);
        setTopCard(card);
        setCalledShape(chosenShape);
        setAttackStack(nextAttack);
        setSkipNext(nextSkip);
        setCurrentTurn('ai');
    }, [playerHand, attackStack, COLORS, showToast, playerName]);

    // ── Player card tap ───────────────────────────────────────────────────────
    const handleCardPress = useCallback((card) => {
        if (currentTurn !== 'player' || winner || skipNext || isGeneralMarket) return;
        if (!canPlay(card, topCard, calledShape, attackStack, isGeneralMarket)) {
            showToast({ message: isGeneralMarket ? "General Market! You must go to the market" : "Can't play that card!", icon: '❌', color: COLORS.hotPink });
            return;
        }
        if (isWhotCard(card)) {
            setPendingCard(card);
            setShowWhotPicker(true);
            return;
        }
        commitPlayerCard(card, null);
    }, [currentTurn, winner, skipNext, isGeneralMarket, topCard, calledShape, attackStack, commitPlayerCard, COLORS, showToast]);

    const handleShapeSelect = useCallback((shape) => {
        setShowWhotPicker(false);
        if (pendingCard) commitPlayerCard(pendingCard, shape);
        setPendingCard(null);
    }, [pendingCard, commitPlayerCard]);

    // ── Player draws ──────────────────────────────────────────────────────────
    const handleDraw = useCallback(() => {
        if (currentTurn !== 'player' || winner || skipNext) return;
        if (isGeneralMarket) {
            const drawn = drawCards(1);
            setPlayerHand(prev => [...prev, ...drawn]);
            showToast({ message: 'Went to market 🏃', icon: '🏃', color: COLORS.textMuted });
            setIsGeneralMarket(false);
            setCurrentTurn('ai');
            return;
        }
        if (attackStack > 0) {
            const drawn = drawCards(attackStack);
            setPlayerHand(prev => [...prev, ...drawn]);
            showToast({ message: `You picked ${attackStack} cards!`, icon: '📦', color: COLORS.hotPink });
            setAttackStack(0);
        } else {
            const drawn = drawCards(1);
            setPlayerHand(prev => [...prev, ...drawn]);
            showToast({ message: 'Went to market 🏃', icon: '🏃', color: COLORS.textMuted });
        }
        setCurrentTurn('ai');
    }, [currentTurn, winner, skipNext, isGeneralMarket, attackStack, drawCards, COLORS, showToast]);

    // ── AI turn (always-fresh via ref) ────────────────────────────────────────
    const performAITurn = useCallback((tc, cs, as, diff, playerHandSize) => {
        setIsThinking(false);
        const aHand = aiHandRef.current;

        // If top card is General Market and AI hasn't drawn yet: AI compulsory draw
        if (isGenMarket(tc) && tc.number === 14) {
            const drawn = drawCards(1);
            aiHandRef.current = [...aHand, ...drawn];
            setAiHandCount(aiHandRef.current.length);
            showToast({ message: 'AI went to market 🏃', icon: '🏃', color: COLORS.textMuted });
            setCurrentTurn('player');
            return;
        }

        const playable = getPlayable(aHand, tc, cs, as);

        if (playable.length === 0) {
            // AI draws
            if (as > 0) {
                const drawn = drawCards(as);
                aiHandRef.current = [...aHand, ...drawn];
                setAiHandCount(aiHandRef.current.length);
                showToast({ message: `AI picks ${as} cards! 📦`, icon: '📦', color: COLORS.limeGlow });
                setAttackStack(0);
            } else {
                const drawn = drawCards(1);
                aiHandRef.current = [...aHand, ...drawn];
                setAiHandCount(aiHandRef.current.length);
                showToast({ message: 'AI went to market 🏃', icon: '🏃', color: COLORS.textMuted });
            }
            setCurrentTurn('player');
            return;
        }

        const card = aiPickCard(playable, aHand, diff, playerHandSize);
        aiHandRef.current = aHand.filter(c => c.id !== card.id);
        setAiHandCount(aiHandRef.current.length);

        // AI wins
        if (aiHandRef.current.length === 0) {
            setTopCard(card);
            setCalledShape(null);
            setWinner('ai');
            setScores(prev => ({ ...prev, ai: prev.ai + 1 }));
            showToast({ message: 'AI WINS! 🤖', icon: '💀', color: COLORS.hotPink });
            return;
        }

        let chosenShape = null;
        if (isWhotCard(card)) {
            chosenShape = aiPickShape(aiHandRef.current);
            showToast({ message: `AI called: ${chosenShape.toUpperCase()}! 🎯`, icon: '🤖', color: COLORS.electricPurple });
        }

        let nextAttack = 0;
        let nextSkip   = false;

        if (isPickTwo(card)) {
            nextAttack = as + 2;
            setTimeout(() => showToast({ message: `Pick ${nextAttack}! ⚡`, icon: '⚡', color: COLORS.hotPink }), 200);
        } else if (isPickThree(card)) {
            nextAttack = as + 3;
            setTimeout(() => showToast({ message: `Pick ${nextAttack}! 🔥`, icon: '🔥', color: COLORS.hotPink }), 200);
        } else if (isGenMarket(card)) {
            setIsGeneralMarket(true);
            setTimeout(() => showToast({ message: 'General Market! Go to market 🛒', icon: '🛒', color: COLORS.neonCyan }), 200);
        } else if (isHoldOn(card) || isSuspension(card)) {
            nextSkip = true;
            showToast({ message: 'Your turn is skipped! ✋', icon: '✋', color: COLORS.hotPink });
        }

        if (aiHandRef.current.length === 1) {
            setTimeout(() => showToast({ message: 'AI has LAST CARD! 🃏', icon: '🃏', color: COLORS.limeGlow }), 400);
        }

        setTopCard(card);
        setCalledShape(isWhotCard(card) ? chosenShape : null);
        setAttackStack(nextAttack);
        setSkipNext(nextSkip);
        setCurrentTurn('player');
    }, [drawCards, COLORS, showToast]);

    // Keep latest params in a ref so the setTimeout always reads fresh values
    const latestRef = useRef({});
    useEffect(() => {
        latestRef.current = { topCard, calledShape, attackStack, difficulty, playerHandSize: playerHand.length };
    });

    // ── Turn effect ───────────────────────────────────────────────────────────
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (winner) return;

        if (currentTurn === 'player' && skipNext) {
            // Player's turn is skipped by AI — auto-forward after delay
            const t = setTimeout(() => {
                setSkipNext(false);
                setCurrentTurn('ai');
            }, 1600);
            return () => clearTimeout(t);
        }

        if (currentTurn === 'ai') {
            if (skipNext) {
                // AI's turn is skipped by player
                const t = setTimeout(() => {
                    setSkipNext(false);
                    showToast({ message: 'AI turn skipped! ✋', icon: '✋', color: COLORS.limeGlow });
                    setCurrentTurn('player');
                }, 1000);
                return () => clearTimeout(t);
            }

            setIsThinking(true);
            const [min, max] = AI_DELAY[difficulty] || AI_DELAY.medium;
            const delay = min + Math.random() * (max - min);

            const t = setTimeout(() => {
                const { topCard: tc, calledShape: cs, attackStack: as, difficulty: diff, playerHandSize } = latestRef.current;
                performAITurn(tc, cs, as, diff, playerHandSize);
            }, delay);
            return () => clearTimeout(t);
        }
        // Intentionally omitting stable refs: showToast, COLORS, performAITurn
    }, [currentTurn, skipNext, winner, difficulty]);

    // ─ Playable highlighting ──────────────────────────────────────────────────
    const playableIds = useMemo(() => {
        if (currentTurn !== 'player' || !topCard || isGeneralMarket) return new Set();
        return new Set(getPlayable(playerHand, topCard, calledShape, attackStack, isGeneralMarket).map(c => c.id));
    }, [currentTurn, playerHand, topCard, calledShape, attackStack, isGeneralMarket]);

    // ── UI ────────────────────────────────────────────────────────────────────
    const isPlayerTurn = currentTurn === 'player' && !winner && !skipNext;

    return (
        <NeonContainer showBackButton scrollable onBackPress={() => navigation.goBack()}>
            {/* Toast */}
            <WhotToast
                message={toast.message}
                icon={toast.icon}
                color={toast.color}
                visible={toast.visible}
                onDone={hideToast}
            />

            {/* ── Scores ── */}
            <View style={styles.scoreRow}>
                <View style={styles.scoreItem}>
                    <NeonText size={11} color={COLORS.textMuted}>YOU</NeonText>
                    <NeonText size={28} weight="bold" color={COLORS.neonCyan} glow>{scores.player}</NeonText>
                </View>
                <View style={styles.diffBadge}>
                    <Ionicons name="hardware-chip-outline" size={12} color={COLORS.electricPurple} />
                    <NeonText size={11} color={COLORS.electricPurple} weight="bold"> {difficulty.toUpperCase()}</NeonText>
                </View>
                <View style={styles.scoreItem}>
                    <NeonText size={11} color={COLORS.textMuted}>AI</NeonText>
                    <NeonText size={28} weight="bold" color={COLORS.hotPink} glow>{scores.ai}</NeonText>
                </View>
            </View>

            {/* ── AI Section ── */}
            <View style={styles.aiSection}>
                <View style={styles.aiHeader}>
                    <Ionicons name="hardware-chip" size={18} color={COLORS.hotPink} />
                    <NeonText size={14} weight="bold" color={COLORS.hotPink}> AI OPPONENT</NeonText>
                    <View style={{ flex: 1 }} />
                    {isThinking && (
                        <View style={styles.thinkingBadge}>
                            <NeonText size={11} color={COLORS.hotPink}>THINKING...</NeonText>
                        </View>
                    )}
                </View>
                <View style={styles.aiCards}>
                    {Array.from({ length: Math.min(aiHandCount, 8) }).map((_, i) => (
                        <View key={i} style={[styles.faceDownCard, { marginLeft: i > 0 ? -18 : 0, zIndex: i }]}>
                            <NeonText size={18}>🃏</NeonText>
                        </View>
                    ))}
                    {aiHandCount > 8 && (
                        <NeonText size={13} color={COLORS.textMuted} style={{ marginLeft: 6 }}>
                            +{aiHandCount - 8}
                        </NeonText>
                    )}
                    <View style={styles.aiCardCount}>
                        <NeonText size={14} weight="bold" color={COLORS.hotPink}>{aiHandCount} cards</NeonText>
                    </View>
                </View>
            </View>

            {/* ── Top Card ── */}
            <View style={styles.topCardSection}>
                <View style={styles.topCardRow}>
                    <View style={styles.topCardWrap}>
                        <NeonText size={11} color={COLORS.textMuted} style={{ marginBottom: 6 }}>TOP CARD</NeonText>
                        {topCard && <WhotCard card={topCard} disabled isTopCard />}
                    </View>
                    <View style={styles.deckWrap}>
                        <View style={styles.deckPile}>
                            <NeonText size={22}>🂠</NeonText>
                        </View>
                        <NeonText size={11} color={COLORS.textMuted}>{deckCount} left</NeonText>
                    </View>
                </View>
                {calledShape && (
                    <View style={styles.calledBadge}>
                        <NeonText size={13} color={COLORS.limeGlow} weight="bold">
                            CALLED: {calledShape.toUpperCase()}
                        </NeonText>
                    </View>
                )}
                {attackStack > 0 && (
                    <View style={styles.attackBadge}>
                        <NeonText size={13} color={COLORS.hotPink} weight="bold">
                            ⚡ PICK {attackStack} PENDING
                        </NeonText>
                    </View>
                )}
            </View>

            {/* ── Player Hand ── */}
            <View style={styles.playerSection}>
                <View style={styles.handHeader}>
                    {isPlayerTurn ? (
                        <Animated.View style={[styles.turnBadge, { transform: [{ scale: pulseAnim }] }]}>
                            <NeonText size={12} color="#000" weight="bold">YOUR TURN ▶</NeonText>
                        </Animated.View>
                    ) : (
                        <NeonText size={13} color={COLORS.textMuted}>YOUR HAND</NeonText>
                    )}
                    <NeonText size={13} weight="bold">
                        {playerHand.length} {playerHand.length === 1 ? 'card' : 'cards'}
                        {playerHand.length === 1 ? ' 🃏' : ''}
                    </NeonText>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.cardsScroll}
                >
                    {playerHand.map((card, i) => {
                        const playable = playableIds.has(card.id);
                        return (
                            <View
                                key={card.id}
                                style={[
                                    styles.cardWrap,
                                    playable && styles.playableWrap,
                                    { zIndex: i + 1 },
                                ]}
                            >
                                <WhotCard
                                    card={card}
                                    onPress={() => handleCardPress(card)}
                                    disabled={!isPlayerTurn || !playable}
                                />
                                {playable && isPlayerTurn && (
                                    <View style={styles.playableDot} />
                                )}
                            </View>
                        );
                    })}
                </ScrollView>

                <NeonButton
                    title={
                        isGeneralMarket
                            ? `GO TO MARKET (1 CARD)`
                            : attackStack > 0
                                ? `PICK ${attackStack} CARDS`
                                : `DRAW CARD (${deckCount} left)`
                    }
                    onPress={handleDraw}
                    disabled={!isPlayerTurn}
                    variant={attackStack > 0 || isGeneralMarket ? 'primary' : 'secondary'}
                    color={attackStack > 0 ? COLORS.hotPink : (isGeneralMarket ? COLORS.neonCyan : undefined)}
                    style={styles.drawBtn}
                />
            </View>

            {/* ── WHOT Shape Picker Modal ── */}
            <Modal visible={showWhotPicker} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.shapeModal}>
                        <NeonText size={20} weight="bold" glow style={{ marginBottom: 4 }}>
                            CALL A SHAPE
                        </NeonText>
                        <NeonText size={12} color={COLORS.textMuted} style={{ marginBottom: 20 }}>
                            Choose which shape the AI must match
                        </NeonText>
                        <View style={styles.shapesGrid}>
                            {SHAPES.map(shape => (
                                <TouchableOpacity
                                    key={shape}
                                    style={[styles.shapeBtn, { borderColor: SHAPE_COLORS[shape] }]}
                                    onPress={() => handleShapeSelect(shape)}
                                >
                                    <View style={styles.shapePreview}>
                                        {shape === 'circle' && <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: SHAPE_COLORS[shape] }} />}
                                        {shape === 'square' && <View style={{ width: 24, height: 24, backgroundColor: SHAPE_COLORS[shape] }} />}
                                        {shape === 'triangle' && <View style={{ width: 0, height: 0, borderLeftWidth: 12, borderRightWidth: 12, borderBottomWidth: 24, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: SHAPE_COLORS[shape] }} />}
                                        {shape === 'cross' && (
                                            <View style={{ width: 24, height: 24, position: 'relative' }}>
                                                <View style={{ position: 'absolute', width: 8, height: 24, left: 8, backgroundColor: SHAPE_COLORS[shape] }} />
                                                <View style={{ position: 'absolute', width: 24, height: 8, top: 8, backgroundColor: SHAPE_COLORS[shape] }} />
                                            </View>
                                        )}
                                        {shape === 'star' && <NeonText size={22} color={SHAPE_COLORS[shape]}>★</NeonText>}
                                    </View>
                                    <NeonText size={13} weight="bold" color={SHAPE_COLORS[shape]} style={{ marginTop: 6 }}>
                                        {shape.toUpperCase()}
                                    </NeonText>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity onPress={() => { setShowWhotPicker(false); setPendingCard(null); }}>
                            <NeonText size={13} color={COLORS.textMuted} style={{ marginTop: 16 }}>Cancel</NeonText>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ── Winner Overlay ── */}
            <Modal visible={!!winner} transparent animationType="fade">
                <View style={styles.winOverlay}>
                    <View style={styles.winCard}>
                        <NeonText size={64} style={{ marginBottom: 12 }}>
                            {winner === 'player' ? '🏆' : '🤖'}
                        </NeonText>
                        <NeonText size={36} weight="bold" glow
                            color={winner === 'player' ? COLORS.limeGlow : COLORS.hotPink}>
                            {winner === 'player' ? 'YOU WIN!' : 'AI WINS!'}
                        </NeonText>
                        <NeonText size={14} color={COLORS.textMuted} style={{ marginTop: 8, marginBottom: 28 }}>
                            {winner === 'player' ? 'Well played! 🎉' : 'The AI outsmarted you this time'}
                        </NeonText>
                        <View style={styles.winScores}>
                            <NeonText size={24} weight="bold" color={COLORS.neonCyan}>{scores.player}</NeonText>
                            <NeonText size={16} color={COLORS.textMuted}> – </NeonText>
                            <NeonText size={24} weight="bold" color={COLORS.hotPink}>{scores.ai}</NeonText>
                        </View>
                        <NeonButton
                            title="PLAY AGAIN"
                            onPress={initGame}
                            style={styles.winBtn}
                        />
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12 }}>
                            <NeonText size={14} color={COLORS.textMuted}>← Back to menu</NeonText>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <View style={{ height: 40 }} />
        </NeonContainer>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const getStyles = (COLORS) => StyleSheet.create({
    scoreRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 10,
        marginBottom: 12,
    },
    scoreItem: { alignItems: 'center', minWidth: 60 },
    diffBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.electricPurple + '22',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: COLORS.electricPurple + '44',
    },
    aiSection: {
        marginHorizontal: 16,
        backgroundColor: 'rgba(255,0,100,0.06)',
        borderRadius: 14,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.hotPink + '33',
    },
    aiHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    thinkingBadge: {
        backgroundColor: COLORS.hotPink + '22',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    aiCards: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    faceDownCard: {
        width: 34,
        height: 48,
        backgroundColor: 'rgba(139,0,0,0.5)',
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.hotPink + '44',
    },
    aiCardCount: {
        marginLeft: 10,
    },
    topCardSection: {
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 16,
    },
    topCardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
    },
    topCardWrap: { alignItems: 'center' },
    deckWrap: { alignItems: 'center' },
    deckPile: {
        width: 58,
        height: 80,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    calledBadge: {
        marginTop: 10,
        backgroundColor: COLORS.limeGlow + '22',
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.limeGlow + '55',
    },
    attackBadge: {
        marginTop: 8,
        backgroundColor: COLORS.hotPink + '22',
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.hotPink + '55',
    },
    playerSection: {
        marginHorizontal: 16,
        backgroundColor: 'rgba(0,255,255,0.06)',
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: COLORS.neonCyan + '33',
    },
    handHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    turnBadge: {
        backgroundColor: COLORS.limeGlow,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 10,
    },
    cardsScroll: {
        paddingBottom: 8,
        paddingRight: 8,
        gap: 6,
        alignItems: 'flex-end',
    },
    cardWrap: {
        position: 'relative',
    },
    playableWrap: {
        transform: [{ translateY: -8 }],
    },
    playableDot: {
        position: 'absolute',
        bottom: -6,
        left: '50%',
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.limeGlow,
    },
    drawBtn: {
        marginTop: 10,
        width: '100%',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    shapeModal: {
        backgroundColor: 'rgba(10,10,30,0.98)',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 380,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    shapesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
    },
    shapeBtn: {
        width: 90,
        height: 90,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 14,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    shapePreview: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    winOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    winCard: {
        backgroundColor: 'rgba(10,10,30,0.98)',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        width: '100%',
        maxWidth: 340,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    winScores: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    winBtn: { width: '100%' },
});

export default WhotVsAIScreen;
