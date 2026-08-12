import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Modal, Platform, AppState } from 'react-native';
import * as Updates from 'expo-updates';
import NeonText from './NeonText';
import NeonButton from './NeonButton';
import GlassView from './GlassView';

export const OTAUpdateManager = ({ children }) => {
    const [showPrompt, setShowPrompt] = useState(false);
    const [isReloading, setIsReloading] = useState(false);

    useEffect(() => {
        // Skip on web and in Expo Go / dev builds — Updates APIs are no-ops there
        if (Platform.OS === 'web' || __DEV__) return;

        const checkAndFetch = async () => {
            try {
                const check = await Updates.checkForUpdateAsync();
                if (!check.isAvailable) return;

                // Download the update in the background, then show the prompt
                await Updates.fetchUpdateAsync();
                setShowPrompt(true);
            } catch (e) {
                // Silently ignore — expected in bare dev or first install
            }
        };

        checkAndFetch();

        // Also check when app comes back to foreground
        const sub = AppState.addEventListener('change', (state) => {
            if (state === 'active') checkAndFetch();
        });
        return () => sub.remove();
    }, []);

    const handleRestart = async () => {
        try {
            setIsReloading(true);
            setShowPrompt(false);
            // Small delay so the modal closes cleanly before the JS reload fires
            await new Promise(resolve => setTimeout(resolve, 300));
            await Updates.reloadAsync();
        } catch (e) {
            console.error('Failed to reload app', e);
            setIsReloading(false);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            {children}

            <Modal
                transparent
                visible={showPrompt}
                animationType="slide"
                statusBarTranslucent
            >
                <View style={styles.overlay}>
                    <GlassView style={styles.modalContainer}>
                        <NeonText size={28} style={styles.icon}>🚀</NeonText>

                        <NeonText size={20} color="#00ffff" weight="bold" style={styles.title}>
                            UPDATE READY
                        </NeonText>

                        <NeonText size={14} color="rgba(255,255,255,0.8)" style={styles.message}>
                            A fresh drop of content is downloaded and ready.{'\n'}Tap Relaunch to apply it now — the app will restart automatically.
                        </NeonText>

                        <View style={styles.buttonContainer}>
                            <NeonButton
                                title={isReloading ? 'RESTARTING...' : '⚡  RELAUNCH NOW'}
                                onPress={handleRestart}
                                variant="primary"
                                disabled={isReloading}
                            />
                            <View style={{ height: 12 }} />
                            <NeonButton
                                title="LATER"
                                onPress={() => setShowPrompt(false)}
                                variant="secondary"
                                disabled={isReloading}
                            />
                        </View>
                    </GlassView>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'flex-end',
        padding: 20,
        paddingBottom: 40,
    },
    modalContainer: {
        padding: 28,
        borderRadius: 24,
        width: '100%',
        alignItems: 'center',
        backgroundColor: 'rgba(10, 10, 30, 0.97)',
        borderWidth: 1.5,
        borderColor: 'rgba(0, 255, 255, 0.4)',
        shadowColor: '#00ffff',
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 20,
    },
    icon: {
        marginBottom: 10,
    },
    title: {
        marginBottom: 12,
        textAlign: 'center',
        textShadowColor: '#00ffff',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    message: {
        marginBottom: 28,
        textAlign: 'center',
        lineHeight: 22,
    },
    buttonContainer: {
        width: '100%',
    }
});
