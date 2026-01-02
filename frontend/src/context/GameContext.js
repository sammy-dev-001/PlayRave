import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import SocketService, { ConnectionState } from '../services/socket';
import { getRandomAvatar, getRandomColor } from '../data/avatars';

// Initial state
const initialState = {
    // Player info
    player: {
        name: '',
        avatar: null,
        avatarColor: null,
        id: null,
    },

    // Room state
    room: null,
    isHost: false,

    // Game state
    currentGame: null,
    gameSettings: {
        hostParticipates: true,
        category: 'normal',
    },

    // Connection state
    connectionState: ConnectionState.DISCONNECTED,
    latency: null,

    // UI state
    isLoading: false,
    error: null,
};

// Action types
const ActionTypes = {
    SET_PLAYER: 'SET_PLAYER',
    UPDATE_PLAYER: 'UPDATE_PLAYER',
    SET_ROOM: 'SET_ROOM',
    UPDATE_ROOM: 'UPDATE_ROOM',
    CLEAR_ROOM: 'CLEAR_ROOM',
    SET_HOST: 'SET_HOST',
    SET_CURRENT_GAME: 'SET_CURRENT_GAME',
    UPDATE_GAME_SETTINGS: 'UPDATE_GAME_SETTINGS',
    SET_CONNECTION_STATE: 'SET_CONNECTION_STATE',
    SET_LATENCY: 'SET_LATENCY',
    SET_LOADING: 'SET_LOADING',
    SET_ERROR: 'SET_ERROR',
    CLEAR_ERROR: 'CLEAR_ERROR',
    RESET_STATE: 'RESET_STATE',
};

// Reducer
function gameReducer(state, action) {
    switch (action.type) {
        case ActionTypes.SET_PLAYER:
            return {
                ...state,
                player: { ...state.player, ...action.payload },
            };

        case ActionTypes.UPDATE_PLAYER:
            return {
                ...state,
                player: { ...state.player, ...action.payload },
            };

        case ActionTypes.SET_ROOM:
            return {
                ...state,
                room: action.payload,
                isHost: action.payload?.players?.[0]?.id === state.player.id,
            };

        case ActionTypes.UPDATE_ROOM:
            return {
                ...state,
                room: action.payload,
                isHost: action.payload?.players?.find(p => p.id === state.player.id)?.isHost || false,
            };

        case ActionTypes.CLEAR_ROOM:
            return {
                ...state,
                room: null,
                isHost: false,
                currentGame: null,
            };

        case ActionTypes.SET_HOST:
            return {
                ...state,
                isHost: action.payload,
            };

        case ActionTypes.SET_CURRENT_GAME:
            return {
                ...state,
                currentGame: action.payload,
            };

        case ActionTypes.UPDATE_GAME_SETTINGS:
            return {
                ...state,
                gameSettings: { ...state.gameSettings, ...action.payload },
            };

        case ActionTypes.SET_CONNECTION_STATE:
            return {
                ...state,
                connectionState: action.payload,
            };

        case ActionTypes.SET_LATENCY:
            return {
                ...state,
                latency: action.payload,
            };

        case ActionTypes.SET_LOADING:
            return {
                ...state,
                isLoading: action.payload,
            };

        case ActionTypes.SET_ERROR:
            return {
                ...state,
                error: action.payload,
                isLoading: false,
            };

        case ActionTypes.CLEAR_ERROR:
            return {
                ...state,
                error: null,
            };

        case ActionTypes.RESET_STATE:
            return {
                ...initialState,
                player: {
                    ...initialState.player,
                    avatar: getRandomAvatar(),
                    avatarColor: getRandomColor(),
                },
            };

        default:
            return state;
    }
}

// Create context
const GameContext = createContext(null);

