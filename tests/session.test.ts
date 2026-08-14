import { strict as assert } from 'node:assert';
import { describe, it, before } from 'node:test';

// Set before the first token is signed. `session.ts` reads the secret lazily
// inside getSecret(), so a static import is safe here.
process.env.SESSION_SECRET = 'test-secret-that-is-comfortably-longer-than-32-chars';
process.env.SESSION_MAX_AGE_SECONDS = '3600';

import { createSessionToken, verifySessionToken, sessionCookieOptions } from '../src/lib/session';

const staff = {
  id: 'user-1',
  name: 'Dr. Kwame Mensah',
  email: 'kwame.mensah@ridgehms.gh',
  role: 'Doctor',
  hierarchyLevel: 3,
  staffId: 'DOC-9921',
  department: 'OPD Consultation'
};

describe('session tokens', () => {
  let token: string;

  before(async () => {
    token = await createSessionToken(staff);
  });

  it('round-trips the signed staff identity', async () => {
    const payload = await verifySessionToken(token);
    assert.ok(payload);
    assert.equal(payload.id, staff.id);
    assert.equal(payload.role, 'Doctor');
    assert.equal(payload.staffId, 'DOC-9921');
  });

  it('rejects a token whose payload was edited to escalate the role', async () => {
    // This is the exact attack the old localStorage session allowed: change
    // your own role to Super Admin and reload.
    const [body, signature] = token.split('.');
    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString());
    decoded.role = 'Super Admin';

    const forgedBody = Buffer.from(JSON.stringify(decoded)).toString('base64url');
    assert.equal(await verifySessionToken(`${forgedBody}.${signature}`), null);
  });

  it('rejects a tampered signature', async () => {
    const [body] = token.split('.');
    assert.equal(await verifySessionToken(`${body}.not-a-real-signature`), null);
  });

  it('rejects a token signed with a different secret', async () => {
    const original = process.env.SESSION_SECRET;
    process.env.SESSION_SECRET = 'a-completely-different-secret-value-over-32-chars';

    const foreign = await createSessionToken(staff);
    process.env.SESSION_SECRET = original;

    assert.equal(await verifySessionToken(foreign), null);
  });

  it('rejects an expired token', async () => {
    const [, signature] = token.split('.');
    const expired = { ...staff, iat: 0, exp: Math.floor(Date.now() / 1000) - 60 };
    const body = Buffer.from(JSON.stringify(expired)).toString('base64url');

    assert.equal(await verifySessionToken(`${body}.${signature}`), null);
  });

  it('rejects empty and malformed input', async () => {
    assert.equal(await verifySessionToken(undefined), null);
    assert.equal(await verifySessionToken(''), null);
    assert.equal(await verifySessionToken('no-separator'), null);
    assert.equal(await verifySessionToken('.onlysignature'), null);
  });

  it('issues an httpOnly cookie that JavaScript cannot read', () => {
    const options = sessionCookieOptions();
    assert.equal(options.httpOnly, true);
    assert.equal(options.sameSite, 'lax');
    assert.equal(options.maxAge, 3600);
  });
});
