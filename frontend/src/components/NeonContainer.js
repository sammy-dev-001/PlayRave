import React from 'react';
import { View, StyleSheet, SafeAreaView, Platform, StatusBar } from 'react-native';
import { COLORS } from '../constants/theme';
import NeonBackground from './NeonBackground';
import MuteButton from './MuteButton';
import BackButton from './BackButton';

const NeonContainer = ({ children, style, showMuteButton = false, showBackButton = false }) => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.deepNightBlack} />
            <View style={[styles.container, style]}>
                <NeonBackground />
                {showBackButton && <BackButton />}
                {showMuteButton && <MuteButton />}
                {children}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.deepNightBlack,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.deepNightBlack,
        padding: 20,
    },
});

export default NeonContainer;
