# Echo Show Remote Release Gates

1. CI: relay syntax check passes.
2. CI: strict TypeScript check passes.
3. CI: Expo web export passes and produces `dist`.
4. Vercel preview deployment succeeds and serves the web app.
5. Vercel production deployment succeeds after preview QA.
6. Expo SDK is upgraded incrementally to the current stable SDK and `expo install --fix` plus `expo-doctor` pass after each upgrade boundary. Expo currently documents SDK 57 as latest stable.
7. EAS development/preview builds install on physical Android and iOS devices.
8. Physical Echo validation passes: discovery, play/pause, next/previous, volume, mute, stop, text command, TTS, reconnect, and unsupported-command rejection.
9. Production environment secrets are configured outside source control.
10. Store release is blocked until physical-device validation and production web QA are green.
