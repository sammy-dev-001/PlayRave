import { useEffect } from 'react';
import SocketService from '../services/socket';

/**
 * Shared hook for all online game screens.
 * Handles two universal events:
 *   - `game-ended-insufficient-players`: a player left mid-game, navigate out gracefully
 *   - `game-state-sync`: full state recovery after a reconnect
 *
 * @param {object} options
 * @param {object} options.navigation    - React Navigation object
 * @param {string} options.exitScreen    - Screen to navigate to on early game end (default: 'Lobby')
 * @param {object} options.exitParams    - Params to pass to exitScreen
 * @param {function} options.onStateSync - Called with (data) when game-state-sync fires. Handle your own game-type filter.
 */
export function useGameDisconnectHandler({ navigation, exitScreen = 'Lobby', exitParams = {}, onStateSync = null }) {
    useEffect(() => {
        const handleInsufficientPlayers = ({ message, finalScores }) => {
            console.log('[useGameDisconnectHandler] Game ended - not enough players:', message);
            try {
                navigation.navigate(exitScreen, {
                    ...exitParams,
                    gameEndedMessage: message,
                });
            } catch (e) {
                // exitScreen may no longer exist (e.g. room deleted) — fall back to Home
                navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
            }
        };

        const handleStateSync = (data) => {
            if (onStateSync) {
                onStateSync(data);
            }
        };

        SocketService.on('game-ended-insufficient-players', handleInsufficientPlayers);
        SocketService.on('game-state-sync', handleStateSync);

        return () => {
            SocketService.off('game-ended-insufficient-players', handleInsufficientPlayers);
            SocketService.off('game-state-sync', handleStateSync);
        };
    }, [navigation, exitScreen, onStateSync]);
}
