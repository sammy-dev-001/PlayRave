import React from 'react';
import { View, StyleSheet, SafeAreaView, Platform, StatusBar, ScrollView, Dimensions } from 'react-native';
import { COLORS } from '../constants/theme';
import NeonBackground from './NeonBackground';
import MuteButton from './MuteButton';
import BackButton from './BackButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const NeonContainer = ({
    children,
    style,
    showMuteButton = false,
    showBackButton = false,
    scrollable = false,
}) => {
    // Responsive padding
    const getPadding = () => {
        if (SCREEN_WIDTH < 375) return 12;
        if (SCREEN_WIDTH >= 768) return 32;
        return 20;
    };

    const padding = getPadding();

    return (
        <View style={styles.rootContainer}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.deepNightBlack} />
            <NeonBackground />
            {showBackButton && <BackButton />}
            {showMuteButton && <MuteButton />}
            {scrollable ? (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[styles.scrollContent, { padding }, style]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {children}
                </ScrollView>
            ) : (
                <View style={[styles.container, { padding }, style]}>
                    {children}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    rootContainer: {
        flex: 1,
        height: '100%', // Critical for web
        minHeight: '100vh', // Web fallback
        backgroundColor: COLORS.deepNightBlack,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    scrollView: {
        flex: 1,
        height: '100%',
    },
    scrollContent: {
        flexGrow: 1,
        minHeight: '100%',
    },
    container: {
        flex: 1,
        height: '100%',
    },
});

export default NeonContainer;

