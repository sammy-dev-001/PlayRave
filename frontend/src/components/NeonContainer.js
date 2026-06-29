import React from 'react';
import { View, StyleSheet, SafeAreaView, Platform, StatusBar, ScrollView, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import ThemeBackground from './ThemeBackground';
import MuteButton from './MuteButton';
import BackButton from './BackButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const NeonContainer = ({
    children,
    style,
    rootStyle,
    showMuteButton = true,
    showBackButton = false,
    onBackPress = null,
    scrollable = false,
    hideBackground = false,
}) => {
    const { theme, COLORS } = useTheme();
    const styles = React.useMemo(() => getStyles(COLORS, theme), [COLORS, theme]);

    // Responsive padding
    const getPadding = () => {
        if (SCREEN_WIDTH < 375) return 12;
        if (SCREEN_WIDTH >= 768) return 32;
        return 20;
    };

    const padding = getPadding();

    const content = scrollable ? (
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingHorizontal: padding }, style]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
            {children}
        </ScrollView>
    ) : (
        <View style={[styles.container, { padding }, style]}>
            {children}
        </View>
    );

    return (
        <View style={[styles.rootContainer, rootStyle]}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.deepNightBlack} />
            {!hideBackground && <ThemeBackground />}
            {showBackButton && <BackButton onPress={onBackPress} />}
            {showMuteButton && <MuteButton />}
            <SafeAreaView style={styles.safeArea}>
                {content}
            </SafeAreaView>
        </View>
    );
};

const getStyles = (COLORS, theme) => StyleSheet.create({
    rootContainer: {
        flex: 1,
        ...Platform.select({
            web: { height: '100%', minHeight: '100vh' },
            default: { flex: 1 },
        }),
        // Glass themes: ThemeBackground renders the full-bleed image, so keep this transparent.
        // All other themes: fill with the deep background colour.
        backgroundColor: theme?.isGlass ? 'transparent' : COLORS.deepNightBlack,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    safeArea: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
        ...Platform.select({ web: { height: '100%' }, default: {} }),
    },
    scrollContent: {
        flexGrow: 1,
        paddingTop: 60,    // Account for back button
        paddingBottom: 100, // Extra space for nav bar clearance
    },
    container: {
        flex: 1,
        paddingTop: 60,   // Account for back button
        paddingBottom: Platform.OS === 'ios' ? 100 : 80,
    },
});

export default NeonContainer;
