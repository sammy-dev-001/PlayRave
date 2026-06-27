/**
 * gameNavigation.js — Shared Game Screen Router
 * ============================================================================
 * Central routing map from gameType → screen name + params.
 * Used by both LobbyScreen (on game-started) and JoinScreen (on mid-game rejoin)
 * so routing logic never drifts between the two entry points.
 * ============================================================================
 */
import { Alert } from 'react-native';

/**
 * Navigate to the correct game screen based on gameType.
 *
 * @param {object} navigation     — React Navigation prop
 * @param {object} room           — Current room snapshot from the server
 * @param {object|null} gameState — Game state from game-state-sync (may be null on first start)
 * @param {string} playerName     — Local player's display name
 * @param {boolean} isHost        — Whether the local player is the host
 * @param {object} extra          — Additional payload fields (question, statement, etc.)
 */
export function navigateToGame(navigation, room, gameState, playerName, isHost, extra = {}) {
    const gameType = room?.gameType || gameState?.type || extra?.gameType;

    if (!gameType) {
        console.warn('[gameNavigation] Cannot navigate: gameType is unknown.');
        return;
    }

    // Resolve category before building navParams so games that use it (truth-or-dare,
    // never-have-i-ever, hot-seat) receive it without a special switch case.
    // Left as undefined if not provided — the receiving screen applies its own default.
    // Previously defaulted to 'normal', which injected a misleading param into every game.
    const category = extra?.category || gameState?.category;

    const navParams = {
        // Spread extra FIRST so explicit fields below always win.
        ...extra,
        room,
        playerName,
        isHost,
        gameState,
        players: room?.players,
        hostParticipates: extra?.hostParticipates ?? true,
        // category is included for all games — harmless for games that ignore it,
        // and avoids a special case in the truth-or-dare switch branch.
        category,
    };

    // Gate behind NAV_DEBUG — consistent with DELTA_DEBUG approach in DeltaSyncManager.
    // Set NAV_DEBUG=true in your environment to enable navigation logging.
    if (process.env.NAV_DEBUG === 'true') {
        console.log(`[gameNavigation] Routing to game screen for: ${gameType}`);
    }

    switch (gameType) {
        case 'trivia':
            navigation.navigate('Question', {
                ...navParams,
                // questionIndex is not in extra — always start from 0 on new entry
                questionIndex: 0,
            });
            break;

        case 'myth-or-fact':
            navigation.navigate('MythOrFactQuestion', {
                ...navParams,
                // statementIndex is not in extra — always start from 0 on new entry
                statementIndex: 0,
            });
            break;

        case 'whos-most-likely':
            navigation.navigate('WhosMostLikelyQuestion', {
                ...navParams,
                prompt: null,        // Screen waits for whos-most-likely-round-start
                promptIndex: null,
                totalPrompts: gameState?.totalPrompts || null,
            });
            break;

        case 'neon-tap':
            navigation.navigate('NeonTapGame', navParams);
            break;

        case 'word-rush':
            navigation.navigate('WordRushGame', navParams);
            break;

        case 'whot':
            navigation.navigate('WhotGame', navParams);
            break;

        case 'truth-or-dare':
            // category is already in navParams (resolved before the switch).
            // No special case needed.
            navigation.navigate('OnlineTruthOrDareGame', navParams);
            break;

        case 'never-have-i-ever':
            navigation.navigate('OnlineNeverHaveIEver', navParams);
            break;

        case 'confession-roulette':
            navigation.navigate('ConfessionRoulette', navParams);
            break;

        case 'spill-the-tea':
            navigation.navigate('SpillTheTea', navParams);
            break;

        case 'imposter':
            navigation.navigate('Imposter', navParams);
            break;

        case 'unpopular-opinions':
            navigation.navigate('UnpopularOpinions', navParams);
            break;

        case 'hot-seat':
            navigation.navigate('HotSeat', navParams);
            break;

        case 'hot-seat-mc':
            navigation.navigate('HotSeatMC', navParams);
            break;

        case 'button-mash':
            navigation.navigate('ButtonMash', navParams);
            break;

        case 'type-race':
            navigation.navigate('TypeRace', navParams);
            break;

        case 'math-blitz':
            navigation.navigate('MathBlitz', navParams);
            break;

        case 'color-rush':
            navigation.navigate('ColorRush', navParams);
            break;

        case 'tic-tac-toe':
            navigation.navigate('TicTacToe', navParams);
            break;

        case 'draw-battle':
            navigation.navigate('DrawBattle', navParams);
            break;

        case 'scrabble':
            navigation.navigate('OnlineScrabble', navParams);
            break;

        case 'caption-this':
            navigation.navigate('CaptionThis', navParams);
            break;

        case 'auction-bluff':
            navigation.navigate('AuctionBluff', navParams);
            break;

        case 'speed-categories':
            navigation.navigate('SpeedCategories', navParams);
            break;

        default:
            console.warn(`[gameNavigation] No screen registered for gameType: "${gameType}"`);
            // If a game is in progress and we have no screen for it, dropping the player
            // into the Lobby leaves them stranded (Start Game is disabled, no way back in).
            // Navigate Home instead with a clear message.
            if (room?.gameState === 'PLAYING' || room?.gameState === 'GAMEOVER') {
                Alert.alert(
                    'Unknown Game',
                    `The game "${gameType}" is not supported by this version of the app. Please update PlayRave.`,
                    [{ text: 'Go Home', onPress: () => navigation.navigate('Home') }]
                );
            } else {
                // Safe to go to Lobby for pre-game states
                navigation.navigate('Lobby', { room, isHost, playerName });
            }
            break;
    }
}
