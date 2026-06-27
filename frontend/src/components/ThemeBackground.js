import React from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const ThemeBackground = () => {
    const { theme } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {theme.backgroundImage ? (
                <ImageBackground
                    source={theme.backgroundImage}
                    style={styles.image}
                    resizeMode="repeat"
                    imageStyle={{ opacity: 0.3 }}
                />
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
    },
    image: {
        flex: 1,
        width: '100%',
        height: '100%',
    }
});

export default ThemeBackground;
