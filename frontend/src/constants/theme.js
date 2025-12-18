export const COLORS = {
    electricPurple: '#B14EFF',
    neonCyan: '#00F8FF',
    hotPink: '#FF3FA4',
    limeGlow: '#C6FF4A',
    deepNightBlack: '#0A0A1A',
    darkOverlay: 'rgba(10, 10, 26, 0.8)',
    white: '#FFFFFF',
    offWhite: '#F0F0F0',
};

export const FONTS = {
    // mapping to system fonts for MVP, can add custom fonts later
    bold: 'System',
    regular: 'System',
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
