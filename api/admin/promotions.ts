import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

export interface Promotion {
  id: string;
  code: string;
  type: 'free_premium' | 'trial_days' | 'percent_off';
  value: number;        // days for trial_days, % for percent_off, 0 for free_premium
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  active: boolean;
  note: string;
  createdAt: string;
}

const PROMOTIONS_KEY = 'echo_remote:promotions';

function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function checkAuth(req: VercelRequest): boolean {
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) return false;
  const header = req.headers.authorization ?? '';
  return header === `Bearer ${pass}`;
}

async function getAll(): Promise<Promotion[]> {
  try {
    return (await kv.get<Promotion[]>(PROMOTIONS_KEY)) ?? [];
  } catch {
    return [];
  }
}

async function saveAll(promos: Promotion[]): Promise<void> {
  await kv.set(PROMOTIONS_KEY, promos);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

  // ── GET: list all ────────────────────────────────────────────
  if (req.method === 'GET') {
    const promos = await getAll();
    return res.json(promos);
  }

  // ── POST: create ─────────────────────────────────────────────
  if (req.method === 'POST') {
    const body = req.body ?? {};
    const code = String(body.code ?? '').toUpperCase().replace(/\s/g, '');
    if (!code) return res.status(400).json({ error: 'Code is required' });

    const promos = await getAll();
    if (promos.some(p => p.code === code)) {
      return res.status(409).json({ error: 'Code already exists' });
    }

    const promo: Promotion = {
      id: `promo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      code,
      type: body.type ?? 'free_premium',
      value: Number(body.value ?? 0),
      maxUses: body.maxUses ? Number(body.maxUses) : null,
      usedCount: 0,
      expiresAt: body.expiresAt ?? null,
      active: true,
      note: String(body.note ?? ''),
      createdAt: new Date().toISOString(),
    };
    promos.push(promo);
    await saveAll(promos);
    return res.status(201).json(promo);
  }

  // ── PUT: update ──────────────────────────────────────────────
  if (req.method === 'PUT') {
    const { id, ...updates } = req.body ?? {};
    if (!id) return res.status(400).json({ error: 'id required' });

    const promos = await getAll();
    const idx = promos.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });

    if (updates.code) updates.code = String(updates.code).toUpperCase().replace(/\s/g, '');
    promos[idx] = { ...promos[idx], ...updates };
    await saveAll(promos);
    return res.json(promos[idx]);
  }

  // ── DELETE ───────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const { id } = req.body ?? {};
    if (!id) return res.status(400).json({ error: 'id required' });

    const promos = await getAll();
    await saveAll(promos.filter(p => p.id !== id));
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
