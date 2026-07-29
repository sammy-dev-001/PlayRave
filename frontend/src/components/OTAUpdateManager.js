import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { useUpdates } from 'expo-updates';
import * as Updates from 'expo-updates';
import NeonText from './NeonText';
import NeonButton from './NeonButton';
import GlassView from './GlassView';

export const OTAUpdateManager = ({ children }) => {
    // We check if useUpdates is available (fallback for web or Expo Go)
    let updates;
    try {
        updates = useUpdates();
    } catch (e) {
        // Fallback if not running in an EAS environment
        updates = { isUpdatePending: false };
    }

    const { isUpdatePending } = updates;
    const [showPrompt, setShowPrompt] = useState(false);
    const [isReloading, setIsReloading] = useState(false);

    useEffect(() => {
        if (isUpdatePending) {
            setShowPrompt(true);
        }
    }, [isUpdatePending]);

    const handleRestart = async () => {
        try {
            setIsReloading(true);
            await Updates.reloadAsync();
        } catch (e) {
            console.error("Failed to reload app", e);
            setIsReloading(false);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            {children}
            
            <Modal
                transparent
                visible={showPrompt}
                animationType="fade"
            >
                <View style={styles.overlay}>
                    <GlassView style={styles.modalContainer}>
                        <NeonText size={22} color="#00ffff" weight="bold" style={styles.title}>
                            SYSTEM UPDATE
                        </NeonText>
                        
                        <NeonText size={16} color="#ffffff" style={styles.message}>
                            A new party module has been downloaded in the background and is ready to install!
                        </NeonText>

                        <View style={styles.buttonContainer}>
                            <NeonButton
                                title={isReloading ? "RELAUNCHING..." : "RELAUNCH NOW"}
                                onPress={handleRestart}
                                variant="primary"
                            />
                            <View style={{ height: 12 }} />
                            <NeonButton
                                title="LATER"
                                onPress={() => setShowPrompt(false)}
                                variant="secondary"
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
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContainer: {
        padding: 24,
        borderRadius: 20,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        backgroundColor: 'rgba(20, 20, 40, 0.85)',
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 255, 0.3)',
    },
    title: {
        marginBottom: 16,
        textAlign: 'center',
        textShadowColor: '#00ffff',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    message: {
        marginBottom: 32,
        textAlign: 'center',
        opacity: 0.9,
    },
    buttonContainer: {
        width: '100%',
    }
});
