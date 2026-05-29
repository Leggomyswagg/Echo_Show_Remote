// Dynamic config — extends app.json and conditionally adds native-only plugins.
// expo-keep-awake has no config plugin and needs none.
// @bam.tech/react-native-android-widget is Android/native only — excluded on web.

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

  return {
    ...config,
    plugins: [...(config.plugins ?? []), ...nativePlugins],
  };
};
