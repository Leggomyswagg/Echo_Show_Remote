import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Legacy pairing endpoint retired with the synthetic Alexa OAuth flow. */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(410).json({
    error: 'Legacy Alexa pairing is disabled',
    replacement: 'Connect the app to an authenticated Echo Show Remote relay.',
  });
}
