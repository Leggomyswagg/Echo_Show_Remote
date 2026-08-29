# Production Execution Checklist

## Quality gates
- Node 22 CI runtime
- Relay syntax validation
- Strict TypeScript validation
- Expo web export

## Web deployment
- Vercel build command: `npx expo export --platform web`
- Output: `dist`
- Required relay/API environment variables must be configured in the deployment platform

## Native release
- EAS development build first
- EAS preview builds next
- EAS production Android/iOS builds after physical-device validation
- Configure signing credentials and store metadata in EAS

## Echo functional validation
1. Start the relay on an always-on trusted host.
2. Configure `RELAY_TOKEN`.
3. Authenticate the Alexa session with the relay onboarding flow.
4. Discover Echo devices.
5. Test volume, mute, play/pause, next/previous, stop, text command, and TTS.
6. Verify failures are surfaced to the app and no unsupported command reports success.

## Release policy
Do not ship a store build until physical Echo control passes on at least one target Echo Show and one additional Echo device, authentication/reconnect tests pass, and the production web build is green.
