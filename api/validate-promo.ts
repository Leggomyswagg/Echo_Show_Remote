import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import type { Promotion } from './admin/promotions';

const PROMOTIONS_KEY = 'echo_remote:promotions';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const code = String(req.body?.code ?? '').toUpperCase().replace(/\s/g, '');
  if (!code) return res.status(400).json({ valid: false, error: 'No code provided' });

  let promos: Promotion[] = [];
  try {
    promos = (await kv.get<Promotion[]>(PROMOTIONS_KEY)) ?? [];
  } catch {
    return res.status(503).json({ valid: false, error: 'Service unavailable' });
  }

  const promo = promos.find(p => p.code === code);

  if (!promo) return res.json({ valid: false, error: 'Invalid code' });
  if (!promo.active) return res.json({ valid: false, error: 'Code is inactive' });
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
    return res.json({ valid: false, error: 'Code has expired' });
  }
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
    return res.json({ valid: false, error: 'Code usage limit reached' });
  }

  // Increment usage count
  const idx = promos.findIndex(p => p.id === promo.id);
  promos[idx] = { ...promos[idx], usedCount: promos[idx].usedCount + 1 };
  await kv.set(PROMOTIONS_KEY, promos);

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
