// VoiceToggle.js - Mute/unmute button for voice chat
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    TouchableOpacity, StyleSheet, View, Modal,
    Platform, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonText from './NeonText';
import { useTheme } from '../context/ThemeContext';
import VoiceService from '../services/VoiceService';

// ─── Permission state helpers ────────────────────────────────────────────────

/**
 * Query the browser Permissions API for microphone access state.
 * Returns 'granted' | 'denied' | 'prompt' | 'unknown'
 */
async function queryMicPermission() {
    if (typeof navigator === 'undefined' || !navigator.permissions) return 'unknown';
    try {
        const result = await navigator.permissions.query({ name: 'microphone' });
        return result.state; // 'granted' | 'denied' | 'prompt'
    } catch (_) {
        return 'unknown';
    }
}

/**
 * Returns browser-specific instructions for re-enabling mic access.
 */
function getPermissionInstructions() {
    if (typeof navigator === 'undefined') return null;
    const ua = navigator.userAgent || '';

    // iOS Safari
    if (/iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/Chrome/.test(ua)) {
        return {
            browser: 'Safari on iPhone/iPad',
            steps: [
                '1. Close this tab',
                '2. Open iPhone Settings → Safari',
                '3. Tap "Microphone" → set to Allow',
                '4. Come back and refresh this page',
            ],
            icon: '🍎',
        };
    }

    // Chrome on Android
    if (/Android/.test(ua) && /Chrome/.test(ua)) {
        return {
            browser: 'Chrome on Android',
            steps: [
                '1. Tap the 🔒 lock icon in the address bar',
                '2. Tap "Permissions" → "Microphone"',
                '3. Change from "Blocked" to "Allow"',
                '4. Refresh the page',
            ],
            icon: '🤖',
        };
    }

    // Firefox mobile
    if (/Firefox/.test(ua)) {
        return {
            browser: 'Firefox',
            steps: [
                '1. Tap the lock icon in the address bar',
                '2. Find "Microphone" and tap Edit Permissions',
                '3. Set it to Allow',
                '4. Refresh the page',
            ],
            icon: '🦊',
        };
    }

    // Desktop Chrome / Edge
    return {
        browser: 'your browser',
        steps: [
            '1. Click the 🔒 lock icon next to the URL',
            '2. Find "Microphone" in the list',
            '3. Change it from "Blocked" to "Allow"',
            '4. Refresh the page',
        ],
        icon: '🖥️',
    };
}

// ─── Component ───────────────────────────────────────────────────────────────

