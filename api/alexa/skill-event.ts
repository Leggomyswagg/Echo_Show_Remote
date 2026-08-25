import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Deprecated with the legacy custom-skill architecture.
 * The former implementation persisted Alexa tokens from a synthetic
 * account-linking flow. Production command transport now uses the relay.
 */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(410).json({
    error: 'Legacy Alexa skill event endpoint disabled',
    replacement: 'Use the Echo Show Remote relay transport.',
  });
}
