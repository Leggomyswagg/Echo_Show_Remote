import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Deprecated. The previous endpoint generated synthetic OAuth tokens and
 * auto-approved every user. That was an MVP stub, not real Alexa account
 * linking, and must not be used in production.
 *
 * Echo Show Remote now authenticates the device-control relay separately.
 */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(410).json({
    error: 'Legacy Alexa account linking has been disabled',
    replacement: 'Configure the Echo Show Remote relay and connect the app to it.',
  });
}
