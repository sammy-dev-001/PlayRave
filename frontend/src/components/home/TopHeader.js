import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import NeonText from '../NeonText';
import { COLORS } from '../../constants/theme';

const TopHeader = ({ onSettingsPress, onProfilePress, isAuthenticated }) => {
    return (
        <View style={styles.container}>
            {/* Left: Logo */}
            <View style={styles.logoRow}>
                <View style={styles.logoBolt}>
                    <NeonText size={22} weight="bold" color={COLORS.white}>⚡</NeonText>
                </View>
                <NeonText size={20} weight="bold" color={COLORS.white} style={styles.logoText}>
                    PLAYRAVE
                </NeonText>
            </View>

            {/* Right: Icons */}
            <View style={styles.iconsRow}>
                <TouchableOpacity style={styles.iconBtn}>
                    <NeonText size={18} color="#8B8FA3">♬</NeonText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn}>
                    <NeonText size={18} color="#8B8FA3">🔊</NeonText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn}>
                    <NeonText size={18} color="#8B8FA3">🔔</NeonText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={onSettingsPress}>
                    <NeonText size={18} color="#8B8FA3">⚙️</NeonText>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 8,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    logoBolt: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: COLORS.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoText: {
        letterSpacing: 2,
    },
    iconsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    iconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default React.memo(TopHeader);
