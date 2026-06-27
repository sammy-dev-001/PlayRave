import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import NeonText from './NeonText';
import { useTheme } from '../context/ThemeContext';
import NeonButton from './NeonButton';

const EmptyState = ({
    icon = '📭',
    title = 'Nothing here yet',
    message = 'Start playing to see content here!',
    actionLabel,
    onAction,
    style
}) => {
    const { COLORS } = useTheme();
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    return (
        <View style={[styles.container, style]}>
            <View style={styles.iconContainer}>
                <NeonText size={64}>{icon}</NeonText>
            </View>
            <NeonText size={20} weight="bold" color={COLORS.neonCyan} style={styles.title}>
                {title}
            </NeonText>
            <NeonText size={14} color={COLORS.textMuted} style={styles.message}>
                {message}
            </NeonText>
            {actionLabel && onAction && (
                <NeonButton
                    title={actionLabel}
                    onPress={onAction}
                    style={styles.button}
                    size="small"
                />
            )}
        </View>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    iconContainer: {
        marginBottom: 20,
        opacity: 0.8,
    },
    title: {
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 20,
    },
    button: {
        minWidth: 150,
    }
});

export default EmptyState;
