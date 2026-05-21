import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_COMMANDS = new Set([
  'power', 'home', 'back', 'menu', 'settings',
  'up', 'down', 'left', 'right', 'select',
  'volume_up', 'volume_down', 'mute',
  'play_pause', 'rewind', 'fast_forward',
  'brightness_up', 'brightness_down',
  'microphone', 'camera', 'do_not_disturb',
  'alexa_text',
  'netflix', 'prime_video', 'hulu', 'disney_plus',
  'spotify', 'amazon_music', 'youtube', 'twitch',
  'smart_home', 'shopping', 'calendar', 'communication',
]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS — allow the Expo web app and mobile clients
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { command, text } = req.body ?? {};

  if (!command || !ALLOWED_COMMANDS.has(command)) {
    return res.status(400).json({ error: 'Invalid command' });
  }

  // ── Alexa text command ───────────────────────────────────────────────────
  if (command === 'alexa_text') {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'text is required for alexa_text command' });
    }
    // TODO: forward to Alexa Voice Service (AVS) or your local relay
    console.log('[alexa_text]', text.trim());
    return res.status(200).json({ ok: true, command, text: text.trim() });
  }

  // ── Standard remote command ──────────────────────────────────────────────
  // TODO: forward to local Echo Show relay server running on your home network.
  // Example: await fetch(`http://${process.env.RELAY_HOST}/command`, { method:'POST', body: JSON.stringify({ command }) })
  console.log('[command]', command);
  return res.status(200).json({ ok: true, command });
}