const VoiceToggle = ({ roomId, style }) => {
    const { COLORS } = useTheme();
    const styles = useMemo(() => getStyles(COLORS), [COLORS]);

    const [isMuted, setIsMuted]           = useState(false);
    const [isAvailable, setIsAvailable]   = useState(false);
    const [isJoining, setIsJoining]       = useState(true);
    const [permDenied, setPermDenied]     = useState(false);
    const [showGuide, setShowGuide]       = useState(false);
    const [isRetrying, setIsRetrying]     = useState(false);

    // ── Connect to voice channel ────────────────────────────────────────────
    const connectVoice = useCallback(async () => {
        if (!roomId) return;
        setIsJoining(true);
        setPermDenied(false);
        try {
            const initialized = await VoiceService.init();
            if (!initialized) {
                setIsAvailable(false);
                return;
            }

            // Check permission before trying (saves a failed join attempt)
            const perm = await queryMicPermission();
            if (perm === 'denied') {
                setPermDenied(true);
                setIsAvailable(false);
                return;
            }

            const joined = await VoiceService.joinChannel(`playrave_${roomId}`);
            if (joined) {
                setIsAvailable(true);
                setIsMuted(VoiceService.isMuted);
            } else {
                // joinChannel returned false — could be permission denial
                const permAfter = await queryMicPermission();
                if (permAfter === 'denied') {
                    setPermDenied(true);
                }
                setIsAvailable(false);
            }
        } catch (error) {
            console.error('VoiceToggle: Init error:', error);
            if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
                setPermDenied(true);
            }
            setIsAvailable(false);
        } finally {
            setIsJoining(false);
            setIsRetrying(false);
        }
    }, [roomId]);

    useEffect(() => {
        connectVoice();
        return () => { VoiceService.leaveChannel(); };
    }, [connectVoice]);

    // ── Handle mic button tap ───────────────────────────────────────────────
    const handleToggle = async () => {
        // If permission denied — show the guide so the user knows how to fix it
        if (permDenied) {
            setShowGuide(true);
            return;
        }

        // If not connected yet (e.g. first tap failed non-perms reason) — retry
        if (!isAvailable && !isJoining) {
            setIsRetrying(true);
            await connectVoice();
            return;
        }

        if (!isAvailable) return;

        const newMutedState = VoiceService.toggleMute();
        setIsMuted(newMutedState);
    };

    // ── "I fixed it" — re-attempt join after user visited settings ──────────
    const handleRetryAfterSettings = async () => {
        setShowGuide(false);
        setIsRetrying(true);
        await connectVoice();
    };

    const instructions = getPermissionInstructions();

    // ── Render: still joining / retrying ───────────────────────────────────
    if (isJoining || isRetrying) {
        return (
            <View style={[styles.container, styles.joining, style]}>
                <Ionicons name="mic" size={20} color={COLORS.textMuted} />
                <NeonText size={10} color={COLORS.textMuted}>...</NeonText>
            </View>
        );
    }

    // ── Render: permission denied — show a tappable warning ────────────────
    if (permDenied) {
        return (
            <>
                <TouchableOpacity
                    style={[styles.container, styles.denied, style]}
                    onPress={() => setShowGuide(true)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="mic-off" size={22} color="#ff4444" />
                    <NeonText size={9} color="#ff4444">BLOCKED</NeonText>
                    <NeonText size={8} color="rgba(255,68,68,0.7)">tap to fix</NeonText>
                </TouchableOpacity>

                {/* ── Permission guide modal ─────────────────────────────── */}
                <Modal
                    visible={showGuide}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowGuide(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalCard}>
                            <NeonText size={28} style={styles.modalIcon}>🎤</NeonText>
                            <NeonText size={18} weight="bold" color={COLORS.hotPink} style={styles.modalTitle}>
                                Mic Access Blocked
                            </NeonText>
                            <NeonText size={13} color={COLORS.textMuted} style={styles.modalSubtitle}>
                                {instructions?.browser
                                    ? `Here's how to allow mic access on ${instructions.browser}:`
                                    : 'Allow mic access in your browser settings:'}
                            </NeonText>

                            <View style={styles.stepsList}>
                                {(instructions?.steps || []).map((step, i) => (
                                    <NeonText
                                        key={i}
                                        size={13}
                                        color={COLORS.textMuted}
                                        style={styles.step}
                                    >
                                        {step}
                                    </NeonText>
                                ))}
                            </View>

                            <NeonText size={12} color="rgba(255,255,255,0.35)" style={styles.tipText}>
                                After allowing access, tap the button below
                            </NeonText>

                            {/* Try again */}
                            <TouchableOpacity
                                style={styles.retryBtn}
                                onPress={handleRetryAfterSettings}
                                activeOpacity={0.8}
                            >
                                <NeonText size={14} weight="bold" color={COLORS.deepNightBlack}>
                                    ✅ I Allowed It — Connect Mic
                                </NeonText>
                            </TouchableOpacity>

                            {/* Dismiss */}
                            <TouchableOpacity
                                style={styles.dismissBtn}
                                onPress={() => setShowGuide(false)}
                                activeOpacity={0.7}
                            >
                                <NeonText size={13} color={COLORS.textMuted}>
                                    Maybe later
                                </NeonText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </>
        );
    }

    // ── Render: Agora not configured / no roomId ────────────────────────────
    if (!isAvailable) {
        return null;
    }

    // ── Render: normal mic button ───────────────────────────────────────────
    return (
        <TouchableOpacity
            style={[
                styles.container,
                isMuted ? styles.muted : styles.active,
                style
            ]}
            onPress={handleToggle}
            activeOpacity={0.7}
        >
            <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={22} color={isMuted ? '#ff4444' : COLORS.limeGlow} />
            <NeonText
                size={10}
                color={isMuted ? '#ff4444' : COLORS.limeGlow}
            >
                {isMuted ? 'MUTED' : 'LIVE'}
            </NeonText>
        </TouchableOpacity>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    container: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 2,
        minWidth: 60,
    },
    active: {
        backgroundColor: 'rgba(198, 255, 74, 0.15)',
        borderColor: COLORS.limeGlow,
    },
    muted: {
        backgroundColor: 'rgba(255, 68, 68, 0.15)',
        borderColor: '#ff4444',
    },
    joining: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderColor: COLORS.textMuted,
    },
    denied: {
        backgroundColor: 'rgba(255, 68, 68, 0.08)',
        borderColor: 'rgba(255, 68, 68, 0.4)',
        borderStyle: 'dashed',
    },

    // ── Modal ─────────────────────────────────────────────────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalCard: {
        backgroundColor: '#0E0E1A',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,68,68,0.3)',
        padding: 28,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        shadowColor: '#ff4444',
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 16,
    },
    modalIcon: {
        marginBottom: 8,
    },
    modalTitle: {
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSubtitle: {
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    stepsList: {
        alignSelf: 'stretch',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        gap: 10,
    },
    step: {
        lineHeight: 20,
    },
    tipText: {
        textAlign: 'center',
        marginBottom: 20,
        fontStyle: 'italic',
    },
    retryBtn: {
        backgroundColor: COLORS.limeGlow,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 24,
        width: '100%',
        alignItems: 'center',
        marginBottom: 12,
    },
    dismissBtn: {
        paddingVertical: 8,
    },
});

export default VoiceToggle;
