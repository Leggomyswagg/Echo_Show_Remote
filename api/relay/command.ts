import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPPORTED_COMMANDS = new Set([
  'power', 'volume_up', 'volume_down', 'set_volume', 'mute',
  'play_pause', 'play', 'pause', 'rewind', 'fast_forward', 'next', 'previous', 'stop',
  'do_not_disturb', 'alexa_text', 'speak',
]);

function getRelayUrl(): string | null {
  const value = process.env.RELAY_URL?.trim();
  return value ? value.replace(/\/$/, '') : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', process.env.APP_ORIGIN ?? '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const relayUrl = getRelayUrl();
  if (!relayUrl) return res.status(503).json({ error: 'Relay service is not configured' });
  if (!process.env.RELAY_TOKEN) return res.status(503).json({ error: 'Relay authentication is not configured' });

  const body = req.body ?? {};
  if (!body.command || typeof body.command !== 'string' || !SUPPORTED_COMMANDS.has(body.command)) {
    return res.status(400).json({ error: 'Unsupported command', supportedCommands: [...SUPPORTED_COMMANDS] });
  }
  if (body.payload !== undefined && (body.payload === null || typeof body.payload !== 'object' || Array.isArray(body.payload))) {
    return res.status(400).json({ error: 'payload must be an object' });
  }

  try {
    const response = await fetch(`${relayUrl}/command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RELAY_TOKEN}`,
      },
      body: JSON.stringify({
        command: body.command,
        payload: body.payload ?? {},
        deviceId: body.deviceId,
        text: body.text,
      }),
    });

    const text = await response.text();
    let data: unknown = {};
    try { data = JSON.parse(text); } catch { data = { error: text || 'Relay returned invalid JSON' }; }
    return res.status(response.status).json(data);
  } catch {
    return res.status(502).json({ error: 'Relay unreachable' });
  }
}
