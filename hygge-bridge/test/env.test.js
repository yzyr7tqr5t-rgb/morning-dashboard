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

test('loadAddonOptions zet Home Assistant-opties om naar omgevingsvariabelen', async () => {
  const { loadAddonOptions } = await import('../src/env.js');
  const file = join(mkdtempSync(join(tmpdir(), 'opt-')), 'options.json');
  writeFileSync(file, JSON.stringify({ niko_host: '192.168.1.5', dry_run: true, min_setpoint: 12.5, niko_sensor_uuid: '' }));
  const env = { WEB_PORT: '8099' };
  assert.equal(loadAddonOptions(file, env), true);
  assert.deepEqual(env, { WEB_PORT: '8099', NIKO_HOST: '192.168.1.5', DRY_RUN: 'true', MIN_SETPOINT: '12.5' });
  assert.equal(loadAddonOptions(join(tmpdir(), 'geen-options.json'), env), false);
});
