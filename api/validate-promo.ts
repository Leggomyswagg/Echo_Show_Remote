import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Promotion } from './admin/promotions';
import { redis } from './lib/redis';

const PROMOTIONS_KEY = 'echo_remote:promotions';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', process.env.APP_ORIGIN ?? '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!redis) return res.status(503).json({ valid: false, error: 'Promotion service is not configured' });

  const code = String(req.body?.code ?? '').toUpperCase().replace(/\s/g, '');
  if (!code || code.length > 64) return res.status(400).json({ valid: false, error: 'Invalid code' });

  let promos: Promotion[];
  try {
    promos = (await redis.get<Promotion[]>(PROMOTIONS_KEY)) ?? [];
  } catch {
    return res.status(503).json({ valid: false, error: 'Service unavailable' });
  }

  const promo = promos.find(p => p.code === code);
  if (!promo) return res.json({ valid: false, error: 'Invalid code' });
  if (!promo.active) return res.json({ valid: false, error: 'Code is inactive' });
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) return res.json({ valid: false, error: 'Code has expired' });
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) return res.json({ valid: false, error: 'Code usage limit reached' });

  const idx = promos.findIndex(p => p.id === promo.id);
  promos[idx] = { ...promos[idx], usedCount: promos[idx].usedCount + 1 };
  try {
    await redis.set(PROMOTIONS_KEY, promos);
  } catch {
    return res.status(503).json({ valid: false, error: 'Service unavailable' });
  }

  return res.json({
    valid: true,
    type: promo.type,
    value: promo.value,
    message:
      promo.type === 'free_premium' ? 'Premium unlocked!'
      : promo.type === 'trial_days' ? `${promo.value}-day free trial activated!`
      : `${promo.value}% discount applied!`,
  });
}
