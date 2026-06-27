import React from 'react';
import { View, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import NeonText from './NeonText';
import { useTheme } from '../context/ThemeContext';

const LoadingOverlay = ({ visible = false, message = 'Loading...' }) => {
    const { COLORS } = useTheme();
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <ActivityIndicator size="large" color={COLORS.neonCyan} />
                    {message && (
                        <NeonText size={16} style={styles.message}>
                            {message}
                        </NeonText>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: COLORS.overlayDarker,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        backgroundColor: 'rgba(20, 30, 40, 0.95)',
        padding: 30,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
        alignItems: 'center',
        minWidth: 200,
    },
    message: {
        marginTop: 15,
        textAlign: 'center',
    },
});

export default LoadingOverlay;
