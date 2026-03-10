import React from 'react';
import { View, StyleSheet, ImageBackground, Platform, Image } from 'react-native';

const bgPattern = require('../../assets/images/neon_background.png');

const NeonBackground = () => {
    if (Platform.OS === 'web') {
        const source = Image.resolveAssetSource(bgPattern);
        const bgUri = source ? source.uri : bgPattern;
        return (
            <View 
                style={[
                    styles.container, 
                    {
                        backgroundImage: `url(${bgUri})`,
                        backgroundRepeat: 'repeat',
                        backgroundSize: '300px 300px',
                        opacity: 0.3,
                    }
                ]} 
            />
        );
    }

    return (
        <View style={styles.container}>
            <ImageBackground
                source={bgPattern}
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
    },
    image: {
        flex: 1,
        width: '100%',
        height: '100%',
    }
});

export default NeonBackground;
