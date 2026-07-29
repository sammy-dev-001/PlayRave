module.exports = () => {
  const APP_ENV = process.env.APP_ENV || 'development';

  let apiUrl = 'http://localhost:4000'; // Default for local dev
  let socketUrl = 'http://localhost:4000';

  if (APP_ENV === 'preview') {
    apiUrl = 'https://playrave-preview.onrender.com';
    socketUrl = 'https://playrave-preview.onrender.com';
  } else if (APP_ENV === 'production') {
    apiUrl = 'https://playrave-59ud.onrender.com';
    socketUrl = 'https://playrave-59ud.onrender.com';
  }

  return {
    expo: {
      name: "PlayRave",
      slug: "playrave",
      version: "1.0.0",
      orientation: "portrait",
      icon: "./assets/icon.png",
      userInterfaceStyle: "dark",
      newArchEnabled: true,
      splash: {
        image: "./assets/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#0a0a1a"
      },
      ios: {
        supportsTablet: true
      },
      android: {
        adaptiveIcon: {
          foregroundImage: "./assets/adaptive-icon.png",
          backgroundColor: "#0a0a1a"
        },
        edgeToEdgeEnabled: true
      },
      web: {
        favicon: "./assets/favicon.png",
        bundler: "metro",
        output: "single",
        backgroundColor: "#0a0a1a",
        themeColor: "#00ffff",
        name: "PlayRave",
        shortName: "PlayRave",
        description: "Neon party games for friends"
      },
      runtimeVersion: {
        policy: "appVersion"
      },
      updates: {
        enabled: true,
        // The URL will be injected properly when running \`eas update:configure\`
        // or we can leave it blank and let EAS CLI populate it when the user runs it.
        fallbackToCacheTimeout: 0,
        checkAutomatically: "ON_LOAD"
      },
      extra: {
        APP_ENV,
        apiUrl,
        socketUrl,
        eas: {
          // This will be auto-populated by \`eas init\` when the user runs it
          projectId: ""
        }
      }
    }
  };
};
