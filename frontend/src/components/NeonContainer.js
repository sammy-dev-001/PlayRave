import React, { useMemo } from 'react';
import { View, StyleSheet, Platform, StatusBar, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => getStyles(COLORS, theme, insets), [COLORS, theme, insets]);

    // Responsive padding
    const getPadding = () => {
        if (SCREEN_WIDTH < 375) return 12;
        if (SCREEN_WIDTH >= 768) return 32;
        return 20;
    };

    const padding = getPadding();

    // Separate overlays (like InGameOverlay) from scrollable/normal content
    // so they are always pinned to the full-viewport root and never trapped or scrolled inside a ScrollView.
    const contentChildren = [];
    const overlayChildren = [];

    const extractOverlays = (nodes) => {
        React.Children.forEach(nodes, (child) => {
            if (!React.isValidElement(child)) {
                contentChildren.push(child);
                return;
            }
            if (child.type === React.Fragment) {
                extractOverlays(child.props.children);
            } else if (
                child.type?.isOverlay ||
                child.props?.isOverlay ||
                child.type?.displayName === 'InGameOverlay' ||
                child.type?.name === 'InGameOverlay'
            ) {
                overlayChildren.push(child);
            } else {
                contentChildren.push(child);
            }
        });
    };

    extractOverlays(children);

    const content = scrollable ? (
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingHorizontal: padding }, style]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
            {contentChildren}
        </ScrollView>
    ) : (
        <View style={[styles.container, { padding }, style]}>
            {contentChildren}
        </View>
    );

    return (
        <View style={[styles.rootContainer, rootStyle]}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.deepNightBlack} />
            {!hideBackground && <ThemeBackground />}
            {showBackButton && <BackButton onPress={onBackPress} />}
            {showMuteButton && <MuteButton />}
            <View style={styles.safeArea}>
                {content}
            </View>
            {overlayChildren}
        </View>
    );
};

const getStyles = (COLORS, theme, insets) => StyleSheet.create({
    rootContainer: {
        flex: 1,
        ...Platform.select({
            web: { height: '100%', minHeight: '100vh' },
            default: { flex: 1 },
        }),
        // Glass themes: ThemeBackground renders the full-bleed image, so keep this transparent.
        // All other themes: fill with the deep background colour.
        backgroundColor: theme?.isGlass ? 'transparent' : COLORS.deepNightBlack,
    },
    safeArea: {
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
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
