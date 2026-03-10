import React from 'react';
import { View, StyleSheet, Platform, StatusBar, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Bug 7
import { COLORS } from '../constants/theme';
import NeonBackground from './NeonBackground';
import MuteButton from './MuteButton';
import BackButton from './BackButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const NeonContainer = ({
    children,
    style,
    rootStyle,
    showMuteButton = true,
    showBackButton = false,
    scrollable = false,
    hideBackground = false,
}) => {
    // Bug 7: Use real device insets — covers iPhone home indicator, Android gesture bar,
    // and any notch/dynamic-island at the top. SafeAreaProvider in App.js makes this work.
    const insets = useSafeAreaInsets();

    // Responsive horizontal padding
    const getPadding = () => {
        if (SCREEN_WIDTH < 375) return 12;
        if (SCREEN_WIDTH >= 768) return 32;
        return 20;
    };

    const padding = getPadding();

    // Bottom padding = real safe-area inset + comfortable breathing room
    const bottomPad = insets.bottom + 20;

    // Top padding = real safe-area inset (handles notch/status bar) + back-button clearance
    // On Android we also add the StatusBar height manually since insets.top may be 0 there.
    const topPad = (insets.top || (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0)) + 20;

    const content = scrollable ? (
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
                styles.scrollContent,
                {
                    paddingHorizontal: padding,
                    paddingTop: topPad,
                    // Bug 7 Action 2 (Web): Use paddingBottom instead of 100vh tricks.
                    // flexGrow: 1 on contentContainerStyle means the ScrollView fills
                    // available height but can expand further — no viewport clipping.
                    paddingBottom: bottomPad,
                },
                style,
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
            {children}
        </ScrollView>
    ) : (
        <View style={[styles.container, { padding, paddingTop: topPad, paddingBottom: bottomPad }, style]}>
            {children}
        </View>
    );

    return (
        // Bug 7 Action 2 (Web): rootContainer uses flex:1 only — no minHeight:'100vh'
        // which caused viewport overflow on mobile browsers. flex:1 correctly fills
        // the available space given by the OS without causing scroll/cut-off issues.
        <View style={[styles.rootContainer, rootStyle]}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.deepNightBlack} />
            {!hideBackground && <NeonBackground />}
            {showBackButton && <BackButton />}
            {showMuteButton && <MuteButton />}
            {content}
        </View>
    );
};

const styles = StyleSheet.create({
    rootContainer: {
        flex: 1,
        // Bug 7: Removed `height: '100%'` and `minHeight: '100vh'`.
        // On web, 100vh causes the viewport to include the browser's URL bar,
        // which clips bottom content. `flex: 1` fills the parent correctly on all platforms.
        backgroundColor: COLORS.deepNightBlack,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        // paddingTop / paddingBottom are applied dynamically via insets above.
        // No hardcoded magic numbers needed anymore.
    },
    container: {
        flex: 1,
        // paddingTop / paddingBottom applied dynamically via insets above.
    },
});

export default NeonContainer;
