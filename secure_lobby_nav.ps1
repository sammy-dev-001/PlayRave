$files = @(
    "frontend\src\screens\CustomQuestionsScreen.js",
    "frontend\src\screens\GameSelectionScreen.js",
    "frontend\src\screens\HotSeatMCScreen.js",
    "frontend\src\screens\JoinScreen.js",
    "frontend\src\screens\LieDetectorScreen.js",
    "frontend\src\screens\PlaylistSetupScreen.js",
    "frontend\src\screens\ScoreboardScreen.js",
    "frontend\src\screens\TeamSetupScreen.js",
    "frontend\src\screens\TournamentResultsScreen.js",
    "frontend\src\screens\WordRushWinnerScreen.js"
)

foreach ($file in $files) {
    Write-Host "Patching $file..."
    $content = Get-Content $file -Raw
    
    # Secure navigation.navigate('Lobby'
    # We use a regex that matches navigation.navigate('Lobby', { ... }) and doesn't match if it's already in a try block (roughly)
    # Actually, simpler to just replace all and then fix double wraps if any.
    
    # Match: navigation.navigate('Lobby', { [content] })
    # Replace with: try { navigation.navigate('Lobby', { [content] }) } catch (e) { navigation.reset({ index: 0, routes: [{ name: 'Home' }] }); }
    
    # Using a simpler string replace for common patterns
    $content = $content -replace "navigation\.navigate\(['""]Lobby['""]", "try { navigation.navigate('Lobby'"
    # This leaves the closing part. We need to find the end of the navigation call.
    # This is hard with regex. 
    
    # Let's use a line-by-line approach for these.
    $lines = Get-Content $file
    $newLines = @()
    foreach ($line in $lines) {
        if ($line -match "navigation\.navigate\(['""]Lobby['""]" -and $line -notmatch "try \{") {
            if ($line -match "\);$") {
                 $newLine = $line -replace "navigation\.navigate\(['""]Lobby['""](.*)\);", "try { navigation.navigate('Lobby'$1); } catch (e) { navigation.reset({ index: 0, routes: [{ name: 'Home' }] }); }"
                 $newLines += $newLine
            } else {
                 # Multi-line navigate? This is harder.
                 $newLines += $line
            }
        } else {
            $newLines += $line
        }
    }
    Set-Content $file $newLines
}
