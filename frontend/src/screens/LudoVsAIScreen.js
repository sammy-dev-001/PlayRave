/**
 * LudoVsAIScreen.js
 * 1–4 Player Local Ludo with automatic AI Bot fill:
 *  - Assigns each human player a distinct corner color (Pink, Cyan, Yellow, Green)
 *  - Fills empty seats up to 4 with AI Bots at the chosen difficulty
 *  - 2 dice per turn, blockades (2+ same-color tokens), safe star squares, kamikaze capture,
 *    and bonus turn on rolling double 6.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, TouchableOpacity, StyleSheet, Animated,
  Modal, SafeAreaView, Text, Platform, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import HapticService from '../services/HapticService';
import { buildLudoSeats } from './LudoDifficultyScreen';
import {
  LUDO_RAVE_THEME,
  LUDO_STACK_OFFSETS,
  LUDO_MID_SAFE_STAR_COLORS,
  LudoHomeBase,
  LudoCenterGoal,
  LudoTrackTile,
  NeonStarToken,
} from '../components/LudoBoardUI';

// ─── Geometry Constants ───────────────────────────────────────────────────────
const GRID = 15;
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

const PLAYER_COLOR = ['#FF007F', '#00FFFF', '#FFD700', '#39FF14']; // P0(Pink), P1(Cyan), P2(Yellow), P3(Green)
const PLAYER_DARK = ['#330018', '#003038', '#332b00', '#0e2200'];

// 52-cell outer track, clockwise
const MAIN_TRACK = [
  // 0-5: bottom col 6, rows 14→9 (P0 entry)
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  // 6-12: row 8 going left + corner
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0], [7, 0],
  // 13-18: row 6 going right (P1 entry)
  [6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  // 19-24: col 6, rows 5→0
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  // 25-26: top turn
  [0, 7], [0, 8],
  // 27-31: col 8, rows 1→5 (P2 entry at [0,8])
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  // 32-38: row 6 going right + corner
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14], [7, 14],
  // 39-44: row 8 going left (P3 entry at [8,14]=39)
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  // 45-51: col 8, rows 9→14 + turn
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], [14, 7],
];

const PLAYER_START = [0, 13, 26, 39];
const SAFE_INDICES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

// Home columns: 5 cells from outer track toward center [7,7]
const HOME_COLS = [
  [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]], // P0 Pink   – col 7 going UP
  [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],     // P1 Cyan   – row 7 going RIGHT
  [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],     // P2 Yellow – col 7 going DOWN
  [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]], // P3 Green  – row 7 going LEFT
];

const CENTER = [7, 7];

const HOME_CORNERS = [
  { r: 9, c: 0 }, // P0 Pink   bottom-left
  { r: 0, c: 0 }, // P1 Cyan   top-left
  { r: 0, c: 9 }, // P2 Yellow top-right
  { r: 9, c: 9 }, // P3 Green  bottom-right
];
const TOKEN_OFFSETS = [
  { r: 1, c: 1 }, { r: 1, c: 4 },
  { r: 4, c: 1 }, { r: 4, c: 4 },
];

// ─── Token Factory ────────────────────────────────────────────────────────────
const makeTokens = () =>
  [0, 1, 2, 3].flatMap(p =>
    [0, 1, 2, 3].map(id => ({
      player: p,
      id,
      pos: -1,     // -1 = in yard; 0-50 = on main track; 51 = off track (in home col)
      homePos: -1, // -1 = not in home col; 0-4 = home col position; 5 = finished
      finished: false,
    }))
  );

// ─── Board Geometry Helpers ───────────────────────────────────────────────────
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

// ─── Per-Seat Blockade & Move Validation ──────────────────────────────────────
const blockadeSet = (tokens) => {
  const counts = {};
  for (const t of tokens) {
    const ai = getAbsIdx(t);
    if (ai < 0) continue;
    const key = `${ai}_${t.player}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
};

const isBlockadedFor = (absIdx, movingPlayer, bdSet) => {
  for (let p = 0; p < 4; p++) {
    if (p !== movingPlayer && (bdSet[`${absIdx}_${p}`] || 0) >= 2) {
      return true;
    }
  }
  return false;
};

const isPathClear = (token, steps, bdSet) => {
  for (let s = 1; s <= steps; s++) {
    const newPos = token.pos + s;
    if (newPos > 50) break;
    const ai = (PLAYER_START[token.player] + newPos) % 52;
    if (isBlockadedFor(ai, token.player, bdSet)) return false;
  }
  return true;
};

const canMove = (token, dv, _allTokens, bdSet) => {
  if (token.finished) return false;
  if (token.pos === -1) {
    if (dv !== 6) return false;
    const startAbs = PLAYER_START[token.player];
    return !isBlockadedFor(startAbs, token.player, bdSet);
  }
  if (token.homePos >= 0) {
    return token.homePos + dv <= 5;
  }
  const newPos = token.pos + dv;
  if (newPos > 55) return false;
  return isPathClear(token, Math.min(dv, 51 - token.pos), bdSet);
};

// ─── Move Application & Capture ───────────────────────────────────────────────
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
    const into = np - 51;
    if (into >= 5) { t.finished = true; t.homePos = 5; }
    else { t.homePos = into; }
    t.pos = 51;
  } else {
    t.pos = np;
  }
  return t;
};

const resolveCapture = (movedToken, allTokens) => {
  const absIdx = getAbsIdx(movedToken);
  if (absIdx < 0 || SAFE_INDICES.has(absIdx)) return allTokens;

  const opponentsHere = allTokens.filter(t =>
    t.player !== movedToken.player && getAbsIdx(t) === absIdx
  );

  // Only capture a lone vulnerable opponent token (kamikaze crown)
  if (opponentsHere.length === 1) {
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
  return allTokens;
};

// ─── Per-Seat AI Heuristics ───────────────────────────────────────────────────
const isSquareInDanger = (absIdx, seatIdx, allTokens, bdSet) => {
  if (absIdx < 0 || SAFE_INDICES.has(absIdx)) return false;
  if ((bdSet[`${absIdx}_${seatIdx}`] || 0) >= 2) return false;
  for (let s = 1; s <= 6; s++) {
    const checkIdx = (absIdx - s + 52) % 52;
    const oppHere = allTokens.filter(t => t.player !== seatIdx && getAbsIdx(t) === checkIdx);
    if (oppHere.length > 0) {
      let pathClear = true;
      for (let step = 1; step <= s; step++) {
        const pathIdx = (checkIdx + step) % 52;
        if (isBlockadedFor(pathIdx, oppHere[0].player, bdSet)) {
          pathClear = false;
          break;
        }
      }
      if (pathClear) return true;
    }
  }
  return false;
};

const scoreAIMove = (token, dv, allTokens, difficulty, aiSeat) => {
  const moved = applyMove(token, dv);
  const bdSet = blockadeSet(allTokens);
  let score = 0;

  if (moved.finished) return 1200 + Math.random() * 10;
  if (moved.homePos >= 0) score += 300 + moved.homePos * 40;
  if (token.pos === -1 && dv === 6) score += 180;

  if (difficulty !== 'easy') {
    const ai = getAbsIdx(moved);
    if (ai >= 0 && !SAFE_INDICES.has(ai)) {
      const oppHere = allTokens.filter(t => t.player !== aiSeat && getAbsIdx(t) === ai);
      if (oppHere.length === 1) score += 400;
    }
  }

  if (difficulty === 'hard') {
    const ai = getAbsIdx(moved);
    const startIdx = getAbsIdx(token);

    if (ai >= 0) {
      const friendsHere = allTokens.filter(t => t.player === aiSeat && t.id !== moved.id && getAbsIdx(t) === ai).length;
      if (friendsHere >= 1) score += 150;
    }
    if (startIdx >= 0 && isSquareInDanger(startIdx, aiSeat, allTokens, bdSet)) {
      score += 200;
    }
    if (ai >= 0 && isSquareInDanger(ai, aiSeat, allTokens, bdSet)) {
      score -= 250;
    }
    if (startIdx >= 0) {
      const friendsAtStart = allTokens.filter(t => t.player === aiSeat && getAbsIdx(t) === startIdx).length;
      if (friendsAtStart >= 2) score -= 100;
    }
  }

  const mi = getAbsIdx(moved);
  if (mi >= 0 && SAFE_INDICES.has(mi)) score += 30;
  if (moved.pos >= 0) score += moved.pos * 2;

  return score + Math.random() * 5;
};

const aiPickToken = (tokens, dv, difficulty, aiSeat) => {
  const bdSet = blockadeSet(tokens);
  const movable = tokens.filter(t =>
    t.player === aiSeat && canMove(t, dv, tokens, bdSet)
  );
  if (!movable.length) return null;
  if (difficulty === 'easy') return movable[Math.floor(Math.random() * movable.length)];
  let best = null;
  let bestScore = -Infinity;
  for (const t of movable) {
    const s = scoreAIMove(t, dv, tokens, difficulty, aiSeat);
    if (s > bestScore) { bestScore = s; best = t; }
  }
  return best;
};

// ─── Subcomponents ────────────────────────────────────────────────────────────
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

// ─── Component ────────────────────────────────────────────────────────────────
const LudoVsAIScreen = ({ route, navigation }) => {
  const { COLORS: _THEME } = useTheme();
  const { width: SW, height: SH } = useWindowDimensions();
  const { players = [], isSinglePlayer = true, difficulty = 'medium' } = route?.params || {};

  const BOARD_PX = useMemo(() => Math.floor(Math.min(SW - 14, SH - 250, 460)), [SW, SH]);
  const CELL = useMemo(() => Math.max(16, Math.floor(BOARD_PX / GRID)), [BOARD_PX]);

  const seats = useMemo(() => buildLudoSeats(players, isSinglePlayer), [players, isSinglePlayer]);
  const seatsRef = useRef(seats);
  useEffect(() => { seatsRef.current = seats; }, [seats]);

  // Game state
  const [tokens, setTokens] = useState(makeTokens);
  const [turnSeat, setTurnSeat] = useState(0); // 0 | 1 | 2 | 3
  const [dice, setDice] = useState([1, 1]);
  const [usedDice, setUsedDice] = useState([false, false]);
  const [selectedDie, setSelectedDie] = useState(null);
  const [rolled, setRolled] = useState(false);
  const [movable, setMovable] = useState([]);
  const [winner, setWinner] = useState(null); // seat object
  const [isRolling, setIsRolling] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [message, setMessage] = useState(() => `${seats[0].name}'s turn (${seats[0].colorName})! Roll dice.`);
  const [winScale] = useState(() => new Animated.Value(0));

  // Refs
  const diceShake = useRef([new Animated.Value(0), new Animated.Value(0)]).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const tokenRef = useRef(tokens);
  const timersRef = useRef([]);

  useEffect(() => { tokenRef.current = tokens; }, [tokens]);

  const addTimeout = useCallback((fn, ms) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => () => clearAllTimers(), [clearAllTimers]);

  useEffect(() => {
    if (movable.length > 0) {
      pulseAnim.setValue(1);
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.18, duration: 420, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 420, useNativeDriver: USE_NATIVE_DRIVER }),
      ]));
      loop.start();
      return () => loop.stop();
    }
    pulseAnim.setValue(1);
    return undefined;
  }, [movable, pulseAnim]);

  const shakeDice = useCallback(() => {
    const make = (anim) => {
      const steps = [-12, 10, -8, 6, -4, 2, 0].map(v =>
        Animated.timing(anim, { toValue: v, duration: 55, useNativeDriver: USE_NATIVE_DRIVER })
      );
      return Animated.sequence(steps);
    };
    Animated.parallel([make(diceShake[0]), make(diceShake[1])]).start();
  }, [diceShake]);

  const computeMovable = (dv, currentTokens, seatIdx) => {
    const bdSet = blockadeSet(currentTokens);
    return currentTokens.filter(t =>
      t.player === seatIdx && canMove(t, dv, currentTokens, bdSet)
    );
  };

  const isSeatDone = (tks, seatIdx) =>
    tks.filter(t => t.player === seatIdx).every(t => t.finished);

  const advanceTurn = useCallback((fromSeat, diceVals) => {
    const rolledDouble6 = diceVals[0] === 6 && diceVals[1] === 6;
    setRolled(false);
    setMovable([]);
    setSelectedDie(null);
    setUsedDice([false, false]);

    if (rolledDouble6) {
      const seat = seatsRef.current[fromSeat];
      setMessage(`🎲 ${seat.name} rolled double 6! Roll again!`);
      return;
    }

    const nextSeatIdx = (fromSeat + 1) % 4;
    const nextSeat = seatsRef.current[nextSeatIdx];
    setTurnSeat(nextSeatIdx);
    setMessage(
      nextSeat.isAI
        ? `${nextSeat.name} (${nextSeat.colorName}) is thinking…`
        : `${nextSeat.name}'s turn (${nextSeat.colorName})! Tap to roll.`
    );
  }, []);

  const executeHumanMove = useCallback((token, dieIdx, currentDice, currentUsedDice, currentTokens, seatIdx) => {
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

    const newUsed = [...currentUsedDice];
    newUsed[dieIdx] = true;
    setSelectedDie(null);

    if (isSeatDone(nextTokens, seatIdx)) {
      const winSeat = seatsRef.current[seatIdx];
      setWinner(winSeat);
      Animated.spring(winScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: USE_NATIVE_DRIVER }).start();
      addTimeout(() => setShowWinner(true), 500);
      return;
    }

    const otherIdx = dieIdx === 0 ? 1 : 0;
    if (!newUsed[otherIdx]) {
      const mv2 = computeMovable(currentDice[otherIdx], nextTokens, seatIdx);
      if (mv2.length > 0) {
        if (mv2.length === 1) {
          setUsedDice(newUsed);
          addTimeout(() => executeHumanMove(mv2[0], otherIdx, currentDice, newUsed, nextTokens, seatIdx), 380);
        } else {
          setUsedDice(newUsed);
          setMovable(mv2);
          setSelectedDie(otherIdx);
          setMessage('Use your second die — tap a glowing token.');
        }
        return;
      }
    }

    setUsedDice([true, true]);
    advanceTurn(seatIdx, currentDice);
  }, [advanceTurn, addTimeout, winScale]);

  const activeSeat = seats[turnSeat] || seats[0];

  const rollDice = useCallback(() => {
    if (rolled || winner || activeSeat.isAI || isRolling) return;
    setIsRolling(true);
    HapticService.impact('medium');
    shakeDice();

    let shuffles = 0;
    const interval = setInterval(() => {
      setDice([Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)]);
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

        const mv1 = computeMovable(d1, tokenRef.current, turnSeat);
        const mv2 = computeMovable(d2, tokenRef.current, turnSeat);
        if (mv1.length === 0 && mv2.length === 0) {
          setMessage(`${activeSeat.name}: No moves available! Passing…`);
          addTimeout(() => advanceTurn(turnSeat, currentDice), 1100);
        } else {
          const allMovable = [...mv1, ...mv2].filter(
            (v, i, a) => a.findIndex(t => t.player === v.player && t.id === v.id) === i
          );
          setMovable(allMovable);
          setMessage(`${activeSeat.name}: Select a die or tap a glowing token.`);
        }
      }
    }, 50);
  }, [rolled, winner, activeSeat, isRolling, shakeDice, turnSeat, advanceTurn, addTimeout]);

  const selectDie = (idx) => {
    if (!rolled || usedDice[idx] || activeSeat.isAI || winner) return;
    HapticService.impact('light');
    const mv = computeMovable(dice[idx], tokenRef.current, turnSeat);

    if (mv.length === 1) {
      executeHumanMove(mv[0], idx, dice, usedDice, tokenRef.current, turnSeat);
    } else {
      setSelectedDie(idx);
      setMovable(mv);
      setMessage(
        mv.length === 0
          ? `No moves for ${dice[idx]}. Try the other die.`
          : `${activeSeat.name}: Now tap a glowing token.`
      );
    }
  };

  const moveHumanToken = useCallback((token) => {
    if (!rolled || activeSeat.isAI || token.player !== turnSeat) return;

    if (selectedDie !== null) {
      executeHumanMove(token, selectedDie, dice, usedDice, tokenRef.current, turnSeat);
    } else {
      const can1 = !usedDice[0] && computeMovable(dice[0], tokenRef.current, turnSeat)
        .some(t => t.player === token.player && t.id === token.id);
      const can2 = !usedDice[1] && computeMovable(dice[1], tokenRef.current, turnSeat)
        .some(t => t.player === token.player && t.id === token.id);

      const options = [];
      if (can1) options.push(() => executeHumanMove(token, 0, dice, usedDice, tokenRef.current, turnSeat));
      if (can2) options.push(() => executeHumanMove(token, 1, dice, usedDice, tokenRef.current, turnSeat));

      if (options.length === 1) {
        options[0]();
      } else if (options.length > 1) {
        setMessage('Select a die at the bottom first!');
        HapticService.notification('warning');
      }
    }
  }, [selectedDie, rolled, activeSeat.isAI, turnSeat, dice, usedDice, executeHumanMove]);

  // ── AI Bot Turn Effect ─────────────────────────────────────────────────────
  useEffect(() => {
    const seat = seatsRef.current[turnSeat];
    if (winner || !seat?.isAI || rolled) return;

    const delayRoll = { easy: 750, medium: 1000, hard: 1200 }[difficulty] ?? 1000;

    const t1 = addTimeout(() => {
      const d1 = Math.ceil(Math.random() * 6);
      const d2 = Math.ceil(Math.random() * 6);
      const diceVals = [d1, d2];
      setDice(diceVals);
      setRolled(true);
      setUsedDice([false, false]);
      shakeDice();

      addTimeout(() => {
        let current = tokenRef.current;
        const used = [false, false];

        // 2 passes so if die 1 is a 6 that spawns a token, die 0 can advance it
        for (let pass = 0; pass < 2; pass++) {
          for (let i = 0; i < 2; i++) {
            if (used[i]) continue;
            const chosen = aiPickToken(current, diceVals[i], difficulty, turnSeat);
            if (!chosen) continue;

            const moved = applyMove(chosen, diceVals[i]);
            let next = current.map(t =>
              t.player === chosen.player && t.id === chosen.id ? moved : t
            );
            next = resolveCapture(moved, next);
            current = next;
            used[i] = true;
          }
        }

        setTokens(current);
        setUsedDice([true, true]);

        if (isSeatDone(current, turnSeat)) {
          setWinner(seat);
          Animated.spring(winScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: USE_NATIVE_DRIVER }).start();
          addTimeout(() => setShowWinner(true), 500);
          return;
        }

        addTimeout(() => {
          advanceTurn(turnSeat, diceVals);
        }, 550);
      }, delayRoll * 0.65);
    }, delayRoll);

    return () => clearTimeout(t1);
  }, [turnSeat, rolled, winner, difficulty, addTimeout, shakeDice, advanceTurn, winScale]);

  const reset = () => {
    clearAllTimers();
    setTokens(makeTokens());
    setTurnSeat(0);
    setDice([1, 1]);
    setUsedDice([false, false]);
    setSelectedDie(null);
    setRolled(false);
    setMovable([]);
    setWinner(null);
    setShowWinner(false);
    setMessage(`${seats[0].name}'s turn (${seats[0].colorName})! Roll dice.`);
    winScale.setValue(0);
  };

  // ── Render Board Cell ─────────────────────────────────────────────────────
  const renderCell = (row, col) => {
    const inBase = [
      row >= 9 && row <= 14 && col >= 0 && col <= 5,
      row >= 0 && row <= 5 && col >= 0 && col <= 5,
      row >= 0 && row <= 5 && col >= 9 && col <= 14,
      row >= 9 && row <= 14 && col >= 9 && col <= 14,
    ];
    const isBaseCell = inBase.some(Boolean);
    const isCenterArea = row >= 6 && row <= 8 && col >= 6 && col <= 8;

    let homeColColor = null;
    let startColor = null;

    if (!isBaseCell && !isCenterArea) {
      if (col === 7 && row >= 9 && row <= 13) homeColColor = PLAYER_COLOR[0];
      if (row === 7 && col >= 1 && col <= 5) homeColColor = PLAYER_COLOR[1];
      if (col === 7 && row >= 1 && row <= 5) homeColColor = PLAYER_COLOR[2];
      if (row === 7 && col >= 9 && col <= 13) homeColColor = PLAYER_COLOR[3];

      const startCells = PLAYER_START.map(i => MAIN_TRACK[i]);
      const startIdx = startCells.findIndex(([r, c]) => r === row && c === col);
      if (startIdx >= 0) startColor = PLAYER_COLOR[startIdx];
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

    let directionArrow = null;
    if (row === 14 && col === 7) directionArrow = { direction: 'up', color: PLAYER_COLOR[0] };
    else if (row === 7 && col === 0) directionArrow = { direction: 'right', color: PLAYER_COLOR[1] };
    else if (row === 0 && col === 7) directionArrow = { direction: 'down', color: PLAYER_COLOR[2] };
    else if (row === 7 && col === 14) directionArrow = { direction: 'left', color: PLAYER_COLOR[3] };

    const safeStarColor = startColor || LUDO_MID_SAFE_STAR_COLORS[`${row}_${col}`] || '#FFD700';

    const tokenElements = here.length > 0 && (
      <View style={styles.stack} pointerEvents="box-none">
        {here.slice(0, 4).map((t, idx) => {
          const k = `${t.player}_${t.id}`;
          const isMovable = movable.some(m => m.player === t.player && m.id === t.id);
          const isStacked = here.length > 1;

          let tx = 0;
          let ty = 0;
          if (isStacked) {
            const off = LUDO_STACK_OFFSETS[idx % 4];
            tx = off.x * CELL;
            ty = off.y * CELL;
          }

          const canTapToken = isMovable && !activeSeat.isAI && t.player === turnSeat;
          const baseScale = isStacked ? (isMovable ? 0.88 : 0.68) : (isMovable ? 1.06 : 0.94);

          return (
            <TouchableOpacity
              key={k}
              onPress={() => canTapToken ? moveHumanToken(t) : null}
              disabled={!canTapToken}
              activeOpacity={0.75}
              style={[styles.tokenWrap, {
                zIndex: 10 + idx,
                transform: [{ translateX: tx }, { translateY: ty }],
              }]}
            >
              <Animated.View style={isMovable ? { transform: [{ scale: pulseAnim }] } : undefined}>
                <View style={{ transform: [{ scale: baseScale }] }}>
                  <NeonStarToken
                    color={PLAYER_COLOR[t.player]}
                    size={Math.floor(CELL * 0.86)}
                    isMovable={isMovable}
                  />
                </View>
              </Animated.View>
              {isStacked && idx === Math.min(here.length - 1, 3) && here.length > 4 && (
                <View style={styles.badge}>
                  <Text style={{ fontSize: 7, color: '#000', fontWeight: 'bold' }}>{here.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );

    if (isBaseCell || isCenterArea) {
      return (
        <View
          key={`${row}_${col}`}
          style={[styles.cell, { width: CELL, height: CELL, backgroundColor: 'transparent' }]}
          pointerEvents="box-none"
        >
          {tokenElements}
        </View>
      );
    }

    return (
      <LudoTrackTile
        key={`${row}_${col}`}
        size={CELL}
        startColor={startColor}
        homeColColor={homeColColor}
        isSafeStar={isSafe && here.length === 0}
        safeStarColor={safeStarColor}
        directionArrow={directionArrow}
      >
        {tokenElements}
      </LudoTrackTile>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <LinearGradient
        colors={['#070714', '#0D0B21', '#070714']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#aaa" />
        </TouchableOpacity>
        <NeonText size={19} weight="bold" glow>NEON LUDO</NeonText>
        <View style={{ width: 36 }} />
      </View>

      {/* 4-Seat Score Bar */}
      <View style={styles.scoreBar}>
        {seats.map(seat => {
          const finishedCount = tokens.filter(t => t.player === seat.idx && t.finished).length;
          const isActive = !winner && turnSeat === seat.idx;
          return (
            <View key={seat.idx} style={[styles.scoreBadge, {
              borderColor: seat.color,
              backgroundColor: PLAYER_DARK[seat.idx],
              shadowColor: seat.color,
              shadowOpacity: isActive ? 1 : 0.15,
              shadowRadius: isActive ? 12 : 3,
              elevation: isActive ? 12 : 2,
              opacity: isActive ? 1 : 0.72,
            }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, maxWidth: '100%' }}>
                {seat.isAI && <Ionicons name="hardware-chip-outline" size={10} color={seat.color} />}
                <NeonText size={10} color={seat.color} weight="bold" numberOfLines={1}>
                  {seat.name}
                </NeonText>
              </View>
              <View style={styles.pipRow}>
                {[0, 1, 2, 3].map(i => (
                  <View key={i} style={[styles.pip, i < finishedCount ? {
                    backgroundColor: seat.color,
                    shadowColor: seat.color,
                    shadowOpacity: 1,
                    shadowRadius: 4,
                    elevation: 4,
                  } : {
                    backgroundColor: '#222',
                  }]} />
                ))}
              </View>
            </View>
          );
        })}
      </View>

      {/* Turn Status Message */}
      <NeonText
        size={12}
        color={activeSeat.color}
        style={{ textAlign: 'center', marginHorizontal: 16, marginBottom: 4 }}
      >
        {message}
      </NeonText>

      {/* Board */}
      <View style={[styles.boardWrap, { minHeight: CELL * GRID + 8 }]}>
        <View style={[styles.board, { width: CELL * GRID, height: CELL * GRID }]}>
          <LudoHomeBase color={PLAYER_COLOR[0]} top={9 * CELL} left={0} size={6 * CELL} label={seats[0].name} isActive={turnSeat === 0 && !winner} />
          <LudoHomeBase color={PLAYER_COLOR[1]} top={0} left={0} size={6 * CELL} label={seats[1].name} isActive={turnSeat === 1 && !winner} />
          <LudoHomeBase color={PLAYER_COLOR[2]} top={0} left={9 * CELL} size={6 * CELL} label={seats[2].name} isActive={turnSeat === 2 && !winner} />
          <LudoHomeBase color={PLAYER_COLOR[3]} top={9 * CELL} left={9 * CELL} size={6 * CELL} label={seats[3].name} isActive={turnSeat === 3 && !winner} />
          <LudoCenterGoal size={3 * CELL} top={6 * CELL} left={6 * CELL} />

          <View style={{ flex: 1, zIndex: 10 }} pointerEvents="box-none">
            {Array.from({ length: GRID }, (_, row) => (
              <View key={row} style={{ flexDirection: 'row', height: CELL }} pointerEvents="box-none">
                {Array.from({ length: GRID }, (_, col) => renderCell(row, col))}
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Dice Controls */}
      <TouchableOpacity
        style={styles.diceArea}
        activeOpacity={1}
        onPress={() => { if (!rolled && !activeSeat.isAI) rollDice(); }}
      >
        <View style={styles.diceRow} pointerEvents="box-none">
          {[0, 1].map(idx => {
            const canSelect = rolled && !usedDice[idx] && !activeSeat.isAI && !winner;
            return (
              <Animated.View key={idx} style={{ transform: [{ translateX: diceShake[idx] }] }}>
                <TouchableOpacity
                  onPress={() => canSelect ? selectDie(idx) : (!rolled && !activeSeat.isAI ? rollDice() : null)}
                  activeOpacity={0.8}
                >
                  <Die
                    value={dice[idx]}
                    size={52}
                    color={activeSeat.color}
                    selected={selectedDie === idx}
                    used={usedDice[idx]}
                    style={{ marginHorizontal: 10 }}
                  />
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {!rolled && !activeSeat.isAI && !winner && (
          <TouchableOpacity style={[styles.rollBtn, { borderColor: activeSeat.color, backgroundColor: `${activeSeat.color}14` }]} onPress={rollDice}>
            <Ionicons name="dice-outline" size={20} color={activeSeat.color} />
            <NeonText size={14} color={activeSeat.color} weight="bold" style={{ marginLeft: 8 }}>
              ROLL DICE ({activeSeat.name.toUpperCase()})
            </NeonText>
          </TouchableOpacity>
        )}

        {activeSeat.isAI && !winner && (
          <NeonText size={11} color={activeSeat.color} style={{ marginTop: 6 }}>
            {activeSeat.name} is rolling…
          </NeonText>
        )}

        {rolled && !activeSeat.isAI && !winner && (
          <NeonText size={10} color="#777" style={{ marginTop: 4 }}>
            {usedDice[0] && usedDice[1]
              ? 'Both dice used'
              : `Die ${!usedDice[0] ? '1' : '2'} still available`}
          </NeonText>
        )}
      </TouchableOpacity>

      {/* Winner Modal */}
      <Modal visible={showWinner} transparent animationType="fade">
        <View style={styles.overlay}>
          <Animated.View style={[styles.modalCard, {
            borderColor: winner?.color || '#FFD700',
            transform: [{ scale: winScale }],
            shadowColor: winner?.color || '#FFD700',
            shadowOpacity: 0.9, shadowRadius: 30, elevation: 30,
          }]}>
            <Text style={{ fontSize: 64 }}>{winner?.isAI ? '🤖' : '🏆'}</Text>
            <NeonText size={28} weight="bold" glow
              color={winner?.color || '#FFD700'}
              style={{ marginTop: 8, textAlign: 'center' }}
            >
              {`${(winner?.name || 'PLAYER').toUpperCase()} WINS!`}
            </NeonText>
            <NeonText size={13} color="#777" style={{ marginTop: 8, marginBottom: 24, textAlign: 'center' }}>
              All 4 tokens of {winner?.colorName} reached home!
            </NeonText>
            <NeonButton title="PLAY AGAIN" onPress={reset} variant="primary" />
            <View style={{ height: 10 }} />
            <NeonButton title="MENU" onPress={() => navigation.navigate('LocalGameSelection', {
              players, isSinglePlayer,
            })} variant="secondary" />
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: LUDO_RAVE_THEME.screenBg,
    ...Platform.select({
      web: { height: '100%', minHeight: 0, maxHeight: '100%' },
      default: {},
    }),
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12, paddingTop: Platform.OS === 'ios' ? 8 : 12, paddingBottom: 2,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  scoreBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 10, marginBottom: 4, gap: 6,
  },
  scoreBadge: {
    flex: 1,
    borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 5,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
  },
  pipRow: { flexDirection: 'row', gap: 3, marginTop: 4 },
  pip: {
    width: 7, height: 7, borderRadius: 3.5,
    shadowOffset: { width: 0, height: 0 },
  },
  boardWrap: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingVertical: 2,
  },
  board: {
    borderWidth: 2, borderColor: LUDO_RAVE_THEME.tileBorder,
    borderRadius: 12,
    backgroundColor: LUDO_RAVE_THEME.boardBg,
    shadowColor: '#8B5CF6', shadowOpacity: 0.28,
    shadowRadius: 18, elevation: 18,
    overflow: 'hidden',
  },
  cell: {
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
  badge: {
    position: 'absolute', top: -3, right: -3,
    backgroundColor: '#fff', borderRadius: 5,
    width: 12, height: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  diceArea: {
    alignItems: 'center', paddingVertical: 8, paddingBottom: 20,
  },
  diceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  rollBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 2, borderRadius: 16,
    paddingHorizontal: 22, paddingVertical: 9,
    marginTop: 2,
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
