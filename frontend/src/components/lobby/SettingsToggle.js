import React from 'react';
import { View, StyleSheet, Switch } from 'react-native';
import NeonText from '../NeonText';
import { COLORS } from '../../constants/theme';

const SettingsToggle = ({ value, onValueChange, label, subtitle }) => {
    return (
        <View style={styles.container}>
            <View style={styles.textBlock}>
                <NeonText size={15} weight="bold" color={COLORS.white}>
                    {label}
                </NeonText>
                {subtitle && (
                    <NeonText size={11} color="#6B7280" style={styles.subtitle}>
                        {subtitle}
                    </NeonText>
                )}
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: '#3e3e3e', true: COLORS.neonCyan }}
                thumbColor={value ? '#FFFFFF' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(17, 24, 39, 0.8)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        marginHorizontal: 20,
        paddingVertical: 18,
        paddingHorizontal: 18,
        marginBottom: 16,
    },
    textBlock: {
        flex: 1,
        marginRight: 16,
    },
    subtitle: {
        marginTop: 3,
    },
});

export default React.memo(SettingsToggle);
