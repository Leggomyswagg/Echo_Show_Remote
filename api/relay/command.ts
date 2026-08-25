import type { VercelRequest, VercelResponse } from '@vercel/node';

function getRelayUrl(): string | null {
  const value = process.env.RELAY_URL?.trim();
  return value ? value.replace(/\/$/, '') : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', process.env.APP_ORIGIN ?? '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const relayUrl = getRelayUrl();
  if (!relayUrl) return res.status(503).json({ error: 'Relay service is not configured' });

  const body = req.body ?? {};
  if (!body.command || typeof body.command !== 'string') {
    return res.status(400).json({ error: 'command is required' });
  }

  try {
    const response = await fetch(`${relayUrl}/command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.RELAY_TOKEN ? { Authorization: `Bearer ${process.env.RELAY_TOKEN}` } : {}),
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
  } catch (error: unknown) {
    return res.status(502).json({
      error: 'Relay unreachable',
      detail: error instanceof Error ? error.message : 'Unknown relay error',
    });
  }
}
