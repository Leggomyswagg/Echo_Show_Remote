import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

/**
 * OAuth 2.0 authorization endpoint for Alexa Account Linking.
 *
 * Alexa app calls:
 *   GET  /api/alexa/link-account?client_id=...&redirect_uri=...&state=...&response_type=code&scope=...
 *   POST /api/alexa/link-account  (token exchange — body has grant_type=authorization_code)
 *
 * For simplicity we treat every user who completes the flow as authorized;
 * the returned `code` embeds a fresh user ID (deviceId or emailed magic link
 * in a real production build). Refresh tokens live in Vercel KV.
 */

const CLIENT_ID = process.env.ECHO_REMOTE_CLIENT_ID ?? 'echo-remote-app';
const CLIENT_SECRET = process.env.ECHO_REMOTE_CLIENT_SECRET ?? '';

interface PendingAuth {
  userId: string;
  redirectUri: string;
  state: string;
  createdAt: number;
}

function generateToken(prefix: string): string {
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  return `${prefix}_${rand}`;
}

// ── GET: show consent page and redirect back with a `code` ────────────────
async function handleAuthorize(req: VercelRequest, res: VercelResponse) {
  const { redirect_uri, state, response_type } = req.query;
  if (response_type !== 'code') {
    return res.status(400).send('response_type must be code');
  }
  if (!redirect_uri || !state) {
    return res.status(400).send('Missing redirect_uri or state');
  }

  // Auto-approve for MVP. Production: show a real consent screen and require sign-in.
  const userId = generateToken('user');
  const code = generateToken('code');

  const pending: PendingAuth = {
    userId,
    redirectUri: String(redirect_uri),
    state: String(state),
    createdAt: Date.now(),
  };
  await kv.set(`alexa:auth_code:${code}`, pending, { ex: 600 });

  const url = new URL(String(redirect_uri));
  url.searchParams.set('code', code);
  url.searchParams.set('state', String(state));

  // Simple HTML page that auto-redirects and briefly shows what happened
  res.setHeader('Content-Type', 'text/html');
  return res.send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Linking Echo Show Remote…</title>
<style>body{font-family:-apple-system,sans-serif;background:#131921;color:#fff;
display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:20px}
.card{max-width:400px}h1{color:#00CAFF;margin:0 0 12px} p{color:#CCC}
</style></head><body>
<div class="card">
<h1>✓ Account linked</h1>
<p>Redirecting you back to the Alexa app…</p>
<script>window.location.href=${JSON.stringify(url.toString())}</script>
</div></body></html>`);
}

// ── POST: exchange code / refresh_token for access_token ──────────────────
async function handleToken(req: VercelRequest, res: VercelResponse) {
  const body = req.body ?? {};
  const grantType = body.grant_type;

  if (grantType === 'authorization_code') {
    const code = body.code;
    if (!code) return res.status(400).json({ error: 'invalid_request' });

    const pending = await kv.get<PendingAuth>(`alexa:auth_code:${code}`);
    if (!pending) return res.status(400).json({ error: 'invalid_grant' });
    await kv.del(`alexa:auth_code:${code}`);

    const accessToken = generateToken('at');
    const refreshToken = generateToken('rt');

    // Persist token → user mapping so Skill Messaging API can find them later
    await kv.set(`alexa:access_token:${accessToken}`, pending.userId, { ex: 3600 });
    await kv.set(`alexa:refresh_token:${refreshToken}`, pending.userId);

    return res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: refreshToken,
    });
  }

  if (grantType === 'refresh_token') {
    const rt = body.refresh_token;
    const userId = await kv.get<string>(`alexa:refresh_token:${rt}`);
    if (!userId) return res.status(400).json({ error: 'invalid_grant' });

    const accessToken = generateToken('at');
    await kv.set(`alexa:access_token:${accessToken}`, userId, { ex: 3600 });
    return res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
    });
  }

  return res.status(400).json({ error: 'unsupported_grant_type' });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') return handleAuthorize(req, res);
  if (req.method === 'POST') return handleToken(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
}
