import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, Platform } from 'react-native';
import NeonText from './NeonText';
import NeonButton from './NeonButton';
import { COLORS } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HapticService from '../services/HapticService';

const INSTALL_PROMPT_KEY = '@playrave_install_prompt_dismissed';

const InstallAppModal = () => {
    const [visible, setVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    useEffect(() => {
        let isDismissed = false;

        // Load dismissal state immediately
        AsyncStorage.getItem(INSTALL_PROMPT_KEY).then(val => {
            isDismissed = (val === 'true');
            checkInstallPrompt(isDismissed);
        });

        const handleBeforeInstall = (e) => {
            if (isDismissed) {
                // If user dismissed our custom modal, don't prevent default.
                // This lets the browser show its standard install banner (so we don't get the console warning).
                return;
            }
            
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            
            // Now that we have the prompt, show our custom modal
            setTimeout(() => {
                setVisible(true);
                HapticService.notification('success');
            }, 1000);
        };

        // Listen for beforeinstallprompt
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeinstallprompt', handleBeforeInstall);
            return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        }
    }, []);

    const checkInstallPrompt = async (isDismissed) => {
        // Only show on web
        if (Platform.OS !== 'web') return;

        if (isDismissed) return;

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

            // Show prompt after delay ONLY for iOS. 
            // For Android/Desktop, we wait for beforeinstallprompt to fire so deferredPrompt is ready.
            if (isiOS && !standalone) {
                setTimeout(() => {
                    setVisible(true);
                    HapticService.notification('success');
                }, 3000);
            }
        }
    };

    const handleInstallClick = async () => {
        HapticService.selection();

        if (deferredPrompt) {
            // Show the install prompt
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);

            // We've used the prompt, and can't use it again, throw it away
            setDeferredPrompt(null);
            setVisible(false);
        } else {
            // No deferred prompt (likely iOS or not triggered yet), invoke instructions
            // For iOS the instructions are already visible.
            // Ideally we wouldn't show the "INSTALL NOW" button for iOS if we can't trigger it,
            // but the UI design has it.
        }
    };

    const handleDismiss = async () => {
        HapticService.selection();
        setVisible(false);
        try {
            await AsyncStorage.setItem(INSTALL_PROMPT_KEY, 'true');
        } catch (e) {
            console.log('AsyncStorage error:', e);
        }
    };

    const handleRemindLater = () => {
        HapticService.selection();
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
                                    <View style={styles.buttons}>
                                        <NeonButton
                                            title="GOT IT!"
                                            onPress={handleDismiss}
                                            style={styles.primaryButton}
                                        />
                                    </View>
                                </View>
                            ) : (
                                // Android/Desktop
                                <View style={styles.androidContent}>
                                    {deferredPrompt && (
                                        <View style={styles.androidNotice}>
                                            <NeonText size={14} color="#ccc" style={{ textAlign: 'center', marginBottom: 10 }}>
                                                Install PlayRave to play offline and get faster performance!
                                            </NeonText>
                                        </View>
                                    )}

                                    <View style={styles.buttons}>
                                        {deferredPrompt ? (
                                            <NeonButton
                                                title="INSTALL NOW"
                                                onPress={handleInstallClick}
                                                style={styles.primaryButton}
                                                glow
                                            />
                                        ) : (
                                            <NeonText size={14} color="#888" style={{ textAlign: 'center', marginBottom: 10 }}>
                                                Check your browser menu to install the app.
                                            </NeonText>
                                        )}

                                        <TouchableOpacity onPress={handleDismiss} style={styles.laterButton}>
                                            <NeonText size={14} color="#888">
                                                No thanks
                                            </NeonText>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={handleRemindLater} style={styles.laterButton}>
                                            <NeonText size={14} color="#888">
                                                Remind me later
                                            </NeonText>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
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
    androidContent: {
        width: '100%',
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
        width: '100%',
    },
    primaryButton: {
        width: '100%',
    },
    laterButton: {
        padding: 10,
    },
});

export default InstallAppModal;
