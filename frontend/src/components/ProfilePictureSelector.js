import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import NeonText from './NeonText';
import { COLORS } from '../constants/theme';

const ProfilePictureSelector = ({ selectedAvatar, onAvatarChange }) => {
    const [isLoading, setIsLoading] = useState(false);

    // Default avatars (emoji options)
    const defaultAvatars = ['👤', '😎', '🎮', '🎯', '⚡', '🔥', '💎', '🌟'];

    const requestPermissions = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Please allow access to your photo library to upload a profile picture.',
                    [{ text: 'OK' }]
                );
                return false;
            }
        }
        return true;
    };

    const compressAndConvertImage = async (uri) => {
        try {
            // Resize and compress the image
            const manipulatedImage = await manipulateAsync(
                uri,
                [{ resize: { width: 200, height: 200 } }],
                { compress: 0.7, format: SaveFormat.JPEG, base64: true }
            );

            // Check size (limit to ~100KB base64)
            const base64String = `data:image/jpeg;base64,${manipulatedImage.base64}`;
            const sizeInKB = (base64String.length * 0.75) / 1024;

            if (sizeInKB > 150) {
                // Further compress if too large
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

    const pickImage = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        setIsLoading(true);
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const base64Image = await compressAndConvertImage(result.assets[0].uri);
                onAvatarChange(base64Image);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to upload image. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const selectDefaultAvatar = (emoji) => {
        onAvatarChange(emoji);
    };

    const isBase64Image = selectedAvatar && selectedAvatar.startsWith('data:image');
    const isEmoji = selectedAvatar && !isBase64Image;

    return (
        <View style={styles.container}>
            <NeonText size={16} style={styles.label}>PROFILE PICTURE</NeonText>

            {/* Current Avatar Display */}
            <View style={styles.currentAvatarContainer}>
                {isBase64Image ? (
                    <Image source={{ uri: selectedAvatar }} style={styles.avatarImage} />
                ) : (
                    <View style={styles.emojiContainer}>
                        <NeonText size={48}>{selectedAvatar || '👤'}</NeonText>
                    </View>
                )}
            </View>

            {/* Upload Button */}
            <TouchableOpacity
                style={styles.uploadButton}
                onPress={pickImage}
                disabled={isLoading}
            >
                <NeonText size={14} color={COLORS.neonCyan}>
                    {isLoading ? 'UPLOADING...' : '📸 UPLOAD PHOTO'}
                </NeonText>
            </TouchableOpacity>

            {/* Default Avatars */}
            <NeonText size={12} color="#888" style={styles.orText}>or choose an emoji</NeonText>
            <View style={styles.defaultAvatars}>
                {defaultAvatars.map((emoji, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.emojiOption,
                            selectedAvatar === emoji && styles.selectedEmoji
                        ]}
                        onPress={() => selectDefaultAvatar(emoji)}
                    >
                        <NeonText size={28}>{emoji}</NeonText>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginVertical: 20,
    },
    label: {
        marginBottom: 15,
        color: COLORS.hotPink,
    },
    currentAvatarContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 3,
        borderColor: COLORS.neonCyan,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    emojiContainer: {
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
        marginBottom: 15,
    },
    orText: {
        marginBottom: 10,
    },
    defaultAvatars: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
        maxWidth: 300,
    },
    emojiOption: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 2,
        borderColor: 'rgba(177, 78, 255, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedEmoji: {
        borderColor: COLORS.limeGlow,
        backgroundColor: 'rgba(0,255,0,0.1)',
    },
});

export default ProfilePictureSelector;
