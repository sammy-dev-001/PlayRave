import React, { lazy } from 'react';
import JoinScreen from '../../screens/JoinScreen';
import GameSelectionScreen from '../../screens/GameSelectionScreen';
import LobbyScreen from '../../screens/LobbyScreen';
import { withSuspenseAndBoundary } from '../NavigationUtils';

// Lazy-loaded game screens
const CustomQuestionsScreen = lazy(() => import('../../screens/CustomQuestionsScreen'));
const QuestionScreen = lazy(() => import('../../screens/QuestionScreen'));
const ResultsScreen = lazy(() => import('../../screens/ResultsScreen'));
const MythOrFactQuestionScreen = lazy(() => import('../../screens/MythOrFactQuestionScreen'));
const MythOrFactResultsScreen = lazy(() => import('../../screens/MythOrFactResultsScreen'));
const WhosMostLikelyQuestionScreen = lazy(() => import('../../screens/WhosMostLikelyQuestionScreen'));
const WhosMostLikelyResultsScreen = lazy(() => import('../../screens/WhosMostLikelyResultsScreen'));
const NeonTapGameScreen = lazy(() => import('../../screens/NeonTapGameScreen'));
const NeonTapResultsScreen = lazy(() => import('../../screens/NeonTapResultsScreen'));
const WordRushGameScreen = lazy(() => import('../../screens/WordRushGameScreen'));
const WordRushResultsScreen = lazy(() => import('../../screens/WordRushResultsScreen'));
const WordRushWinnerScreen = lazy(() => import('../../screens/WordRushWinnerScreen'));
const TruthOrDareCategorySelectionScreen = lazy(() => import('../../screens/TruthOrDareCategorySelectionScreen'));
const TruthOrDareGameScreen = lazy(() => import('../../screens/TruthOrDareGameScreen'));
const OnlineTruthOrDareCategoryScreen = lazy(() => import('../../screens/OnlineTruthOrDareCategoryScreen'));
const OnlineTruthOrDareGameScreen = lazy(() => import('../../screens/OnlineTruthOrDareGameScreen'));
const WouldYouRatherScreen = lazy(() => import('../../screens/WouldYouRatherScreen'));
const SpinTheBottleScreen = lazy(() => import('../../screens/SpinTheBottleScreen'));
const WhotGameScreen = lazy(() => import('../../screens/WhotGameScreen'));
const ScoreboardScreen = lazy(() => import('../../screens/ScoreboardScreen'));
const NeverHaveIEverCategoryScreen = lazy(() => import('../../screens/NeverHaveIEverCategoryScreen'));
const NeverHaveIEverScreen = lazy(() => import('../../screens/NeverHaveIEverScreen'));
const OnlineNHIECategoryScreen = lazy(() => import('../../screens/OnlineNHIECategoryScreen'));
const OnlineNeverHaveIEverScreen = lazy(() => import('../../screens/OnlineNeverHaveIEverScreen'));
const ScrabbleScreen = lazy(() => import('../../screens/ScrabbleScreen'));
const OnlineScrabbleScreen = lazy(() => import('../../screens/OnlineScrabbleScreen'));
const ScrabbleDifficultyScreen = lazy(() => import('../../screens/ScrabbleDifficultyScreen'));
const MVPVotingScreen = lazy(() => import('../../screens/MVPVotingScreen'));
const TeamSetupScreen = lazy(() => import('../../screens/TeamSetupScreen'));
const PlaylistSetupScreen = lazy(() => import('../../screens/PlaylistSetupScreen'));
const CaptionThisScreen = lazy(() => import('../../screens/CaptionThisScreen'));
const SpeedCategoriesScreen = lazy(() => import('../../screens/SpeedCategoriesScreen'));
const AuctionBluffScreen = lazy(() => import('../../screens/AuctionBluffScreen'));
const MemoryChainScreen = lazy(() => import('../../screens/MemoryChainScreen'));
const SpectatorScreen = lazy(() => import('../../screens/SpectatorScreen'));
const JoinSpectatorScreen = lazy(() => import('../../screens/JoinSpectatorScreen'));
const ConfessionRouletteScreen = lazy(() => import('../../screens/ConfessionRouletteScreen'));
const ImposterScreen = lazy(() => import('../../screens/ImposterScreen'));
const UnpopularOpinionsScreen = lazy(() => import('../../screens/UnpopularOpinionsScreen'));
const TicTacToeDifficultyScreen = lazy(() => import('../../screens/TicTacToeDifficultyScreen'));
const SpillTheTeaScreen = lazy(() => import('../../screens/SpillTheTeaScreen'));
const HotSeatScreen = lazy(() => import('../../screens/HotSeatScreen'));
const HotSeatCategoryScreen = lazy(() => import('../../screens/HotSeatCategoryScreen'));
const HotSeatMCScreen = lazy(() => import('../../screens/HotSeatMCScreen'));
const ButtonMashScreen = lazy(() => import('../../screens/ButtonMashScreen'));
const TypeRaceScreen = lazy(() => import('../../screens/TypeRaceScreen'));
const MathBlitzScreen = lazy(() => import('../../screens/MathBlitzScreen'));
const ColorRushScreen = lazy(() => import('../../screens/ColorRushScreen'));
const MemoryMatchScreen = lazy(() => import('../../screens/MemoryMatchScreen'));
const TicTacToeScreen = lazy(() => import('../../screens/TicTacToeScreen'));
const DrawBattleScreen = lazy(() => import('../../screens/DrawBattleScreen'));
const LieDetectorScreen = lazy(() => import('../../screens/LieDetectorScreen'));
const RealTalkCategoryScreen = lazy(() => import('../../screens/RealTalkCategoryScreen'));
const RealTalkScreen = lazy(() => import('../../screens/RealTalkScreen'));
const OnlineRealTalkCategoryScreen = lazy(() => import('../../screens/OnlineRealTalkCategoryScreen'));
const OnlineRealTalkScreen = lazy(() => import('../../screens/OnlineRealTalkScreen'));

