# PlayRave Project Tracker

This document tracks current project status, upcoming features, known issues, and roadmaps so context is never lost across sessions.

---

## 🚀 Recent Accomplishments & Deployed Updates
- **EAS OTA Update (`preview` channel):** Successfully published OTA bundle (Update Group: `fd4bdfd5-c4e4-4c79-9ec0-5f3315586582`) on runtime `1.0.0` for Android & iOS.
- **Git Repository:** Synced and pushed cleanly to GitHub `origin/main` (commit `4e64eae`).
- **Live Chat & Keyboard Positioning:** Fixed mobile web visual viewport resize and native keyboard overlap across `InGameOverlay` and `LiveChat`.
- **Game Engine Consistency:** Standardized `_publicState` and `getGameState(roomId, userId)` across all 16 backend game engines (`Whot`, `Scrabble`, `ButtonMash`, `WhosMostLikely`, etc.).
- **Storage Optimization:** Reclaimed +7.66 GB of disk space (purged npm and pip caches, removed stale AI IDE caches).

---

## ⚡ New Feature Focus: Home Screen Party Utilities & Micro-Games
Quick-access, low-friction party tools anchored directly at the bottom of the **Home Screen**:

### 1. 🪙 Quick Coin Flip
- **Concept:** Instant 50/50 decision maker for bets, who-goes-first, or tiebreakers.
- **Features:** 3D animated coin flip with sound effects and haptic feedback. Instant result without creating an online room, with an optional "Best of 3" toggle.

### 2. 🎡 Spin & Win (Giveaway Wheel of Names)
- **Concept:** Room-based dynamic giveaway / selection wheel.
- **Flow:**
  1. Host taps **Spin & Win** to open a room (generates link + QR code).
  2. Anyone who joins via link or QR code is automatically added as a colorful named wedge on the wheel in real-time.
  3. Host can also manually type extra names/options if desired.
  4. Host spins the wheel: physics deceleration, clicking tick sound, confetti explosion, and dramatic winner announcement synchronized across all connected screens.

### 3. 📊 Live Audience Poll
- **Concept:** Instant live interactive voting with bar chart visualization.
- **Flow:**
  1. Host creates a poll question with 2–6 custom options (or picks a quick party template).
  2. Players join instantly via QR code or link on their phones.
  3. Real-time voting with live neon bar charts animating percentages and vote counts as they arrive.
  4. Host can reveal/hide live results, lock voting, and highlight the winning choice.

---

## 🚧 Current Priorities & Roadmap Workstreams

### 1. 🧮 Local Mode Expansions (Offline & Party Pass-and-Play)
- [x] **Local Math Blitz / Math Quiz:**
  - **Solo 60-Second Blitz / Time Attack:** Dynamic difficulty (Easy/Medium/Hard), combo multiplier streaks (x1–x4), custom neon keypad, sound/haptic cues, and local high score tracking via AsyncStorage.
  - **Pass & Play / 2-Player Split-Screen Duel:** Two players facing opposite ends of the screen, racing head-to-head to solve equations with wrong-answer penalty delay and first-to-10 win condition.
- [x] **Local The Imposter (Undercover / Spyfall):**
  - Pass-the-phone confidential word distribution with hold-to-reveal privacy cards, 100+ curated word pairs across 10 categories (including Naija/Afro Vibes and Pop Culture), interrogation timer with first-speaker selection, voting/accusation, and Imposter last-guess redemption.
- [x] **Local Button Mash:**
  - 2-player split-screen rapid tapping duel featuring Tug of War plasma beam, 10s Speed Blitz, and First to 100 Target Race, plus Solo CPS Drill with performance tiers (Sloth to Godlike).
- [ ] **Local Word Rush & Type Race:**
  - Offline solo anagram and typing speed challenges.

### 2. 🎲 Ludo Evolution (Board Redesign & Online Multiplayer)
- [x] **Ludo Board Aesthetics & Modern Layout:**
  - Responsive dynamic viewport scaling (`Math.min(SW - 16, SH - 240, 460)`) preventing mobile cramped layout; neon-illuminated corner bases, high-contrast tracks, glowing star safe zones, and center crown badge.
- [x] **Online Multiplayer Ludo:**
  - Full authoritative backend `LudoEngine.js` (2–4 players, balanced diagonal seats, dice rolls, 3-consecutive-sixes forfeiture, token captures with bonus rolls, home column runs, and winner rankings).
  - Frontend `OnlineLudoScreen.js` with animated dice physics, glowing movable token ripple animations, live 4-player HUD score pips, and auto-rejoin disconnect resilience.

### 3. 📚 Game Integrity & Dictionary
- [x] **Full Scrabble Dictionary & Server-Side Validation:**
  - Expanded lexicon to the complete 267,751-word official tournament SOWPODS/TWL/CSW dictionary on both client (`scrabble-words.json`) and server (`backend/src/data/scrabbleWords.js`).
  - Synchronous lazy-loading fallback ensuring zero false rejections from unawaited dictionary promises in local and online games.

### 4. 🌐 Connection, Lobby & Social Quality of Life
- [x] **Rejoin In-App Reminder / Banner:**
  - Persistent, non-blocking glowing neon match banner at the top of the Home Screen powered by `useFocusEffect` to catch disconnections instantly on return.
  - Automatically persisted in `SocketService.setRoomData` across both hosts and guests for instant 1-tap "RESUME ▶" match re-entry.
- [ ] **Custom Room Names & Quick Filters:**
  - Tagging and filtering public lobbies by vibe (e.g., "Casual", "Spicy", "Competitive", "Speed").
- [ ] **Offline Sound Assets Bundling:**
  - Download and bundle all remaining CDN sound effects locally in `assets/sounds/` for 100% offline audio reliability.

### 5. ♟️ Strategic & Heritage Additions
- [ ] **Chess (Online & Offline vs Stockfish/AI):**
  - 2-player turn-based board game with move validation, check/checkmate detection, and ELO ratings.
- [ ] **Ayo / Oware (African Mancala):**
  - Iconic traditional 2-player seed-sowing strategy game for African Game Night pillar.

---

## 🎯 Immediate Action Items
- [x] Build **Local Math Blitz / Math Quiz screen** (Solo 60s Time Attack + 2-Player Split-Screen Duel).
- [x] Register Local Math Blitz in `LocalGamesRegistry`, `LocalPlayGroup.js`, and `LocalGameSelectionScreen.js`.
- [x] Build **Local The Imposter** (Pass-and-play).
- [x] Build **Local Button Mash** (2-Player split-screen).
- [x] Redesign **Ludo Board layout & aesthetics**.
- [x] Build **Online Multiplayer Ludo** (`LudoEngine.js` + `OnlineLudoScreen.js`).
- [x] Upgrade **Scrabble & Word Rush Dictionary** to 267,751 words across client and server.
- [x] Implement **Home Screen Rejoin Banner & useFocusEffect detection**.
