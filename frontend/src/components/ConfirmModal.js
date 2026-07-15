import React, { useEffect, useRef } from 'react';
import {
    View,
    Modal,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Animated,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonText from './NeonText';
import NeonButton from './NeonButton';
import { useTheme } from '../context/ThemeContext';

const ConfirmModal = ({ 
    visible, 
    title = 'CONFIRM', 
    message, 
    onCancel, 
    onConfirm, 
    confirmText = 'CONFIRM', 
    cancelText = 'CANCEL',
    confirmVariant = 'primary',
    cancelVariant = 'secondary',
    // New: pass 'danger' to get red destructive styling
    variant = 'default',
    icon = null, // custom icon name (Ionicons)
}) => {
    const { COLORS } = useTheme();
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);

    const isDanger = variant === 'danger' || confirmVariant === 'danger';

    // Entrance animation
    const slideAnim = useRef(new Animated.Value(60)).current;
    const fadeAnim  = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.92)).current;

    // Pulsing icon glow
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (visible) {
            // Reset
            slideAnim.setValue(60);
            fadeAnim.setValue(0);
            scaleAnim.setValue(0.92);

            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 220,
                    useNativeDriver: Platform.OS !== 'web',
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    friction: 7,
                    tension: 60,
                    useNativeDriver: Platform.OS !== 'web',
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 7,
                    tension: 60,
                    useNativeDriver: Platform.OS !== 'web',
                }),
            ]).start();

            // Looping pulse on the icon
            const loop = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.18, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
                    Animated.timing(pulseAnim, { toValue: 1,    duration: 700, useNativeDriver: Platform.OS !== 'web' }),
                ])
            );
            loop.start();
            return () => loop.stop();
        }
    }, [visible]);

    const iconName = icon || (isDanger ? 'warning-outline' : 'help-circle-outline');
    const iconColor = isDanger ? '#FF453A' : COLORS.neonCyan;

    const confirmColor = isDanger ? '#FF453A' : COLORS.neonCyan;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="none"
            onRequestClose={onCancel}
            statusBarTranslucent
        >
            <TouchableWithoutFeedback onPress={onCancel}>
                <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                    <TouchableWithoutFeedback>
                        <Animated.View
                            style={[
                                styles.modalContent,
                                isDanger && styles.dangerBorder,
                                {
                                    transform: [
                                        { translateY: slideAnim },
                                        { scale: scaleAnim },
                                    ],
                                },
                            ]}
                        >
                            {/* Icon */}
                            <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
                                <View style={[styles.iconCircle, { borderColor: iconColor, backgroundColor: `${iconColor}18` }]}>
                                    <Ionicons name={iconName} size={36} color={iconColor} />
                                </View>
                            </Animated.View>

                            {/* Title */}
                            <NeonText
                                size={22}
                                weight="bold"
                                glow
                                color={isDanger ? '#FF453A' : COLORS.neonCyan}
                                style={styles.title}
                            >
                                {title}
                            </NeonText>

                            {/* Divider */}
                            <View style={[styles.divider, { backgroundColor: isDanger ? '#FF453A44' : `${COLORS.neonCyan}44` }]} />

                            {/* Message */}
                            <NeonText size={15} color={COLORS.textMuted} style={styles.messageText}>
                                {message}
                            </NeonText>

                            {/* Buttons */}
                            <View style={styles.buttonRow}>
                                <TouchableOpacity
                                    style={[styles.btn, styles.cancelBtn]}
                                    onPress={onCancel}
                                    activeOpacity={0.75}
                                >
                                    <NeonText size={14} weight="bold" color={COLORS.textMuted}>
                                        {cancelText}
                                    </NeonText>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.btn, styles.confirmBtn, { borderColor: confirmColor, backgroundColor: `${confirmColor}22` }]}
                                    onPress={onConfirm}
                                    activeOpacity={0.8}
                                >
                                    <NeonText size={14} weight="bold" color={confirmColor} glow>
                                        {confirmText}
                                    </NeonText>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </Animated.View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#13131F',
        borderRadius: 24,
        paddingHorizontal: 28,
        paddingTop: 32,
        paddingBottom: 28,
        width: '100%',
        maxWidth: 360,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: COLORS.electricPurple || '#B14EFF',
        shadowColor: COLORS.electricPurple || '#B14EFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.45,
        shadowRadius: 20,
        elevation: 20,
    },
    dangerBorder: {
        borderColor: '#FF453A',
        shadowColor: '#FF453A',
    },
    iconContainer: {
        marginBottom: 18,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        textAlign: 'center',
        letterSpacing: 2,
        marginBottom: 14,
    },
    divider: {
        width: '60%',
        height: 1.5,
        borderRadius: 1,
        marginBottom: 16,
    },
    messageText: {
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    btn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
    },
    cancelBtn: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderColor: 'rgba(255,255,255,0.15)',
    },
    confirmBtn: {
        // background and border set inline per variant
    },
});

export default ConfirmModal;
