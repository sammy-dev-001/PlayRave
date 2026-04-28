$files = @(
    "frontend\src\screens\ColorRushScreen.js",
    "frontend\src\screens\DrawBattleScreen.js",
    "frontend\src\screens\MathBlitzScreen.js",
    "frontend\src\screens\TypeRaceScreen.js",
    "frontend\src\screens\TicTacToeScreen.js",
    "frontend\src\screens\OnlineNeverHaveIEverScreen.js",
    "frontend\src\screens\OnlineRapidFireScreen.js"
)

foreach ($file in $files) {
    Write-Host "Patching $file..."
    $content = Get-Content $file -Raw
    
    # 1. Add import if missing
    if ($content -notmatch "useGameDisconnectHandler") {
        $content = $content -replace "import SocketService from '\.\./services/socket';", "import SocketService from '../services/socket';`nimport { useGameDisconnectHandler } from '../hooks/useGameDisconnectHandler';"
    }
    
    # 2. Add hook usage if missing
    if ($content -notmatch "useGameDisconnectHandler\(\{") {
        $content = $content -replace "(const \{ room, playerName, isHost.* \} = route\.params;)", "$1`n`n    useGameDisconnectHandler({`n        navigation,`n        exitScreen: 'Lobby',`n        exitParams: { room, playerName, isHost }`n    });"
    }
    
    # 3. Secure onGameEnded
    $content = $content -replace "navigation\.navigate\('Lobby', \{ room: updatedRoom, playerName, isHost \}\);", "try { navigation.navigate('Lobby', { room: updatedRoom, playerName, isHost }); } catch (e) { navigation.reset({ index: 0, routes: [{ name: 'Home' }] }); }"
    $content = $content -replace "navigation\.navigate\('Lobby', \{ room, isHost, playerName: players\.find\(p => p\.id === currentPlayerId\)\?\.name \}\);", "try { navigation.navigate('Lobby', { room, isHost, playerName: players.find(p => p.id === currentPlayerId)?.name }); } catch (e) { navigation.reset({ index: 0, routes: [{ name: 'Home' }] }); }"

    Set-Content $file $content
}
