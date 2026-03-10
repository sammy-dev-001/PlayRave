import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';

const AuthContext = createContext(null);

// Guest user template for local storage
const generateGuestId = () => `guest_${Math.random().toString(16).slice(2, 10)}`;

const createGuestUser = (username = '') => ({
    id: generateGuestId(),
    username: username || '',
    avatar: '👤',
    level: 1,
    xp: 0,
    totalXp: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    isGuest: true,
    stats: {}
});

const STORAGE_KEY = 'playrave_guest_profile';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(false);

    // Initialize auth state
    useEffect(() => {
        initAuth();
    }, []);

    const initAuth = async () => {
        try {
            console.log('Auth Initialization started...');
            await ApiService.init();

            // 1. Check for saved auth token (Registered users take precedence)
            const token = await AsyncStorage.getItem('authToken');
            if (token) {
                try {
                    const { user: userData } = await ApiService.getProfile();
                    setUser(userData);
                    setIsGuest(false);
                } catch (e) {
                    await AsyncStorage.removeItem('authToken');
                }
            } 
            
            // 2. Check for guest data or generate new if not found
            if (!user) {
                const guestData = await AsyncStorage.getItem(STORAGE_KEY);
                if (guestData) {
                    const profile = JSON.parse(guestData);
                    console.log('[AUTH] Found existing profile:', profile);
                    setUser(profile);
                    setIsGuest(true);
                } else {
                    console.log('[AUTH] No profile found. Generating new guest.');
                    const newGuest = createGuestUser();
                    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newGuest));
                    console.log('[AUTH] Saved new profile:', newGuest);
                    setUser(newGuest);
                    setIsGuest(true);
                }
            }
        } catch (e) {
            console.error('Auth init error:', e);
        } finally {
            setIsLoading(false);
            console.log('Auth initialized.');
        }
    };

    const register = async (email, password, username) => {
        const { user: userData } = await ApiService.register(email, password, username);
        setUser(userData);
        setIsGuest(false);
        await AsyncStorage.removeItem(STORAGE_KEY);
        return userData;
    };

    const login = async (email, password) => {
        const { user: userData } = await ApiService.login(email, password);
        setUser(userData);
        setIsGuest(false);
        await AsyncStorage.removeItem(STORAGE_KEY);
        return userData;
    };

    const continueAsGuest = async () => {
        // This is now redundant since initAuth does it, but kept for UI switches
        const guestUser = createGuestUser();
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(guestUser));
        setUser(guestUser);
        setIsGuest(true);
        return guestUser;
    };

    const logout = async () => {
        await ApiService.logout();
        await AsyncStorage.removeItem(STORAGE_KEY);
        setUser(null);
        setIsGuest(false);
        // Force re-init to get a fresh guest profile
        initAuth();
    };

    const updateLocalStats = async (gameType, stats) => {
        if (isGuest) {
            // Update locally for guests
            const updatedUser = { ...user };
            updatedUser.gamesPlayed = (updatedUser.gamesPlayed || 0) + 1;
            if (stats.won) updatedUser.gamesWon = (updatedUser.gamesWon || 0) + 1;

            // Simple XP for guests
            const xpGained = stats.won ? 100 : 25;
            updatedUser.xp = (updatedUser.xp || 0) + xpGained;
            updatedUser.totalXp = (updatedUser.totalXp || 0) + xpGained;

            // Level up
            while (updatedUser.xp >= 100) {
                updatedUser.xp -= 100;
                updatedUser.level = (updatedUser.level || 1) + 1;
            }

            setUser(updatedUser);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
            return { xpGained, newLevel: updatedUser.level, newXp: updatedUser.xp };
        } else {
            // Update on server for registered users
            const result = await ApiService.updateStats(gameType, stats);
            // Refresh user data
            const { user: updatedUser } = await ApiService.getProfile();
            setUser(updatedUser);
            return result;
        }
    };

    const refreshUser = async () => {
        if (!isGuest && user) {
            try {
                const { user: userData } = await ApiService.getProfile();
                setUser(userData);
            } catch (e) {
                console.error('Refresh user error:', e);
            }
        }
    };

    // Update profile picture (works for both guest and authenticated users)
    const updateProfilePicture = async (pictureUri) => {
        if (!user) return;

        const updatedUser = { ...user, profilePicture: pictureUri };
        setUser(updatedUser);

        if (isGuest) {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
        } else {
            // For authenticated users, could upload to server
            // For now, store locally
            await AsyncStorage.setItem('profilePicture', pictureUri);
        }

        return updatedUser;
    };

    // Update avatar emoji
    const updateAvatar = async (emoji) => {
        if (!user) return;

        const updatedUser = { ...user, avatar: emoji };
        setUser(updatedUser);

        if (isGuest) {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
        }

        return updatedUser;
    };

    const updateUsername = async (newUsername) => {
        if (!user || !newUsername) return;

        const updatedUser = { ...user, username: newUsername };
        setUser(updatedUser);

        if (isGuest) {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
        } else {
            // TODO: Implement API call for registered users
            // await ApiService.updateProfile({ username: newUsername });
        }
        return updatedUser;
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            isGuest,
            isAuthenticated: !!user,
            register,
            login,
            logout,
            continueAsGuest,
            updateLocalStats,
            refreshUser,
            updateProfilePicture,
            updateAvatar,
            updateUsername
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
