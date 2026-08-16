/**
 * OTAUpdateManager.js
 *
 * Silent background update strategy:
 *   1. On app launch, check for an available OTA update.
 *   2. If found, download it silently in the background — user sees nothing.
 *   3. Expo marks the new bundle as "pending".
 *   4. The next time the user cold-starts the app, Expo automatically boots
 *      the new bundle. No prompt, no interruption, no required reload.
 *
 * This mirrors how WhatsApp, Slack, Discord, etc. handle JS-level updates.
 *
 * Edge cases handled:
 *   - Re-checks every time the app comes back to the foreground (AppState).
 *   - Skipped entirely on web and in Expo Go / dev builds where Updates are
 *     no-ops, so it never throws in those environments.
 */

import React, { useEffect } from 'react';
import { Platform, AppState } from 'react-native';
import * as Updates from 'expo-updates';

export const OTAUpdateManager = ({ children }) => {
    useEffect(() => {
        // Updates API is a no-op on web and in Expo Go / dev builds.
        if (Platform.OS === 'web' || __DEV__) return;

        const silentlyFetchUpdate = async () => {
            try {
                const { isAvailable } = await Updates.checkForUpdateAsync();
                if (!isAvailable) return;

                // Download the update in the background.
                // Expo will automatically apply it on the next cold launch.
                await Updates.fetchUpdateAsync();
                // No prompt shown, no reloadAsync() called — user is never interrupted.
            } catch {
                // Silently swallow errors (no network, server unavailable, etc.)
            }
        };

        // Run on initial mount (app cold start).
        silentlyFetchUpdate();

        // Re-check every time the app comes back to the foreground so that if
        // an update ships while the user has the app minimised, it will be
        // ready before they next open the app from scratch.
        const subscription = AppState.addEventListener('change', (nextState) => {
            if (nextState === 'active') silentlyFetchUpdate();
        });

        return () => subscription.remove();
    }, []);

    // This component has no UI — it is a pure side-effect wrapper.
    return children;
};
