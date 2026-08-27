# Echo Show Remote — Deployment Runbook

## 1. Build validation

The repository's Quality workflow validates both components:

- `relay`: Node syntax check.
- `app`: Expo web export with the web-only Expo configuration.

Use the GitHub Actions Quality run as the release gate.

## 2. Relay setup

On an always-on trusted machine:

```bash
cd relay
npm install
npm run setup:alexa
```

Complete Amazon authentication in the browser on that machine. Copy the emitted `ALEXA_COOKIE_JSON` into the relay host's secret store.

Set a strong `RELAY_TOKEN` and keep `RELAY_TOKEN_REQUIRED=true` in production.

Start the relay:

```bash
npm start
```

Verify:

```bash
curl http://127.0.0.1:8080/health
```

The relay should report `ready: true` after Alexa authentication completes.

## 3. Vercel gateway

Configure these server-side environment variables:

- `RELAY_URL`
- `RELAY_TOKEN`
- `APP_ORIGIN`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `ADMIN_PASSWORD`

Do not place `ALEXA_COOKIE_JSON` in the Vercel project. It belongs only on the trusted relay host.

## 4. Mobile configuration

For cloud mode, set `EXPO_PUBLIC_API_URL` to the deployed Vercel origin. The mobile app must have a trusted relay credential available through secure configuration; production credentials must never be hard-coded into the repository.

For local mode, configure the relay host LAN IP, port 8080, and the same `RELAY_TOKEN`.

## 5. Command expectations

The current transport supports media, volume, stop, do-not-disturb, Alexa text commands, and speech. Unsupported touchscreen/navigation/app-launch commands are intentionally rejected. Do not market unsupported commands as working until a verified device-specific transport is implemented.

## 6. Production smoke test

Run, in order:

1. Relay `/health` returns ready.
2. `/devices` returns the expected Echo device.
3. `play_pause` succeeds.
4. `volume_up` succeeds.
5. `set_volume` succeeds with a value from 0–100.
6. `alexa_text` succeeds with a short command.
7. An unsupported command returns HTTP 400.
8. An unauthenticated command returns HTTP 401.
9. Excessive command requests return HTTP 429.
10. Vercel web deployment loads the Expo app and `/api/relay/health` reports the relay state.

## 7. Store release

The Expo metadata is version `1.0.1`, iOS build `2`, Android version code `2`. Before submitting a native build, create/link the real EAS project and supply the real Android Firebase configuration. The previous placeholder EAS project ID was removed.
