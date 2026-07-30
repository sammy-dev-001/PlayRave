const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// EXTREMELY IMPORTANT: We MUST blacklist agora-rtc-sdk-ng for Native (Android/iOS)
// because it contains ES2022 private properties (e.g. #registry) which Hermes
// cannot compile. Without this blacklist, Metro will bundle it and the EAS Android
// build will fail with "Failed to generate Hermes bytecode".
config.resolver.blockList = [
  ...config.resolver.blockList || [],
  /\/node_modules\/agora-rtc-sdk-ng\/.*/,
];

module.exports = config;
