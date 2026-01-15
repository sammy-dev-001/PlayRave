import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import NeonText from './NeonText';

const WhotCard = ({ card, onPress, disabled, small }) => {
    // Determine card background and content color
    const isWhot = card.shape === 'whot';
    const cardBgColor = '#FFFFFF';
    const contentColor = card.color || '#000';

    const cardSize = small ? styles.cardSmall : styles.card;
    const numberSize = small ? 14 : 24;

    const renderShape = (shape, size) => {
        const s = size;
        const color = contentColor;

        switch (shape) {
            case 'circle':
                return <View style={{ width: s, height: s, borderRadius: s / 2, backgroundColor: color }} />;
            case 'square':
                return <View style={{ width: s, height: s, backgroundColor: color }} />;
            case 'triangle':
                return (
                    <View style={{
                        width: 0, height: 0,
                        backgroundColor: 'transparent',
                        borderStyle: 'solid',
                        borderLeftWidth: s / 2, borderRightWidth: s / 2, borderBottomWidth: s,
                        borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: color
                    }} />
                );
            case 'cross':
                return (
                    <View style={{ width: s, height: s, justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ position: 'absolute', width: s / 4, height: s, backgroundColor: color }} />
                        <View style={{ position: 'absolute', width: s, height: s / 4, backgroundColor: color }} />
                    </View>
                );
            case 'star':
                return <NeonText size={s} color={color}>★</NeonText>;
            case 'whot':
                return (
                    <View style={styles.whotLogoContainer}>
                        <NeonText size={small ? 10 : 16} weight="bold" color={color} style={styles.whotText}>WHOT</NeonText>
                        <NeonText size={small ? 8 : 12} weight="bold" color="#000">20</NeonText>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <TouchableOpacity
            style={[
                cardSize,
                { backgroundColor: cardBgColor, borderColor: '#ccc' },
                disabled && styles.disabled
            ]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.8}
        >
            {!isWhot && (
                <>
                    {/* Top Left Corner */}
                    <View style={styles.topLeft}>
                        <NeonText size={numberSize} weight="bold" color={contentColor}>{card.number}</NeonText>
                        <View style={{ transform: [{ scale: 0.3 }] }}>
                            {renderShape(card.shape, 20)}
                        </View>
                    </View>

                    {/* Bottom Right Corner (Inverted) */}
                    <View style={styles.bottomRight}>
                        <NeonText size={numberSize} weight="bold" color={contentColor}>{card.number}</NeonText>
                        <View style={{ transform: [{ scale: 0.3 }] }}>
                            {renderShape(card.shape, 20)}
                        </View>
                    </View>

                    {/* Center Shape */}
                    <View style={styles.centerShape}>
                        {renderShape(card.shape, small ? 30 : 50)}
                    </View>
                </>
            )}

            {isWhot && (
                <View style={styles.whotCenter}>
                    {renderShape('whot', small ? 30 : 50)}
                </View>
            )}

            {card.isSpecial && !isWhot && (
                <View style={styles.specialBadge}>
                    <NeonText size={small ? 8 : 12} color="#FFD700">★</NeonText>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        width: 90,
        height: 130,
        borderRadius: 8,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    cardSmall: {
        width: 50,
        height: 75,
        borderRadius: 6,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    topLeft: {
        position: 'absolute',
        top: 5,
        left: 5,
        alignItems: 'center',
    },
    bottomRight: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        alignItems: 'center',
        transform: [{ rotate: '180deg' }]
    },
    centerShape: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    whotCenter: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#222', // Whot cards often dark? Or keeping white with colorful text
        borderRadius: 4,
        margin: 5,
        width: '90%',
        height: '90%',
    },
    whotText: {
        letterSpacing: 2,
    },
    whotLogoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        padding: 5,
        borderRadius: 4,
    },
    disabled: {
        opacity: 0.6,
        backgroundColor: '#e0e0e0',
    },
    specialBadge: {
        position: 'absolute',
        top: '45%',
        right: 5,
    }
});

export default WhotCard;
