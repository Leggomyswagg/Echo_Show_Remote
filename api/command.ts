import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_COMMANDS = new Set([
  'power', 'home', 'back', 'menu', 'settings', 'up', 'down', 'left', 'right', 'select',
  'volume_up', 'volume_down', 'mute', 'play_pause', 'rewind', 'fast_forward',
  'brightness_up', 'brightness_down', 'microphone', 'camera', 'do_not_disturb', 'alexa_text',
  'netflix', 'prime_video', 'hulu', 'disney_plus', 'spotify', 'amazon_music', 'youtube', 'twitch',
  'smart_home', 'shopping', 'calendar', 'communication', 'speak', 'play', 'pause', 'next', 'previous',
  'stop', 'set_volume',
]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', process.env.APP_ORIGIN ?? '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { command, text, payload, deviceId } = req.body ?? {};
  if (!command || !ALLOWED_COMMANDS.has(command)) return res.status(400).json({ error: 'Invalid command' });

  const relayUrl = process.env.RELAY_URL?.trim().replace(/\/$/, '');
  if (!relayUrl) return res.status(503).json({ error: 'Relay service is not configured' });

  try {
    const response = await fetch(`${relayUrl}/command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.RELAY_TOKEN ? { Authorization: `Bearer ${process.env.RELAY_TOKEN}` } : {}),
      },
      body: JSON.stringify({ command, text, payload, deviceId }),
    });
    const body = await response.text();
    let data: unknown;
    try { data = JSON.parse(body); } catch { data = { error: body || 'Invalid relay response' }; }
    return res.status(response.status).json(data);
  } catch (error: unknown) {
    return res.status(502).json({ error: 'Relay unreachable', detail: error instanceof Error ? error.message : 'Unknown error' });
  }
}
