import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config.js';

const base = { NIKO_HOST: '192.168.1.50', NIKO_TOKEN: 'jwt', NIKO_SENSOR_NAME: 'Woonkamer', IFTTT_KEY: 'k' };

test('standaardwaarden en komma als decimaalteken', () => {
  const c = loadConfig({ ...base, DEFAULT_SETPOINT: '20,5' });
  assert.equal(c.hygge.defaultSetpoint, 20.5);
  assert.deepEqual([c.hygge.min, c.hygge.max], [10, 28]);
  assert.equal(c.niko.port, 8884);
  assert.equal(c.web.port, 8080);
});

test('ontbrekende verplichte waarden geven een duidelijke fout', () => {
  assert.throws(() => loadConfig({ ...base, NIKO_TOKEN: '' }), /NIKO_TOKEN/);
  assert.throws(() => loadConfig({ ...base, IFTTT_KEY: '' }), /IFTTT_KEY/);
  assert.throws(() => loadConfig({ ...base, NIKO_SENSOR_NAME: '' }), /NIKO_SENSOR/);
});

test('grenzen van het setpoint worden gecontroleerd', () => {
  assert.throws(() => loadConfig({ ...base, MIN_SETPOINT: '25', MAX_SETPOINT: '20' }), /MIN_SETPOINT/);
  assert.throws(() => loadConfig({ ...base, DEFAULT_SETPOINT: '35' }), /DEFAULT_SETPOINT/);
});

test('in DRY_RUN is de IFTTT-sleutel niet nodig', () => {
  assert.doesNotThrow(() => loadConfig({ ...base, IFTTT_KEY: '', DRY_RUN: 'true' }));
});

test('DEMO heeft geen Niko- of IFTTT-gegevens nodig en verstuurt niets', () => {
  const c = loadConfig({ DEMO: 'true' });
  assert.equal(c.demo, true);
  assert.equal(c.dryRun, true);
});
