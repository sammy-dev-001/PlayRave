import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Animated,
    ActivityIndicator
} from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

const AuthScreen = ({ navigation }) => {
    const { login, register, continueAsGuest } = useAuth();

    const [mode, setMode] = useState('welcome'); // welcome, login, register
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true })
        ]).start();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigation.replace('Home');
        } catch (e) {
            setError(e.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!email || !password || !username) {
            setError('Please fill in all fields');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await register(email, password, username);
            navigation.replace('Home');
        } catch (e) {
            setError(e.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGuest = async () => {
        setLoading(true);
        try {
            await continueAsGuest();
            navigation.replace('Home');
        } catch (e) {
            setError('Could not continue as guest');
        } finally {
            setLoading(false);
        }
    };

    const renderWelcome = () => (
        <Animated.View style={[styles.welcomeContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.logoSection}>
                <NeonText size={64} weight="bold" glow color={COLORS.hotPink}>🎮</NeonText>
                <NeonText size={42} weight="bold" glow style={styles.title}>PLAYRAVE</NeonText>
                <NeonText size={16} color="#888" style={styles.tagline}>
                    The Ultimate Party Game Experience
                </NeonText>
            </View>

            <View style={styles.buttonSection}>
                <NeonButton
                    title="CREATE ACCOUNT"
                    onPress={() => setMode('register')}
                    style={styles.mainButton}
                />
                <NeonButton
                    title="SIGN IN"
                    variant="secondary"
                    onPress={() => setMode('login')}
                    style={styles.mainButton}
                />
                <TouchableOpacity style={styles.guestButton} onPress={handleGuest} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color={COLORS.neonCyan} />
                    ) : (
                        <NeonText size={16} color={COLORS.neonCyan}>Continue as Guest</NeonText>
                    )}
                </TouchableOpacity>
                <NeonText size={12} color="#666" style={styles.guestNote}>
                    Guest progress is stored locally only
                </NeonText>
            </View>
        </Animated.View>
    );

    const renderForm = () => (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.formContainer}
        >
            <TouchableOpacity style={styles.backButton} onPress={() => setMode('welcome')}>
                <NeonText size={24}>←</NeonText>
            </TouchableOpacity>

            <NeonText size={28} weight="bold" glow style={styles.formTitle}>
                {mode === 'login' ? 'Welcome Back!' : 'Join the Party'}
            </NeonText>
            <NeonText size={14} color="#888" style={styles.formSubtitle}>
                {mode === 'login' ? 'Sign in to continue' : 'Create your account'}
            </NeonText>

            {mode === 'register' && (
                <View style={styles.inputContainer}>
                    <NeonText size={12} color={COLORS.neonCyan} style={styles.inputLabel}>USERNAME</NeonText>
                    <TextInput
                        style={styles.input}
                        placeholder="Choose a username"
                        placeholderTextColor="#555"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                    />
                </View>
            )}

            <View style={styles.inputContainer}>
                <NeonText size={12} color={COLORS.neonCyan} style={styles.inputLabel}>EMAIL</NeonText>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#555"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
            </View>

            <View style={styles.inputContainer}>
                <NeonText size={12} color={COLORS.neonCyan} style={styles.inputLabel}>PASSWORD</NeonText>
                <TextInput
                    style={styles.input}
                    placeholder="Enter password"
                    placeholderTextColor="#555"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>

            {error ? (
                <NeonText size={14} color={COLORS.hotPink} style={styles.error}>{error}</NeonText>
            ) : null}

            <NeonButton
                title={loading ? 'PLEASE WAIT...' : (mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT')}
                onPress={mode === 'login' ? handleLogin : handleRegister}
                disabled={loading}
                style={styles.submitButton}
            />

            <TouchableOpacity
                style={styles.switchMode}
                onPress={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
                <NeonText size={14} color="#888">
                    {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                    <NeonText size={14} color={COLORS.neonCyan}>
                        {mode === 'login' ? 'Sign up' : 'Sign in'}
                    </NeonText>
                </NeonText>
            </TouchableOpacity>
        </KeyboardAvoidingView>
    );

    return (
        <NeonContainer>
            {mode === 'welcome' ? renderWelcome() : renderForm()}
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    welcomeContainer: { flex: 1, justifyContent: 'space-between', paddingVertical: 60, paddingHorizontal: 30 },
    logoSection: { alignItems: 'center', marginTop: 60 },
    title: { marginTop: 10 },
    tagline: { marginTop: 10, textAlign: 'center' },
    buttonSection: { alignItems: 'center' },
    mainButton: { marginBottom: 15, width: '100%', maxWidth: 300 },
    guestButton: { marginTop: 20, padding: 15 },
    guestNote: { marginTop: 5 },
    formContainer: { flex: 1, paddingHorizontal: 30, paddingTop: 60 },
    backButton: { marginBottom: 20 },
    formTitle: { marginBottom: 5 },
    formSubtitle: { marginBottom: 30 },
    inputContainer: { marginBottom: 20 },
    inputLabel: { marginBottom: 8 },
    input: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    error: { marginBottom: 15, textAlign: 'center' },
    submitButton: { marginTop: 10 },
    switchMode: { marginTop: 25, alignItems: 'center' }
});

export default AuthScreen;
