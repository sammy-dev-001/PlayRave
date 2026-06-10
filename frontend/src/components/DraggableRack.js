import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, PanResponder, Animated, TouchableOpacity } from 'react-native';
import NeonText from './NeonText';
import { COLORS } from '../constants/theme';

const DraggableRack = ({
    hand,
    placedTiles,
    selectedTileIndex,
    exchangeMode,
    selectedTilesForExchange,
    rackTileSize,
    onTilePress,
}) => {
    // We maintain a local order array. Values are indices of the `hand` array.
    const [order, setOrder] = useState([]);
    
    // When the hand changes size (e.g. start of turn), reset the order.
    useEffect(() => {
        setOrder(hand.map((_, i) => i));
    }, [hand]);

    const [draggingIndex, setDraggingIndex] = useState(null); // the visual index being dragged
    const pan = useRef(new Animated.ValueXY()).current;
    
    // Width of a tile plus the gap
    const gap = 5;
    const tileSlotWidth = rackTileSize + gap;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onStartShouldSetPanResponderCapture: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Only become PanResponder if moving horizontally significantly
                return Math.abs(gestureState.dx) > 5;
            },
            onMoveShouldSetPanResponderCapture: (_, gestureState) => {
                return Math.abs(gestureState.dx) > 5;
            },
            onPanResponderGrant: (e, gestureState) => {
                // Find which tile we touched based on touch X relative to the rack
                // We use gestureState.x0, but it's absolute. A better way is to attach panResponders to the tiles themselves.
            },
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: () => {
                // handled by individual tiles
            },
            onPanResponderTerminate: () => {
                // handled by individual tiles
            }
        })
    ).current;

    // To make it robust, we create a panResponder for EACH tile.
    const createTilePanResponder = (visualIndex) => PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 5,
        onPanResponderGrant: () => {
            setDraggingIndex(visualIndex);
            pan.setOffset({ x: 0, y: 0 });
            pan.setValue({ x: 0, y: 0 });
        },
        onPanResponderMove: Animated.event(
            [null, { dx: pan.x, dy: pan.y }],
            { useNativeDriver: false }
        ),
        onPanResponderRelease: (e, gestureState) => {
            if (Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5) {
                // It was a tap
                const originalIndex = order[visualIndex];
                if (originalIndex !== undefined) {
                    onTilePress(originalIndex);
                }
            } else {
                // It was a drag, calculate new index
                const offsetSlots = Math.round(gestureState.dx / tileSlotWidth);
                let newVisualIndex = visualIndex + offsetSlots;
                newVisualIndex = Math.max(0, Math.min(newVisualIndex, order.length - 1));
                
                if (newVisualIndex !== visualIndex) {
                    setOrder(prevOrder => {
                        const newOrder = [...prevOrder];
                        const item = newOrder.splice(visualIndex, 1)[0];
                        newOrder.splice(newVisualIndex, 0, item);
                        return newOrder;
                    });
                }
            }
            setDraggingIndex(null);
            pan.flattenOffset();
        },
        onPanResponderTerminate: () => {
            setDraggingIndex(null);
            pan.flattenOffset();
        }
    });

    // Cache pan responders to avoid recreating them and breaking touches
    const respondersRef = useRef([]);
    useEffect(() => {
        respondersRef.current = hand.map((_, i) => createTilePanResponder(i));
    }, [hand.length, order]); // Re-create if hand size changes, wait, we need 'order' context in release!
    
    // Actually, PanResponder callbacks capture closures. It's better to use refs for mutable state.
    const orderRef = useRef(order);
    orderRef.current = order;
    
    const tilePanResponders = useRef(
        Array.from({ length: 15 }).map((_, visualIndex) => PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 5,
            onPanResponderGrant: () => {
                setDraggingIndex(visualIndex);
                pan.setOffset({ x: 0, y: 0 });
                pan.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: (e, gestureState) => {
                const isTap = Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5;
                if (isTap) {
                    const originalIndex = orderRef.current[visualIndex];
                    if (originalIndex !== undefined && onTilePress) {
                        onTilePress(originalIndex);
                    }
                } else {
                    const offsetSlots = Math.round(gestureState.dx / tileSlotWidth);
                    let newVisualIndex = visualIndex + offsetSlots;
                    newVisualIndex = Math.max(0, Math.min(newVisualIndex, orderRef.current.length - 1));
                    
                    if (newVisualIndex !== visualIndex) {
                        setOrder(prevOrder => {
                            const newOrder = [...prevOrder];
                            const item = newOrder.splice(visualIndex, 1)[0];
                            newOrder.splice(newVisualIndex, 0, item);
                            return newOrder;
                        });
                    }
                }
                setDraggingIndex(null);
                pan.flattenOffset();
            },
            onPanResponderTerminate: () => {
                setDraggingIndex(null);
                pan.flattenOffset();
            }
        }))
    ).current;

    return (
        <View style={[styles.rack, { height: rackTileSize + 8 }]}>
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
                            style={[styles.rackTile, styles.usedTile, { width: rackTileSize, height: rackTileSize }]}
                        />
                    );
                }

                // If dragging, we use Animated.View
                if (isDragging) {
                    return (
                        <Animated.View
                            key={`drag-${originalIndex}`}
                            style={[
                                styles.rackTile,
                                { width: rackTileSize, height: rackTileSize, zIndex: 100 },
                                isSelected && !exchangeMode && styles.selectedRackTile,
                                isSelectedForExchange && styles.exchangeSelectedTile,
                                {
                                    transform: [
                                        { translateX: pan.x },
                                        { translateY: pan.y },
                                        ...(isSelected && !exchangeMode ? [{ translateY: -5 }] : [])
                                    ],
                                    // Slight pop effect when dragging
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.5,
                                    shadowRadius: 5,
                                    elevation: 10,
                                }
                            ]}
                            {...tilePanResponders[visualIndex].panHandlers}
                        >
                            <NeonText size={rackTileSize * 0.45} color="#000" weight="bold">
                                {tile.letter === '_' ? '★' : tile.letter}
                            </NeonText>
                            <NeonText size={rackTileSize * 0.22} color="#000" style={styles.tileValue}>{tile.value}</NeonText>
                        </Animated.View>
                    );
                }

                return (
                    <Animated.View
                        key={`tile-${originalIndex}`}
                        style={[
                            styles.rackTile,
                            { width: rackTileSize, height: rackTileSize },
                            isSelected && !exchangeMode && styles.selectedRackTile,
                            isSelectedForExchange && styles.exchangeSelectedTile
                        ]}
                        {...tilePanResponders[visualIndex].panHandlers}
                    >
                        <NeonText size={rackTileSize * 0.45} color="#000" weight="bold">
                            {tile.letter === '_' ? '★' : tile.letter}
                        </NeonText>
                        <NeonText size={rackTileSize * 0.22} color="#000" style={styles.tileValue}>{tile.value}</NeonText>
                    </Animated.View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    rack: {
        flexDirection: 'row',
        gap: 5,
        justifyContent: 'center',
    },
    rackTile: {
        backgroundColor: '#e1c699',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#c6a87c',
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
        opacity: 0.5,
    },
    tileValue: {
        position: 'absolute',
        bottom: 1,
        right: 2,
        fontSize: 8,
    },
});

export default DraggableRack;
