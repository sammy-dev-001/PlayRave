import React, { Suspense, lazy } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GameProvider } from '../context/GameContext';
import { AuthProvider } from '../context/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';
import LoadingScreen from '../components/LoadingScreen';
import { COLORS } from '../constants/theme';

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
const RapidFireCategoryScreen = lazy(() => import('../screens/RapidFireCategoryScreen'));
const RapidFireScreen = lazy(() => import('../screens/RapidFireScreen'));
const OnlineRapidFireCategoryScreen = lazy(() => import('../screens/OnlineRapidFireCategoryScreen'));
const OnlineRapidFireScreen = lazy(() => import('../screens/OnlineRapidFireScreen'));
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

const Stack = createNativeStackNavigator();

// Wrapper component for lazy-loaded screens
const withSuspense = (Component) => {
    return (props) => (
        <Suspense fallback={<LoadingScreen message="Loading game..." />}>
            <Component {...props} />
        </Suspense>
    );
};

// Create wrapped versions of lazy components
const LazyCustomQuestionsScreen = withSuspense(CustomQuestionsScreen);
const LazyQuestionScreen = withSuspense(QuestionScreen);
const LazyResultsScreen = withSuspense(ResultsScreen);
const LazyMythOrFactQuestionScreen = withSuspense(MythOrFactQuestionScreen);
const LazyMythOrFactResultsScreen = withSuspense(MythOrFactResultsScreen);
const LazyWhosMostLikelyQuestionScreen = withSuspense(WhosMostLikelyQuestionScreen);
const LazyWhosMostLikelyResultsScreen = withSuspense(WhosMostLikelyResultsScreen);
const LazyNeonTapGameScreen = withSuspense(NeonTapGameScreen);
const LazyNeonTapResultsScreen = withSuspense(NeonTapResultsScreen);
const LazyWordRushGameScreen = withSuspense(WordRushGameScreen);
const LazyWordRushResultsScreen = withSuspense(WordRushResultsScreen);
const LazyWordRushWinnerScreen = withSuspense(WordRushWinnerScreen);
const LazyTruthOrDareCategorySelectionScreen = withSuspense(TruthOrDareCategorySelectionScreen);
const LazyTruthOrDareGameScreen = withSuspense(TruthOrDareGameScreen);
const LazyOnlineTruthOrDareCategoryScreen = withSuspense(OnlineTruthOrDareCategoryScreen);
const LazyOnlineTruthOrDareGameScreen = withSuspense(OnlineTruthOrDareGameScreen);
const LazyWouldYouRatherScreen = withSuspense(WouldYouRatherScreen);
const LazySpinTheBottleScreen = withSuspense(SpinTheBottleScreen);
const LazyWhotGameScreen = withSuspense(WhotGameScreen);
const LazyScoreboardScreen = withSuspense(ScoreboardScreen);
const LazyNeverHaveIEverCategoryScreen = withSuspense(NeverHaveIEverCategoryScreen);
const LazyNeverHaveIEverScreen = withSuspense(NeverHaveIEverScreen);
const LazyOnlineNHIECategoryScreen = withSuspense(OnlineNHIECategoryScreen);
const LazyOnlineNeverHaveIEverScreen = withSuspense(OnlineNeverHaveIEverScreen);
const LazyRapidFireCategoryScreen = withSuspense(RapidFireCategoryScreen);
const LazyRapidFireScreen = withSuspense(RapidFireScreen);
const LazyOnlineRapidFireCategoryScreen = withSuspense(OnlineRapidFireCategoryScreen);
const LazyOnlineRapidFireScreen = withSuspense(OnlineRapidFireScreen);
const LazyScrabbleScreen = withSuspense(ScrabbleScreen);
const LazyOnlineScrabbleScreen = withSuspense(OnlineScrabbleScreen);
const LazyScrabbleDifficultyScreen = withSuspense(ScrabbleDifficultyScreen);
const LazyMVPVotingScreen = withSuspense(MVPVotingScreen);
const LazyTeamSetupScreen = withSuspense(TeamSetupScreen);
const LazyPlaylistSetupScreen = withSuspense(PlaylistSetupScreen);
const LazyCaptionThisScreen = withSuspense(CaptionThisScreen);
const LazySpeedCategoriesScreen = withSuspense(SpeedCategoriesScreen);
const LazyAuctionBluffScreen = withSuspense(AuctionBluffScreen);
const LazyMemoryChainScreen = withSuspense(MemoryChainScreen);
const LazySpectatorScreen = withSuspense(SpectatorScreen);
const LazyJoinSpectatorScreen = withSuspense(JoinSpectatorScreen);
const LazyConfessionRouletteScreen = withSuspense(ConfessionRouletteScreen);
const LazyImposterScreen = withSuspense(ImposterScreen);
const LazyUnpopularOpinionsScreen = withSuspense(UnpopularOpinionsScreen);

const AppNavigator = () => {
    return (
        <ErrorBoundary
            errorMessage="The app encountered an unexpected error. Please try again."
            showHomeButton={false}
        >
            <AuthProvider>
                <GameProvider>
                    <NavigationContainer>
                        <Stack.Navigator
                            screenOptions={{
                                headerShown: false,
                                contentStyle: { backgroundColor: COLORS.deepNightBlack }
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
                            <Stack.Screen name="RapidFireCategory" component={LazyRapidFireCategoryScreen} />
                            <Stack.Screen name="RapidFire" component={LazyRapidFireScreen} />
                            <Stack.Screen name="OnlineRapidFireCategory" component={LazyOnlineRapidFireCategoryScreen} />
                            <Stack.Screen name="OnlineRapidFire" component={LazyOnlineRapidFireScreen} />
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
                            <Stack.Screen name="HotSeat" component={withSuspense(lazy(() => import('../screens/HotSeatScreen')))} />
                            <Stack.Screen name="ButtonMash" component={withSuspense(lazy(() => import('../screens/ButtonMashScreen')))} />
                            <Stack.Screen name="TypeRace" component={withSuspense(lazy(() => import('../screens/TypeRaceScreen')))} />
                            <Stack.Screen name="MathBlitz" component={withSuspense(lazy(() => import('../screens/MathBlitzScreen')))} />
                            <Stack.Screen name="ColorRush" component={withSuspense(lazy(() => import('../screens/ColorRushScreen')))} />
                            <Stack.Screen name="MemoryMatch" component={withSuspense(lazy(() => import('../screens/MemoryMatchScreen')))} />
                            <Stack.Screen name="TicTacToe" component={withSuspense(lazy(() => import('../screens/TicTacToeScreen')))} />
                            <Stack.Screen name="DrawBattle" component={withSuspense(lazy(() => import('../screens/DrawBattleScreen')))} />
                            <Stack.Screen name="Auth" component={withSuspense(AuthScreen)} />
                            <Stack.Screen name="Leaderboard" component={withSuspense(LeaderboardScreen)} />
                            <Stack.Screen name="MyPacks" component={withSuspense(MyPacksScreen)} />
                            <Stack.Screen name="CommunityPacks" component={withSuspense(CommunityPacksScreen)} />
                            <Stack.Screen name="CustomPackEditor" component={withSuspense(CustomPackEditorScreen)} />
                            <Stack.Screen name="Challenges" component={withSuspense(ChallengesScreen)} />
                            <Stack.Screen name="LieDetector" component={withSuspense(lazy(() => import('../screens/LieDetectorScreen')))} />
                            <Stack.Screen name="LANMode" component={withSuspense(lazy(() => import('../screens/LANModeScreen')))} />
                        </Stack.Navigator>
                    </NavigationContainer>
                </GameProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
};

export default AppNavigator;
