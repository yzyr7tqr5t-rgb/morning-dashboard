import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseEnv, loadEnvFile } from '../src/env.js';

test('parseEnv leest sleutels, slaat commentaar over en haalt aanhalingstekens weg', () => {
  assert.deepEqual(parseEnv('# uitleg\nA=1\n\nB = "twee woorden"\nC=\'x=y\'\nfout\n'), { A: '1', B: 'twee woorden', C: 'x=y' });
});

test('loadEnvFile overschrijft geen bestaande waarden', () => {
  const file = join(mkdtempSync(join(tmpdir(), 'env-')), '.env');
  writeFileSync(file, 'DEMO=false\nWEB_PORT=9000\n');
  const env = { DEMO: 'true' };
  assert.equal(loadEnvFile(file, env), true);
  assert.deepEqual(env, { DEMO: 'true', WEB_PORT: '9000' });
  assert.equal(loadEnvFile(join(tmpdir(), 'bestaat-niet.env'), env), false);
});
