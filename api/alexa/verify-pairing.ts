import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

/**
 * Phone app polls this endpoint with the 6-8 char pairing code the user copies
 * from the Alexa app's post-linking screen. If the code has been stored by the
 * skill-event webhook (after SKILL_ACCOUNT_LINKED), we return the userId so the
 * app can attach it to this device.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const code = String(req.query.code ?? '').toUpperCase();
  if (!code) return res.status(400).json({ error: 'Missing code' });

  const userId = await kv.get<string>(`alexa:pairing:${code}`);
  if (!userId) return res.status(404).json({ error: 'Pairing code not found or expired' });

  // Delete after use — pairing codes are one-shot
  await kv.del(`alexa:pairing:${code}`);
  return res.json({ userId });
}
