import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import NeonText from './NeonText';

const WhotCard = ({ card, onPress, disabled, small }) => {
    const getShapeSymbol = (shape) => {
        const symbols = {
            circle: '○',
            triangle: '△',
            cross: '✕',
            square: '□',
            star: '★',
            whot: 'WHOT'
        };
        return symbols[shape] || shape;
    };

    const cardSize = small ? styles.cardSmall : styles.card;
    const numberSize = small ? 16 : 32;
    const symbolSize = small ? 20 : 48;

    return (
        <TouchableOpacity
            style={[
                cardSize,
                { borderColor: card.color },
                disabled && styles.disabled
            ]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.7}
        >
            {card.shape === 'whot' ? (
                <NeonText size={small ? 14 : 24} weight="bold" color={card.color} glow>
                    {getShapeSymbol(card.shape)}
                </NeonText>
            ) : (
                <>
                    <NeonText size={numberSize} weight="bold" color={card.color}>
                        {card.number}
                    </NeonText>
                    <NeonText size={symbolSize} color={card.color} glow>
                        {getShapeSymbol(card.shape)}
                    </NeonText>
                    {card.isSpecial && (
                        <View style={styles.specialBadge}>
                            <NeonText size={8} color="#FFD700">★</NeonText>
                        </View>
                    )}
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        width: 80,
        height: 120,
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderRadius: 12,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    cardSmall: {
        width: 50,
        height: 75,
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderRadius: 8,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
    },
    disabled: {
        opacity: 0.5,
    },
    specialBadge: {
        position: 'absolute',
        top: 5,
        right: 5,
    }
});

export default WhotCard;
