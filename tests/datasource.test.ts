import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import { redact, resolveDatasource } from '../prisma/resolve-datasource';

const LOCAL = 'postgresql://postgres:secret@localhost:5432/healtheasy_g?schema=public';
const CLOUD = 'postgresql://owner:hunter2@ep-abc.neon.tech/neondb?sslmode=require';

describe('local / cloud database selection', () => {
  it('uses the cloud database when the target says so', () => {
    const resolved = resolveDatasource({
      DATABASE_TARGET: 'cloud',
      DATABASE_URL_LOCAL: LOCAL,
      DATABASE_URL_CLOUD: CLOUD
    } as unknown as NodeJS.ProcessEnv);

    assert.equal(resolved.target, 'cloud');
    assert.equal(resolved.url, CLOUD);
  });

  it('uses the local database when the facility is offline', () => {
    const resolved = resolveDatasource({
      DATABASE_TARGET: 'local',
      DATABASE_URL_LOCAL: LOCAL,
      DATABASE_URL_CLOUD: CLOUD
    } as unknown as NodeJS.ProcessEnv);

    assert.equal(resolved.target, 'local');
    assert.equal(resolved.url, LOCAL);
  });

  it('lets an explicit DATABASE_URL win, for CI and hosting providers', () => {
    const resolved = resolveDatasource({
      DATABASE_URL: CLOUD,
      DATABASE_URL_LOCAL: LOCAL
    } as unknown as NodeJS.ProcessEnv);

    assert.equal(resolved.target, 'explicit');
    assert.equal(resolved.url, CLOUD);
  });

  it('prefers the named target over a stale DATABASE_URL', () => {
    const resolved = resolveDatasource({
      DATABASE_TARGET: 'local',
      DATABASE_URL: CLOUD,
      DATABASE_URL_LOCAL: LOCAL
    } as unknown as NodeJS.ProcessEnv);

    assert.equal(resolved.url, LOCAL);
  });

  it('fails loudly rather than silently connecting to the wrong database', () => {
    assert.throws(
      () => resolveDatasource({ DATABASE_TARGET: 'local' } as unknown as NodeJS.ProcessEnv),
      /DATABASE_URL_LOCAL is not set/
    );
    assert.throws(() => resolveDatasource({} as unknown as NodeJS.ProcessEnv), /No database configured/);
  });

  it('never prints a database password', () => {
    assert.equal(redact(LOCAL).includes('secret'), false);
    assert.equal(redact(CLOUD).includes('hunter2'), false);
    assert.ok(redact(CLOUD).includes('neon.tech'));
  });
});
