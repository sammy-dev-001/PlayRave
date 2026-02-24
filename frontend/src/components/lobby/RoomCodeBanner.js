import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import NeonText from '../NeonText';
import { COLORS } from '../../constants/theme';

const RoomCodeBanner = ({ roomCode, onSharePress, onQRPress }) => {
    return (
        <View style={styles.container}>


            {/* Share / QR pills */}
            <View style={styles.pillRow}>
                <TouchableOpacity style={styles.pill} onPress={onSharePress}>
                    <NeonText size={14} color="#8B8FA3">📤</NeonText>
                    <NeonText size={13} color={COLORS.white} style={styles.pillText}>
                        Share Link
                    </NeonText>
                </TouchableOpacity>

                <TouchableOpacity style={styles.pill} onPress={onQRPress}>
                    <NeonText size={14} color="#8B8FA3">⊞</NeonText>
                    <NeonText size={13} color={COLORS.white} style={styles.pillText}>
                        QR Code
                    </NeonText>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    label: {
        letterSpacing: 3,
        marginBottom: 4,
    },
    roomCode: {
        letterSpacing: 8,
        textShadowColor: COLORS.neonCyan,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    pillRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 14,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 8,
    },
    pillText: {
        fontWeight: '500',
    },
});

export default React.memo(RoomCodeBanner);
