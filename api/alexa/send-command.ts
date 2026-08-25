import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Backward-compatible command endpoint.
 *
 * The previous implementation sent AMAZON.MessageAlert.Activated proactive
 * events and treated them as remote-control commands. Proactive Events are
 * notifications, not an Echo control channel. Commands now go to the
 * authenticated Echo relay, which uses alexa-remote2's device-control API.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const relayUrl = process.env.RELAY_URL?.trim().replace(/\/$/, '');
  if (!relayUrl) return res.status(503).json({ error: 'Relay service is not configured' });

  const { command, text, payload, deviceId } = req.body ?? {};
  if (!command || typeof command !== 'string') return res.status(400).json({ error: 'command required' });

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
