import { useEffect } from 'react';
import SocketService from '../services/socket';

/**
 * Shared hook for all online game screens.
 * Handles three universal responsibilities:
 *   1. Identity Persistence: Registers room data for auto-rejoin on disconnect.
 *   2. Early Termination: Handles 'game-ended-insufficient-players' (e.g. someone left).
 *   3. State Recovery: Handles 'game-state-sync' for full state hydration after a reconnect.
 *
 * @param {object} options
 * @param {object} options.navigation    - React Navigation object
 * @param {object} options.room          - Current room object
 * @param {string} options.playerName    - Current player's name
 * @param {string} options.userId        - Current player's persistent userId (optional, will try to find in room)
 * @param {string} options.exitScreen    - Screen to navigate to on early game end (default: 'Lobby')
 * @param {object} options.exitParams    - Params to pass to exitScreen
 * @param {function} options.onStateSync - Called with (data) when game-state-sync fires.
 */
export function useGameDisconnectHandler({ 
    navigation, 
    room, 
    playerName, 
    userId = null,
    exitScreen = 'Lobby', 
    exitParams = {}, 
    onStateSync = null 
}) {
    useEffect(() => {
        // 1. Register room data for persistence immediately
        if (room && playerName) {
            // Find current player data in room for avatar/userId recovery
            // room.players usually uses 'uid' for persistent userId and 'id' for socketId
            const me = room.players?.find(p => p.name === playerName || p.uid === userId || p.id === userId);
            const resolvedUserId = userId || me?.uid || me?.userId;

            console.log(`[useGameDisconnectHandler] Registering room persistence for ${playerName} (${resolvedUserId || 'no-id'}) in room ${room.id}`);
            
            SocketService.setRoomData(room.id, {
                name: playerName,
                avatar: me?.avatar,
                avatarColor: me?.avatarColor,
                userId: resolvedUserId
            });
        }

        const handleInsufficientPlayers = ({ message, finalScores }) => {
            console.log('[useGameDisconnectHandler] Game ended - not enough players:', message);
            try {
                navigation.navigate(exitScreen, {
                    ...exitParams,
                    gameEndedMessage: message,
                });
            } catch (e) {
                // exitScreen may no longer exist — fall back to Home
                navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
            }
        };

        const handleStateSync = (data) => {
            console.log('[useGameDisconnectHandler] Received game-state-sync');
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
    }, [navigation, room, playerName, userId, exitScreen, onStateSync]);
}
