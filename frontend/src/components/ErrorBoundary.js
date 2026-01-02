import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { COLORS } from '../constants/theme';

/**
 * Error Boundary component that catches JavaScript errors anywhere in the child
 * component tree, logs those errors, and displays a fallback UI.
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log error to console (could be sent to analytics service)
        console.error('ErrorBoundary caught an error:', error);
        console.error('Error Info:', errorInfo);

        this.setState({ errorInfo });

        // If onError callback is provided, call it
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    handleRetry = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });

        // If onRetry callback is provided, call it
        if (this.props.onRetry) {
            this.props.onRetry();
        }
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI with neon theme
            return (
                <View style={styles.container}>
                    <View style={styles.content}>
                        <Text style={styles.icon}>⚠️</Text>
                        <Text style={styles.title}>Oops! Something went wrong</Text>
                        <Text style={styles.message}>
                            {this.props.errorMessage || "We're sorry, but something unexpected happened."}
                        </Text>

                        {__DEV__ && this.state.error && (
                            <View style={styles.errorDetails}>
                                <Text style={styles.errorText}>
                                    {this.state.error.toString()}
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={this.handleRetry}
                        >
                            <Text style={styles.retryButtonText}>🔄 Try Again</Text>
                        </TouchableOpacity>

                        {this.props.showHomeButton && (
                            <TouchableOpacity
                                style={styles.homeButton}
                                onPress={this.props.onGoHome}
                            >
                                <Text style={styles.homeButtonText}>🏠 Go Home</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.deepNightBlack,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        alignItems: 'center',
        maxWidth: 400,
    },
    icon: {
        fontSize: 60,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.neonCyan,
        textAlign: 'center',
        marginBottom: 15,
        textShadowColor: COLORS.neonCyan,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    message: {
        fontSize: 16,
        color: COLORS.white,
        textAlign: 'center',
        marginBottom: 30,
        opacity: 0.8,
        lineHeight: 24,
    },
    errorDetails: {
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        padding: 15,
        borderRadius: 8,
        marginBottom: 20,
        maxWidth: '100%',
        borderWidth: 1,
        borderColor: 'rgba(255, 0, 0, 0.3)',
    },
    errorText: {
        fontSize: 12,
        color: '#ff6b6b',
        fontFamily: 'monospace',
    },
    retryButton: {
        backgroundColor: COLORS.electricPurple,
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
        marginBottom: 15,
        shadowColor: COLORS.electricPurple,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 5,
    },
    retryButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.white,
        textAlign: 'center',
    },
    homeButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    homeButtonText: {
        fontSize: 16,
        color: COLORS.neonCyan,
        textAlign: 'center',
    },
});

export default ErrorBoundary;
