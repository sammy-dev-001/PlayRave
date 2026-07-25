import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassView from './GlassView';
import NeonText from './NeonText';
import { useTheme } from '../context/ThemeContext';

const GlassHeader = ({ title, onBack }) => {
    const { COLORS } = useTheme();

    return (
        <GlassView style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <Ionicons name="chevron-back" size={28} color={COLORS.text} />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
                <NeonText size={20} glow={false}>{title}</NeonText>
            </View>
            <View style={styles.spacer} />
        </GlassView>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 50, // safe area approx
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        borderRadius: 0,
    },
    backButton: {
        padding: 8,
        zIndex: 10,
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 16,
    },
    spacer: {
        width: 44, // roughly back button width
    }
});

export default GlassHeader;
