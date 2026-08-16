/**
 * LudoVsAIScreen.js
 * Full 2-player Ludo per spec:
 *  - Human controls Player 0 (Cyan, bottom-right) + Player 3 (Purple, bottom-left)
 *  - AI    controls Player 1 (Lime,  top-left)    + Player 2 (Pink,  top-right)
 *  - 2 dice per turn, split or combine freely
 *  - Blockades (2+ same-owner tokens block opponents from landing/passing)
 *  - Intermediate square validation for combined moves
 *  - Bonus turn only for rolling a 6 (NOT for captures)
 *  - Exact roll required to enter home triangle
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, TouchableOpacity, StyleSheet, Animated,
  Dimensions, Modal, SafeAreaView, Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import HapticService from '../services/HapticService';

// ─── Dimensions ───────────────────────────────────────────────────────────────
const { width: SW, height: SH } = Dimensions.get('window');
const GRID = 15;
const BOARD_PX = Math.min(SW - 14, SH * 0.52, 500);
const CELL = Math.floor(BOARD_PX / GRID);

// ─── Player Setup ─────────────────────────────────────────────────────────────
const HUMAN_PLAYERS = [0, 3]; // Cyan (bottom-right) + Purple (bottom-left)
const AI_PLAYERS = [1, 2]; // Lime (top-left)     + Pink (top-right)

const PLAYER_COLOR = ['#FF007F', '#00FFFF', '#FFD700', '#39FF14']; // P0(Pink), P1(Cyan), P2(Yellow), P3(Green)
const PLAYER_DARK = ['#330015', '#003333', '#332b00', '#0e2200'];

const getOwner = (playerIdx) =>
  HUMAN_PLAYERS.includes(playerIdx) ? 'human' : 'ai';

// ─── Main Track (52 cells, clockwise) ─────────────────────────────────────────
// Player start indices: P0=0, P1=13, P2=26, P3=39  (52/4 = 13 apart)
const MAIN_TRACK = [
  // 0-5: bottom col 6, rows 14→9 (P0/Cyan entry)
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  // 6-12: row 8 going left + corner
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0], [7, 0],
  // 13-18: row 6 going right (P1/Lime entry at [6,0])
  [6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  // 19-24: col 6, rows 5→0
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  // 25-26: top turn
  [0, 7], [0, 8],
  // 27-31: col 8, rows 0→5 (P2/Yellow entry)
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  // 32-38: row 6 going right + corner
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14], [7, 14],
  // 39-44: row 8 going left (P3/Green entry at [8,14]=39)
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  // 45-51: col 8, rows 9→14 + close
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], [14, 7],
];
// PLAYER_START[p] = the index on MAIN_TRACK where player p enters from their yard
const PLAYER_START = [0, 13, 26, 39];

// Safe squares (global track indices): start squares + star squares
const SAFE_INDICES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

// Home columns: 5 cells from outer track toward center [7,7]
const HOME_COLS = [
  [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]], // P0 Cyan  – col 7 going UP
  [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],     // P1 Lime  – row 7 going RIGHT
  [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],     // P2 Pink  – col 7 going DOWN
  [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]], // P3 Purple – row 7 going LEFT
];

const CENTER = [7, 7];

// Home base top-left corners (6×6 area in each quadrant)
const HOME_CORNERS = [
  { r: 9, c: 0 }, // P0 Cyan   bottom-left
  { r: 0, c: 0 }, // P1 Lime   top-left
  { r: 0, c: 9 }, // P2 Pink   top-right
  { r: 9, c: 9 }, // P3 Purple bottom-right
];
const TOKEN_OFFSETS = [
  { r: 1, c: 1 }, { r: 1, c: 4 },
  { r: 4, c: 1 }, { r: 4, c: 4 },
];

// ─── Token Factory ────────────────────────────────────────────────────────────
// Each token: { player:0-3, id:0-3, pos:-1..50, homePos:-1..4, finished:bool }
const makeTokens = () =>
  [0, 1, 2, 3].flatMap(p =>
    [0, 1, 2, 3].map(id => ({
      player: p, id,
      pos: -1,     // -1 = in yard; 0-50 = on main track; 51 = off track (in home col)
      homePos: -1, // -1 = not in home col; 0-4 = home col position; 5 = finished
      finished: false,
    }))
  );

// ─── Token Position ───────────────────────────────────────────────────────────
const tokenCell = (token) => {
  if (token.finished) return CENTER;
  if (token.pos === -1) {
    const c = HOME_CORNERS[token.player];
    const o = TOKEN_OFFSETS[token.id];
    return [c.r + o.r, c.c + o.c];
  }
  if (token.homePos >= 0) {
    if (token.homePos >= 5) return CENTER;
    return HOME_COLS[token.player][token.homePos];
  }
  return MAIN_TRACK[(PLAYER_START[token.player] + token.pos) % 52];
};

const getAbsIdx = (token) => {
  if (token.pos < 0 || token.pos > 50 || token.homePos >= 0 || token.finished) return -1;
  return (PLAYER_START[token.player] + token.pos) % 52;
};

// ─── Blockade Helpers ─────────────────────────────────────────────────────────
// A blockade is 2+ tokens of the SAME owner on the SAME absolute track index.
// It prevents opposing tokens from landing ON or passing THROUGH it.

const blockadeSet = (tokens) => {
  const counts = {};
  for (const t of tokens) {
    const ai = getAbsIdx(t);
    if (ai < 0) continue;
    const key = `${ai}_${getOwner(t.player)}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  // Return set of absIdx values that are blockaded (per owner)
  // e.g. "12_human" → index 12 is blockaded by human
  return counts;
};

// Is absIdx blockaded for a moving token from movingOwner?
// Returns true if the OPPONENT owner has 2+ tokens at that index
const isBlockadedFor = (absIdx, movingOwner, bdSet) => {
  const oppOwner = movingOwner === 'human' ? 'ai' : 'human';
  return (bdSet[`${absIdx}_${oppOwner}`] || 0) >= 2;
};

// ─── Move Validation ──────────────────────────────────────────────────────────
// Check if path from token.pos for `steps` steps is clear of opponent blockades.
// Returns false if any intermediate square (including destination) is blockaded.
const isPathClear = (token, steps, bdSet) => {
  const owner = getOwner(token.player);
  for (let s = 1; s <= steps; s++) {
    const newPos = token.pos + s;
    if (newPos > 50) break; // entering home column — no blockades there
    const ai = (PLAYER_START[token.player] + newPos) % 52;
    if (isBlockadedFor(ai, owner, bdSet)) return false;
  }
  return true;
};

// Can token move `dv` steps given current board state?
const canMove = (token, dv, allTokens, bdSet) => {
  if (token.finished) return false;
  if (token.pos === -1) {
    // Must roll 6 to exit yard
    if (dv !== 6) return false;
    // Start square must not be blockaded by opponent
    const startAbs = PLAYER_START[token.player];
    return !isBlockadedFor(startAbs, getOwner(token.player), bdSet);
  }
  if (token.homePos >= 0) {
    // Exact or partial advance in home column (no blockades in home col)
    return token.homePos + dv <= 5;
  }
  // On main track
  const newPos = token.pos + dv;
  if (newPos > 55) return false; // overshot (max: 50 + 5 home steps)
  return isPathClear(token, Math.min(dv, 51 - token.pos), bdSet);
};

// ─── Move Application ─────────────────────────────────────────────────────────
const applyMove = (token, dv) => {
  const t = { ...token };
  if (t.pos === -1 && dv === 6) {
    t.pos = 0;
    return t;
  }
  if (t.homePos >= 0) {
    const nh = t.homePos + dv;
    if (nh >= 5) { t.finished = true; t.homePos = 5; }
    else { t.homePos = nh; }
    return t;
  }
  const np = t.pos + dv;
  if (np > 50) {
    const into = np - 51; // steps past end of main track = position in home col
    if (into >= 5) { t.finished = true; t.homePos = 5; }
    else { t.homePos = into; }
    t.pos = 51;
  } else {
    t.pos = np;
  }
  return t;
};

// Resolve captures after a move. Returns updated tokens array.
// Captures only happen on the main track (not yard, home col, or center).
// Single opponent token → captured. Blockade (2+) → no capture.
const resolveCapture = (movedToken, allTokens) => {
  const absIdx = getAbsIdx(movedToken);
  if (absIdx < 0) return allTokens;
  if (SAFE_INDICES.has(absIdx)) return allTokens;
  const owner = getOwner(movedToken.player);

  const opponentsHere = allTokens.filter(t => {
    if (getOwner(t.player) === owner) return false;
    return getAbsIdx(t) === absIdx;
  });

  if (opponentsHere.length === 1) {
    // Kamikaze Capture — send opponent back to yard, and crown the capturing piece!
    return allTokens.map(t => {
      if (t.player === opponentsHere[0].player && t.id === opponentsHere[0].id) {
        return { ...t, pos: -1, homePos: -1, finished: false };
      }
      if (t.player === movedToken.player && t.id === movedToken.id) {
        return { ...t, pos: 51, homePos: 5, finished: true };
      }
      return t;
    });
  }
  return allTokens; // blockade or empty
};

// ─── AI Heuristics ────────────────────────────────────────────────────────────
const isSquareInDanger = (absIdx, owner, allTokens, bdSet) => {
  if (absIdx < 0 || SAFE_INDICES.has(absIdx)) return false;
  if (isBlockadedFor(absIdx, owner, bdSet)) return false; // protected by own blockade
  for (let s = 1; s <= 6; s++) {
    const checkIdx = (absIdx - s + 52) % 52;
    const oppHere = allTokens.filter(t => getOwner(t.player) !== owner && getAbsIdx(t) === checkIdx);
    if (oppHere.length > 0) {
      let pathClear = true;
      for (let step = 1; step <= s; step++) {
        const pathIdx = (checkIdx + step) % 52;
        if (isBlockadedFor(pathIdx, getOwner(oppHere[0].player), bdSet)) {
          pathClear = false;
          break;
        }
      }
      if (pathClear) return true;
    }
  }
  return false;
};

const scoreAIMove = (token, dv, allTokens, difficulty) => {
  const moved = applyMove(token, dv);
  const bdSet = blockadeSet(allTokens);
  let score = 0;

  // Top: finish a token
  if (moved.finished) return 1200 + Math.random() * 10;

  // High: advance in home column
  if (moved.homePos >= 0) score += 300 + moved.homePos * 40;

  // High: spawn a token from yard
  if (token.pos === -1 && dv === 6) score += 180;

  // Medium: capture opportunity
  if (difficulty !== 'easy') {
    const ai = getAbsIdx(moved);
    if (ai >= 0 && !SAFE_INDICES.has(ai)) {
      const oppHere = allTokens.filter(t => getOwner(t.player) !== 'ai' && getAbsIdx(t) === ai);
      if (oppHere.length === 1) score += 400; // Increased capture priority
    }
  }

  // Hard heuristics
  if (difficulty === 'hard') {
    const ai = getAbsIdx(moved);
    const startIdx = getAbsIdx(token);
    
    // Blockade forming
    if (ai >= 0) {
      const friendsHere = allTokens.filter(t => getOwner(t.player) === 'ai' && t.player !== moved.player && getAbsIdx(t) === ai).length;
      if (friendsHere >= 1) score += 150; 
    }

    // Fleeing danger
    if (startIdx >= 0 && isSquareInDanger(startIdx, 'ai', allTokens, bdSet)) {
        score += 200;
    }

    // Avoiding moving INTO danger
    if (ai >= 0 && isSquareInDanger(ai, 'ai', allTokens, bdSet)) {
        score -= 250;
    }

    // Penalize breaking our own blockade
    if (startIdx >= 0) {
        const friendsAtStart = allTokens.filter(t => getOwner(t.player) === 'ai' && getAbsIdx(t) === startIdx).length;
        if (friendsAtStart >= 2) {
            score -= 100;
        }
    }
  }

  // Low: land on safe square
  const mi = getAbsIdx(moved);
  if (mi >= 0 && SAFE_INDICES.has(mi)) score += 30;

  // Fallback: advance by position
  if (moved.pos >= 0) score += moved.pos * 2;

  return score + Math.random() * 5; // small noise to break ties
};

const aiPickToken = (tokens, dv, difficulty) => {
  const bdSet = blockadeSet(tokens);
  const movable = tokens.filter(t =>
    getOwner(t.player) === 'ai' && canMove(t, dv, tokens, bdSet)
  );
  if (!movable.length) return null;
  if (difficulty === 'easy') return movable[Math.floor(Math.random() * movable.length)];
  let best = null, bestScore = -Infinity;
  for (const t of movable) {
    const s = scoreAIMove(t, dv, tokens, difficulty);
    if (s > bestScore) { bestScore = s; best = t; }
  }
  return best;
};

// ─── Dice Face ────────────────────────────────────────────────────────────────
const DOTS = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [25, 75], [75, 25], [75, 75]],
  5: [[25, 25], [25, 75], [50, 50], [75, 25], [75, 75]],
  6: [[25, 25], [25, 75], [50, 25], [50, 75], [75, 25], [75, 75]],
};

const Die = ({ value, size, color, selected, used, style }) => (
  <View style={[{
    width: size, height: size, borderRadius: 12,
    backgroundColor: '#0a0a1a',
    borderWidth: selected ? 3 : 2,
    borderColor: selected ? '#FFD700' : (used ? '#333' : color),
    opacity: used ? 0.3 : 1,
    shadowColor: selected ? '#FFD700' : color,
    shadowOpacity: selected ? 1 : 0.7,
    shadowRadius: selected ? 18 : 10,
    elevation: selected ? 18 : 8,
    position: 'relative',
  }, style]}>
    {!used && (DOTS[value] || []).map(([top, left], i) => (
      <View key={i} style={{
        position: 'absolute',
        width: size * 0.17, height: size * 0.17, borderRadius: 50,
        backgroundColor: selected ? '#FFD700' : color,
        top: `${top}%`, left: `${left}%`,
        transform: [{ translateX: -size * 0.085 }, { translateY: -size * 0.085 }],
        shadowColor: color, shadowOpacity: 1, shadowRadius: 5, elevation: 6,
      }} />
    ))}
  </View>
);

const TokenSpot = ({ color, size, top, left }) => (
  <View style={{
    position: 'absolute', top, left,
    width: size, height: size, borderRadius: size / 2,
    backgroundColor: '#111',
    borderWidth: 2, borderColor: color,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: color, shadowOpacity: 1, shadowRadius: 6,
    marginLeft: -size / 2, marginTop: -size / 2
  }}>
    <View style={{
      width: '60%', height: '60%', borderRadius: size,
      backgroundColor: color,
      opacity: 0.6,
      shadowColor: color, shadowOpacity: 1, shadowRadius: 10
    }} />
  </View>
);

const HomeBase = ({ color, size, top, left }) => (
  <View style={{
    position: 'absolute', top, left, width: size, height: size,
    backgroundColor: '#0a0a1a', padding: size * 0.05, zIndex: 0
  }}>
    <View style={{
      flex: 1, borderRadius: size * 0.1, borderWidth: 3, borderColor: color,
      shadowColor: color, shadowOpacity: 0.8, shadowRadius: 10, padding: size * 0.08
    }}>
      <View style={{
        flex: 1, borderRadius: size * 0.08, borderWidth: 2, borderColor: color,
        shadowColor: color, shadowOpacity: 0.5, shadowRadius: 5
      }} />
    </View>
    <View style={{ position: 'absolute', top: 0, left: 0, width: size, height: size, zIndex: 1 }} pointerEvents="none">
      <TokenSpot color={color} size={size * 0.16} top="25%" left="25%" />
      <TokenSpot color={color} size={size * 0.16} top="25%" left="75%" />
      <TokenSpot color={color} size={size * 0.16} top="75%" left="25%" />
      <TokenSpot color={color} size={size * 0.16} top="75%" left="75%" />
    </View>
  </View>
);

const CenterArea = ({ size, top, left }) => (
  <View style={{
    position: 'absolute', top, left, width: size, height: size,
    backgroundColor: '#0a0a1a', zIndex: 0,
    borderWidth: 2, borderColor: '#00FFFF', overflow: 'hidden',
    justifyContent: 'center', alignItems: 'center'
  }}>
    <View style={{ position: 'absolute', width: size*1.5, height: size*1.5, backgroundColor: '#FF007F', opacity: 0.3, transform: [{rotate: '45deg'}] }} />
    <View style={{ position: 'absolute', width: size*1.2, height: size*1.2, backgroundColor: '#00FFFF', opacity: 0.3, transform: [{rotate: '-45deg'}] }} />
    <View style={{ position: 'absolute', width: size*0.8, height: size*0.8, backgroundColor: '#39FF14', opacity: 0.4, borderRadius: size, shadowColor: '#39FF14', shadowRadius: 20, shadowOpacity: 1 }} />
    <Ionicons name="infinite" size={size * 0.6} color="#fff" style={{ opacity: 0.9, shadowColor: '#fff', shadowRadius: 10, shadowOpacity: 1 }} />
  </View>
);

// ─── Component ────────────────────────────────────────────────────────────────
const LudoVsAIScreen = ({ route, navigation }) => {
  const { COLORS: THEME } = useTheme();
  const { players, difficulty = 'medium' } = route.params ?? {};

  // Game state
  const [tokens, setTokens] = useState(makeTokens);
  const [turn, setTurn] = useState('human');  // 'human' | 'ai'
  const [dice, setDice] = useState([1, 1]);
  const [usedDice, setUsedDice] = useState([false, false]);
  const [selectedDie, setSelectedDie] = useState(null);  // null | 0 | 1
  const [rolled, setRolled] = useState(false);
  const [movable, setMovable] = useState([]);       // tokens movable with selectedDie
  const [winner, setWinner] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [message, setMessage] = useState('Your turn! Tap a die to roll.');
  const [winScale] = useState(() => new Animated.Value(0));
  const [comboModal, setComboModal] = useState(null); // { visible, token, options: [] }

  // Animation refs
  const diceShake = useRef([new Animated.Value(0), new Animated.Value(0)]).current;
  const glowAnims = useRef({}).current;

  // Fresh token ref for AI callbacks
  const tokenRef = useRef(tokens);
  useEffect(() => { tokenRef.current = tokens; }, [tokens]);

  // ── Ensure glow anim exists ───────────────────────────────────────────────
  const ensureGlow = (key) => {
    if (!glowAnims[key]) glowAnims[key] = new Animated.Value(0);
    return glowAnims[key];
  };

  // ── Glow pulse for movable tokens ─────────────────────────────────────────
  useEffect(() => {
    movable.forEach(t => {
      const key = `${t.player}_${t.id}`;
      const a = ensureGlow(key);
      a.stopAnimation();
      Animated.loop(Animated.sequence([
        Animated.timing(a, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(a, { toValue: 0, duration: 400, useNativeDriver: true }),
      ])).start();
    });
    return () => movable.forEach(t => {
      glowAnims[`${t.player}_${t.id}`]?.stopAnimation();
    });
  }, [movable]);

  // ── Roll animation ────────────────────────────────────────────────────────
  const shakeDice = () => {
    const make = (anim) => {
      const steps = [-12, 10, -8, 6, -4, 2, 0].map(v =>
        Animated.timing(anim, { toValue: v, duration: 60, useNativeDriver: true })
      );
      return Animated.sequence(steps);
    };
    Animated.parallel([make(diceShake[0]), make(diceShake[1])]).start();
  };

  // ── Compute movable tokens for a given die value ──────────────────────────
  const computeMovable = (dv, currentTokens, owner) => {
    const bdSet = blockadeSet(currentTokens);
    return currentTokens.filter(t =>
      getOwner(t.player) === owner && canMove(t, dv, currentTokens, bdSet)
    );
  };

  const isOwnerDone = (tks, owner) =>
    tks.filter(t => getOwner(t.player) === owner).every(t => t.finished);

  // ── End human turn ────────────────────────────────────────────────────────
  const endHumanTurn = (diceVals, usedArr, currentTokens) => {
    const rolledDouble6 = diceVals[0] === 6 && diceVals[1] === 6;
    setRolled(false);
    setMovable([]);
    setSelectedDie(null);
    setUsedDice([false, false]);

    if (rolledDouble6) {
      // Bonus turn — human goes again
      setMessage('🎲 You rolled a double 6! Roll again!');
    } else {
      setTurn('ai');
      setMessage('AI is thinking…');
    }
  };

  // ── Execute human move (functional core) ──────────────────────────────────
  const executeHumanMove = (token, dieIdx, currentDice, currentUsedDice, currentTokens) => {
    const dv = currentDice[dieIdx];
    const bdSet = blockadeSet(currentTokens);
    if (!canMove(token, dv, currentTokens, bdSet)) return;

    HapticService.impact('light');
    const moved = applyMove(token, dv);
    let nextTokens = currentTokens.map(t =>
      t.player === token.player && t.id === token.id ? moved : t
    );
    nextTokens = resolveCapture(moved, nextTokens);

    setTokens(nextTokens);
    setMovable([]);
    setComboModal(null);

    const newUsed = [...currentUsedDice];
    newUsed[dieIdx] = true;
    setSelectedDie(null);

    // Check win
    if (isOwnerDone(nextTokens, 'human')) {
      setWinner('human');
      Animated.spring(winScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
      setTimeout(() => setShowWinner(true), 600);
      return;
    }

    // Check if other die is usable
    const otherIdx = dieIdx === 0 ? 1 : 0;
    if (!newUsed[otherIdx]) {
      const mv2 = computeMovable(currentDice[otherIdx], nextTokens, 'human');
      if (mv2.length > 0) {
        if (mv2.length === 1) {
          // Auto move the second die!
          setUsedDice(newUsed);
          setTimeout(() => executeHumanMove(mv2[0], otherIdx, currentDice, newUsed, nextTokens), 400);
        } else {
          setUsedDice(newUsed);
          setMovable(mv2);
          setSelectedDie(otherIdx);
          setMessage('Use your second die — tap a glowing token.');
        }
        return;
      }
    }

    // Both dice done (or other unusable)
    setUsedDice([true, true]);
    endHumanTurn(currentDice, newUsed, nextTokens);
  };

  // ── Roll dice (human turn) ────────────────────────────────────────────────
  const rollDice = useCallback(() => {
    if (rolled || winner || turn !== 'human' || isRolling) return;
    setIsRolling(true);
    HapticService.impact('medium');

    shakeDice(); // shake visually

    let shuffles = 0;
    const interval = setInterval(() => {
      setDice([
        Math.ceil(Math.random() * 6),
        Math.ceil(Math.random() * 6),
      ]);
      if (shuffles % 2 === 0) HapticService.impact('light');
      shuffles++;

      if (shuffles > 8) {
        clearInterval(interval);
        
        const d1 = Math.ceil(Math.random() * 6);
        const d2 = Math.ceil(Math.random() * 6);
        const currentDice = [d1, d2];
        setDice(currentDice);
        setRolled(true);
        setUsedDice([false, false]);
        setSelectedDie(null);
        setMovable([]);
        setIsRolling(false);
        HapticService.notification('success');

        // Check if ANY move possible at all
        const mv1 = computeMovable(d1, tokenRef.current, 'human');
        const mv2 = computeMovable(d2, tokenRef.current, 'human');
        const anyMove = mv1.length > 0 || mv2.length > 0;

        if (!anyMove) {
          setMessage('No moves available! Passing…');
          setTimeout(() => endHumanTurn(currentDice, [true, true], tokenRef.current), 1200);
        } else {
          // Set ALL movable tokens for display
          const allMovable = [...mv1, ...mv2].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
          setMovable(allMovable);
          setMessage('Select a die, or tap a glowing token to move.');
        }
      }
    }, 50);
  }, [rolled, winner, turn, isRolling, shakeDice]);

  // ── Select which die to use ───────────────────────────────────────────────
  const selectDie = (idx) => {
    if (!rolled || usedDice[idx] || turn !== 'human' || winner) return;
    HapticService.impact('light');
    const mv = computeMovable(dice[idx], tokenRef.current, 'human');

    if (mv.length === 1) {
      executeHumanMove(mv[0], idx, dice, usedDice, tokenRef.current);
    } else {
      setSelectedDie(idx);
      setMovable(mv);
      if (mv.length === 0) {
        setMessage(`No moves for ${dice[idx]}. Try the other die.`);
      } else {
        setMessage('Now tap a glowing token to move it.');
      }
    }
  };

  // ── Move a human token ────────────────────────────────────────────────────
  const moveHumanToken = useCallback((token) => {
    if (!rolled || turn !== 'human') return;

    if (selectedDie !== null) {
      executeHumanMove(token, selectedDie, dice, usedDice, tokenRef.current);
    } else {
      // No die selected. We figure out which options are available.
      const can1 = !usedDice[0] && computeMovable(dice[0], tokenRef.current, 'human').some(t => t.id === token.id);
      const can2 = !usedDice[1] && computeMovable(dice[1], tokenRef.current, 'human').some(t => t.id === token.id);
      
      const options = [];
      if (can1) options.push({ label: `Move ${dice[0]}`, onPress: () => executeHumanMove(token, 0, dice, usedDice, tokenRef.current) });
      if (can2) options.push({ label: `Move ${dice[1]}`, onPress: () => executeHumanMove(token, 1, dice, usedDice, tokenRef.current) });
      
      // Calculate Combined Move
      if (!usedDice[0] && !usedDice[1]) {
        let comboValid = false;
        if (can1) {
          const sim1 = applyMove(token, dice[0]);
          const simTokens1 = tokenRef.current.map(t => t.id === token.id ? sim1 : t);
          if (computeMovable(dice[1], simTokens1, 'human').some(t => t.id === sim1.id)) comboValid = true;
        }
        if (can2 && !comboValid) {
          const sim2 = applyMove(token, dice[1]);
          const simTokens2 = tokenRef.current.map(t => t.id === token.id ? sim2 : t);
          if (computeMovable(dice[0], simTokens2, 'human').some(t => t.id === sim2.id)) comboValid = true;
        }

        if (comboValid) {
          options.push({
            label: `Move ${dice[0] + dice[1]} (Combo)`, 
            onPress: () => {
              setComboModal(null);
              let firstDie = can1 ? 0 : 1;
              let secondDie = firstDie === 0 ? 1 : 0;
              
              const m1 = applyMove(token, dice[firstDie]);
              let tks1 = tokenRef.current.map(t => t.id === token.id ? m1 : t);
              tks1 = resolveCapture(m1, tks1);
              
              const m2 = applyMove(m1, dice[secondDie]);
              let tks2 = tks1.map(t => t.id === m1.id ? m2 : t);
              tks2 = resolveCapture(m2, tks2);
              
              setTokens(tks2);
              setMovable([]);
              setUsedDice([true, true]);
              
              if (isOwnerDone(tks2, 'human')) {
                setWinner('human');
                Animated.spring(winScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
                setTimeout(() => setShowWinner(true), 600);
              } else {
                endHumanTurn(dice, [true, true], tks2);
              }
            }
          });
        }
      }

      if (options.length === 1) {
        options[0].onPress();
      } else if (options.length > 1) {
        setComboModal({ visible: true, token, options });
      }
    }
  }, [selectedDie, rolled, turn, dice, usedDice]);

  // ── AI Turn ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (winner || turn !== 'ai' || rolled) return;

    const delayRoll = { easy: 900, medium: 1200, hard: 1500 }[difficulty] ?? 1200;

    const t1 = setTimeout(() => {
      // AI rolls
      const d1 = Math.ceil(Math.random() * 6);
      const d2 = Math.ceil(Math.random() * 6);
      setDice([d1, d2]);
      setRolled(true);
      setUsedDice([false, false]);

      // AI "thinks" then moves
      const t2 = setTimeout(() => {
        let current = tokenRef.current;
        let used = [false, false];
        const diceVals = [d1, d2];

        // Try to use each die
        for (let i = 0; i < 2; i++) {
          if (used[i]) continue;
          const dv = diceVals[i];
          const chosen = aiPickToken(current, dv, difficulty);
          if (!chosen) { used[i] = true; continue; }

          const moved = applyMove(chosen, dv);
          let next = current.map(t =>
            t.player === chosen.player && t.id === chosen.id ? moved : t
          );
          next = resolveCapture(moved, next);
          current = next;
          used[i] = true;
        }

        setTokens(current);
        setUsedDice([true, true]);

        if (isOwnerDone(current, 'ai')) {
          setWinner('ai');
          Animated.spring(winScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
          setTimeout(() => setShowWinner(true), 600);
          return;
        }

        const t3 = setTimeout(() => {
          setRolled(false);
          setUsedDice([false, false]);
          const rolledDouble6 = d1 === 6 && d2 === 6;
          if (rolledDouble6) {
            setTurn('ai');
            setMessage('AI rolled a double 6! Going again…');
          } else {
            setTurn('human');
            setMessage('Your turn! Tap a die to roll.');
          }
        }, 600);

        return () => clearTimeout(t3);
      }, delayRoll * 0.7);

      return () => clearTimeout(t2);
    }, delayRoll);

    return () => clearTimeout(t1);
  }, [turn, rolled, winner, difficulty]);

  // ── Reset ─────────────────────────────────────────────────────────────────
  const reset = () => {
    setTokens(makeTokens());
    setTurn('human');
    setDice([1, 1]);
    setUsedDice([false, false]);
    setSelectedDie(null);
    setRolled(false);
    setMovable([]);
    setWinner(null);
    setShowWinner(false);
    setMessage('Your turn! Tap a die to roll.');
    winScale.setValue(0);
  };

  // ── Render board cell ─────────────────────────────────────────────────────
  const renderCell = (row, col) => {
    let bg = '#111128';

    const inBase = [
      row >= 9 && row <= 14 && col >= 0 && col <= 5,  // P0 Pink   (bottom-left)
      row >= 0 && row <= 5 && col >= 0 && col <= 5,  // P1 Cyan   (top-left)
      row >= 0 && row <= 5 && col >= 9 && col <= 14, // P2 Yellow (top-right)
      row >= 9 && row <= 14 && col >= 9 && col <= 14, // P3 Green (bottom-right)
    ];
    const isBaseCell = inBase.some(Boolean);
    const isCenterArea = row >= 6 && row <= 8 && col >= 6 && col <= 8;

    if (isBaseCell || isCenterArea) {
      bg = 'transparent';
    } else {
      // Home column colorings (Solid glow)
      if (col === 7 && row >= 9 && row <= 13) bg = PLAYER_COLOR[0];
      if (row === 7 && col >= 1 && col <= 5) bg = PLAYER_COLOR[1];
      if (col === 7 && row >= 1 && row <= 5) bg = PLAYER_COLOR[2];
      if (row === 7 && col >= 9 && col <= 13) bg = PLAYER_COLOR[3];

      // Start square highlights
      const startCells = PLAYER_START.map(i => MAIN_TRACK[i]);
      const startIdx = startCells.findIndex(([r, c]) => r === row && c === col);
      if (startIdx >= 0) bg = PLAYER_COLOR[startIdx];
    }

    const tIdx = MAIN_TRACK.findIndex(([r, c]) => r === row && c === col);
    const isSafe = tIdx >= 0 && SAFE_INDICES.has(tIdx);

    const here = tokens.filter(t => {
      const [r, c] = tokenCell(t);
      return r === row && c === col;
    }).sort((a, b) => {
      const aMovable = movable.some(m => m.player === a.player && m.id === a.id);
      const bMovable = movable.some(m => m.player === b.player && m.id === b.id);
      return (aMovable === bMovable) ? 0 : aMovable ? 1 : -1;
    });

    return (
      <View key={`${row}_${col}`} style={[
        styles.cell,
        { 
          backgroundColor: bg, 
          borderColor: (isBaseCell || isCenterArea) ? 'transparent' : '#00FFFF',
          borderWidth: (isBaseCell || isCenterArea) ? 0 : 1,
          shadowColor: bg !== 'transparent' && bg !== '#111128' ? bg : 'transparent',
          shadowOpacity: 0.8, shadowRadius: 5
        }
      ]}>
        {isSafe && !isCenterArea && !isBaseCell && (
          <Ionicons name="star-outline" size={CELL * 0.65} color="#FFD700" style={{ position: 'absolute' }} />
        )}
        {(row === 14 && col === 7) && <Ionicons name="arrow-up" size={CELL * 0.7} color={PLAYER_COLOR[0]} style={{position:'absolute'}} />}
        {(row === 7 && col === 0) && <Ionicons name="arrow-forward" size={CELL * 0.7} color={PLAYER_COLOR[1]} style={{position:'absolute'}} />}
        {(row === 0 && col === 7) && <Ionicons name="arrow-down" size={CELL * 0.7} color={PLAYER_COLOR[2]} style={{position:'absolute'}} />}
        {(row === 7 && col === 14) && <Ionicons name="arrow-back" size={CELL * 0.7} color={PLAYER_COLOR[3]} style={{position:'absolute'}} />}
        {here.length > 0 && (
          <View style={styles.stack}>
            {here.slice(0, 3).map((t, idx) => {
              const k = `${t.player}_${t.id}`;
              const isMovable = movable.some(m => m.player === t.player && m.id === t.id);
              const gAnim = glowAnims[k];
              const gOp = gAnim
                ? gAnim.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] })
                : 1;

              return (
                <TouchableOpacity
                  key={k}
                  onPress={() => isMovable && turn === 'human' ? moveHumanToken(t) : null}
                  disabled={!isMovable || turn !== 'human'}
                  style={[styles.tokenWrap, {
                    zIndex: 10 + idx,
                    transform: [{ translateX: idx * 4 }, { translateY: -idx * 4 }],
                  }]}
                >
                  <Animated.View style={[styles.token, {
                    backgroundColor: '#111',
                    borderWidth: 3,
                    borderColor: PLAYER_COLOR[t.player],
                    shadowColor: PLAYER_COLOR[t.player],
                    shadowOpacity: isMovable ? gOp : 0.4,
                    shadowRadius: isMovable ? 16 : 4,
                    elevation: isMovable ? 16 : 4,
                    transform: [{ scale: isMovable ? 1.14 : 0.85 }],
                  }]}>
                    <View style={{ width: '50%', height: '50%', backgroundColor: PLAYER_COLOR[t.player], borderRadius: 10, opacity: 0.8 }} />
                  </Animated.View>
                  {here.length > 1 && idx === here.length - 1 && (
                    <View style={styles.badge}>
                      <Text style={{ fontSize: 7, color: '#000', fontWeight: 'bold' }}>{here.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  // ── Score pips (4 pips per house, 2 houses per player = 8 total) ──────────
  const getFinishedColors = (owner) =>
    tokens.filter(t => getOwner(t.player) === owner && t.finished).map(t => PLAYER_COLOR[t.player]);

  const activeOwner = winner ? null : turn;

  return (
    <SafeAreaView style={[styles.screen, { minHeight: SH }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#aaa" />
        </TouchableOpacity>
        <NeonText size={19} weight="bold" glow>NEON LUDO</NeonText>
        <View style={{ width: 36 }} />
      </View>

      {/* Score bar */}
      <View style={styles.scoreBar}>
        {['human', 'ai'].map(owner => {
          const finishedColors = getFinishedColors(owner);
          const isActive = activeOwner === owner;
          const c1 = PLAYER_COLOR[owner === 'human' ? 0 : 1];
          return (
            <View key={owner} style={[styles.scoreBadge, {
              borderColor: c1,
              backgroundColor: PLAYER_DARK[owner === 'human' ? 0 : 1],
              shadowColor: c1, shadowOpacity: isActive ? 1 : 0.2,
              shadowRadius: isActive ? 18 : 4, elevation: isActive ? 16 : 3,
            }]}>
              <NeonText size={10} color={c1} weight="bold">{owner === 'human' ? 'YOU' : 'AI'}</NeonText>
              <View style={styles.pipRow}>
                {finishedColors.map((color, i) => (
                  <View key={`lit_${i}`} style={[styles.pip, {
                    backgroundColor: color,
                    shadowColor: color,
                    shadowOpacity: 1,
                    shadowRadius: 4, elevation: 4,
                  }]} />
                ))}
                {[...Array(8 - finishedColors.length)].map((_, i) => (
                  <View key={`unlit_${i}`} style={[styles.pip, {
                    backgroundColor: '#222',
                    shadowColor: 'transparent',
                    shadowOpacity: 0,
                    shadowRadius: 0, elevation: 0,
                  }]} />
                ))}
              </View>
            </View>
          );
        })}
      </View>

      {/* Message */}
      <NeonText
        size={12}
        color={turn === 'human' ? PLAYER_COLOR[0] : PLAYER_COLOR[1]}
        style={{ textAlign: 'center', marginHorizontal: 16, marginBottom: 6 }}
      >
        {message}
      </NeonText>

      {/* Board */}
      <View style={styles.boardWrap}>
        <View style={[styles.board, { width: CELL * GRID, height: CELL * GRID }]}>
          <HomeBase player={0} color={PLAYER_COLOR[0]} top={9 * CELL} left={0} size={6 * CELL} />
          <HomeBase player={1} color={PLAYER_COLOR[1]} top={0} left={0} size={6 * CELL} />
          <HomeBase player={2} color={PLAYER_COLOR[2]} top={0} left={9 * CELL} size={6 * CELL} />
          <HomeBase player={3} color={PLAYER_COLOR[3]} top={9 * CELL} left={9 * CELL} size={6 * CELL} />
          <CenterArea size={3 * CELL} top={6 * CELL} left={6 * CELL} />
          
          <View style={{ flex: 1, zIndex: 10 }}>
            {Array.from({ length: GRID }, (_, row) => (
              <View key={row} style={{ flexDirection: 'row', height: CELL }}>
                {Array.from({ length: GRID }, (_, col) => renderCell(row, col))}
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Dice area */}
      <TouchableOpacity 
        style={styles.diceArea} 
        activeOpacity={1}
        onPress={() => { if (!rolled) rollDice(); }}
      >
        {/* Two dice */}
        <View style={styles.diceRow} pointerEvents="box-none">
          {[0, 1].map(idx => {
            const canSelect = rolled && !usedDice[idx] && turn === 'human' && !winner;
            return (
              <Animated.View key={idx} style={{ transform: [{ translateX: diceShake[idx] }] }}>
                <TouchableOpacity
                  onPress={() => canSelect ? selectDie(idx) : (!rolled ? rollDice() : null)}
                  activeOpacity={0.8}
                >
                  <Die
                    value={dice[idx]}
                    size={56}
                    color={turn === 'human' ? PLAYER_COLOR[0] : PLAYER_COLOR[1]}
                    selected={selectedDie === idx}
                    used={usedDice[idx]}
                    style={{ marginHorizontal: 10 }}
                  />
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Roll button */}
        {!rolled && turn === 'human' && !winner && (
          <TouchableOpacity style={[styles.rollBtn, { borderColor: PLAYER_COLOR[0] }]} onPress={rollDice}>
            <Ionicons name="dice-outline" size={20} color={PLAYER_COLOR[0]} />
            <NeonText size={14} color={PLAYER_COLOR[0]} weight="bold" style={{ marginLeft: 8 }}>
              ROLL DICE
            </NeonText>
          </TouchableOpacity>
        )}

        {turn === 'ai' && !winner && (
          <NeonText size={11} color={PLAYER_COLOR[1]} style={{ marginTop: 6 }}>
            AI is rolling…
          </NeonText>
        )}

        {/* Die usage hint */}
        {rolled && turn === 'human' && !winner && (
          <NeonText size={10} color="#555" style={{ marginTop: 4 }}>
            {usedDice[0] && usedDice[1]
              ? 'Both dice used'
              : `Die ${!usedDice[0] ? '1' : '2'} still available`}
          </NeonText>
        )}
      </TouchableOpacity>

      {/* Winner modal */}
      <Modal visible={showWinner} transparent animationType="fade">
        <View style={styles.overlay}>
          <Animated.View style={[styles.modalCard, {
            borderColor: PLAYER_COLOR[winner === 'human' ? 0 : 1],
            transform: [{ scale: winScale }],
            shadowColor: PLAYER_COLOR[winner === 'human' ? 0 : 1],
            shadowOpacity: 0.9, shadowRadius: 30, elevation: 30,
          }]}>
            <Text style={{ fontSize: 64 }}>{winner === 'human' ? '🏆' : '🤖'}</Text>
            <NeonText size={30} weight="bold" glow
              color={PLAYER_COLOR[winner === 'human' ? 0 : 1]}
              style={{ marginTop: 8 }}
            >
              {winner === 'human' ? 'YOU WIN!' : 'AI WINS!'}
            </NeonText>
            <NeonText size={13} color="#777" style={{ marginTop: 8, marginBottom: 24, textAlign: 'center' }}>
              All tokens made it home!
            </NeonText>
            <NeonButton title="PLAY AGAIN" onPress={reset} variant="primary" />
            <View style={{ height: 10 }} />
            <NeonButton title="MENU" onPress={() => navigation.navigate('LocalGameSelection', {
              players: players || [], isSinglePlayer: true,
            })} variant="secondary" />
          </Animated.View>
        </View>
      </Modal>

      {/* Combo Move Modal */}
      <Modal visible={!!comboModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.modalCard, { borderColor: '#00ffff' }]}>
            <NeonText size={20} glow style={{ marginBottom: 20 }}>Select Move</NeonText>
            {comboModal?.options.map((opt, i) => (
              <View key={i} style={{ marginBottom: 12 }}>
                <NeonButton title={opt.label} onPress={opt.onPress} variant={opt.label.includes('Combo') ? 'primary' : 'secondary'} />
              </View>
            ))}
            <View style={{ marginTop: 10 }}>
              <NeonButton title="Cancel" onPress={() => setComboModal(null)} variant="danger" />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1, backgroundColor: '#07070e',
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12, paddingTop: 40, paddingBottom: 2,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  scoreBar: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingHorizontal: 16, marginBottom: 6,
  },
  scoreBadge: {
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 7,
    alignItems: 'center', minWidth: 130,
    shadowOffset: { width: 0, height: 0 },
  },
  pipRow: { flexDirection: 'row', gap: 4, marginTop: 5, flexWrap: 'wrap', maxWidth: 120 },
  pip: {
    width: 8, height: 8, borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  boardWrap: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingVertical: 4,
    minHeight: CELL * GRID + 10,
  },
  board: {
    borderWidth: 2, borderColor: '#2a2a5a',
    backgroundColor: '#0c0c1e',
    shadowColor: '#00FFFF', shadowOpacity: 0.2,
    shadowRadius: 18, elevation: 18,
    overflow: 'hidden',
  },
  cell: {
    width: CELL, height: CELL, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'visible',
  },
  stack: {
    position: 'absolute', width: '100%', height: '100%',
    justifyContent: 'center', alignItems: 'center',
  },
  tokenWrap: {
    position: 'absolute', justifyContent: 'center', alignItems: 'center',
  },
  token: {
    width: CELL * 0.72, height: CELL * 0.72,
    borderRadius: CELL * 0.36, borderWidth: 2.5,
    justifyContent: 'center', alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
  },
  badge: {
    position: 'absolute', top: -3, right: -3,
    backgroundColor: '#fff', borderRadius: 5,
    width: 12, height: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  diceArea: {
    alignItems: 'center', paddingVertical: 10, paddingBottom: 40,
  },
  diceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  rollBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 2, borderRadius: 16,
    paddingHorizontal: 26, paddingVertical: 10,
    backgroundColor: 'rgba(0,255,255,0.07)', marginTop: 2,
  },
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center', alignItems: 'center', padding: 28,
  },
  modalCard: {
    backgroundColor: '#0e0e1e', borderRadius: 24, borderWidth: 2,
    padding: 32, alignItems: 'center', width: '100%', maxWidth: 340,
    shadowOffset: { width: 0, height: 0 },
  },
});

export default LudoVsAIScreen;