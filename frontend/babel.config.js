module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      ['module-resolver', {
        alias: {
          'agora-rtc-sdk-ng': process.env.EXPO_PUBLIC_WEB_BUILD === 'true' 
            ? 'agora-rtc-sdk-ng' 
            : './src/mocks/agora-rtc-sdk-ng.mock.js'
        }
      }]
    ]
  };
};
