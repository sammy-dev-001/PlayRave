import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Animated
} from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import RaveLights from '../components/RaveLights';
import { COLORS, SHADOWS } from '../constants/theme';
import { getRandomAuctionItems } from '../data/auctionItems';

const formatMoney = (amount) => {
    if (amount >= 1000000000) {
        return `₦${(amount / 1000000000).toFixed(1)}B`;
    } else if (amount >= 1000000) {
        return `₦${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
        return `₦${(amount / 1000).toFixed(0)}K`;
    }
    return `₦${amount}`;
};

const AuctionBluffScreen = ({ route, navigation }) => {
    const { players } = route.params;
    const [items] = useState(() => getRandomAuctionItems(5));
    const [currentItemIndex, setCurrentItemIndex] = useState(0);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [phase, setPhase] = useState('present'); // 'present', 'vote', 'vote-results', 'bid', 'reveal', 'results'
    const [showRealFact, setShowRealFact] = useState(() => Math.random() > 0.5);
    const [currentBid, setCurrentBid] = useState(0);
    const [highestBidder, setHighestBidder] = useState(null);
    const [playerBudgets, setPlayerBudgets] = useState(() =>
        players.reduce((acc, p) => ({ ...acc, [p.name]: 500000000 }), {}) // ₦500M budget each
    );
    const [playerItems, setPlayerItems] = useState(() =>
        players.reduce((acc, p) => ({ ...acc, [p.name]: [] }), {})
    );
    const [playerVotes, setPlayerVotes] = useState({}); // { playerName: 'real' | 'bluff' }
    const [votingPlayerIndex, setVotingPlayerIndex] = useState(0);
    const [bonusPoints, setBonusPoints] = useState(() =>
        players.reduce((acc, p) => ({ ...acc, [p.name]: 0 }), {})
    );
    const [countdown, setCountdown] = useState(10);
    const [showWinner, setShowWinner] = useState(false);
    const [passedPlayers, setPassedPlayers] = useState([]); // Track who passed in bidding

    const currentItem = items[currentItemIndex];
    const currentPlayer = players[currentPlayerIndex];
    const displayedFact = showRealFact ? currentItem.realFact : currentItem.bluffFact;

    // Bidding countdown
    useEffect(() => {
        if (phase !== 'bid') return;

        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleBiddingEnd();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [phase]);

    const handleStartVoting = () => {
        setPhase('vote');
        setPlayerVotes({});
        setVotingPlayerIndex(0);
    };

    const handleVote = (vote) => {
        const voterName = players[votingPlayerIndex].name;
        const newVotes = { ...playerVotes, [voterName]: vote };
        setPlayerVotes(newVotes);

        if (votingPlayerIndex < players.length - 1) {
            setVotingPlayerIndex(votingPlayerIndex + 1);
        } else {
            // All voted — show vote results briefly, then move to bidding
            setPlayerVotes(newVotes);
            setPhase('vote-results');
        }
    };

    const handleStartBidding = () => {
        setPhase('bid');
        setCountdown(20);
        setPassedPlayers([]);
        setCurrentBid(Math.floor(currentItem.realValue * 0.1)); // Start at 10% of real value
        setCurrentPlayerIndex(0);
    };

    const handleBid = (amount) => {
        const playerBudget = playerBudgets[currentPlayer.name];
        const newBid = currentBid + amount;

        if (newBid <= playerBudget) {
            setCurrentBid(newBid);
            setHighestBidder(currentPlayer.name);
            // Move to next active bidder
            moveToNextBidder(currentPlayerIndex);
        }
    };

    const moveToNextBidder = (fromIndex) => {
        let nextIndex = (fromIndex + 1) % players.length;
        let checked = 0;
        while (checked < players.length) {
            if (!passedPlayers.includes(players[nextIndex].name) &&
                players[nextIndex].name !== highestBidder) {
                setCurrentPlayerIndex(nextIndex);
                return;
            }
            nextIndex = (nextIndex + 1) % players.length;
            checked++;
        }
        // Everyone passed or only highest bidder remains
        handleBiddingEnd();
    };

    const handlePass = () => {
        const newPassed = [...passedPlayers, currentPlayer.name];
        setPassedPlayers(newPassed);

        // Check if only one active bidder remains
        const activeBidders = players.filter(p =>
            !newPassed.includes(p.name) && p.name !== highestBidder
        );

        if (activeBidders.length === 0) {
            handleBiddingEnd();
        } else {
            moveToNextBidder(currentPlayerIndex);
        }
    };

    const handleBiddingEnd = () => {
        setPhase('reveal');
    };

    const handleRevealComplete = () => {
        const isRealFact = showRealFact;

        if (highestBidder) {
            // Award item to highest bidder
            const value = isRealFact ? currentItem.realValue : Math.floor(currentItem.realValue * 0.1);

            setPlayerItems(prev => ({
                ...prev,
                [highestBidder]: [...prev[highestBidder], { ...currentItem, purchasePrice: currentBid, actualValue: value, wasReal: isRealFact }]
            }));

            setPlayerBudgets(prev => ({
                ...prev,
                [highestBidder]: prev[highestBidder] - currentBid
            }));
        }

        // Award bonus points for correct guesses
        const newBonusPoints = { ...bonusPoints };
        players.forEach(p => {
            const vote = playerVotes[p.name];
            const correct = (vote === 'real' && isRealFact) || (vote === 'bluff' && !isRealFact);
            if (correct) {
                newBonusPoints[p.name] = (newBonusPoints[p.name] || 0) + 5000000; // ₦5M bonus
            }
        });
        setBonusPoints(newBonusPoints);

        // Move to next item or end game
        if (currentItemIndex < items.length - 1) {
            setCurrentItemIndex(currentItemIndex + 1);
            setCurrentPlayerIndex(0);
            setHighestBidder(null);
            setShowRealFact(Math.random() > 0.5);
            setCurrentBid(0);
            setPassedPlayers([]);
            setPhase('present');
        } else {
            setShowWinner(true);
        }
    };

    const handleEndGame = () => {
        navigation.navigate('LocalGameSelection', { players });
    };

    // Calculate final scores
    const calculateScores = () => {
        return players.map(p => {
            const items = playerItems[p.name] || [];
            const itemValue = items.reduce((sum, item) => sum + item.actualValue, 0);
            const spent = items.reduce((sum, item) => sum + item.purchasePrice, 0);
            const profit = itemValue - spent;
            const bonus = bonusPoints[p.name] || 0;
            return {
                name: p.name,
                budget: playerBudgets[p.name],
                itemCount: items.length,
                itemValue,
                spent,
                profit,
                bonus,
                total: playerBudgets[p.name] + profit + bonus
            };
        }).sort((a, b) => b.total - a.total);
    };

    // Winner Screen
    if (showWinner) {
        const scores = calculateScores();
        const winner = scores[0];

        return (
            <NeonContainer>
                <RaveLights trigger={true} intensity="high" />
                <View style={styles.winnerContainer}>
                    <NeonText size={28} weight="bold" glow>
                        🏆 AUCTION CHAMPION 🏆
                    </NeonText>
                    <NeonText size={48}>💰</NeonText>
                    <NeonText size={36} weight="bold" color={COLORS.limeGlow}>
                        {winner.name}
                    </NeonText>
                    <NeonText size={20} color={COLORS.neonCyan}>
                        Net Worth: {formatMoney(winner.total)}
                    </NeonText>

                    <View style={styles.finalScores}>
                        {scores.map((score, index) => (
                            <View key={score.name} style={styles.scoreRow}>
                                <View style={styles.scoreLeft}>
                                    <NeonText size={16}>{index + 1}. {score.name}</NeonText>
                                    <NeonText size={12} color="#888">
                                        {score.itemCount} items • {score.profit >= 0 ? '+' : ''}{formatMoney(score.profit)} profit
                                    </NeonText>
                                    {score.bonus > 0 && (
                                        <NeonText size={12} color={COLORS.limeGlow}>
                                            🧠 +{formatMoney(score.bonus)} bluff bonus
                                        </NeonText>
                                    )}
                                </View>
                                <NeonText size={16} color={COLORS.neonCyan}>
                                    {formatMoney(score.total)}
                                </NeonText>
                            </View>
                        ))}
                    </View>

                    <NeonButton
                        title="PLAY AGAIN"
                        onPress={handleEndGame}
                        style={styles.playAgainBtn}
                    />
                </View>
            </NeonContainer>
        );
    }

    // Present Phase - Show item
    if (phase === 'present') {
        return (
            <NeonContainer showBackButton>
                <View style={styles.header}>
                    <NeonText size={14} color={COLORS.hotPink}>
                        ITEM {currentItemIndex + 1} of {items.length}
                    </NeonText>
                    <NeonText size={24} weight="bold" glow>
                        🔨 AUCTION BLUFF
                    </NeonText>
                </View>

                <View style={styles.itemCard}>
                    <NeonText size={80}>{currentItem.image}</NeonText>
                    <NeonText size={24} weight="bold" style={styles.itemName}>
                        {currentItem.name}
                    </NeonText>
                    <View style={styles.factBox}>
                        <NeonText size={14} color={COLORS.neonCyan} style={styles.factLabel}>
                            APPRAISER SAYS:
                        </NeonText>
                        <NeonText size={16} style={styles.factText}>
                            "{displayedFact}"
                        </NeonText>
                    </View>
                    <View style={styles.bluffWarning}>
                        <NeonText size={14} color={COLORS.hotPink} weight="bold">
                            ⚠️ But is it TRUE or a BLUFF?
                        </NeonText>
                    </View>
                </View>

                <NeonButton
                    title="🗳️ VOTE NOW!"
                    onPress={handleStartVoting}
                />
            </NeonContainer>
        );
    }

    // Vote Phase - Each player votes REAL or BLUFF
    if (phase === 'vote') {
        const votingPlayer = players[votingPlayerIndex];

        return (
            <NeonContainer>
                <View style={styles.header}>
                    <NeonText size={14} color={COLORS.hotPink}>
                        ITEM {currentItemIndex + 1} of {items.length}
                    </NeonText>
                    <NeonText size={24} weight="bold" glow>
                        🗳️ VOTE TIME
                    </NeonText>
                </View>

                <View style={styles.votePlayerCard}>
                    <NeonText size={14} color="#888">PASS THE PHONE TO:</NeonText>
                    <NeonText size={32} weight="bold" glow>
                        {votingPlayer.name}
                    </NeonText>
                    <NeonText size={14} color="#888" style={{ marginTop: 10 }}>
                        Is the claim about {currentItem.name} real or a bluff?
                    </NeonText>
                </View>

                <View style={styles.factBoxCompact}>
                    <NeonText size={14} style={styles.factText}>
                        "{displayedFact}"
                    </NeonText>
                </View>

                <View style={styles.voteActions}>
                    <TouchableOpacity
                        style={[styles.voteBtn, styles.voteBtnReal]}
                        onPress={() => handleVote('real')}
                        activeOpacity={0.7}
                    >
                        <NeonText size={36}>✅</NeonText>
                        <NeonText size={20} weight="bold" color={COLORS.limeGlow}>
                            REAL!
                        </NeonText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.voteBtn, styles.voteBtnBluff]}
                        onPress={() => handleVote('bluff')}
                        activeOpacity={0.7}
                    >
                        <NeonText size={36}>🚫</NeonText>
                        <NeonText size={20} weight="bold" color={COLORS.hotPink}>
                            BLUFF!
                        </NeonText>
                    </TouchableOpacity>
                </View>

                <View style={styles.voteProgress}>
                    <NeonText size={12} color="#888">
                        {votingPlayerIndex + 1} of {players.length} voted
                    </NeonText>
                    <View style={styles.voteDots}>
                        {players.map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.voteDot,
                                    i <= votingPlayerIndex && styles.voteDotActive
                                ]}
                            />
                        ))}
                    </View>
                </View>
            </NeonContainer>
        );
    }

    // Vote Results Phase
    if (phase === 'vote-results') {
        const realCount = Object.values(playerVotes).filter(v => v === 'real').length;
        const bluffCount = Object.values(playerVotes).filter(v => v === 'bluff').length;

        return (
            <NeonContainer>
                <View style={styles.header}>
                    <NeonText size={24} weight="bold" glow>
                        🗳️ VOTE RESULTS
                    </NeonText>
                </View>

                <View style={styles.voteResultsCard}>
                    <NeonText size={48}>{currentItem.image}</NeonText>
                    <NeonText size={20} weight="bold" style={{ marginTop: 10 }}>
                        {currentItem.name}
                    </NeonText>

                    <View style={styles.voteBarContainer}>
                        <View style={styles.voteBarLabels}>
                            <NeonText size={16} color={COLORS.limeGlow}>✅ REAL</NeonText>
                            <NeonText size={16} color={COLORS.hotPink}>BLUFF 🚫</NeonText>
                        </View>
                        <View style={styles.voteBar}>
                            <View style={[
                                styles.voteBarFill,
                                {
                                    width: `${(realCount / players.length) * 100}%`,
                                    backgroundColor: COLORS.limeGlow
                                }
                            ]} />
                            <View style={[
                                styles.voteBarFill,
                                {
                                    width: `${(bluffCount / players.length) * 100}%`,
                                    backgroundColor: COLORS.hotPink
                                }
                            ]} />
                        </View>
                        <View style={styles.voteBarLabels}>
                            <NeonText size={14}>{realCount} vote{realCount !== 1 ? 's' : ''}</NeonText>
                            <NeonText size={14}>{bluffCount} vote{bluffCount !== 1 ? 's' : ''}</NeonText>
                        </View>
                    </View>

                    <View style={styles.playerVotesList}>
                        {players.map(p => (
                            <View key={p.name} style={styles.playerVoteRow}>
                                <NeonText size={14}>{p.name}</NeonText>
                                <NeonText size={14} color={playerVotes[p.name] === 'real' ? COLORS.limeGlow : COLORS.hotPink}>
                                    {playerVotes[p.name] === 'real' ? '✅ Real' : '🚫 Bluff'}
                                </NeonText>
                            </View>
                        ))}
                    </View>

                    <NeonText size={12} color="#888" style={{ marginTop: 10, textAlign: 'center' }}>
                        Correct guessers earn ₦5M bonus!
                    </NeonText>
                </View>

                <NeonButton
                    title="🔨 START BIDDING!"
                    onPress={handleStartBidding}
                />
            </NeonContainer>
        );
    }

    // Bidding Phase
    if (phase === 'bid') {
        const playerBudget = playerBudgets[currentPlayer.name];
        const bidAmounts = [1000000, 5000000, 10000000, 50000000];

        return (
            <NeonContainer>
                <View style={styles.bidHeader}>
                    <NeonText size={48}>{currentItem.image}</NeonText>
                    <NeonText size={20} weight="bold">{currentItem.name}</NeonText>
                    <View style={styles.timer}>
                        <NeonText size={24} weight="bold" color={countdown <= 5 ? COLORS.hotPink : COLORS.neonCyan}>
                            {countdown}s
                        </NeonText>
                    </View>
                </View>

                <View style={styles.currentBidSection}>
                    <NeonText size={14} color="#888">CURRENT BID</NeonText>
                    <NeonText size={36} weight="bold" color={COLORS.limeGlow}>
                        {formatMoney(currentBid)}
                    </NeonText>
                    {highestBidder && (
                        <NeonText size={14} color={COLORS.neonCyan}>
                            by {highestBidder}
                        </NeonText>
                    )}
                </View>

                <View style={styles.playerTurn}>
                    <NeonText size={18} weight="bold" glow>{currentPlayer.name}'s turn</NeonText>
                    <NeonText size={12} color="#888">Budget: {formatMoney(playerBudget)}</NeonText>
                </View>

                <View style={styles.bidButtons}>
                    {bidAmounts.map(amount => (
                        <TouchableOpacity
                            key={amount}
                            style={[
                                styles.bidBtn,
                                currentBid + amount > playerBudget && styles.bidBtnDisabled
                            ]}
                            onPress={() => handleBid(amount)}
                            disabled={currentBid + amount > playerBudget}
                        >
                            <NeonText size={14} color={COLORS.limeGlow}>
                                +{formatMoney(amount)}
                            </NeonText>
                        </TouchableOpacity>
                    ))}
                </View>

                <NeonButton
                    title="PASS"
                    onPress={handlePass}
                    variant="secondary"
                />
            </NeonContainer>
        );
    }

    // Reveal Phase
    if (phase === 'reveal') {
        const wasReal = showRealFact;
        const actualValue = wasReal ? currentItem.realValue : Math.floor(currentItem.realValue * 0.1);

        // Determine who guessed correctly
        const correctGuessers = players.filter(p => {
            const vote = playerVotes[p.name];
            return (vote === 'real' && wasReal) || (vote === 'bluff' && !wasReal);
        });

        return (
            <NeonContainer>
                <View style={styles.revealContainer}>
                    <NeonText size={48}>{currentItem.image}</NeonText>

                    <NeonText size={28} weight="bold" glow color={wasReal ? COLORS.limeGlow : COLORS.hotPink}>
                        {wasReal ? "✅ IT WAS TRUE!" : "🚫 IT WAS A BLUFF!"}
                    </NeonText>

                    <View style={styles.revealFacts}>
                        <View style={styles.revealFactBox}>
                            <NeonText size={12} color="#888">THE CLAIM</NeonText>
                            <NeonText size={14}>"{displayedFact}"</NeonText>
                        </View>
                        <View style={styles.revealFactBox}>
                            <NeonText size={12} color="#888">ACTUAL VALUE</NeonText>
                            <NeonText size={24} weight="bold" color={COLORS.neonCyan}>
                                {formatMoney(actualValue)}
                            </NeonText>
                        </View>
                    </View>

                    {highestBidder ? (
                        <View style={styles.winnerInfo}>
                            <NeonText size={16}>
                                {highestBidder} won for {formatMoney(currentBid)}
                            </NeonText>
                            <NeonText size={14} color={actualValue > currentBid ? COLORS.limeGlow : COLORS.hotPink}>
                                {actualValue > currentBid
                                    ? `📈 Profit: +${formatMoney(actualValue - currentBid)}!`
                                    : `📉 Loss: -${formatMoney(currentBid - actualValue)}`}
                            </NeonText>
                        </View>
                    ) : (
                        <NeonText size={16} color="#888">No one bid on this item!</NeonText>
                    )}

                    {correctGuessers.length > 0 && (
                        <View style={styles.bonusSection}>
                            <NeonText size={14} color={COLORS.limeGlow} weight="bold">
                                🧠 CORRECT GUESSERS (+₦5M each):
                            </NeonText>
                            <NeonText size={14} color={COLORS.neonCyan}>
                                {correctGuessers.map(p => p.name).join(', ')}
                            </NeonText>
                        </View>
                    )}

                    <NeonButton
                        title={currentItemIndex < items.length - 1 ? "NEXT ITEM" : "SEE RESULTS"}
                        onPress={handleRevealComplete}
                        style={styles.nextBtn}
                    />
                </View>
            </NeonContainer>
        );
    }

    return null;
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    itemCard: {
        alignItems: 'center',
        padding: 25,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.electricPurple,
        marginBottom: 20,
    },
    itemName: {
        marginTop: 15,
        textAlign: 'center',
    },
    factBox: {
        marginTop: 20,
        padding: 15,
        backgroundColor: 'rgba(0, 248, 255, 0.1)',
        borderRadius: 12,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.neonCyan,
        width: '100%',
    },
    factBoxCompact: {
        padding: 15,
        backgroundColor: 'rgba(0, 248, 255, 0.1)',
        borderRadius: 12,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.neonCyan,
        marginBottom: 20,
    },
    factLabel: {
        marginBottom: 5,
    },
    factText: {
        fontStyle: 'italic',
        lineHeight: 22,
    },
    bluffWarning: {
        marginTop: 15,
    },
    // Vote Phase
    votePlayerCard: {
        alignItems: 'center',
        padding: 25,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
        marginBottom: 20,
    },
    voteActions: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 20,
        height: 130,
    },
    voteBtn: {
        flex: 1,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    voteBtnReal: {
        borderColor: COLORS.limeGlow,
        shadowColor: COLORS.limeGlow,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    voteBtnBluff: {
        borderColor: COLORS.hotPink,
        shadowColor: COLORS.hotPink,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    voteProgress: {
        alignItems: 'center',
    },
    voteDots: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 8,
    },
    voteDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    voteDotActive: {
        backgroundColor: COLORS.limeGlow,
    },
    // Vote Results
    voteResultsCard: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        marginBottom: 20,
    },
    voteBarContainer: {
        width: '100%',
        marginTop: 20,
    },
    voteBarLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    voteBar: {
        flexDirection: 'row',
        height: 20,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginBottom: 5,
    },
    voteBarFill: {
        height: '100%',
    },
    playerVotesList: {
        width: '100%',
        marginTop: 15,
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 10,
    },
    playerVoteRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    // Bidding Phase
    bidHeader: {
        alignItems: 'center',
        marginBottom: 15,
    },
    timer: {
        marginTop: 10,
        padding: 10,
        borderRadius: 25,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
    },
    currentBidSection: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
        borderRadius: 16,
        marginBottom: 15,
    },
    playerTurn: {
        alignItems: 'center',
        marginBottom: 15,
    },
    bidButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 20,
    },
    bidBtn: {
        padding: 15,
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.limeGlow,
        minWidth: 90,
        alignItems: 'center',
    },
    bidBtnDisabled: {
        opacity: 0.3,
        borderColor: '#444',
    },
    // Reveal Phase
    revealContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    revealFacts: {
        width: '100%',
        marginTop: 20,
    },
    revealFactBox: {
        padding: 15,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        marginBottom: 10,
    },
    winnerInfo: {
        alignItems: 'center',
        marginTop: 20,
    },
    bonusSection: {
        alignItems: 'center',
        marginTop: 15,
        padding: 10,
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
        borderRadius: 10,
    },
    nextBtn: {
        marginTop: 30,
        minWidth: 200,
    },
    // Winner Screen
    winnerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    finalScores: {
        width: '100%',
        marginTop: 25,
        padding: 15,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
    },
    scoreRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    scoreLeft: {
        flex: 1,
    },
    playAgainBtn: {
        marginTop: 25,
    }
});

export default AuctionBluffScreen;
