# Echo Show Remote Relay

This is the actual device-control transport for Echo Show Remote. It runs on a computer, Raspberry Pi, NAS, or other Node.js host on the same network as the Echo devices.

The mobile app sends commands to this relay. The relay uses `alexa-remote2` to communicate with Amazon's Alexa service and exposes a small authenticated HTTP API to the app. `alexa-remote2` is a current, MIT-licensed library that supports Alexa device control over LAN/WLAN.

## Why the relay exists

The Alexa Proactive Events API is a notification mechanism; it is not a remote-control API. The previous implementation incorrectly treated proactive events as a command transport. The production architecture therefore uses the established Alexa device-control transport through the relay instead.

## Install

```bash
cd relay
npm install
cp .env.example .env
```

Node.js 20+ is required.

## Alexa authentication

Generate the initial Alexa session data with the included setup helper:

```bash
npm run setup:alexa
```

Open the proxy URL printed by the helper, complete Amazon authentication, and copy the emitted `ALEXA_COOKIE_JSON` value into the relay secret store. Then start the relay:

```bash
npm start
```

Keep this JSON private. It represents authenticated access to the Amazon account used by the relay.

## Relay authentication

Set `RELAY_TOKEN` to a long random value. The mobile app sends it as `Authorization: Bearer <token>` when configured for a protected relay.

If `RELAY_TOKEN` is empty, the relay is intentionally LAN-open for development only. Do not expose an unauthenticated relay to the internet.

Never commit the cookie, credentials, or token to Git.

## API

`GET /ping` — liveness check.

`GET /health` — Alexa connection status.

`GET /devices` — available Echo devices.

`POST /command`

```json
{
  "command": "volume_up",
  "deviceId": "optional-serial-number"
}
```

Supported production transport commands currently include:

- `play_pause`
- `play`
- `pause`
- `rewind`
- `fast_forward`
- `next`
- `previous`
- `volume_up`
- `volume_down`
- `set_volume` with `{ "level": 0-100 }`
- `mute`
- `power` / `stop`
- `do_not_disturb` with `{ "enabled": true|false }`
- `alexa_text` with `{ "text": "..." }`
- `speak` with `{ "text": "..." }`

Commands such as arbitrary touchscreen navigation, launching every streaming app, camera control, and display gestures are not falsely reported as supported. They require a separate device-specific transport and are intentionally rejected until that transport is implemented.

## Production deployment

Keep this relay behind a private network, VPN, or authenticated tunnel. Do not port-forward it directly to the public internet. For remote access, use a private overlay network such as Tailscale/WireGuard or a properly authenticated reverse proxy.
