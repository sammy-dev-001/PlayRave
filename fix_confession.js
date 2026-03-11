const fs = require('fs');
const filepath = 'c:\\\\Users\\\\USER\\\\Documents\\\\CODE X\\\\PlayRave\\\\frontend\\\\src\\\\screens\\\\ConfessionRouletteScreen.js';
let content = fs.readFileSync(filepath, 'utf8');

// Normalize line endings for reliable replacing
content = content.replace(/\r\n/g, '\n');

// 1. Imports
content = content.replace(`import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import GameOverlay from '../components/GameOverlay';`, `import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import GameOverlay from '../components/GameOverlay';`);


// 2. Auto Start Remove
content = content.replace(`        // Start game if host
        if (isHost) {
            SocketService.emit('confession-start', { roomId: room.id });
        }`, `        // Host must manually click "START GAME" now to prevent accidental double-timers`);

// 3. Reveal and Voting split
content = content.replace(`    const renderVotingPhase = () => (
        <View style={styles.votingContainer}>
            <View style={styles.timerBadge}>
                <NeonText size={24} weight="bold" color={timer <= 5 ? COLORS.hotPink : COLORS.neonCyan} glow>
                    {timer}s
                </NeonText>
            </View>

            <NeonText size={14} color={COLORS.limeGlow} style={styles.confessionCount}>
                Confession {confessionIndex + 1} of {totalConfessions}
            </NeonText>

            <Animated.View style={[styles.confessionCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                <NeonText size={18} style={styles.confessionText}>
                    "{currentConfession}"
                </NeonText>
            </Animated.View>

            <NeonText size={16} weight="bold" style={styles.votePrompt}>
                Who wrote this?
            </NeonText>

            <ScrollView style={styles.playersList} contentContainerStyle={styles.playersContent}>
                {players.filter(p => p.name !== playerName).map((player) => (
                    <TouchableOpacity
                        key={player.name}
                        style={[
                            styles.playerOption,
                            selectedPlayer === player.name && styles.selectedPlayer
                        ]}
                        onPress={() => setSelectedPlayer(player.name)}
                    >
                        <NeonText size={16}>{player.avatar || '👤'}</NeonText>
                        <NeonText
                            size={16}
                            color={selectedPlayer === player.name ? COLORS.neonCyan : COLORS.white}
                        >
                            {player.name}
                        </NeonText>
                        {selectedPlayer === player.name && (
                            <NeonText size={16} color={COLORS.neonCyan}></NeonText>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <NeonButton
                title="LOCK IN VOTE"
                onPress={submitVote}
                disabled={!selectedPlayer}
                style={styles.voteButton}
            />
        </View>
    );`, `    const renderRevealPhase = () => (
        <View style={styles.votingContainer}>
            <View style={styles.timerBadge}>
                <NeonText size={24} weight="bold" color={timer <= 10 ? COLORS.hotPink : COLORS.neonCyan} glow>
                    {timer}s (Discussion)
                </NeonText>
            </View>

            <NeonText size={14} color={COLORS.limeGlow} style={styles.confessionCount}>
                Confession {confessionIndex + 1} of {totalConfessions}
            </NeonText>

            <Animated.View style={[styles.confessionCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                <NeonText size={18} style={styles.confessionText}>
                    "{currentConfession}"
                </NeonText>
            </Animated.View>

            <NeonText size={16} weight="bold" style={styles.votePrompt}>
                Who do you think wrote this? Discuss!
            </NeonText>
            
            {isHost && (
                <NeonButton
                    title="SKIP & START VOTING"
                    onPress={() => SocketService.emit('confession-start-voting', { roomId: room.id })}
                    style={styles.voteButton}
                />
            )}
        </View>
    );

    const renderVotingPhase = () => (
        <View style={styles.votingContainer}>
            <View style={styles.timerBadge}>
                <NeonText size={24} weight="bold" color={timer <= 5 ? COLORS.hotPink : COLORS.neonCyan} glow>
                    {timer}s (Voting)
                </NeonText>
            </View>

            <NeonText size={14} color={COLORS.limeGlow} style={styles.confessionCount}>
                Confession {confessionIndex + 1} of {totalConfessions}
            </NeonText>

            <Animated.View style={[styles.confessionCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                <NeonText size={18} style={styles.confessionText}>
                    "{currentConfession}"
                </NeonText>
            </Animated.View>

            <NeonText size={16} weight="bold" style={styles.votePrompt}>
                Lock in your final guess!
            </NeonText>

            <ScrollView style={styles.playersList} contentContainerStyle={styles.playersContent}>
                {players.map((player) => (
                    <TouchableOpacity
                        key={player.name}
                        style={[
                            styles.playerOption,
                            selectedPlayer === player.name && styles.selectedPlayer
                        ]}
                        onPress={() => setSelectedPlayer(player.name)}
                    >
                        <NeonText size={16}>{player.avatar || '👤'}</NeonText>
                        <NeonText
                            size={16}
                            color={selectedPlayer === player.name ? COLORS.neonCyan : COLORS.white}
                        >
                            {player.name}
                        </NeonText>
                        {selectedPlayer === player.name && (
                            <NeonText size={16} color={COLORS.neonCyan}></NeonText>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <NeonButton
                title="LOCK IN VOTE"
                onPress={submitVote}
                disabled={!selectedPlayer}
                style={styles.voteButton}
            />
        </View>
    );`);

content = content.replace(`            <View style={styles.authorReveal}>
                <NeonText size={16} color="#888">Written by...</NeonText>
                <NeonText size={28} weight="bold" color={COLORS.limeGlow} glow style={{ marginTop: 10 }}>
                    {roundResults?.author || 'Unknown'}
                </NeonText>
            </View>`, `            <View style={styles.authorReveal}>
                <NeonText size={16} color="#888">Written by...</NeonText>
                <NeonText size={28} weight="bold" color={COLORS.limeGlow} glow style={{ marginTop: 10 }}>
                    {roundResults?.author === 'Unknown' ? '🕵️ UNKNOWN' : (roundResults?.author || '🕵️ UNKNOWN')}
                </NeonText>
            </View>`);

content = content.replace(`            case GAME_PHASES.REVEAL:
            case GAME_PHASES.VOTING:
                return renderVotingPhase();`, `            case GAME_PHASES.REVEAL:
                return renderRevealPhase();
            case GAME_PHASES.VOTING:
                return renderVotingPhase();`);

content = content.replace(`    return (
        <NeonContainer>
            <View style={styles.header}>
                <NeonText size={16} color={COLORS.hotPink}>CONFESSION ROULETTE</NeonText>
                <NeonText size={12} color="#666">Room: {room.id}</NeonText>
            </View>
            {renderPhase()}
        </NeonContainer>
    );`, `    return (
        <GameOverlay roomId={room.id} playerName={playerName}>
            <View style={styles.header}>
                <NeonText size={16} color={COLORS.hotPink}>CONFESSION ROULETTE</NeonText>
                <NeonText size={12} color="#666">Room: {room.id}</NeonText>
            </View>
            {renderPhase()}
        </GameOverlay>
    );`);

fs.writeFileSync(filepath, content);
console.log('patched');
