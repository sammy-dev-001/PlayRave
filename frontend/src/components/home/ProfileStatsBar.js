import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import NeonText from '../NeonText';
import { useTheme } from '../../context/ThemeContext';
import GlassView from '../GlassView';

const ProfileStatsBar = ({ onPress }) => {
    const { COLORS, theme } = useTheme();
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    return (
        <TouchableOpacity style={styles.touchableWrapper} onPress={onPress} activeOpacity={0.7}>
            <GlassView style={[styles.container, theme?.isGlass && { backgroundColor: 'transparent', borderWidth: 0 }]}>
                {/* Left icon */}
                <View style={styles.iconCircle}>
                    <NeonText size={20} color={COLORS.neonCyan}>👤</NeonText>
                </View>

                {/* Text */}
                <View style={styles.textBlock}>
                    <NeonText size={14} weight="bold" color={COLORS.white}>
                        MY PROFILE & STATS
                    </NeonText>
                    <NeonText size={10} color="#6B7280" style={styles.subtitle}>
                        TROPHIES, HISTORY & CUSTOMIZATION
                    </NeonText>
                </View>

                {/* Right arrow */}
                <NeonText size={18} color="#6B7280">›</NeonText>
            </GlassView>
        </TouchableOpacity>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    touchableWrapper: {
        marginHorizontal: 20,
        marginTop: 24,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(17, 24, 39, 0.8)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    iconCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(0, 248, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    textBlock: {
        flex: 1,
    },
    subtitle: {
        marginTop: 2,
        letterSpacing: 0.5,
    },
});

export default React.memo(ProfileStatsBar);