// Provider component
export function GameProvider({ children }) {
    const [state, dispatch] = useReducer(gameReducer, {
        ...initialState,
        player: {
            ...initialState.player,
            avatar: getRandomAvatar(),
            avatarColor: getRandomColor(),
        },
    });

    // Subscribe to socket connection state changes
    useEffect(() => {
        const unsubscribeConnection = SocketService.onConnectionStateChange((connectionState) => {
            dispatch({ type: ActionTypes.SET_CONNECTION_STATE, payload: connectionState });
        });

        const unsubscribeLatency = SocketService.onLatencyChange((latency) => {
            dispatch({ type: ActionTypes.SET_LATENCY, payload: latency });
        });

        return () => {
            unsubscribeConnection();
            unsubscribeLatency();
        };
    }, []);

    // Update player ID when socket connects
    useEffect(() => {
        if (state.connectionState === ConnectionState.CONNECTED && SocketService.socket?.id) {
            dispatch({
                type: ActionTypes.UPDATE_PLAYER,
                payload: { id: SocketService.socket.id }
            });
        }
    }, [state.connectionState]);

    // Store room data in socket service for auto-rejoin
    useEffect(() => {
        if (state.room && state.player.name) {
            SocketService.setRoomData(state.room.id, {
                name: state.player.name,
                avatar: state.player.avatar,
                avatarColor: state.player.avatarColor,
            });
        }
    }, [state.room, state.player]);

    // Action creators
    const actions = {
        setPlayer: useCallback((playerData) => {
            dispatch({ type: ActionTypes.SET_PLAYER, payload: playerData });
        }, []),

        updatePlayer: useCallback((updates) => {
            dispatch({ type: ActionTypes.UPDATE_PLAYER, payload: updates });
        }, []),

        setRoom: useCallback((room) => {
            dispatch({ type: ActionTypes.SET_ROOM, payload: room });
        }, []),

        updateRoom: useCallback((room) => {
            dispatch({ type: ActionTypes.UPDATE_ROOM, payload: room });
        }, []),

        clearRoom: useCallback(() => {
            SocketService.clearRoomData();
            dispatch({ type: ActionTypes.CLEAR_ROOM });
        }, []),

        setHost: useCallback((isHost) => {
            dispatch({ type: ActionTypes.SET_HOST, payload: isHost });
        }, []),

        setCurrentGame: useCallback((game) => {
            dispatch({ type: ActionTypes.SET_CURRENT_GAME, payload: game });
        }, []),

        updateGameSettings: useCallback((settings) => {
            dispatch({ type: ActionTypes.UPDATE_GAME_SETTINGS, payload: settings });
        }, []),

        setLoading: useCallback((isLoading) => {
            dispatch({ type: ActionTypes.SET_LOADING, payload: isLoading });
        }, []),

        setError: useCallback((error) => {
            dispatch({ type: ActionTypes.SET_ERROR, payload: error });
        }, []),

        clearError: useCallback(() => {
            dispatch({ type: ActionTypes.CLEAR_ERROR });
        }, []),

        resetState: useCallback(() => {
            SocketService.clearRoomData();
            dispatch({ type: ActionTypes.RESET_STATE });
        }, []),
    };

    const value = {
        state,
        ...actions,
        // Convenience getters
        isConnected: state.connectionState === ConnectionState.CONNECTED,
        isReconnecting: state.connectionState === ConnectionState.RECONNECTING,
        hasError: state.error !== null,
    };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
}

// Custom hook for using game context
export function useGame() {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
}

// Custom hook for player data only
export function usePlayer() {
    const { state, setPlayer, updatePlayer } = useGame();
    return {
        player: state.player,
        setPlayer,
        updatePlayer,
    };
}

// Custom hook for room data only
export function useRoom() {
    const { state, setRoom, updateRoom, clearRoom } = useGame();
    return {
        room: state.room,
        isHost: state.isHost,
        setRoom,
        updateRoom,
        clearRoom,
    };
}

// Custom hook for connection status only
export function useConnection() {
    const { state, isConnected, isReconnecting } = useGame();
    return {
        connectionState: state.connectionState,
        latency: state.latency,
        isConnected,
        isReconnecting,
    };
}

export { ActionTypes };
export default GameContext;
