import React, { Suspense, lazy } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GameProvider } from '../context/GameContext';
import { AuthProvider } from '../context/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';
import GameErrorBoundary from '../components/GameErrorBoundary';
import LoadingScreen from '../components/LoadingScreen';
import ConnectionStatusOverlay from '../components/ConnectionStatusOverlay';
import { useTheme } from '../context/ThemeContext';


// Core screens - loaded immediately
import HomeScreen from '../screens/HomeScreen';
import JoinScreen from '../screens/JoinScreen';
import GameSelectionScreen from '../screens/GameSelectionScreen';
import LobbyScreen from '../screens/LobbyScreen';
import LocalPartySetupScreen from '../screens/LocalPartySetupScreen';
import LocalGameSelectionScreen from '../screens/LocalGameSelectionScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Auth screens
const AuthScreen = lazy(() => import('../screens/AuthScreen'));
const LeaderboardScreen = lazy(() => import('../screens/LeaderboardScreen'));
const MyPacksScreen = lazy(() => import('../screens/MyPacksScreen'));
const CommunityPacksScreen = lazy(() => import('../screens/CommunityPacksScreen'));
const CustomPackEditorScreen = lazy(() => import('../screens/CustomPackEditorScreen'));
const ChallengesScreen = lazy(() => import('../screens/ChallengesScreen'));
const WhispersHubScreen = lazy(() => import('../screens/WhispersHubScreen'));
const TriviaHubScreen = lazy(() => import('../screens/TriviaHubScreen'));

// Lazy-loaded game screens - loaded on demand
const CustomQuestionsScreen = lazy(() => import('../screens/CustomQuestionsScreen'));
const QuestionScreen = lazy(() => import('../screens/QuestionScreen'));
const ResultsScreen = lazy(() => import('../screens/ResultsScreen'));
const MythOrFactQuestionScreen = lazy(() => import('../screens/MythOrFactQuestionScreen'));
const MythOrFactResultsScreen = lazy(() => import('../screens/MythOrFactResultsScreen'));
const WhosMostLikelyQuestionScreen = lazy(() => import('../screens/WhosMostLikelyQuestionScreen'));
const WhosMostLikelyResultsScreen = lazy(() => import('../screens/WhosMostLikelyResultsScreen'));
const NeonTapGameScreen = lazy(() => import('../screens/NeonTapGameScreen'));
const NeonTapResultsScreen = lazy(() => import('../screens/NeonTapResultsScreen'));
const WordRushGameScreen = lazy(() => import('../screens/WordRushGameScreen'));
const WordRushResultsScreen = lazy(() => import('../screens/WordRushResultsScreen'));
const WordRushWinnerScreen = lazy(() => import('../screens/WordRushWinnerScreen'));
const TruthOrDareCategorySelectionScreen = lazy(() => import('../screens/TruthOrDareCategorySelectionScreen'));
const TruthOrDareGameScreen = lazy(() => import('../screens/TruthOrDareGameScreen'));
const OnlineTruthOrDareCategoryScreen = lazy(() => import('../screens/OnlineTruthOrDareCategoryScreen'));
const OnlineTruthOrDareGameScreen = lazy(() => import('../screens/OnlineTruthOrDareGameScreen'));
const WouldYouRatherScreen = lazy(() => import('../screens/WouldYouRatherScreen'));
const SpinTheBottleScreen = lazy(() => import('../screens/SpinTheBottleScreen'));
const WhotGameScreen = lazy(() => import('../screens/WhotGameScreen'));
const ScoreboardScreen = lazy(() => import('../screens/ScoreboardScreen'));
const NeverHaveIEverCategoryScreen = lazy(() => import('../screens/NeverHaveIEverCategoryScreen'));
const NeverHaveIEverScreen = lazy(() => import('../screens/NeverHaveIEverScreen'));
const OnlineNHIECategoryScreen = lazy(() => import('../screens/OnlineNHIECategoryScreen'));
const OnlineNeverHaveIEverScreen = lazy(() => import('../screens/OnlineNeverHaveIEverScreen'));
const ScrabbleScreen = lazy(() => import('../screens/ScrabbleScreen'));
const OnlineScrabbleScreen = lazy(() => import('../screens/OnlineScrabbleScreen'));
const ScrabbleDifficultyScreen = lazy(() => import('../screens/ScrabbleDifficultyScreen'));
const MVPVotingScreen = lazy(() => import('../screens/MVPVotingScreen'));
const TeamSetupScreen = lazy(() => import('../screens/TeamSetupScreen'));
const PlaylistSetupScreen = lazy(() => import('../screens/PlaylistSetupScreen'));
const CaptionThisScreen = lazy(() => import('../screens/CaptionThisScreen'));
const SpeedCategoriesScreen = lazy(() => import('../screens/SpeedCategoriesScreen'));
const AuctionBluffScreen = lazy(() => import('../screens/AuctionBluffScreen'));
const MemoryChainScreen = lazy(() => import('../screens/MemoryChainScreen'));
const SpectatorScreen = lazy(() => import('../screens/SpectatorScreen'));
const JoinSpectatorScreen = lazy(() => import('../screens/JoinSpectatorScreen'));
const ConfessionRouletteScreen = lazy(() => import('../screens/ConfessionRouletteScreen'));
const ImposterScreen = lazy(() => import('../screens/ImposterScreen'));
const UnpopularOpinionsScreen = lazy(() => import('../screens/UnpopularOpinionsScreen'));
const TicTacToeDifficultyScreen = lazy(() => import('../screens/TicTacToeDifficultyScreen'));
const LocalTicTacToeScreen = lazy(() => import('../screens/LocalTicTacToeScreen'));
const SettingsScreen = lazy(() => import('../screens/SettingsScreen'));
const SpillTheTeaScreen = lazy(() => import('../screens/SpillTheTeaScreen'));
const HotSeatScreen = lazy(() => import('../screens/HotSeatScreen'));
const HotSeatCategoryScreen = lazy(() => import('../screens/HotSeatCategoryScreen'));
const HotSeatMCScreen = lazy(() => import('../screens/HotSeatMCScreen'));
const ButtonMashScreen = lazy(() => import('../screens/ButtonMashScreen'));
const TypeRaceScreen = lazy(() => import('../screens/TypeRaceScreen'));
const MathBlitzScreen = lazy(() => import('../screens/MathBlitzScreen'));
const ColorRushScreen = lazy(() => import('../screens/ColorRushScreen'));
const MemoryMatchScreen = lazy(() => import('../screens/MemoryMatchScreen'));
const TicTacToeScreen = lazy(() => import('../screens/TicTacToeScreen'));
const DrawBattleScreen = lazy(() => import('../screens/DrawBattleScreen'));
const LieDetectorScreen = lazy(() => import('../screens/LieDetectorScreen'));
const LANModeScreen = lazy(() => import('../screens/LANModeScreen'));
const LocalCharadesScreen = lazy(() => import('../screens/LocalCharadesScreen'));
const LocalTriviaScreen = lazy(() => import('../screens/LocalTriviaScreen'));

