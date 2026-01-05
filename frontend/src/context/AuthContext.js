import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';

const AuthContext = createContext(null);

// Guest user template for local storage
const createGuestUser = () => ({
    id: 'guest-' + Date.now(),
    username: 'Guest',
    avatar: '👤',
    level: 1,
    xp: 0,
    totalXp: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    isGuest: true,
    stats: {}
});

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
            await ApiService.init();

            // Check for saved auth token
            const token = await AsyncStorage.getItem('authToken');
            if (token) {
                try {
                    const { user: userData } = await ApiService.getProfile();
                    setUser(userData);
                    setIsGuest(false);
                } catch (e) {
                    // Token invalid, clear it
                    await AsyncStorage.removeItem('authToken');
                }
            } else {
                // Check for guest data
                const guestData = await AsyncStorage.getItem('guestUser');
                if (guestData) {
                    setUser(JSON.parse(guestData));
                    setIsGuest(true);
                }
            }
        } catch (e) {
            console.error('Auth init error:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (email, password, username) => {
        const { user: userData } = await ApiService.register(email, password, username);
        setUser(userData);
        setIsGuest(false);
        await AsyncStorage.removeItem('guestUser');
        return userData;
    };

    const login = async (email, password) => {
        const { user: userData } = await ApiService.login(email, password);
        setUser(userData);
        setIsGuest(false);
        await AsyncStorage.removeItem('guestUser');
        return userData;
    };

    const continueAsGuest = async () => {
        const guestUser = createGuestUser();
        await AsyncStorage.setItem('guestUser', JSON.stringify(guestUser));
        setUser(guestUser);
        setIsGuest(true);
        return guestUser;
    };

    const logout = async () => {
        await ApiService.logout();
        await AsyncStorage.removeItem('guestUser');
        setUser(null);
        setIsGuest(false);
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
            await AsyncStorage.setItem('guestUser', JSON.stringify(updatedUser));
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
            refreshUser
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
