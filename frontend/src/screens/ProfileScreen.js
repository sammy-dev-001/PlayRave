import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Alert,
    Platform,
    Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import StatsDisplay from '../components/StatsDisplay';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = ({ navigation }) => {
    const { user, isGuest, logout, updateProfilePicture } = useAuth();
    const progressAnim = useRef(new Animated.Value(0)).current;
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    useEffect(() => {
        if (user) {
            const xpForLevel = getXPForLevel(user.level);
            const progress = (user.xp || 0) / xpForLevel;
            Animated.timing(progressAnim, {
                toValue: progress,
                duration: 1000,
                useNativeDriver: false
            }).start();
        }
    }, [user]);

    const getXPForLevel = (level) => {
        if (level <= 5) return 100;
        if (level <= 10) return 200;
        if (level <= 20) return 300;
        return 500;
    };

    const handleLogout = async () => {
        await logout();
        navigation.replace('Auth');
    };

    const pickImage = async (useCamera = false) => {
        try {
            // Request permissions
            if (useCamera) {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission needed', 'Camera access is required to take a photo.');
                    return;
                }
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission needed', 'Photo library access is required.');
                    return;
                }
            }

            // Launch picker
            const result = useCamera
                ? await ImagePicker.launchCameraAsync({
                    mediaTypes: 'images',
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.7,
                })
                : await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: 'images',
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.7,
                });

            if (!result.canceled && result.assets?.[0]) {
                setIsUploadingImage(true);
                await updateProfilePicture(result.assets[0].uri);
                setIsUploadingImage(false);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            setIsUploadingImage(false);
            Alert.alert('Error', 'Failed to update profile picture.');
        }
    };

    const showImageOptions = () => {
        Alert.alert(
            'Update Profile Picture',
            'Choose an option',
            [
                { text: 'Take Photo', onPress: () => pickImage(true) },
                { text: 'Choose from Gallery', onPress: () => pickImage(false) },
                { text: 'Remove Photo', onPress: () => updateProfilePicture(null), style: 'destructive' },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };

    if (!user) return null;

    const xpForNext = getXPForLevel(user.level);
    const winRate = user.gamesPlayed > 0
        ? Math.round((user.gamesWon / user.gamesPlayed) * 100)
        : 0;

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%']
    });

    return (
        <NeonContainer showBackButton scrollable>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={showImageOptions} style={styles.avatarContainer}>
                        {user.profilePicture ? (
                            <Image
                                source={{ uri: user.profilePicture }}
                                style={styles.profileImage}
                            />
                        ) : (
                            <NeonText size={64}>{user.avatar || '👤'}</NeonText>
                        )}
                        <View style={styles.editBadge}>
                            <NeonText size={16}>📷</NeonText>
                        </View>
                        {isUploadingImage && (
                            <View style={styles.uploadingOverlay}>
                                <NeonText size={12}>...</NeonText>
                            </View>
                        )}
                    </TouchableOpacity>
                    <NeonText size={28} weight="bold" glow style={styles.username}>
                        {user.username}
                    </NeonText>
                    {isGuest && (
                        <View style={styles.guestBadge}>
                            <NeonText size={12} color={COLORS.hotPink}>GUEST MODE</NeonText>
                        </View>
                    )}
                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={() => navigation.navigate('Settings')}
                    >
                        <NeonText size={14} color={COLORS.neonCyan}>⚙️ Settings</NeonText>
                    </TouchableOpacity>
                </View>

                {/* Level Progress */}
                <View style={styles.levelSection}>
                    <View style={styles.levelHeader}>
                        <NeonText size={18} weight="bold" color={COLORS.neonCyan}>
                            Level {user.level}
                        </NeonText>
                        <NeonText size={14} color="#888">
                            {user.xp || 0} / {xpForNext} XP
                        </NeonText>
                    </View>
                    <View style={styles.progressBar}>
                        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
                    </View>
                    <NeonText size={12} color="#666" style={styles.totalXp}>
                        Total XP: {user.totalXp || 0}
                    </NeonText>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsSection}>
                    <NeonText size={18} weight="bold" style={styles.sectionTitle}>Statistics</NeonText>
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <NeonText size={32} weight="bold" color={COLORS.limeGlow}>
                                {user.gamesPlayed || 0}
                            </NeonText>
                            <NeonText size={12} color="#888">Games Played</NeonText>
                        </View>
                        <View style={styles.statCard}>
                            <NeonText size={32} weight="bold" color={COLORS.neonCyan}>
                                {user.gamesWon || 0}
                            </NeonText>
                            <NeonText size={12} color="#888">Victories</NeonText>
                        </View>
                        <View style={styles.statCard}>
                            <NeonText size={32} weight="bold" color={COLORS.hotPink}>
                                {winRate}%
                            </NeonText>
                            <NeonText size={12} color="#888">Win Rate</NeonText>
                        </View>
                        <View style={styles.statCard}>
                            <NeonText size={32} weight="bold" color={COLORS.electricPurple}>
                                {user.level || 1}
                            </NeonText>
                            <NeonText size={12} color="#888">Level</NeonText>
                        </View>
                    </View>
                </View>

                {/* Detailed Game Stats & Achievements */}
                <View style={styles.detailedStats}>
                    <NeonText size={18} weight="bold" style={styles.sectionTitle}>Game Details</NeonText>
                    <StatsDisplay />
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    {isGuest && (
                        <NeonButton
                            title="CREATE ACCOUNT"
                            onPress={() => navigation.navigate('Auth')}
                            style={styles.actionButton}
                        />
                    )}
                    <TouchableOpacity style={styles.leaderboardButton} onPress={() => navigation.navigate('Leaderboard')}>
                        <NeonText size={16} color={COLORS.neonCyan}>🏆 View Leaderboard</NeonText>
                    </TouchableOpacity>
                    <NeonButton
                        title={isGuest ? "CLEAR GUEST DATA" : "SIGN OUT"}
                        variant="secondary"
                        onPress={handleLogout}
                        style={styles.logoutButton}
                    />
                </View>
            </View>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 20, paddingHorizontal: 20 },
    header: { alignItems: 'center', marginBottom: 30 },
    avatarContainer: {
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 3, borderColor: COLORS.neonCyan,
        marginBottom: 15
    },
    username: { marginBottom: 5 },
    guestBadge: {
        backgroundColor: 'rgba(255, 87, 170, 0.2)',
        paddingHorizontal: 12, paddingVertical: 4,
        borderRadius: 12, marginTop: 5
    },
    levelSection: { marginBottom: 30 },
    levelHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    progressBar: {
        height: 12, borderRadius: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden'
    },
    progressFill: {
        height: '100%', borderRadius: 6,
        backgroundColor: COLORS.limeGlow
    },
    totalXp: { marginTop: 8, textAlign: 'right' },
    statsSection: { marginBottom: 30 },
    sectionTitle: { marginBottom: 15 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    statCard: {
        flex: 1, minWidth: '45%',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 15, padding: 20, alignItems: 'center'
    },
    detailedStats: { marginBottom: 30 },
    actions: { alignItems: 'center', marginTop: 20, marginBottom: 40 },
    actionButton: { marginBottom: 20, width: '100%' },
    leaderboardButton: { padding: 15, marginBottom: 15 },
    logoutButton: { width: '100%' },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.neonCyan,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.deepNightBlack,
    },
    uploadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingsButton: {
        marginTop: 10,
        padding: 10,
    },
});

export default ProfileScreen;