// Tournament screens
const TournamentSetupScreen = lazy(() => import('../screens/TournamentSetupScreen'));
const TournamentLobbyScreen = lazy(() => import('../screens/TournamentLobbyScreen'));
const TournamentResultsScreen = lazy(() => import('../screens/TournamentResultsScreen'));

const Stack = createNativeStackNavigator();

// Wrapper component for lazy-loaded screens
const withSuspense = (Component) => {
    return (props) => (
        <Suspense fallback={<LoadingScreen message="Loading game..." />}>
            <Component {...props} />
        </Suspense>
    );
};

// Wrapper for game screens that adds an Error Boundary
const withSuspenseAndBoundary = (Component) => {
    return (props) => (
        <GameErrorBoundary navigation={props.navigation}>
            <Suspense fallback={<LoadingScreen message="Loading game..." />}>
                <Component {...props} />
            </Suspense>
        </GameErrorBoundary>
    );
};

// Create wrapped versions of lazy components
const LazyCustomQuestionsScreen = withSuspenseAndBoundary(CustomQuestionsScreen);
const LazyQuestionScreen = withSuspenseAndBoundary(QuestionScreen);
const LazyResultsScreen = withSuspenseAndBoundary(ResultsScreen);
const LazyMythOrFactQuestionScreen = withSuspenseAndBoundary(MythOrFactQuestionScreen);
const LazyMythOrFactResultsScreen = withSuspenseAndBoundary(MythOrFactResultsScreen);
const LazyWhosMostLikelyQuestionScreen = withSuspenseAndBoundary(WhosMostLikelyQuestionScreen);
const LazyWhosMostLikelyResultsScreen = withSuspenseAndBoundary(WhosMostLikelyResultsScreen);
const LazyNeonTapGameScreen = withSuspenseAndBoundary(NeonTapGameScreen);
const LazyNeonTapResultsScreen = withSuspenseAndBoundary(NeonTapResultsScreen);
const LazyWordRushGameScreen = withSuspenseAndBoundary(WordRushGameScreen);
const LazyWordRushResultsScreen = withSuspenseAndBoundary(WordRushResultsScreen);
const LazyWordRushWinnerScreen = withSuspenseAndBoundary(WordRushWinnerScreen);
const LazyTruthOrDareCategorySelectionScreen = withSuspenseAndBoundary(TruthOrDareCategorySelectionScreen);
const LazyTruthOrDareGameScreen = withSuspenseAndBoundary(TruthOrDareGameScreen);
const LazyOnlineTruthOrDareCategoryScreen = withSuspenseAndBoundary(OnlineTruthOrDareCategoryScreen);
const LazyOnlineTruthOrDareGameScreen = withSuspenseAndBoundary(OnlineTruthOrDareGameScreen);
const LazyWouldYouRatherScreen = withSuspenseAndBoundary(WouldYouRatherScreen);
const LazySpinTheBottleScreen = withSuspenseAndBoundary(SpinTheBottleScreen);
const LazyWhotGameScreen = withSuspenseAndBoundary(WhotGameScreen);
const LazyScoreboardScreen = withSuspenseAndBoundary(ScoreboardScreen);
const LazyNeverHaveIEverCategoryScreen = withSuspenseAndBoundary(NeverHaveIEverCategoryScreen);
const LazyNeverHaveIEverScreen = withSuspenseAndBoundary(NeverHaveIEverScreen);
const LazyOnlineNHIECategoryScreen = withSuspenseAndBoundary(OnlineNHIECategoryScreen);
const LazyOnlineNeverHaveIEverScreen = withSuspenseAndBoundary(OnlineNeverHaveIEverScreen);
const LazyScrabbleScreen = withSuspenseAndBoundary(ScrabbleScreen);
const LazyOnlineScrabbleScreen = withSuspenseAndBoundary(OnlineScrabbleScreen);
const LazyScrabbleDifficultyScreen = withSuspenseAndBoundary(ScrabbleDifficultyScreen);
const LazyTicTacToeDifficultyScreen = withSuspenseAndBoundary(TicTacToeDifficultyScreen);
const LazyLocalTicTacToeScreen = withSuspenseAndBoundary(LocalTicTacToeScreen);
const LazyMVPVotingScreen = withSuspenseAndBoundary(MVPVotingScreen);
const LazyTeamSetupScreen = withSuspenseAndBoundary(TeamSetupScreen);
const LazyPlaylistSetupScreen = withSuspenseAndBoundary(PlaylistSetupScreen);
const LazyCaptionThisScreen = withSuspenseAndBoundary(CaptionThisScreen);
const LazySpeedCategoriesScreen = withSuspenseAndBoundary(SpeedCategoriesScreen);
const LazyAuctionBluffScreen = withSuspenseAndBoundary(AuctionBluffScreen);
const LazyMemoryChainScreen = withSuspenseAndBoundary(MemoryChainScreen);
const LazySpectatorScreen = withSuspenseAndBoundary(SpectatorScreen);
const LazyJoinSpectatorScreen = withSuspenseAndBoundary(JoinSpectatorScreen);
const LazyConfessionRouletteScreen = withSuspenseAndBoundary(ConfessionRouletteScreen);
const LazyImposterScreen = withSuspenseAndBoundary(ImposterScreen);
const LazyUnpopularOpinionsScreen = withSuspenseAndBoundary(UnpopularOpinionsScreen);
const LazySettingsScreen = withSuspense(SettingsScreen); // Settings doesn't need GameErrorBoundary
const LazyTournamentSetupScreen = withSuspense(TournamentSetupScreen);
const LazyTournamentLobbyScreen = withSuspense(TournamentLobbyScreen);
const LazyTournamentResultsScreen = withSuspense(TournamentResultsScreen);
const LazySpillTheTeaScreen = withSuspenseAndBoundary(SpillTheTeaScreen);
const LazyHotSeatScreen = withSuspenseAndBoundary(HotSeatScreen);
const LazyHotSeatCategoryScreen = withSuspenseAndBoundary(HotSeatCategoryScreen);
const LazyHotSeatMCScreen = withSuspenseAndBoundary(HotSeatMCScreen);
const LazyButtonMashScreen = withSuspenseAndBoundary(ButtonMashScreen);
const LazyTypeRaceScreen = withSuspenseAndBoundary(TypeRaceScreen);
const LazyMathBlitzScreen = withSuspenseAndBoundary(MathBlitzScreen);
const LazyColorRushScreen = withSuspenseAndBoundary(ColorRushScreen);
const LazyMemoryMatchScreen = withSuspenseAndBoundary(MemoryMatchScreen);
const LazyTicTacToeScreen = withSuspenseAndBoundary(TicTacToeScreen);
const LazyDrawBattleScreen = withSuspenseAndBoundary(DrawBattleScreen);
const LazyLieDetectorScreen = withSuspenseAndBoundary(LieDetectorScreen);
const LazyLANModeScreen = withSuspense(LANModeScreen);
const LazyLocalCharadesScreen = withSuspenseAndBoundary(LocalCharadesScreen);
const LazyLocalTriviaScreen = withSuspenseAndBoundary(LocalTriviaScreen);
const LazyWhispersHubScreen = withSuspense(WhispersHubScreen);
const LazyTriviaHubScreen = withSuspense(TriviaHubScreen);

