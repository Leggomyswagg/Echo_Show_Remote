# Echo Show Remote — Alexa Skill

This is the official Alexa Skill for the Echo Show Remote app. It's the Amazon-approved path to controlling Echo devices from a third-party phone app.

## Architecture

```
Phone App                Vercel API               AWS Lambda            Amazon Alexa
    │                        │                         │                     │
    │  send command ─────────▶                         │                     │
    │                        │  Skill Messaging API ──▶                     │
    │                        │                         │  triggers routine ─▶
    │                        │                         │                     ▼
    │                        │                         │              Echo Device
    │                        │                         │              (plays music,
    │                        │                         │               volume, etc.)
    │                        │◀── SKILL_ACCOUNT_LINKED ─┤
    │                        │  (Lambda forwards event) │
```

## First-time setup (one-time, ~30 min)

### 1. Create Amazon Developer Account
- Sign up at https://developer.amazon.com — free
- No credit card required for the Alexa Skills Kit

### 2. Create the Skill
```bash
npm install -g ask-cli
ask configure                              # sign in with Amazon
cd alexa-skill
ask deploy                                 # deploys skill + interaction model + Lambda
```

### 3. Enable Account Linking
- Open the skill in the Alexa Developer Console → **Account Linking**
- Enable it and use these values:
  - **Authorization URI**: `https://echo-show-remote.vercel.app/api/alexa/link-account`
  - **Access Token URI**: `https://echo-show-remote.vercel.app/api/alexa/link-account`
  - **Client ID**: `echo-remote-app` (or anything — set as `ECHO_REMOTE_CLIENT_ID` env var too)
  - **Client Secret**: any strong random string, set as `ECHO_REMOTE_CLIENT_SECRET`
  - **Client Authentication Scheme**: `HTTP Basic`
  - **Scope**: `alexa::skills:account_linking`

### 4. Enable Proactive Events Permission
- Skill Console → **Permissions**
- Toggle on **Send Alexa Events**
- Copy the Messaging Client ID + Client Secret Amazon generates
- Set them as Vercel env vars: `ALEXA_CLIENT_ID` and `ALEXA_CLIENT_SECRET`

### 5. Configure Skill Events
- Skill Console → **Permissions → Skill Events**
- Enable: `Skill Enabled`, `Skill Disabled`, `Skill Account Linked`
- Endpoint: `https://echo-show-remote.vercel.app/api/alexa/skill-event`

### 6. Vercel environment variables

| Variable | Value |
|----------|-------|
| `ALEXA_CLIENT_ID` | From Alexa Console → Permissions |
| `ALEXA_CLIENT_SECRET` | From Alexa Console → Permissions |
| `ECHO_REMOTE_CLIENT_ID` | Chosen when configuring Account Linking |
| `ECHO_REMOTE_CLIENT_SECRET` | Chosen when configuring Account Linking |
| `SKILL_WEBHOOK_SECRET` | Random string shared between Lambda and Vercel |

### 7. Lambda environment variables

| Variable | Value |
|----------|-------|
| `VERCEL_WEBHOOK_URL` | `https://echo-show-remote.vercel.app/api/alexa/skill-event` |
| `VERCEL_WEBHOOK_SECRET` | Same as `SKILL_WEBHOOK_SECRET` above |

### 8. Submit for Certification
Once end-to-end testing works, submit the skill from the Alexa Developer Console.
Amazon review takes **3–7 business days**.

## User flow (post-launch)

1. User installs the phone app
2. Settings → Alexa Skill → **Link Alexa**
3. Opens the Alexa app, enables the "Echo Show Remote" skill, signs in
4. Alexa app displays a 6-character pairing code
5. User pastes the code back into the phone app
6. All commands now flow through the skill to their Echo devices

## Local development

Run the interaction model tests locally without touching Amazon:

```bash
cd alexa-skill/lambda
npm install
node -e "require('./index').handler({request:{type:'LaunchRequest'},context:{System:{}},session:{new:true}}, {}, (e,r) => console.log(JSON.stringify(r,null,2)))"
```

## What if certification is rejected?

Common reasons and fixes:

| Issue | Fix |
|-------|-----|
| "Skill invocation must include an intent" | Update sample utterances so each intent has at least 3 |
| "Account linking not working" | Verify the OAuth URLs return the expected JSON shape |
| "Missing example phrases" | Add 3+ to `publishingInformation.examplePhrases` in `skill.json` |
| "Icon 108x108 or 512x512 not found" | Upload PNGs at those exact sizes to `public/skill-icon-*.png` |
