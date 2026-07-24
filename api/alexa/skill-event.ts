import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

/**
 * Called by the Lambda when Alexa sends lifecycle events:
 *   - AlexaSkillEvent.SkillEnabled
 *   - AlexaSkillEvent.SkillAccountLinked  (body contains accessToken for Skill Messaging)
 *   - AlexaSkillEvent.SkillDisabled
 *
 * Persists the Skill Messaging access token per Alexa userId so that
 * /api/alexa/send-command can act on their behalf.
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Simple shared-secret check — Lambda includes X-Skill-Secret header
  const secret = process.env.SKILL_WEBHOOK_SECRET;
  if (secret && req.headers['x-skill-secret'] !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { type, userId, accessToken, timestamp } = req.body ?? {};
  if (!userId) return res.status(400).json({ error: 'userId required' });

  if (type === 'AlexaSkillEvent.SkillAccountLinked' && accessToken) {
    await kv.set(`alexa:user:${userId}`, {
      userId,
      accessToken,
      linkedAt: timestamp ?? new Date().toISOString(),
    });
    // Generate a short human-readable pairing code (6 chars) → userId,
    // valid for 15 minutes, so the phone app can attach itself.
    const pairing = Math.random().toString(36).slice(2, 8).toUpperCase();
    await kv.set(`alexa:pairing:${pairing}`, userId, { ex: 900 });
    return res.json({ ok: true, stored: true, pairingCode: pairing });
  }

  if (type === 'AlexaSkillEvent.SkillDisabled') {
    await kv.del(`alexa:user:${userId}`);
    return res.json({ ok: true, deleted: true });
  }

  if (type === 'AlexaSkillEvent.SkillEnabled') {
    return res.json({ ok: true });
  }

  return res.json({ ok: true, unhandled: type });
}
