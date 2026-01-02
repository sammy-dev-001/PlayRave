import { Platform } from 'react-native';

/**
 * HapticService - Provides haptic feedback for mobile devices
 * Uses expo-haptics on native platforms, gracefully degrades on web
 */

// Haptic impact styles
export const HapticStyle = {
    LIGHT: 'light',
    MEDIUM: 'medium',
    HEAVY: 'heavy',
};

// Notification types
export const NotificationType = {
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
};

class HapticService {
    isSupported = false;
    isEnabled = true;
    Haptics = null;

    async init() {
        // Only available on native platforms
        if (Platform.OS === 'web') {
            this.isSupported = false;
            console.log('HapticService: Not supported on web');
            return;
        }

        try {
            // Dynamically import expo-haptics
            const haptics = await import('expo-haptics');
            this.Haptics = haptics;
            this.isSupported = true;
            console.log('HapticService: Initialized successfully');
        } catch (error) {
            console.log('HapticService: expo-haptics not available', error);
            this.isSupported = false;
        }
    }

    /**
     * Enable or disable haptic feedback
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
    }

    /**
     * Check if haptics are available and enabled
     */
    canVibrate() {
        return this.isSupported && this.isEnabled && this.Haptics !== null;
    }

    /**
     * Trigger impact haptic feedback
     * @param {string} style - 'light', 'medium', or 'heavy'
     */
    async impact(style = HapticStyle.MEDIUM) {
        if (!this.canVibrate()) return;

        try {
            const impactStyle = {
                [HapticStyle.LIGHT]: this.Haptics.ImpactFeedbackStyle.Light,
                [HapticStyle.MEDIUM]: this.Haptics.ImpactFeedbackStyle.Medium,
                [HapticStyle.HEAVY]: this.Haptics.ImpactFeedbackStyle.Heavy,
            }[style] || this.Haptics.ImpactFeedbackStyle.Medium;

            await this.Haptics.impactAsync(impactStyle);
        } catch (error) {
            console.log('Haptic impact error:', error);
        }
    }

    /**
     * Trigger notification haptic feedback
     * @param {string} type - 'success', 'warning', or 'error'
     */
    async notification(type = NotificationType.SUCCESS) {
        if (!this.canVibrate()) return;

        try {
            const notificationType = {
                [NotificationType.SUCCESS]: this.Haptics.NotificationFeedbackType.Success,
                [NotificationType.WARNING]: this.Haptics.NotificationFeedbackType.Warning,
                [NotificationType.ERROR]: this.Haptics.NotificationFeedbackType.Error,
            }[type] || this.Haptics.NotificationFeedbackType.Success;

            await this.Haptics.notificationAsync(notificationType);
        } catch (error) {
            console.log('Haptic notification error:', error);
        }
    }

    /**
     * Trigger selection haptic feedback (subtle tap)
     */
    async selection() {
        if (!this.canVibrate()) return;

        try {
            await this.Haptics.selectionAsync();
        } catch (error) {
            console.log('Haptic selection error:', error);
        }
    }

    // === Convenience methods for common game events ===

    /**
     * Button tap feedback
     */
    async buttonTap() {
        await this.impact(HapticStyle.LIGHT);
    }

    /**
     * Correct answer feedback
     */
    async correctAnswer() {
        await this.notification(NotificationType.SUCCESS);
    }

    /**
     * Wrong answer feedback
     */
    async wrongAnswer() {
        await this.notification(NotificationType.ERROR);
    }

    /**
     * Game start feedback
     */
    async gameStart() {
        await this.impact(HapticStyle.HEAVY);
    }

    /**
     * Winner announcement feedback
     */
    async winner() {
        // Create a pattern of vibrations
        await this.impact(HapticStyle.HEAVY);
        setTimeout(() => this.impact(HapticStyle.MEDIUM), 150);
        setTimeout(() => this.impact(HapticStyle.LIGHT), 300);
    }

    /**
     * Timer tick feedback (for countdown)
     */
    async timerTick() {
        await this.selection();
    }

    /**
     * Card flip/reveal feedback
     */
    async cardFlip() {
        await this.impact(HapticStyle.MEDIUM);
    }

    /**
     * Error/warning feedback
     */
    async error() {
        await this.notification(NotificationType.ERROR);
    }

    /**
     * Success feedback
     */
    async success() {
        await this.notification(NotificationType.SUCCESS);
    }
}

// Create and export singleton
const hapticService = new HapticService();
export default hapticService;
