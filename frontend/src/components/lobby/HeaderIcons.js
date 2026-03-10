import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonText from '../NeonText';
import VoiceToggle from '../VoiceToggle';
import { COLORS } from '../../constants/theme';

const HeaderIcons = ({ onBackPress, roomId }) => {
    return (
        <View style={styles.container}>
            <View style={styles.leftRow}>
                {/* Back arrow */}
                <TouchableOpacity style={styles.backBtn} onPress={onBackPress}>
                    <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Room Code */}
                <View style={styles.codeBadge}>
                    <NeonText size={12} color="#6B7280" weight="bold" style={styles.codeLabel}>CODE:</NeonText>
                    <NeonText size={20} weight="bold" color={COLORS.neonCyan} style={styles.codeText}>{roomId}</NeonText>
                </View>
            </View>

            {/* Right icons */}
            <View style={styles.iconsRow}>
                <TouchableOpacity style={styles.iconBtn}>
                    <Ionicons name="volume-high" size={20} color="#8B8FA3" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn}>
                    <Ionicons name="musical-notes" size={20} color="#8B8FA3" />
                </TouchableOpacity>
                <VoiceToggle roomId={roomId} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        backgroundColor: 'rgba(5, 5, 10, 0.9)', // Slight background for readability
    },
    leftRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    codeBadge: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 6,
    },
    codeLabel: {
        opacity: 0.7,
    },
    codeText: {
        textShadowColor: COLORS.neonCyan,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    iconsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default React.memo(HeaderIcons);
