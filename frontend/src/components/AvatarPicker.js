import React, { useState } from 'react';
import {
    View,
    Modal,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    ScrollView,
    Image,
    Alert,
    Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import NeonText from './NeonText';
import NeonButton from './NeonButton';
import { COLORS, SHADOWS } from '../constants/theme';
import { AVATARS, AVATAR_COLORS } from '../data/avatars';

const AvatarPicker = ({ visible, onClose, onSelect, currentAvatar }) => {
    const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || AVATARS[0]);
    const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
    const [customPhoto, setCustomPhoto] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const requestPermissions = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Please allow access to your photo library.',
                    [{ text: 'OK' }]
                );
                return false;
            }
        }
        return true;
    };

    const compressAndConvertImage = async (uri) => {
        try {
            const manipulatedImage = await manipulateAsync(
                uri,
                [{ resize: { width: 200, height: 200 } }],
                { compress: 0.7, format: SaveFormat.JPEG, base64: true }
            );

            const base64String = `data:image/jpeg;base64,${manipulatedImage.base64}`;
            const sizeInKB = (base64String.length * 0.75) / 1024;

            if (sizeInKB > 150) {
                const furtherCompressed = await manipulateAsync(
                    uri,
                    [{ resize: { width: 150, height: 150 } }],
                    { compress: 0.5, format: SaveFormat.JPEG, base64: true }
                );
                return `data:image/jpeg;base64,${furtherCompressed.base64}`;
            }

            return base64String;
        } catch (error) {
            console.error('Error compressing image:', error);
            throw error;
        }
    };

    const pickCustomPhoto = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        setIsUploading(true);
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const base64Image = await compressAndConvertImage(result.assets[0].uri);
                setCustomPhoto(base64Image);
                setSelectedAvatar(null); // Clear emoji selection
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to upload image. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleConfirm = () => {
        onSelect({
            avatar: customPhoto || selectedAvatar,
            color: selectedColor,
            isCustomPhoto: !!customPhoto
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
                            <View style={[styles.previewContainer, !customPhoto && { backgroundColor: selectedColor }]}>
                                {customPhoto ? (
                                    <Image source={{ uri: customPhoto }} style={styles.previewImage} />
                                ) : (
                                    <>
                                        <NeonText size={64}>{selectedAvatar?.emoji}</NeonText>
                                        <NeonText size={14} color="#fff" style={styles.previewName}>
                                            {selectedAvatar?.name}
                                        </NeonText>
                                    </>
                                )}
                            </View>

                            {/* Custom Photo Upload */}
                            <TouchableOpacity
                                style={styles.uploadButton}
                                onPress={pickCustomPhoto}
                                disabled={isUploading}
                            >
                                <NeonText size={14} color={COLORS.neonCyan}>
                                    {isUploading ? '⏳ UPLOADING...' : '📸 UPLOAD CUSTOM PHOTO'}
                                </NeonText>
                            </TouchableOpacity>

                            {customPhoto && (
                                <TouchableOpacity
                                    style={styles.clearPhotoButton}
                                    onPress={() => setCustomPhoto(null)}
                                >
                                    <NeonText size={12} color={COLORS.hotPink}>
                                        ✕ REMOVE PHOTO
                                    </NeonText>
                                </TouchableOpacity>
                            )}

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
export const AvatarDisplay = ({ avatar, color, size = 40, onPress, isCustomPhoto }) => {
    const Component = onPress ? TouchableOpacity : View;
    const isBase64Image = avatar && typeof avatar === 'string' && avatar.startsWith('data:image');

    return (
        <Component
            style={[
                styles.avatarDisplay,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: !isBase64Image ? (color || AVATAR_COLORS[0]) : 'transparent',
                    overflow: 'hidden'
                }
            ]}
            onPress={onPress}
        >
            {isBase64Image || isCustomPhoto ? (
                <Image
                    source={{ uri: avatar }}
                    style={{ width: size, height: size, borderRadius: size / 2 }}
                />
            ) : (
                <NeonText size={size * 0.5}>{avatar?.emoji || '👤'}</NeonText>
            )}
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
    },
    uploadButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: 'rgba(0,240,255,0.1)',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
        alignItems: 'center',
        marginBottom: 15,
    },
    clearPhotoButton: {
        paddingVertical: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    previewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
    }
});

export default AvatarPicker;
