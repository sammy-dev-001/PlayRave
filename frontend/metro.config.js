const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add txt to asset extensions
config.resolver.assetExts.push('txt');

module.exports = config;
