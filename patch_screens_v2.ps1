$files = @(
    "frontend\src\screens\ColorRushScreen.js",
    "frontend\src\screens\DrawBattleScreen.js",
    "frontend\src\screens\MathBlitzScreen.js",
    "frontend\src\screens\TypeRaceScreen.js",
    "frontend\src\screens\TicTacToeScreen.js",
    "frontend\src\screens\OnlineNeverHaveIEverScreen.js",
    "frontend\src\screens\OnlineRapidFireScreen.js",
    "frontend\src\screens\WhotGameScreen.js",
    "frontend\src\screens\HotSeatScreen.js",
    "frontend\src\screens\WordRushGameScreen.js",
    "frontend\src\screens\NeonTapGameScreen.js",
    "frontend\src\screens\SpillTheTeaScreen.js",
    "frontend\src\screens\UnpopularOpinionsScreen.js",
    "frontend\src\screens\QuestionScreen.js",
    "frontend\src\screens\WhosMostLikelyQuestionScreen.js",
    "frontend\src\screens\MythOrFactQuestionScreen.js"
)

foreach ($file in $files) {
    Write-Host "Patching $file..."
    $lines = Get-Content $file
    $newLines = @()
    $importAdded = $false
    $hookAdded = $false

    foreach ($line in $lines) {
        # 1. Add import
        if ($line -match "import SocketService from '\.\./services/socket';" -and -not $importAdded) {
            $newLines += $line
            $newLines += "import { useGameDisconnectHandler } from '../hooks/useGameDisconnectHandler';"
            $importAdded = $true
            continue
        }

        # 2. Add hook usage after route.params
        if ($line -match "route\.params" -and -not $hookAdded) {
            $newLines += $line
            $newLines += ""
            $newLines += "    useGameDisconnectHandler({"
            $newLines += "        navigation,"
            $newLines += "        exitScreen: 'Lobby',"
            $newLines += "        exitParams: { room, isHost }"
            $newLines += "    });"
            $hookAdded = $true
            continue
        }

        # 3. Secure onGameEnded
        if ($line -match "navigation\.navigate\('Lobby', \{ room") {
            $secured = $line -replace "navigation\.navigate\('Lobby', \{ room.* \}\);", "try { $& } catch (e) { navigation.reset({ index: 0, routes: [{ name: 'Home' }] }); }"
            $newLines += $secured
            continue
        }

        $newLines += $line
    }

    Set-Content $file $newLines
}
