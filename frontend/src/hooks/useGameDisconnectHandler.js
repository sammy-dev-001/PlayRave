import { useEffect, useRef } from 'react';
import SocketService from '../services/socket';
import LifecycleWatchdog from '../services/LifecycleWatchdog';

/**
 * Shared hook for all online game screens.
 * Handles four universal responsibilities:
 *   1. Identity Persistence: Registers room data for auto-rejoin on disconnect.
 *   2. Early Termination: Handles 'game-ended-insufficient-players' (e.g. someone left).
 *   3. Monotonic State Convergence & Gap Healing: Ignores stale broadcasts; detects
 *      version gaps and fetches HTTP snapshot to automatically heal dropped moves.
 *   4. Foreground Safety Net: 12-second gentle poll against GET /api/rooms/:roomId/state
 *      (returns 204 if in sync; heals if drifted).
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
    const localStateVersionRef = useRef(0);

    useEffect(() => {
        // 1. Register room data for persistence immediately
        if (room && playerName) {
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

        const handleInsufficientPlayers = ({ message }) => {
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

        const handleStateSync = async (data) => {
            if (!data) return;
            const incomingVersion = data.stateVersion || data.gameState?.stateVersion;

            if (incomingVersion !== undefined && incomingVersion !== null) {
                // Ignore stale / superseded broadcasts
                if (localStateVersionRef.current > 0 && incomingVersion <= localStateVersionRef.current) {
                    console.log(`[useGameDisconnectHandler] Stale state ${incomingVersion} <= current ${localStateVersionRef.current}. Ignoring.`);
                    return;
                }

                // Gap detected: missed intermediate broadcasts
                if (localStateVersionRef.current > 0 && incomingVersion > localStateVersionRef.current + 1 && room?.id) {
                    console.warn(`[useGameDisconnectHandler] Version gap detected (${localStateVersionRef.current} -> ${incomingVersion}) [Telemetry:version_gap_resync_count]. Healing via snapshot.`);
                    const snapshot = await SocketService.fetchRoomState(room.id, localStateVersionRef.current);
                    if (snapshot && !snapshot.synchronized && snapshot.gameState) {
                        localStateVersionRef.current = snapshot.stateVersion || incomingVersion;
                        if (onStateSync) onStateSync(snapshot);
                        return;
                    }
                }

                localStateVersionRef.current = incomingVersion;
            }

            console.log('[useGameDisconnectHandler] Applying state sync, version:', localStateVersionRef.current);
            if (onStateSync) {
                onStateSync(data);
            }
        };

        // 2. Foreground Turn Safety Net: 12-second gentle poll to resolve any silent desyncs
        const safetyPollInterval = setInterval(async () => {
            if (room?.id && SocketService.isConnected()) {
                const snapshot = await SocketService.fetchRoomState(room.id, localStateVersionRef.current);
                if (snapshot && !snapshot.synchronized && snapshot.gameState) {
                    console.log('[useGameDisconnectHandler] Safety net healed drifted state:', snapshot.stateVersion);
                    localStateVersionRef.current = snapshot.stateVersion;
                    if (onStateSync) onStateSync(snapshot);
                }
            }
        }, 12000);

        // 3. Wake listener to heal immediately on app resume
        const unsubscribeWake = LifecycleWatchdog.addWakeListener(async () => {
            if (room?.id) {
                const snapshot = await SocketService.fetchRoomState(room.id, localStateVersionRef.current);
                if (snapshot && !snapshot.synchronized && snapshot.gameState) {
                    console.log('[useGameDisconnectHandler] Wake snapshot healed state:', snapshot.stateVersion);
                    localStateVersionRef.current = snapshot.stateVersion;
                    if (onStateSync) onStateSync(snapshot);
                }
            }
        });

        SocketService.on('game-ended-insufficient-players', handleInsufficientPlayers);
        SocketService.on('game-state-sync', handleStateSync);

        return () => {
            clearInterval(safetyPollInterval);
            unsubscribeWake();
            SocketService.off('game-ended-insufficient-players', handleInsufficientPlayers);
            SocketService.off('game-state-sync', handleStateSync);
        };
    }, [navigation, room, playerName, userId, exitScreen, exitParams, onStateSync]);
}
