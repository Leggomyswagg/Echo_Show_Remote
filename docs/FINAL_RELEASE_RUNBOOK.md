# Echo Show Remote — Final Release Runbook

## Current state

The repository is CI-ready and contains separate mobile/web application and relay components. The relay must run on an always-on trusted host and must never expose its Amazon session or token through source control.

## 1. CI

Required gates:
- Node installation succeeds.
- `npm run type-check` succeeds.
- `npm run build:web` succeeds.
- Relay `node --check server.js` succeeds.

## 2. Vercel

Configure the Vercel project to build the Expo web application:
- Build command: `npm run build:web`
- Output directory: `dist`
- Node: 22.x for current Expo SDK 57 target; SDK 57 requires Node 22.13.x or newer.
- Configure only the environment variables required by the deployed API gateway.
- Never put Amazon credentials, relay tokens, or EAS secrets in Git.

Deploy a preview first. Verify the homepage, device UI, API health behavior, authentication failure behavior, and unsupported-command behavior before production promotion.

## 3. Expo upgrade

The current application is Expo SDK 51. Upgrade incrementally, one SDK at a time, validating after each step. For each upgrade:

```bash
npx expo install expo@^<target>
npx expo install --fix
npx expo-doctor
npm run type-check
npm run build:web
```

Do not skip directly to SDK 57 if an intermediate upgrade exposes migration issues that cannot be safely resolved together.

## 4. EAS

After the target SDK is stable:

```bash
npx eas-cli@latest login
eas build:configure
eas build --profile preview --platform android
eas build --profile preview --platform ios
```

Use internal distribution for physical testing before production builds. Configure runtime versions so native-incompatible OTA updates cannot be delivered to an incompatible binary.

## 5. Physical Echo validation

Required tests with a real Echo device:
- discovery
- play
- pause
- next
- previous
- rewind
- fast-forward
- volume up/down
- set volume
- mute
- stop
- text command
- TTS
- reconnect after relay restart
- relay unavailable behavior
- invalid/unsupported command rejection

A CI pass does not prove these controls work against a physical Echo.

## 6. Production security

Before launch:
- rotate all development secrets
- use strong relay authentication
- restrict relay network exposure
- use HTTPS/TLS for remote connections
- rate-limit commands
- do not log Amazon credentials/session data
- do not store credentials in the repository
- verify CORS/origin policy for deployed API routes
- verify error responses do not leak upstream exceptions

## 7. Store release

Only after preview testing:

```bash
eas build --profile production-android --platform android
eas build --profile production-ios --platform ios
eas submit --profile production-android --platform android
eas submit --profile production-ios --platform ios
```

Store credentials and signing keys remain in EAS, not Git.

## Important product boundary

Amazon does not expose a generic public API that turns arbitrary consumer Echo devices into unrestricted third-party remote-control targets. The relay approach therefore depends on the authenticated Amazon web/service session used by `alexa-remote2`. Treat this as a compatibility dependency and validate against current Amazon behavior before promising universal device support.
