import React, { useRef, useMemo, memo } from 'react';
import {
    View, StyleSheet, TouchableOpacity, Animated,
    Platform, useWindowDimensions
} from 'react-native';
import NeonText from '../NeonText';
import GameIcon from '../GameIcon';
import { useTheme } from '../../context/ThemeContext';
import HapticService from '../../services/HapticService';
import SoundService from '../../services/SoundService';
import GlassView from '../GlassView';

const ToolCard = ({ gameId, title, badge, subtitle, accentColor, onPress, isWide }) => {
    const { COLORS, theme } = useTheme();
    const styles = useMemo(() => getStyles(COLORS), [COLORS]);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.96,
            useNativeDriver: Platform.OS !== 'web',
            friction: 8,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: Platform.OS !== 'web',
            friction: 5,
            tension: 100,
        }).start();
    };

    const handlePress = () => {
        SoundService.playButtonClick();
        HapticService.buttonTap();
        if (onPress) onPress();
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
            style={[styles.cardTouchable, isWide && { flex: 1 }]}
        >
            <Animated.View style={{ transform: [{ scale: scaleAnim }], height: '100%' }}>
                <GlassView
                    style={[
                        styles.toolCard,
                        { borderColor: accentColor ? `${accentColor}40` : COLORS.surfaceLight },
                        theme?.isGlass && { backgroundColor: 'transparent' },
                    ]}
                >
                    {/* Game Icon */}
                    <View style={styles.iconContainer}>
                        <GameIcon gameId={gameId} size={isWide ? 56 : 50} style={styles.gameIcon} />
                        {badge && (
                            <View style={[styles.badge, { backgroundColor: "#0B1120", borderColor: `${accentColor}88` }]}>
                                <NeonText size={8} weight="bold" color={accentColor} numberOfLines={1} style={styles.badgeText}>
                                    {badge}
                                </NeonText>
                            </View>
                        )}
                    </View>

                    {/* Text Details */}
                    <View style={styles.textWrap}>
                        <NeonText size={15} weight="bold" color={COLORS.white} style={styles.cardTitle}>
                            {title}
                        </NeonText>
                        <NeonText size={11} color="#9CA3AF" style={styles.cardSubtitle}>
                            {subtitle}
                        </NeonText>
                    </View>

                    {/* Arrow chevron for mobile */}
                    {!isWide && (
                        <NeonText size={18} color="#6B7280" style={styles.chevron}>
                            ›
                        </NeonText>
                    )}
                </GlassView>
            </Animated.View>
        </TouchableOpacity>
    );
};

const PartyToolsSection = ({ onCoinFlipPress, onSpinWheelPress, onLivePollPress }) => {
    const { COLORS } = useTheme();
    const styles = useMemo(() => getStyles(COLORS), [COLORS]);
    const { width } = useWindowDimensions();

    const isWide = width >= 640;

    return (
        <View style={styles.container}>
            <View style={styles.sectionHeader}>
                <View style={styles.titleRow}>
                    <NeonText size={16}>⚡</NeonText>
                    <NeonText
                        size={12}
                        weight="bold"
                        color="#9CA3AF"
                        style={styles.sectionTitle}
                    >
                        PARTY UTILITIES
                    </NeonText>
                </View>
                <NeonText size={10} color="#6B7280" style={styles.sectionBadge}>
                    MICRO-GAMES
                </NeonText>
            </View>

            <View style={[styles.grid, isWide ? styles.gridWide : styles.gridNarrow]}>
                {/* 1. Quick Coin Flip */}
                <ToolCard
                    gameId="coin-flip"
                    title="COIN FLIP"
                    badge="INSTANT"
                    subtitle="3D Flip · Bets & 50/50"
                    accentColor={COLORS.neonYellow || '#FFD700'}
                    onPress={onCoinFlipPress}
                    isWide={isWide}
                />

                {/* 2. Spin & Win (Wheel of Names) */}
                <ToolCard
                    gameId="spin-wheel"
                    title="SPIN & WIN"
                    badge="LINK / QR"
                    subtitle="Giveaway Wheel of Names"
                    accentColor={COLORS.neonPink || '#FF0055'}
                    onPress={onSpinWheelPress}
                    isWide={isWide}
                />

                {/* 3. Live Poll */}
                <ToolCard
                    gameId="live-poll"
                    title="LIVE POLL"
                    badge="REAL-TIME"
                    subtitle="Live Bar Chart Voting"
                    accentColor={COLORS.neonCyan || '#00F0FF'}
                    onPress={onLivePollPress}
                    isWide={isWide}
                />
            </View>
        </View>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        marginTop: 26,
        maxWidth: 720,
        width: '100%',
        alignSelf: 'center',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    sectionTitle: {
        letterSpacing: 2,
    },
    sectionBadge: {
        letterSpacing: 1,
    },
    grid: {
        width: '100%',
    },
    gridWide: {
        flexDirection: 'row',
        gap: 12,
    },
    gridNarrow: {
        flexDirection: 'column',
        gap: 10,
    },
    cardTouchable: {
        width: '100%',
    },
    toolCard: {
        backgroundColor: 'rgba(17, 24, 39, 0.88)',
        borderRadius: 18,
        borderWidth: 1.5,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    iconContainer: {
        position: "relative",
        marginRight: 14,
        alignItems: "center",
    },
    gameIcon: {
        borderRadius: 14,
    },
    badge: {
        position: "absolute",
        bottom: -7,
        alignSelf: "center",
        paddingHorizontal: 6,
        paddingVertical: 1.5,
        borderRadius: 6,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 3,
        elevation: 3,
    },
    badgeText: {
        letterSpacing: 0.6,
        textAlign: "center",
        ...(Platform.OS === "web" ? { whiteSpace: "nowrap" } : {}),
    },
    textWrap: {
        flex: 1,
        justifyContent: 'center',
    },
    cardTitle: {
        letterSpacing: 1,
        marginBottom: 3,
    },
    cardSubtitle: {
        letterSpacing: 0.3,
    },
    chevron: {
        marginLeft: 10,
        opacity: 0.7,
    },
});

export default memo(PartyToolsSection);
