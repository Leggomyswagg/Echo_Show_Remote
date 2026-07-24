/**
 * Echo Show Remote — Alexa Skill Lambda
 *
 * Two responsibilities:
 * 1. Custom skill request handling (invocation, intents)
 * 2. Proactive events (received from Vercel proxy via Skill Messaging API)
 *
 * Environment variables:
 *   VERCEL_WEBHOOK_URL       — URL of api/alexa/skill-event.ts (for event forwarding)
 *   VERCEL_WEBHOOK_SECRET    — shared secret for webhook verification
 */

const Alexa = require('ask-sdk-core');
const https = require('https');

// ─── Helpers ────────────────────────────────────────────────────────────────

async function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'X-Skill-Secret': process.env.VERCEL_WEBHOOK_SECRET || '',
      },
    }, res => {
      let chunks = '';
      res.on('data', c => (chunks += c));
      res.on('end', () => resolve({ status: res.statusCode, body: chunks }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ─── Intent Handlers ────────────────────────────────────────────────────────

const LaunchRequestHandler = {
  canHandle(h) { return Alexa.getRequestType(h.requestEnvelope) === 'LaunchRequest'; },
  handle(h) {
    return h.responseBuilder
      .speak("Echo Show Remote is ready. You can now control this device from the app on your phone.")
      .withShouldEndSession(true)
      .getResponse();
  },
};

// Generic factory — most intents just say a confirmation and end
function makeSimpleIntent(name, speech) {
  return {
    canHandle(h) {
      return Alexa.getRequestType(h.requestEnvelope) === 'IntentRequest'
        && Alexa.getIntentName(h.requestEnvelope) === name;
    },
    handle(h) {
      return h.responseBuilder.speak(speech).withShouldEndSession(true).getResponse();
    },
  };
}

const PlayHandler         = makeSimpleIntent('PlayIntent', "Playing.");
const PauseHandler        = makeSimpleIntent('PauseIntent', "Paused.");
const NextHandler         = makeSimpleIntent('NextIntent', "Skipping.");
const PreviousHandler     = makeSimpleIntent('PreviousIntent', "Going back.");
const VolumeUpHandler     = makeSimpleIntent('VolumeUpIntent', "Volume up.");
const VolumeDownHandler   = makeSimpleIntent('VolumeDownIntent', "Volume down.");
const MuteHandler         = makeSimpleIntent('MuteIntent', "Muted.");
const DoNotDisturbHandler = makeSimpleIntent('DoNotDisturbIntent', "Do not disturb enabled.");

const SetVolumeHandler = {
  canHandle(h) {
    return Alexa.getRequestType(h.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(h.requestEnvelope) === 'SetVolumeIntent';
  },
  handle(h) {
    const level = Alexa.getSlotValue(h.requestEnvelope, 'Level') || '5';
    return h.responseBuilder.speak(`Volume set to ${level}.`).withShouldEndSession(true).getResponse();
  },
};

const RunRoutineHandler = {
  canHandle(h) {
    return Alexa.getRequestType(h.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(h.requestEnvelope) === 'RunRoutineIntent';
  },
  handle(h) {
    const routine = Alexa.getSlotValue(h.requestEnvelope, 'Routine') || 'routine';
    return h.responseBuilder.speak(`Running ${routine}.`).withShouldEndSession(true).getResponse();
  },
};

const SmartHomeHandler = {
  canHandle(h) {
    return Alexa.getRequestType(h.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(h.requestEnvelope) === 'SmartHomeIntent';
  },
  handle(h) {
    const action = Alexa.getSlotValue(h.requestEnvelope, 'Action') || 'controlled';
    const device = Alexa.getSlotValue(h.requestEnvelope, 'Device') || 'device';
    return h.responseBuilder.speak(`${action} ${device}.`).withShouldEndSession(true).getResponse();
  },
};

const PassthroughHandler = {
  canHandle(h) {
    return Alexa.getRequestType(h.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(h.requestEnvelope) === 'PassthroughIntent';
  },
  handle(h) {
    const cmd = Alexa.getSlotValue(h.requestEnvelope, 'Command') || '';
    return h.responseBuilder.speak(cmd).withShouldEndSession(true).getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(h) {
    return Alexa.getRequestType(h.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(h.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(h) {
    return h.responseBuilder
      .speak("You can control this Echo device from the Echo Show Remote app on your phone. Open the app to get started.")
      .withShouldEndSession(true)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(h) {
    return Alexa.getRequestType(h.requestEnvelope) === 'IntentRequest'
      && (Alexa.getIntentName(h.requestEnvelope) === 'AMAZON.CancelIntent'
       || Alexa.getIntentName(h.requestEnvelope) === 'AMAZON.StopIntent');
  },
  handle(h) {
    return h.responseBuilder.speak("Goodbye!").withShouldEndSession(true).getResponse();
  },
};

const FallbackIntentHandler = {
  canHandle(h) {
    return Alexa.getRequestType(h.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(h.requestEnvelope) === 'AMAZON.FallbackIntent';
  },
  handle(h) {
    return h.responseBuilder
      .speak("Sorry, I didn't catch that. Try opening the Echo Show Remote app on your phone instead.")
      .withShouldEndSession(true)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(h) { return Alexa.getRequestType(h.requestEnvelope) === 'SessionEndedRequest'; },
  handle(h) { return h.responseBuilder.getResponse(); },
};

// ─── Skill lifecycle events (SKILL_ENABLED, SKILL_ACCOUNT_LINKED, SKILL_DISABLED) ─
// These arrive as "AlexaSkillEvent.*" request types. Forward to Vercel so the
// companion server can persist per-user access tokens.

const SkillEventHandler = {
  canHandle(h) {
    const type = Alexa.getRequestType(h.requestEnvelope);
    return typeof type === 'string' && type.startsWith('AlexaSkillEvent.');
  },
  async handle(h) {
    const event = h.requestEnvelope.request;
    const userId = h.requestEnvelope.context?.System?.user?.userId;
    const accessToken = event?.body?.accessToken;
    const url = process.env.VERCEL_WEBHOOK_URL;
    if (url) {
      try {
        await postJson(url, {
          type: event.type,
          userId,
          accessToken: accessToken || null,
          timestamp: event.timestamp,
        });
      } catch (e) {
        console.error('Webhook forward failed:', e.message);
      }
    }
    return h.responseBuilder.getResponse();
  },
};

// ─── Error handler ──────────────────────────────────────────────────────────

const ErrorHandler = {
  canHandle() { return true; },
  handle(h, err) {
    console.error('Skill error:', err);
    return h.responseBuilder
      .speak("Sorry, something went wrong.")
      .withShouldEndSession(true)
      .getResponse();
  },
};

// ─── Export ─────────────────────────────────────────────────────────────────

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    PlayHandler,
    PauseHandler,
    NextHandler,
    PreviousHandler,
    VolumeUpHandler,
    VolumeDownHandler,
    MuteHandler,
    SetVolumeHandler,
    DoNotDisturbHandler,
    RunRoutineHandler,
    SmartHomeHandler,
    PassthroughHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    FallbackIntentHandler,
    SkillEventHandler,
    SessionEndedRequestHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
