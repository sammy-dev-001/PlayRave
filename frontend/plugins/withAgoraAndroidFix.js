const { AndroidConfig, withGradleProperties } = require('expo/config-plugins');

/**
 * Workaround for react-native-agora on AGP 9+ (Expo SDK 58):
 * Multiple Agora AAR dependencies (agora-special-full and iris-rtc) share the
 * legacy package/namespace `io.agora.rtc`. AGP 9 enables
 * `android.uniquePackageNames=true` by default, failing `:app:processReleaseMainManifest`.
 */
module.exports = function withAgoraAndroidFix(config) {
  return withGradleProperties(config, (modConfig) => {
    modConfig.modResults = AndroidConfig.BuildProperties.updateAndroidBuildProperty(
      modConfig.modResults,
      'android.uniquePackageNames',
      'false'
    );
    return modConfig;
  });
};
