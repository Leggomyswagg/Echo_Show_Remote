# Echo Show Remote — Production Architecture

## Transport decision

The product no longer uses Alexa Proactive Events as a command channel. Amazon documents Proactive Events as customer notifications, while the Alexa Messaging interface delivers out-of-session messages to a skill. Neither is a general-purpose API for injecting arbitrary remote-control actions into an Echo Show.

The production command path is:

`Echo Show Remote mobile app -> authenticated relay -> alexa-remote2 -> Amazon Alexa service -> target Echo`

The relay is intentionally a separate component because it needs the user's authenticated Alexa session and must be able to maintain the Amazon connection from a trusted host.

## Supported commands in v1

Media transport: play, pause, play/pause, next, previous, rewind, fast-forward.

Volume: set volume, volume up/down, mute.

Device: stop/power-stop, do-not-disturb.

Voice: send a text command to Alexa, or speak text on the selected Echo.

## Deliberately unsupported commands

Touchscreen navigation, arbitrary app launching, camera controls, display gestures, and every command in the original UI are not represented as working merely because a button exists. They require a device-specific transport. The relay rejects unsupported commands rather than returning false success.

## Security model

- Relay access is protected by `RELAY_TOKEN` when enabled.
- Amazon authentication material remains on the relay and is never sent to the mobile app.
- The cloud gateway forwards only validated command payloads to a configured relay URL.
- No user-generated relay URL is accepted by the API, preventing basic SSRF abuse.
- Legacy synthetic Alexa OAuth and pairing endpoints are disabled.
- The relay should be deployed behind a private network, VPN, or authenticated tunnel rather than exposing port 8080 directly to the internet.

## Deployment modes

### Local-first

Run the relay on a computer/NAS/Raspberry Pi on the same LAN as the Echo. The mobile app uses `mode: local` and the relay's LAN address.

### Remote

Run the relay on a host with secure remote connectivity and configure the Vercel gateway with `RELAY_URL` and `RELAY_TOKEN`. The mobile app can use the existing `skill` compatibility mode, which now means cloud relay rather than Alexa proactive events.

## Amazon dependency

`alexa-remote2` uses Amazon's web/service interfaces rather than an official public Echo remote-control API. It is a third-party transport and can be affected by Amazon authentication or API changes. The relay isolates that dependency so it can be replaced without rewriting the mobile UI.

Amazon's official Alexa Smart Home APIs are appropriate when controlling a device that the product itself owns and exposes as a smart-home endpoint. They do not provide a generic API for controlling an arbitrary consumer Echo Show as though it were a TV remote.
