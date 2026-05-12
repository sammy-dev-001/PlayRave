# PlayRave 🎮✨

**PlayRave** is a modern, high-energy party gaming platform built with React Native and Expo. Designed for both local and online multiplayer experiences, it features a stunning "Neon Rave" aesthetic with vibrant colors, smooth animations, and premium UI elements.

## 🌟 Key Features

### 🏠 Local Party Mode
Play with friends in the same room on a single device!
- **Truth or Dare**: Dynamic categories from "Classic" to "Spicy".
- **Never Have I Ever**: Perfect for breaking the ice.
- **Scrabble**: A full-featured local implementation with move validation and dictionary checks.
- **Speed Categories**: Test your reflexes and knowledge under pressure.
- **Memory Chain**: Can you remember the sequence?
- **Local Charades**: A high-energy acting game with custom word packs.
- **Tic-Tac-Toe**: Play against a friend or a smart AI.

### 🌐 Online Multiplayer (Coming Soon/WIP)
Connect with friends globally!
- **Real-time Socket.io integration** for seamless gameplay.
- **Lobby System**: Create or join rooms with unique codes.
- **Whot!**: A classic African card game implemented with full online synchronization.

### 💎 Design Aesthetic
- **Neon Container System**: Custom-built UI components for a consistent rave vibe.
- **Glassmorphism**: Sleek, semi-transparent overlays and blurred backgrounds.
- **Micro-animations**: Enhanced feedback for every user interaction.
- **Responsive Layout**: Works beautifully on smartphones, tablets, and desktop browsers.

## 🛠 Tech Stack

- **Frontend**: React Native, Expo, React Navigation.
- **Styling**: Vanilla CSS-in-JS (StyleSheet) with a custom design system.
- **Backend**: Node.js, Socket.io (for real-time features).
- **Services**: Custom Haptic and Sound services for an immersive experience.

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Expo Go app on your mobile device (to test locally)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/playrave.git
   cd playrave
   ```

2. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

3. **Start the development server**:
   ```bash
   npx expo start
   ```

4. **Run the app**:
   - Scan the QR code with your phone (Expo Go app).
   - Press `w` to open in a web browser.

## 📝 Recent Stabilizations

- Fixed reference errors in **Truth or Dare** game logic.
- Resolved state synchronization issues in **Scrabble** local play.
- Standardized navigation safety checks across all party games to prevent runtime crashes.
- Optimized UI for desktop and mobile screen dimensions.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an issue for any bugs or feature requests.

---

*Play hard. Rave on. 🎧🔥*
