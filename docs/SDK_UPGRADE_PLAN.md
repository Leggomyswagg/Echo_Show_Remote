# Expo SDK Upgrade Plan

The app currently uses an older Expo SDK. Do not perform a blind major-version jump.

Upgrade one SDK at a time, running `npx expo install --fix`, `npx expo-doctor`, TypeScript, and the web export at each boundary. Expo's current stable SDK is 57 and its documentation explicitly recommends incremental upgrades.

After each successful boundary:
- review release notes and native changes;
- regenerate native projects when using CNG/prebuild;
- run Android/iOS development builds;
- test Echo discovery/control;
- commit only when all gates are green.

Target: SDK 57, React Native 0.86, React 19.2, Node 22.13+.
