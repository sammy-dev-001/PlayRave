export const COLORS = {
    electricPurple: '#B14EFF',
    neonCyan: '#00F8FF',
    hotPink: '#FF3FA4',
    limeGlow: '#C6FF4A',
    deepNightBlack: '#0A0A1A',
    darkOverlay: 'rgba(10, 10, 26, 0.8)',
    white: '#FFFFFF',
    offWhite: '#F0F0F0',
    cancelRed: '#FF4444',
};

export const FONTS = {
    // Using Outfit for modern feel, Righteous for headers, Orbitron for arcade feel
    bold: 'Outfit',
    regular: 'Outfit',
    display: 'Righteous', // Retro-futuristic party font
    arcade: 'Orbitron',   // High-tech sci-fi gaming font
};

export const SHADOWS = {
    neonGlow: {
        shadowColor: COLORS.neonCyan,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 5, // for Android
    },
    purpleGlow: {
        shadowColor: COLORS.electricPurple,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 5,
    },
};
