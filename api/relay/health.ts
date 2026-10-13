import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isRelayAuthorized } from '../lib/relayAuth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', process.env.APP_ORIGIN ?? '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const relayUrl = process.env.RELAY_URL?.trim().replace(/\/$/, '');
  if (!relayUrl) return res.status(503).json({ ok: false, error: 'Relay service is not configured' });
  if (!process.env.RELAY_TOKEN) return res.status(503).json({ ok: false, error: 'Relay authentication is not configured' });
  if (!isRelayAuthorized(req.headers.authorization, process.env.RELAY_TOKEN)) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  try {
    const response = await fetch(`${relayUrl}/health`, {
      headers: { Authorization: `Bearer ${process.env.RELAY_TOKEN}` },
      signal: AbortSignal.timeout(5000),
    });
    const text = await response.text();
    let data: unknown = {};
    try { data = JSON.parse(text); } catch { return res.status(502).json({ ok: false, error: 'Relay returned invalid JSON' }); }
    return res.status(response.status).json(data);
  } catch {
    return res.status(502).json({ ok: false, error: 'Relay unreachable' });
  }
}
