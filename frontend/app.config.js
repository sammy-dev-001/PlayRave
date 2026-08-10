module.exports = () => {
  const APP_ENV = process.env.APP_ENV || 'development';

  let apiUrl = 'http://localhost:4000'; // Default for local dev
  let socketUrl = 'http://localhost:4000';

  if (APP_ENV === 'preview') {
    apiUrl = 'https://playrave-59ud.onrender.com';
    socketUrl = 'https://playrave-59ud.onrender.com';
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
        supportsTablet: true,
        bundleIdentifier: "com.sammydev.playrave",
        config: {
          usesNonExemptEncryption: false
        }
      },
      android: {
        package: "com.sammydev.playrave",
        adaptiveIcon: {
          foregroundImage: "./assets/adaptive-icon.png",
          backgroundColor: "#0a0a1a"
        },
        edgeToEdgeEnabled: true,
        jsEngine: "hermes"
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
        url: "https://u.expo.dev/44ace18c-b235-4d04-a21a-1e73289de69f",
        fallbackToCacheTimeout: 0,
        checkAutomatically: "ON_LOAD"
      },
      plugins: [
        "expo-asset",
        "expo-file-system",
        "expo-font",
        "expo-splash-screen",
        [
          "expo-image-picker",
          {
            "photosPermission": "Allow PlayRave to access your photos for profile pictures."
          }
        ],
        [
          "expo-camera",
          {
            "cameraPermission": "Allow PlayRave to access your camera."
          }
        ],
        [
          "expo-sensors",
          {
            "motionPermission": "Allow PlayRave to access motion sensors for games."
          }
        ],
        [
          "expo-av",
          {
            "microphonePermission": "Allow PlayRave to access the microphone for voice chat."
          }
        ],
        [
          "expo-build-properties",
          {
            "ios": {
              "deploymentTarget": "15.1"
            }
          }
        ]
      ],
      extra: {
        APP_ENV,
        apiUrl,
        socketUrl,
        eas: {
          projectId: "44ace18c-b235-4d04-a21a-1e73289de69f"
        }
      }
    }
  };
};