const AppNavigator = () => {
    const { COLORS } = useTheme();
    return (
        <ErrorBoundary
            errorMessage="The app encountered an unexpected error. Please try again."
            showHomeButton={false}
        >
            <AuthProvider>
                <GameProvider>
                    <View style={{ flex: 1 }}>
                        <NavigationContainer>
                            <Stack.Navigator
                                screenOptions={{
                                    headerShown: false,
                                    contentStyle: { backgroundColor: COLORS.background }
                                }}
                                initialRouteName="Home"
                            >
                                {/* Core screens - loaded immediately */}
                                <Stack.Screen name="Home" component={HomeScreen} />
                                <Stack.Screen name="Join" component={JoinScreen} />
                                <Stack.Screen name="GameSelection" component={GameSelectionScreen} />
                                <Stack.Screen name="Lobby" component={LobbyScreen} />
                                <Stack.Screen name="LocalPartySetup" component={LocalPartySetupScreen} />
                                <Stack.Screen name="LocalGameSelection" component={LocalGameSelectionScreen} />
                                <Stack.Screen name="Profile" component={ProfileScreen} />
                                <Stack.Screen name="Settings" component={LazySettingsScreen} />

                                {/* Tournament screens */}
                                <Stack.Screen name="TournamentSetup" component={LazyTournamentSetupScreen} />
                                <Stack.Screen name="TournamentLobby" component={LazyTournamentLobbyScreen} />
                                <Stack.Screen name="TournamentResults" component={LazyTournamentResultsScreen} />

                                {/* Lazy-loaded game screens */}
                                <Stack.Screen name="CustomQuestions" component={LazyCustomQuestionsScreen} />
                                <Stack.Screen name="Question" component={LazyQuestionScreen} />
                                <Stack.Screen name="Results" component={LazyResultsScreen} />
                                <Stack.Screen name="MythOrFactQuestion" component={LazyMythOrFactQuestionScreen} />
                                <Stack.Screen name="MythOrFactResults" component={LazyMythOrFactResultsScreen} />
                                <Stack.Screen name="WhosMostLikelyQuestion" component={LazyWhosMostLikelyQuestionScreen} />
                                <Stack.Screen name="WhosMostLikelyResults" component={LazyWhosMostLikelyResultsScreen} />
                                <Stack.Screen name="NeonTapGame" component={LazyNeonTapGameScreen} />
                                <Stack.Screen name="NeonTapResults" component={LazyNeonTapResultsScreen} />
                                <Stack.Screen name="WordRushGame" component={LazyWordRushGameScreen} />
                                <Stack.Screen name="WordRushResults" component={LazyWordRushResultsScreen} />
                                <Stack.Screen name="WordRushWinner" component={LazyWordRushWinnerScreen} />
                                <Stack.Screen name="TruthOrDareCategorySelection" component={LazyTruthOrDareCategorySelectionScreen} />
                                <Stack.Screen name="TruthOrDareGame" component={LazyTruthOrDareGameScreen} />
                                <Stack.Screen name="OnlineTruthOrDareCategory" component={LazyOnlineTruthOrDareCategoryScreen} />
                                <Stack.Screen name="OnlineTruthOrDareGame" component={LazyOnlineTruthOrDareGameScreen} />
                                <Stack.Screen name="WouldYouRather" component={LazyWouldYouRatherScreen} />
                                <Stack.Screen name="SpinTheBottle" component={LazySpinTheBottleScreen} />
                                <Stack.Screen name="WhotGame" component={LazyWhotGameScreen} />
                                <Stack.Screen name="Scoreboard" component={LazyScoreboardScreen} />
                                <Stack.Screen name="NeverHaveIEverCategory" component={LazyNeverHaveIEverCategoryScreen} />
                                <Stack.Screen name="NeverHaveIEver" component={LazyNeverHaveIEverScreen} />
                                <Stack.Screen name="OnlineNHIECategory" component={LazyOnlineNHIECategoryScreen} />
                                <Stack.Screen name="OnlineNeverHaveIEver" component={LazyOnlineNeverHaveIEverScreen} />
                                <Stack.Screen name="Scrabble" component={LazyScrabbleScreen} />
                                <Stack.Screen name="OnlineScrabble" component={LazyOnlineScrabbleScreen} />
                                <Stack.Screen name="ScrabbleDifficulty" component={LazyScrabbleDifficultyScreen} />
                                <Stack.Screen name="ScrabbleAI" component={LazyScrabbleScreen} />
                                <Stack.Screen name="MVPVoting" component={LazyMVPVotingScreen} />
                                <Stack.Screen name="TeamSetup" component={LazyTeamSetupScreen} />
                                <Stack.Screen name="PlaylistSetup" component={LazyPlaylistSetupScreen} />
                                <Stack.Screen name="CaptionThis" component={LazyCaptionThisScreen} />
                                <Stack.Screen name="SpeedCategories" component={LazySpeedCategoriesScreen} />
                                <Stack.Screen name="AuctionBluff" component={LazyAuctionBluffScreen} />
                                <Stack.Screen name="MemoryChain" component={LazyMemoryChainScreen} />
                                <Stack.Screen name="Spectator" component={LazySpectatorScreen} />
                                <Stack.Screen name="JoinSpectator" component={LazyJoinSpectatorScreen} />
                                <Stack.Screen name="ConfessionRoulette" component={LazyConfessionRouletteScreen} />
                                <Stack.Screen name="Imposter" component={LazyImposterScreen} />
                                <Stack.Screen name="UnpopularOpinions" component={LazyUnpopularOpinionsScreen} />
                                <Stack.Screen name="SpillTheTea" component={LazySpillTheTeaScreen} />
                                <Stack.Screen name="HotSeat" component={LazyHotSeatScreen} />
                                <Stack.Screen name="HotSeatCategory" component={LazyHotSeatCategoryScreen} />
                                <Stack.Screen name="HotSeatMC" component={LazyHotSeatMCScreen} />
                                <Stack.Screen name="ButtonMash" component={LazyButtonMashScreen} />
                                <Stack.Screen name="TypeRace" component={LazyTypeRaceScreen} />
                                <Stack.Screen name="MathBlitz" component={LazyMathBlitzScreen} />
                                <Stack.Screen name="ColorRush" component={LazyColorRushScreen} />
                                <Stack.Screen name="MemoryMatch" component={LazyMemoryMatchScreen} />
                                <Stack.Screen name="TicTacToe" component={LazyTicTacToeScreen} />
                                <Stack.Screen name="TicTacToeDifficulty" component={LazyTicTacToeDifficultyScreen} />
                                <Stack.Screen name="LocalTrivia" component={LazyLocalTriviaScreen} />
                                <Stack.Screen name="LocalTicTacToe" component={LazyLocalTicTacToeScreen} />
                                <Stack.Screen name="DrawBattle" component={LazyDrawBattleScreen} />
                                <Stack.Screen name="Auth" component={withSuspense(AuthScreen)} />
                                <Stack.Screen name="Leaderboard" component={withSuspense(LeaderboardScreen)} />
                                <Stack.Screen name="MyPacks" component={withSuspense(MyPacksScreen)} />
                                <Stack.Screen name="CommunityPacks" component={withSuspense(CommunityPacksScreen)} />
                                <Stack.Screen name="CustomPackEditor" component={withSuspense(CustomPackEditorScreen)} />
                                <Stack.Screen name="Challenges" component={withSuspense(ChallengesScreen)} />
                                <Stack.Screen name="LieDetector" component={LazyLieDetectorScreen} />
                                <Stack.Screen name="LANMode" component={LazyLANModeScreen} />
                                <Stack.Screen name="LocalCharades" component={LazyLocalCharadesScreen} />
                                <Stack.Screen name="WhispersHub" component={LazyWhispersHubScreen} />
                                <Stack.Screen name="TriviaHub" component={LazyTriviaHubScreen} />
                            </Stack.Navigator>
                        </NavigationContainer>
                        <ConnectionStatusOverlay />
                    </View>
                </GameProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
};

export default AppNavigator;
