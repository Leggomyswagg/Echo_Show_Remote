import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

/**
 * POST /api/alexa/send-command
 *   { userId, command, payload? }
 *
 * Looks up the user's Alexa access token (stored when they linked the skill),
 * calls Alexa's Proactive Events API to trigger a specific routine on their Echo.
 *
 * Env:
 *   ALEXA_CLIENT_ID / ALEXA_CLIENT_SECRET — from your Alexa Developer Console
 *
 * Command → Alexa intent mapping. To trigger any of these, the user must have
 * a matching Alexa Routine configured in their Alexa app that listens for
 * the equivalent phrase. We ship a routine template on first launch.
 */

const CMD_TO_UTTERANCE: Record<string, string> = {
  play_pause: 'play',
  volume_up: 'volume up',
  volume_down: 'volume down',
  mute: 'mute',
  rewind: 'previous',
  fast_forward: 'next',
  home: 'go home',
  back: 'go back',
  do_not_disturb: 'do not disturb on',
  power: 'stop',
};

interface UserRecord {
  userId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  linkedAt: string;
}

async function getUser(userId: string): Promise<UserRecord | null> {
  return (await kv.get<UserRecord>(`alexa:user:${userId}`)) ?? null;
}

async function saveUser(user: UserRecord): Promise<void> {
  await kv.set(`alexa:user:${user.userId}`, user);
}

async function refreshAccessToken(user: UserRecord): Promise<string> {
  if (!user.refreshToken) throw new Error('No refresh token');
  const res = await fetch('https://api.amazon.com/auth/o2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: user.refreshToken,
      client_id: process.env.ALEXA_CLIENT_ID ?? '',
      client_secret: process.env.ALEXA_CLIENT_SECRET ?? '',
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Refresh failed');
  const updated: UserRecord = {
    ...user,
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? user.refreshToken,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  await saveUser(updated);
  return updated.accessToken;
}

async function ensureFreshToken(user: UserRecord): Promise<string> {
  if (!user.expiresAt || user.expiresAt < Date.now() + 30_000) {
    return refreshAccessToken(user);
  }
  return user.accessToken;
}

async function sendProactiveEvent(token: string, utterance: string) {
  // Uses Alexa's Skill Messaging API to nudge the customer's Echo.
  // Real end-to-end control requires a paired user-created Alexa Routine
  // configured to trigger on the same utterance.
  const res = await fetch('https://api.amazonalexa.com/v1/proactiveEvents/stages/development', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      timestamp: new Date().toISOString(),
      referenceId: `cmd_${Date.now()}`,
      expiryTime: new Date(Date.now() + 60_000).toISOString(),
      event: {
        name: 'AMAZON.MessageAlert.Activated',
        payload: {
          state: { status: 'UNREAD', freshness: 'NEW' },
          messageGroup: {
            creator: { name: 'Echo Remote' },
            count: 1,
            urgency: 'URGENT',
          },
        },
      },
      relevantAudience: { type: 'Unicast', payload: { user: utterance } },
    }),
  });
  return { ok: res.ok, status: res.status, body: await res.text() };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, command, text } = req.body ?? {};
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const user = await getUser(userId);
  if (!user) return res.status(404).json({ error: 'Account not linked. Complete Alexa Skill setup first.' });

  let utterance = text ?? CMD_TO_UTTERANCE[command];
  if (!utterance) return res.status(400).json({ error: 'Unknown command' });

  try {
    const token = await ensureFreshToken(user);
    const result = await sendProactiveEvent(token, utterance);
    if (!result.ok) return res.status(502).json({ error: 'Alexa API rejected event', detail: result.body });
    return res.json({ success: true, utterance });
  } catch (e: unknown) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Unknown error' });
  }
}
