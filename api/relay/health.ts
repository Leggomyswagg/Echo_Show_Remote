import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const relayUrl = process.env.RELAY_URL?.trim().replace(/\/$/, '');
  if (!relayUrl) return res.status(503).json({ ok: false, error: 'Relay service is not configured' });

  try {
    const response = await fetch(`${relayUrl}/health`, {
      headers: process.env.RELAY_TOKEN ? { Authorization: `Bearer ${process.env.RELAY_TOKEN}` } : {},
    });
    const text = await response.text();
    let data: unknown = {};
    try { data = JSON.parse(text); } catch { data = { ok: false, error: text }; }
    return res.status(response.status).json(data);
  } catch (error: unknown) {
    return res.status(502).json({ ok: false, error: 'Relay unreachable', detail: error instanceof Error ? error.message : 'Unknown error' });
  }
}
