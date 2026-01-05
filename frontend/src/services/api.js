import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = __DEV__
    ? 'http://localhost:4000/api'
    : 'https://playrave-59ud.onrender.com/api';

class ApiService {
    token = null;

    async init() {
        try {
            this.token = await AsyncStorage.getItem('authToken');
        } catch (e) {
            console.error('Error loading token:', e);
        }
    }

    async setToken(token) {
        this.token = token;
        if (token) {
            await AsyncStorage.setItem('authToken', token);
        } else {
            await AsyncStorage.removeItem('authToken');
        }
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(this.token && { Authorization: `Bearer ${this.token}` }),
            ...options.headers,
        };

        try {
            const response = await fetch(url, { ...options, headers });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }
            return data;
        } catch (error) {
            console.error('API error:', error);
            throw error;
        }
    }

    // Auth endpoints
    async register(email, password, username) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, username }),
        });
        await this.setToken(data.token);
        return data;
    }

    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        await this.setToken(data.token);
        return data;
    }

    async getProfile() {
        return this.request('/auth/me');
    }

    async logout() {
        await this.setToken(null);
    }

    // Leaderboard
    async getLeaderboard() {
        return this.request('/leaderboard');
    }

    // Stats
    async updateStats(gameType, stats) {
        return this.request('/stats/update', {
            method: 'POST',
            body: JSON.stringify({ gameType, stats }),
        });
    }
}

export default new ApiService();
