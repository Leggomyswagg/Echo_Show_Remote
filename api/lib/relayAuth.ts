import { timingSafeEqual } from 'node:crypto';

export function isRelayAuthorized(authorization: unknown, token: string): boolean {
  const supplied = typeof authorization === 'string' && authorization.startsWith('Bearer ')
    ? authorization.slice(7) : '';
  const expected = new Uint8Array(Buffer.from(token));
  const actual = new Uint8Array(Buffer.from(supplied));
  return token.length > 0 && actual.length === expected.length && timingSafeEqual(actual, expected);
}
