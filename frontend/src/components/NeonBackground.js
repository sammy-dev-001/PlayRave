import React from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';

const NeonBackground = () => {
    return (
        <View style={styles.container}>
            <ImageBackground
                source={require('../../assets/images/neon_background.png')}
                style={styles.image}
                resizeMode="repeat"
                imageStyle={{ opacity: 0.3 }}
            />
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

export default NeonBackground;
