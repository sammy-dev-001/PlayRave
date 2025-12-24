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
    if (amount >= 1000000) {
        return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
        return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount}`;
};

const AuctionBluffScreen = ({ route, navigation }) => {
    const { players } = route.params;
    const [items] = useState(() => getRandomAuctionItems(5));
    const [currentItemIndex, setCurrentItemIndex] = useState(0);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [phase, setPhase] = useState('present'); // 'present', 'choose', 'bid', 'reveal', 'results'
    const [showRealFact, setShowRealFact] = useState(Math.random() > 0.5);
    const [currentBid, setCurrentBid] = useState(0);
    const [highestBidder, setHighestBidder] = useState(null);
    const [playerBudgets, setPlayerBudgets] = useState(() =>
        players.reduce((acc, p) => ({ ...acc, [p.name]: 10000000 }), {}) // $10M budget each
    );
    const [playerItems, setPlayerItems] = useState(() =>
        players.reduce((acc, p) => ({ ...acc, [p.name]: [] }), {})
    );
    const [countdown, setCountdown] = useState(10);
    const [showWinner, setShowWinner] = useState(false);

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

    const handleStartBidding = () => {
        setPhase('bid');
        setCountdown(15);
        setCurrentBid(Math.floor(currentItem.realValue * 0.1)); // Start at 10% of real value
    };

    const handleBid = (amount) => {
        const playerBudget = playerBudgets[currentPlayer.name];
        const newBid = currentBid + amount;

        if (newBid <= playerBudget) {
            setCurrentBid(newBid);
            setHighestBidder(currentPlayer.name);
            // Move to next player
            setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
        }
    };

    const handlePass = () => {
        // Move to next player
        const nextIndex = (currentPlayerIndex + 1) % players.length;
        setCurrentPlayerIndex(nextIndex);

        // If we've gone around and back to the highest bidder, end bidding
        if (players[nextIndex].name === highestBidder) {
            handleBiddingEnd();
        }
    };

    const handleBiddingEnd = () => {
        setPhase('reveal');
    };

    const handleRevealComplete = () => {
        if (highestBidder) {
            // Award item to highest bidder
            const isRealFact = showRealFact;
            const value = isRealFact ? currentItem.realValue : Math.floor(currentItem.realValue * 0.1); // Bluff = 10% value

            setPlayerItems(prev => ({
                ...prev,
                [highestBidder]: [...prev[highestBidder], { ...currentItem, purchasePrice: currentBid, actualValue: value, wasReal: isRealFact }]
            }));

            setPlayerBudgets(prev => ({
                ...prev,
                [highestBidder]: prev[highestBidder] - currentBid
            }));
        }

        // Move to next item or end game
        if (currentItemIndex < items.length - 1) {
            setCurrentItemIndex(currentItemIndex + 1);
            setCurrentPlayerIndex(0);
            setHighestBidder(null);
            setShowRealFact(Math.random() > 0.5);
            setCurrentBid(0);
            setPhase('present');
        } else {
            setShowWinner(true);
        }
    };

    const handleEndGame = () => {
        navigation.navigate('LocalGameSelection', { players });
    };

    // Calculate final scores (budget remaining + item values - purchase prices)
    const calculateScores = () => {
        return players.map(p => {
            const items = playerItems[p.name] || [];
            const itemValue = items.reduce((sum, item) => sum + item.actualValue, 0);
            const spent = items.reduce((sum, item) => sum + item.purchasePrice, 0);
            const profit = itemValue - spent;
            return {
                name: p.name,
                budget: playerBudgets[p.name],
                itemCount: items.length,
                itemValue,
                spent,
                profit,
                total: playerBudgets[p.name] + profit
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
                            EXPERT SAYS:
                        </NeonText>
                        <NeonText size={16} style={styles.factText}>
                            "{displayedFact}"
                        </NeonText>
                    </View>
                    <View style={styles.bluffWarning}>
                        <NeonText size={12} color={COLORS.hotPink}>
                            ⚠️ But is it TRUE or a BLUFF?
                        </NeonText>
                    </View>
                </View>

                <NeonButton
                    title="START BIDDING!"
                    onPress={handleStartBidding}
                />
            </NeonContainer>
        );
    }

    // Bidding Phase
    if (phase === 'bid') {
        const playerBudget = playerBudgets[currentPlayer.name];
        const bidAmounts = [10000, 50000, 100000, 500000];

        return (
            <NeonContainer>
                <View style={styles.bidHeader}>
                    <NeonText size={64}>{currentItem.image}</NeonText>
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
                    <NeonText size={16}>{currentPlayer.name}'s turn</NeonText>
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

        return (
            <NeonContainer>
                <View style={styles.revealContainer}>
                    <NeonText size={48}>{currentItem.image}</NeonText>

                    <NeonText size={28} weight="bold" glow color={wasReal ? COLORS.limeGlow : COLORS.hotPink}>
                        {wasReal ? "✓ IT WAS TRUE!" : "✗ IT WAS A BLUFF!"}
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
    },
    factBox: {
        marginTop: 20,
        padding: 15,
        backgroundColor: 'rgba(0, 248, 255, 0.1)',
        borderRadius: 12,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.neonCyan,
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
    nextBtn: {
        marginTop: 30,
        minWidth: 200,
    },
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
