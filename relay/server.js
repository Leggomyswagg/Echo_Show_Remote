const express = require('express');
const AlexaRemote = require('alexa-remote2');
const crypto = require('crypto');

const app = express();
app.use(express.json({ limit: '32kb' }));

const PORT = Number(process.env.PORT || 8080);
const RELAY_TOKEN = process.env.RELAY_TOKEN || '';
const AMAZON_PAGE = process.env.AMAZON_PAGE || 'amazon.com';
const ALEXA_SERVICE_HOST = process.env.ALEXA_SERVICE_HOST || 'pitangui.amazon.com';
const ALEXA_COOKIE_JSON = process.env.ALEXA_COOKIE_JSON || '';
const DEFAULT_DEVICE = process.env.ECHO_DEVICE || '';
const VOLUME_STEP = Math.max(1, Math.min(25, Number(process.env.VOLUME_STEP || 10)));

const alexa = new AlexaRemote();
let ready = false;
let initError = null;
const volumeCache = new Map();

function safeEqual(a, b) {
  if (!a || !b) return false;
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

function authorized(req) {
  if (!RELAY_TOKEN) return true;
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.get('x-relay-token');
  return safeEqual(token, RELAY_TOKEN);
}

function callbackPromise(fn) {
  return new Promise((resolve, reject) => {
    fn((err, result) => err ? reject(err) : resolve(result));
  });
}

function listEchoDevices() {
  return Object.values(alexa.serialNumbers || {})
    .filter(d => ['ECHO', 'KNIGHT', 'ROOK'].includes(d.deviceFamily) || /Echo/i.test(d.accountName || d.deviceType || ''))
    .map(d => ({
      id: d.serialNumber,
      name: d.accountName || d.friendlyName || d.serialNumber,
      type: d.deviceType,
      family: d.deviceFamily,
      online: d.online !== false,
    }));
}

function resolveDevice(id) {
  const wanted = id || DEFAULT_DEVICE;
  if (wanted) {
    const device = alexa.find(wanted);
    if (device) return device;
  }
  const devices = listEchoDevices();
  if (!devices.length) return null;
  return alexa.find(devices[0].id);
}

function execute(device, command, payload = {}) {
  const id = device.serialNumber;
  const current = volumeCache.get(id) ?? 50;

  if (command === 'volume_up' || command === 'volume_down') {
    const next = Math.max(0, Math.min(100, current + (command === 'volume_up' ? VOLUME_STEP : -VOLUME_STEP)));
    volumeCache.set(id, next);
    return callbackPromise(cb => alexa.sendCommand(device, 'volume', next, cb));
  }

  if (command === 'volume' || command === 'set_volume') {
    const level = Number(payload.level);
    if (!Number.isFinite(level) || level < 0 || level > 100) throw new Error('level must be between 0 and 100');
    volumeCache.set(id, Math.round(level));
    return callbackPromise(cb => alexa.sendCommand(device, 'volume', Math.round(level), cb));
  }

  const direct = {
    play_pause: 'play',
    play: 'play',
    pause: 'pause',
    rewind: 'rewind',
    fast_forward: 'forward',
    next: 'next',
    previous: 'previous',
  };

  if (direct[command]) {
    return callbackPromise(cb => alexa.sendCommand(device, direct[command], undefined, cb));
  }

  if (command === 'mute') {
    return callbackPromise(cb => alexa.sendCommand(device, 'volume', 0, cb));
  }

  if (command === 'power' || command === 'stop') {
    return callbackPromise(cb => alexa.sendSequenceCommand(device.serialNumber, 'deviceStop', null, cb));
  }

  if (command === 'do_not_disturb') {
    const enabled = payload.enabled !== false;
    return callbackPromise(cb => alexa.sendSequenceCommand(device.serialNumber, 'deviceDoNotDisturb', enabled, cb));
  }

  if (command === 'alexa_text') {
    const text = String(payload.text || '').trim();
    if (!text) throw new Error('text is required');
    if (text.length > 250) throw new Error('text must be 250 characters or fewer');
    return callbackPromise(cb => alexa.sendSequenceCommand(device.serialNumber, 'textCommand', text, cb));
  }

  if (command === 'speak') {
    const text = String(payload.text || '').trim();
    if (!text) throw new Error('text is required');
    return callbackPromise(cb => alexa.sendSequenceCommand(device.serialNumber, 'speak', text, cb));
  }

  throw new Error(`Command '${command}' is not supported by the Alexa device-control transport`);
}

app.get('/ping', (_req, res) => res.json({ ok: true, service: 'echo-show-remote-relay', ready }));

app.get('/health', (_req, res) => res.status(ready ? 200 : 503).json({
  ok: ready,
  ready,
  error: initError ? String(initError.message || initError) : null,
}));

app.use('/devices', (req, res, next) => authorized(req) ? next() : res.status(401).json({ error: 'Unauthorized' }));
app.get('/devices', (_req, res) => res.json({ devices: listEchoDevices() }));

app.use('/command', (req, res, next) => authorized(req) ? next() : res.status(401).json({ error: 'Unauthorized' }));
app.post('/command', async (req, res) => {
  if (!ready) return res.status(503).json({ error: 'Relay is not connected to Alexa', detail: initError?.message || 'initializing' });

  const { command, payload = {}, deviceId, text } = req.body || {};
  if (!command || typeof command !== 'string') return res.status(400).json({ error: 'command is required' });

  const device = resolveDevice(deviceId);
  if (!device) return res.status(404).json({ error: 'No Echo device found' });

  try {
    const effectivePayload = { ...payload, ...(text !== undefined ? { text } : {}) };
    await execute(device, command, effectivePayload);
    return res.json({ ok: true, command, device: { id: device.serialNumber, name: device.accountName || device.friendlyName } });
  } catch (error) {
    console.error('[command]', command, error);
    return res.status(502).json({ error: error instanceof Error ? error.message : 'Alexa command failed' });
  }
});

async function initialize() {
  if (!ALEXA_COOKIE_JSON) {
    initError = new Error('ALEXA_COOKIE_JSON is not configured. Generate an Alexa cookie using the relay setup flow and store it securely.');
    console.error(initError.message);
    return;
  }

  let cookie;
  try {
    cookie = JSON.parse(ALEXA_COOKIE_JSON);
  } catch {
    initError = new Error('ALEXA_COOKIE_JSON is not valid JSON');
    console.error(initError.message);
    return;
  }

  try {
    await callbackPromise(cb => alexa.init({
      cookie,
      amazonPage: AMAZON_PAGE,
      alexaServiceHost: ALEXA_SERVICE_HOST,
      usePushConnectType: 3,
      cookieRefreshInterval: 7 * 24 * 60 * 60 * 1000,
      logger: process.env.LOG_LEVEL === 'debug' ? console.log : undefined,
      deviceAppName: 'Echo Show Remote',
      apiUserAgentPostFix: 'EchoShowRemote/1.0',
    }, cb));
    ready = true;
    initError = null;
    console.log(`[relay] connected; ${listEchoDevices().length} Echo device(s) available`);
  } catch (error) {
    ready = false;
    initError = error;
    console.error('[relay] Alexa initialization failed:', error);
  }
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[relay] listening on http://0.0.0.0:${PORT}`);
  initialize();
});

process.on('SIGTERM', () => { try { alexa.stop(); } finally { process.exit(0); } });
process.on('SIGINT', () => { try { alexa.stop(); } finally { process.exit(0); } });