export const OnlinePlayGroup = (Stack) => (
    <Stack.Group>
        <Stack.Screen name="Join" component={JoinScreen} />
        <Stack.Screen name="GameSelection" component={GameSelectionScreen} />
        <Stack.Screen name="Lobby" component={LobbyScreen} />
        <Stack.Screen name="CustomQuestions" component={withSuspenseAndBoundary(CustomQuestionsScreen)} />
        <Stack.Screen name="Question" component={withSuspenseAndBoundary(QuestionScreen)} />
        <Stack.Screen name="Results" component={withSuspenseAndBoundary(ResultsScreen)} />
        <Stack.Screen name="MythOrFactQuestion" component={withSuspenseAndBoundary(MythOrFactQuestionScreen)} />
        <Stack.Screen name="MythOrFactResults" component={withSuspenseAndBoundary(MythOrFactResultsScreen)} />
        <Stack.Screen name="WhosMostLikelyQuestion" component={withSuspenseAndBoundary(WhosMostLikelyQuestionScreen)} />
        <Stack.Screen name="WhosMostLikelyResults" component={withSuspenseAndBoundary(WhosMostLikelyResultsScreen)} />
        <Stack.Screen name="NeonTapGame" component={withSuspenseAndBoundary(NeonTapGameScreen)} />
        <Stack.Screen name="NeonTapResults" component={withSuspenseAndBoundary(NeonTapResultsScreen)} />
        <Stack.Screen name="WordRushGame" component={withSuspenseAndBoundary(WordRushGameScreen)} />
        <Stack.Screen name="WordRushResults" component={withSuspenseAndBoundary(WordRushResultsScreen)} />
        <Stack.Screen name="WordRushWinner" component={withSuspenseAndBoundary(WordRushWinnerScreen)} />
        <Stack.Screen name="TruthOrDareCategorySelection" component={withSuspenseAndBoundary(TruthOrDareCategorySelectionScreen)} />
        <Stack.Screen name="TruthOrDareGame" component={withSuspenseAndBoundary(TruthOrDareGameScreen)} />
        <Stack.Screen name="OnlineTruthOrDareCategory" component={withSuspenseAndBoundary(OnlineTruthOrDareCategoryScreen)} />
        <Stack.Screen name="OnlineTruthOrDareGame" component={withSuspenseAndBoundary(OnlineTruthOrDareGameScreen)} />
        <Stack.Screen name="WouldYouRather" component={withSuspenseAndBoundary(WouldYouRatherScreen)} />
        <Stack.Screen name="SpinTheBottle" component={withSuspenseAndBoundary(SpinTheBottleScreen)} />
        <Stack.Screen name="WhotGame" component={withSuspenseAndBoundary(WhotGameScreen)} />
        <Stack.Screen name="Scoreboard" component={withSuspenseAndBoundary(ScoreboardScreen)} />
        <Stack.Screen name="NeverHaveIEverCategory" component={withSuspenseAndBoundary(NeverHaveIEverCategoryScreen)} />
        <Stack.Screen name="NeverHaveIEver" component={withSuspenseAndBoundary(NeverHaveIEverScreen)} />
        <Stack.Screen name="OnlineNHIECategory" component={withSuspenseAndBoundary(OnlineNHIECategoryScreen)} />
        <Stack.Screen name="OnlineNeverHaveIEver" component={withSuspenseAndBoundary(OnlineNeverHaveIEverScreen)} />
        <Stack.Screen name="Scrabble" component={withSuspenseAndBoundary(ScrabbleScreen)} />
        <Stack.Screen name="OnlineScrabble" component={withSuspenseAndBoundary(OnlineScrabbleScreen)} />
        <Stack.Screen name="ScrabbleDifficulty" component={withSuspenseAndBoundary(ScrabbleDifficultyScreen)} />
        <Stack.Screen name="ScrabbleAI" component={withSuspenseAndBoundary(ScrabbleScreen)} />
        <Stack.Screen name="MVPVoting" component={withSuspenseAndBoundary(MVPVotingScreen)} />
        <Stack.Screen name="TeamSetup" component={withSuspenseAndBoundary(TeamSetupScreen)} />
        <Stack.Screen name="PlaylistSetup" component={withSuspenseAndBoundary(PlaylistSetupScreen)} />
        <Stack.Screen name="CaptionThis" component={withSuspenseAndBoundary(CaptionThisScreen)} />
        <Stack.Screen name="SpeedCategories" component={withSuspenseAndBoundary(SpeedCategoriesScreen)} />
        <Stack.Screen name="AuctionBluff" component={withSuspenseAndBoundary(AuctionBluffScreen)} />
        <Stack.Screen name="MemoryChain" component={withSuspenseAndBoundary(MemoryChainScreen)} />
        <Stack.Screen name="Spectator" component={withSuspenseAndBoundary(SpectatorScreen)} />
        <Stack.Screen name="JoinSpectator" component={withSuspenseAndBoundary(JoinSpectatorScreen)} />
        <Stack.Screen name="ConfessionRoulette" component={withSuspenseAndBoundary(ConfessionRouletteScreen)} />
        <Stack.Screen name="Imposter" component={withSuspenseAndBoundary(ImposterScreen)} />
        <Stack.Screen name="UnpopularOpinions" component={withSuspenseAndBoundary(UnpopularOpinionsScreen)} />
        <Stack.Screen name="TicTacToeDifficulty" component={withSuspenseAndBoundary(TicTacToeDifficultyScreen)} />
        <Stack.Screen name="SpillTheTea" component={withSuspenseAndBoundary(SpillTheTeaScreen)} />
        <Stack.Screen name="HotSeat" component={withSuspenseAndBoundary(HotSeatScreen)} />
        <Stack.Screen name="HotSeatCategory" component={withSuspenseAndBoundary(HotSeatCategoryScreen)} />
        <Stack.Screen name="HotSeatMC" component={withSuspenseAndBoundary(HotSeatMCScreen)} />
        <Stack.Screen name="ButtonMash" component={withSuspenseAndBoundary(ButtonMashScreen)} />
        <Stack.Screen name="TypeRace" component={withSuspenseAndBoundary(TypeRaceScreen)} />
        <Stack.Screen name="MathBlitz" component={withSuspenseAndBoundary(MathBlitzScreen)} />
        <Stack.Screen name="ColorRush" component={withSuspenseAndBoundary(ColorRushScreen)} />
        <Stack.Screen name="MemoryMatch" component={withSuspenseAndBoundary(MemoryMatchScreen)} />
        <Stack.Screen name="TicTacToe" component={withSuspenseAndBoundary(TicTacToeScreen)} />
        <Stack.Screen name="DrawBattle" component={withSuspenseAndBoundary(DrawBattleScreen)} />
        <Stack.Screen name="LieDetector" component={withSuspenseAndBoundary(LieDetectorScreen)} />
        <Stack.Screen name="RealTalkCategory" component={withSuspenseAndBoundary(RealTalkCategoryScreen)} />
        <Stack.Screen name="RealTalk" component={withSuspenseAndBoundary(RealTalkScreen)} />
        <Stack.Screen name="OnlineRealTalkCategory" component={withSuspenseAndBoundary(OnlineRealTalkCategoryScreen)} />
        <Stack.Screen name="OnlineRealTalk" component={withSuspenseAndBoundary(OnlineRealTalkScreen)} />
    </Stack.Group>
);
