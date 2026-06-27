import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, PanResponder, Animated } from 'react-native';
import NeonText from './NeonText';
import { useTheme } from '../context/ThemeContext';

const DraggableRack = ({
    hand,
    placedTiles,
    selectedTileIndex,
    exchangeMode,
    selectedTilesForExchange,
    rackTileSize,
    onTilePress,
    onTileDrop,
}) => {
    const { COLORS } = useTheme();
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    // Local visual order — values are indices into the `hand` array
    const [order, setOrder] = useState([]);

    useEffect(() => {
        setOrder(hand.map((_, i) => i));
    }, [hand.length]);

    const [draggingIndex, setDraggingIndex] = useState(null);
    // Each tile gets its own Animated.ValueXY so they move independently
    const pans = useRef(Array.from({ length: 15 }, () => new Animated.ValueXY())).current;

    const gap = 5;
    const tileSlotWidth = rackTileSize + gap;

    // --- Refs for mutable state accessed inside PanResponder closures ---
    const orderRef = useRef(order);
    orderRef.current = order;

    const onTilePressRef = useRef(onTilePress);
    onTilePressRef.current = onTilePress;

    const onTileDropRef = useRef(onTileDrop);
    onTileDropRef.current = onTileDrop;

    const tileSlotWidthRef = useRef(tileSlotWidth);
    tileSlotWidthRef.current = tileSlotWidth;

    // Create one PanResponder per slot (up to 15). Closures read from refs.
    const tilePanResponders = useRef(
        Array.from({ length: 15 }, (_, visualIndex) =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onStartShouldSetPanResponderCapture: () => false,
                onMoveShouldSetPanResponder: (_, g) =>
                    Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6,
                onMoveShouldSetPanResponderCapture: (_, g) =>
                    Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6,

                onPanResponderGrant: () => {
                    setDraggingIndex(visualIndex);
                    pans[visualIndex].setOffset({ x: 0, y: 0 });
                    pans[visualIndex].setValue({ x: 0, y: 0 });
                },

                onPanResponderMove: Animated.event(
                    [null, { dx: pans[visualIndex].x, dy: pans[visualIndex].y }],
                    { useNativeDriver: false }
                ),

                onPanResponderRelease: (_, g) => {
                    const isTap = Math.abs(g.dx) < 6 && Math.abs(g.dy) < 6;
                    const originalIndex = orderRef.current[visualIndex];

                    if (isTap) {
                        // Simple tap — select/deselect
                        if (originalIndex !== undefined && onTilePressRef.current) {
                            onTilePressRef.current(originalIndex);
                        }
                    } else if (g.dy < -40) {
                        // Dragged upwards — drop onto board
                        if (originalIndex !== undefined && onTileDropRef.current) {
                            onTileDropRef.current(originalIndex, g.moveX, g.moveY);
                        }
                    } else {
                        // Dragged horizontally — rearrange rack
                        const slotWidth = tileSlotWidthRef.current;
                        const offsetSlots = Math.round(g.dx / slotWidth);
                        let newVI = visualIndex + offsetSlots;
                        newVI = Math.max(0, Math.min(newVI, orderRef.current.length - 1));

                        if (newVI !== visualIndex) {
                            setOrder(prev => {
                                const next = [...prev];
                                const [moved] = next.splice(visualIndex, 1);
                                next.splice(newVI, 0, moved);
                                return next;
                            });
                        }
                    }

                    setDraggingIndex(null);
                    pans[visualIndex].flattenOffset();
                    pans[visualIndex].setValue({ x: 0, y: 0 });
                },

                onPanResponderTerminate: () => {
                    setDraggingIndex(null);
                    pans[visualIndex].flattenOffset();
                    pans[visualIndex].setValue({ x: 0, y: 0 });
                },
            })
        )
    ).current;

    return (
        <View style={[styles.rack, { height: rackTileSize + 12 }]}>
            {order.map((originalIndex, visualIndex) => {
                const tile = hand[originalIndex];
                if (!tile) return null;

                const isUsed = placedTiles.some(t => t.handIndex === originalIndex);
                const isSelected = selectedTileIndex === originalIndex;
                const isSelectedForExchange = selectedTilesForExchange.includes(originalIndex);
                const isDragging = draggingIndex === visualIndex;

                if (isUsed) {
                    return (
                        <View
                            key={`used-${originalIndex}`}
                            style={[
                                styles.rackTile,
                                styles.usedTile,
                                { width: rackTileSize, height: rackTileSize },
                            ]}
                        />
                    );
                }

                return (
                    <Animated.View
                        key={`tile-${originalIndex}`}
                        style={[
                            styles.rackTile,
                            { width: rackTileSize, height: rackTileSize },
                            isSelected && !exchangeMode && styles.selectedRackTile,
                            isSelectedForExchange && styles.exchangeSelectedTile,
                            isDragging && styles.draggingTile,
                            {
                                transform: [
                                    { translateX: pans[visualIndex].x },
                                    { translateY: pans[visualIndex].y },
                                    ...(isDragging ? [{ scale: 0.75 }] : []),
                                ],
                                zIndex: isDragging ? 100 : 1,
                            },
                        ]}
                        {...tilePanResponders[visualIndex].panHandlers}
                    >
                        <NeonText size={rackTileSize * 0.45} color="#000" weight="bold">
                            {tile.letter === '_' ? '★' : tile.letter}
                        </NeonText>
                        <NeonText size={rackTileSize * 0.22} color="#000" style={styles.tileValue}>
                            {tile.value}
                        </NeonText>
                    </Animated.View>
                );
            })}
        </View>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    rack: {
        flexDirection: 'row',
        gap: 5,
        justifyContent: 'center',
        overflow: 'visible',
    },
    rackTile: {
        backgroundColor: '#e1c699',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#c6a87c',
        cursor: 'grab',
        userSelect: 'none',
    },
    draggingTile: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 12,
        opacity: 0.9,
    },
    selectedRackTile: {
        borderColor: COLORS.limeGlow,
        borderWidth: 3,
        transform: [{ translateY: -5 }],
    },
    exchangeSelectedTile: {
        borderColor: COLORS.neonCyan,
        borderWidth: 3,
        backgroundColor: '#a0e0ff',
    },
    usedTile: {
        backgroundColor: '#333',
        borderColor: '#222',
        opacity: 0.4,
    },
    tileValue: {
        position: 'absolute',
        bottom: 1,
        right: 2,
        fontSize: 8,
    },
});

export default DraggableRack;
