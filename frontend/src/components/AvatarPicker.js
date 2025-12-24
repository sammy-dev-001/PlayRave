import React, { useState } from 'react';
import {
    View,
    Modal,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    ScrollView,
    Animated
} from 'react-native';
import NeonText from './NeonText';
import NeonButton from './NeonButton';
import { COLORS, SHADOWS } from '../constants/theme';
import { AVATARS, AVATAR_COLORS } from '../data/avatars';

const AvatarPicker = ({ visible, onClose, onSelect, currentAvatar }) => {
    const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || AVATARS[0]);
    const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);

    const handleConfirm = () => {
        onSelect({
            avatar: selectedAvatar,
            color: selectedColor
        });
        onClose();
    };

    const renderAvatarOption = (avatar) => {
        const isSelected = selectedAvatar?.id === avatar.id;

        return (
            <TouchableOpacity
                key={avatar.id}
                style={[
                    styles.avatarOption,
                    isSelected && styles.avatarOptionSelected,
                    isSelected && { borderColor: selectedColor }
                ]}
                onPress={() => setSelectedAvatar(avatar)}
            >
                <NeonText size={36}>{avatar.emoji}</NeonText>
            </TouchableOpacity>
        );
    };

    const renderColorOption = (color) => {
        const isSelected = selectedColor === color;

        return (
            <TouchableOpacity
                key={color}
                style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    isSelected && styles.colorOptionSelected
                ]}
                onPress={() => setSelectedColor(color)}
            >
                {isSelected && <NeonText size={16}>✓</NeonText>}
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContent}>
                            <View style={styles.header}>
                                <NeonText size={24} weight="bold" glow color={COLORS.neonCyan}>
                                    CHOOSE AVATAR
                                </NeonText>
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <NeonText size={24} color={COLORS.hotPink}>✕</NeonText>
                                </TouchableOpacity>
                            </View>

                            {/* Preview */}
                            <View style={[styles.previewContainer, { backgroundColor: selectedColor }]}>
                                <NeonText size={64}>{selectedAvatar?.emoji}</NeonText>
                                <NeonText size={14} color="#fff" style={styles.previewName}>
                                    {selectedAvatar?.name}
                                </NeonText>
                            </View>

                            {/* Avatar Grid */}
                            <NeonText size={12} color="#888" style={styles.sectionLabel}>
                                SELECT AVATAR
                            </NeonText>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.avatarScroll}
                                contentContainerStyle={styles.avatarGrid}
                            >
                                {AVATARS.map(renderAvatarOption)}
                            </ScrollView>

                            {/* Color Grid */}
                            <NeonText size={12} color="#888" style={styles.sectionLabel}>
                                SELECT COLOR
                            </NeonText>
                            <View style={styles.colorGrid}>
                                {AVATAR_COLORS.map(renderColorOption)}
                            </View>

                            <NeonButton
                                title="CONFIRM"
                                onPress={handleConfirm}
                                style={styles.confirmButton}
                            />
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

// Compact avatar display component for use in lists
export const AvatarDisplay = ({ avatar, color, size = 40, onPress }) => {
    const Component = onPress ? TouchableOpacity : View;

    return (
        <Component
            style={[
                styles.avatarDisplay,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: color || AVATAR_COLORS[0]
                }
            ]}
            onPress={onPress}
        >
            <NeonText size={size * 0.5}>{avatar?.emoji || '👤'}</NeonText>
        </Component>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1a1a2e',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: 40,
        maxHeight: '80%',
        borderWidth: 2,
        borderColor: COLORS.electricPurple,
        borderBottomWidth: 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    closeButton: {
        padding: 5,
    },
    previewContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 120,
        height: 120,
        borderRadius: 60,
        alignSelf: 'center',
        marginBottom: 20,
        ...SHADOWS.neonGlow,
    },
    previewName: {
        marginTop: 5,
        fontWeight: 'bold',
    },
    sectionLabel: {
        marginBottom: 10,
        marginTop: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    avatarScroll: {
        maxHeight: 80,
    },
    avatarGrid: {
        flexDirection: 'row',
        gap: 10,
        paddingVertical: 5,
    },
    avatarOption: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    avatarOptionSelected: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 3,
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 20,
    },
    colorOption: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    colorOptionSelected: {
        borderColor: '#fff',
        borderWidth: 3,
    },
    confirmButton: {
        marginTop: 10,
    },
    avatarDisplay: {
        alignItems: 'center',
        justifyContent: 'center',
    }
});

export default AvatarPicker;
