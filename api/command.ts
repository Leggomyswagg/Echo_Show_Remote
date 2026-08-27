import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_COMMANDS = new Set([
  'power', 'volume_up', 'volume_down', 'set_volume', 'mute',
  'play_pause', 'play', 'pause', 'rewind', 'fast_forward', 'next', 'previous', 'stop',
  'do_not_disturb', 'alexa_text', 'speak',
]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', process.env.APP_ORIGIN ?? '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { command, text, payload, deviceId } = req.body ?? {};
  if (!command || typeof command !== 'string' || !ALLOWED_COMMANDS.has(command)) {
    return res.status(400).json({ error: 'Unsupported command', supportedCommands: [...ALLOWED_COMMANDS] });
  }
  if (payload !== undefined && (payload === null || typeof payload !== 'object' || Array.isArray(payload))) {
    return res.status(400).json({ error: 'payload must be an object' });
  }

  const relayUrl = process.env.RELAY_URL?.trim().replace(/\/$/, '');
  if (!relayUrl) return res.status(503).json({ error: 'Relay service is not configured' });
  if (!process.env.RELAY_TOKEN) return res.status(503).json({ error: 'Relay authentication is not configured' });

  try {
    const response = await fetch(`${relayUrl}/command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RELAY_TOKEN}`,
      },
      body: JSON.stringify({ command, text, payload: payload ?? {}, deviceId }),
    });
    const body = await response.text();
    let data: unknown;
    try { data = JSON.parse(body); } catch { data = { error: body || 'Invalid relay response' }; }
    return res.status(response.status).json(data);
  } catch (error: unknown) {
    return res.status(502).json({ error: 'Relay unreachable' });
  }
}
