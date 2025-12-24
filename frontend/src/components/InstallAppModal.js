import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, Platform } from 'react-native';
import NeonText from './NeonText';
import NeonButton from './NeonButton';
import { COLORS } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const INSTALL_PROMPT_KEY = '@playrave_install_prompt_dismissed';

const InstallAppModal = () => {
    const [visible, setVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        checkInstallPrompt();
    }, []);

    const checkInstallPrompt = async () => {
        // Only show on web
        if (Platform.OS !== 'web') return;

        // Check if already dismissed
        try {
            const dismissed = await AsyncStorage.getItem(INSTALL_PROMPT_KEY);
            if (dismissed === 'true') return;
        } catch (e) {
            console.log('AsyncStorage error:', e);
        }

        // Check if already installed (standalone mode)
        if (typeof window !== 'undefined') {
            const standalone = window.navigator.standalone ||
                window.matchMedia('(display-mode: standalone)').matches;
            setIsStandalone(standalone);
            if (standalone) return; // Already installed

            // Detect iOS
            const userAgent = window.navigator.userAgent.toLowerCase();
            const isiOS = /iphone|ipad|ipod/.test(userAgent);
            setIsIOS(isiOS);

            // Show prompt after 3 seconds
            setTimeout(() => {
                setVisible(true);
            }, 3000);
        }
    };

    const handleDismiss = async () => {
        setVisible(false);
        try {
            await AsyncStorage.setItem(INSTALL_PROMPT_KEY, 'true');
        } catch (e) {
            console.log('AsyncStorage error:', e);
        }
    };

    const handleRemindLater = () => {
        setVisible(false);
        // Don't save to storage - will show again next visit
    };

    if (!visible || isStandalone) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={handleRemindLater}
        >
            <TouchableWithoutFeedback onPress={handleRemindLater}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContent}>
                            <View style={styles.header}>
                                <NeonText size={24} weight="bold" glow color={COLORS.neonCyan}>
                                    📱 INSTALL APP
                                </NeonText>
                            </View>

                            <NeonText size={16} style={styles.description}>
                                Add PlayRave to your home screen for the best experience!
                            </NeonText>

                            {isIOS ? (
                                // iOS Instructions
                                <View style={styles.iosInstructions}>
                                    <NeonText size={14} color={COLORS.limeGlow} style={styles.stepTitle}>
                                        How to install on iPhone:
                                    </NeonText>

                                    <View style={styles.step}>
                                        <NeonText size={28}>1️⃣</NeonText>
                                        <View style={styles.stepContent}>
                                            <NeonText size={14}>
                                                Tap the <NeonText size={14} weight="bold" color={COLORS.neonCyan}>Share</NeonText> button
                                            </NeonText>
                                            <NeonText size={24} style={styles.shareIcon}>📤</NeonText>
                                        </View>
                                    </View>

                                    <View style={styles.step}>
                                        <NeonText size={28}>2️⃣</NeonText>
                                        <View style={styles.stepContent}>
                                            <NeonText size={14}>
                                                Scroll down and tap
                                            </NeonText>
                                            <View style={styles.addToHomeBtn}>
                                                <NeonText size={12} color="#fff">
                                                    ➕ Add to Home Screen
                                                </NeonText>
                                            </View>
                                        </View>
                                    </View>

                                    <View style={styles.step}>
                                        <NeonText size={28}>3️⃣</NeonText>
                                        <NeonText size={14} style={{ flex: 1 }}>
                                            Tap <NeonText size={14} weight="bold" color={COLORS.limeGlow}>Add</NeonText> to confirm
                                        </NeonText>
                                    </View>
                                </View>
                            ) : (
                                // Android/Desktop - would use beforeinstallprompt
                                <View style={styles.androidNotice}>
                                    <NeonText size={14} color="#888">
                                        Look for the install prompt in your browser's address bar or menu.
                                    </NeonText>
                                </View>
                            )}

                            <View style={styles.buttons}>
                                <NeonButton
                                    title="GOT IT!"
                                    onPress={handleDismiss}
                                    style={styles.primaryButton}
                                />
                                <TouchableOpacity onPress={handleRemindLater} style={styles.laterButton}>
                                    <NeonText size={14} color="#888">
                                        Remind me later
                                    </NeonText>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1a1a2e',
        borderRadius: 20,
        padding: 25,
        width: '100%',
        maxWidth: 350,
        borderWidth: 2,
        borderColor: COLORS.electricPurple,
    },
    header: {
        alignItems: 'center',
        marginBottom: 15,
    },
    description: {
        textAlign: 'center',
        marginBottom: 20,
        color: '#ccc',
    },
    iosInstructions: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
    },
    stepTitle: {
        marginBottom: 15,
        textAlign: 'center',
    },
    step: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        gap: 12,
    },
    stepContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    shareIcon: {
        marginLeft: 10,
    },
    addToHomeBtn: {
        backgroundColor: 'rgba(0,122,255,0.3)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    androidNotice: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
    },
    buttons: {
        alignItems: 'center',
        gap: 10,
    },
    primaryButton: {
        width: '100%',
    },
    laterButton: {
        padding: 10,
    },
});

export default InstallAppModal;
