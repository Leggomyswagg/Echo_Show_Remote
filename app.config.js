// Dynamic config — keeps native-only settings out of the web export.
// The Android widget and Google services configuration are intentionally
// omitted from the web config so Expo can build cleanly on Vercel/CI.

const isWeb = process.env.EXPO_PLATFORM === 'web' || process.env.VERCEL === '1';

/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => {
  const nativePlugins = isWeb
    ? []
    : [
        [
          '@bam.tech/react-native-android-widget',
          {
            widgets: [
              {
                name: 'EchoShowWidget',
                label: 'Echo Show Remote',
                description: 'Control your Echo Show and ask Alexa from your home screen.',
                previewImage: './assets/widget-preview.png',
                taskHandler: './src/components/widget/widgetTaskHandler',
              },
            ],
          },
        ],
      ];

  const android = config.android
    ? {
        ...config.android,
        ...(isWeb ? { googleServicesFile: undefined } : {}),
      }
    : config.android;

  return {
    ...config,
    android,
    plugins: [...(config.plugins ?? []), ...nativePlugins],
  };
};
