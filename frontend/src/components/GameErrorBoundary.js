import React from 'react';
import { View, StyleSheet } from 'react-native';
import NeonContainer from './NeonContainer';
import NeonText from './NeonText';
import NeonButton from './NeonButton';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

class GameErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service here
        console.error("GameErrorBoundary caught an error:", error, errorInfo);
    }

    handleReturnToLobby = () => {
        // DO NOT reset `hasError` to false here. 
        // Doing so forces the broken component to re-render and crash again immediately.
        // Keep the error UI mounted while we navigate away.
        
        // Use navigation if provided
        if (this.props.navigation) {
            try {
                this.props.navigation.reset({
                    index: 0,
                    routes: [{ name: 'Lobby', params: { fromError: true } }]
                });
            } catch (e) {
                this.props.navigation.navigate('Lobby');
            }
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <NeonContainer>
                    <View style={styles.container}>
                        <Ionicons name="warning" size={80} color={COLORS.hotPink} style={styles.icon} />
                        <NeonText size={28} weight="bold" color={COLORS.hotPink} style={styles.title}>
                            SYSTEM GLITCH
                        </NeonText>
                        <NeonText size={16} color={COLORS.white} style={styles.message}>
                            An unexpected error occurred in this game. Don't worry, the rest of the app is fine.
                        </NeonText>
                        <NeonButton 
                            title="RETURN TO LOBBY" 
                            onPress={this.handleReturnToLobby}
                            variant="primary"
                            color={COLORS.neonCyan}
                        />
                        {/* Optionally display error details in dev */}
                        {__DEV__ && this.state.error && (
                            <NeonText size={12} color={COLORS.textMuted} style={styles.errorText}>
                                {this.state.error.toString()}
                            </NeonText>
                        )}
                    </View>
                </NeonContainer>
            );
        }

        return this.props.children;
    }
}

const getStyles = (COLORS) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    icon: {
        marginBottom: 20,
    },
    title: {
        marginBottom: 15,
        textAlign: 'center',
    },
    message: {
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 24,
    },
    errorText: {
        marginTop: 40,
        textAlign: 'center',
        fontFamily: 'monospace',
    }
});

export default GameErrorBoundary;
