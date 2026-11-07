import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig, targetBounds } from '../src/config.js';

const base = { NIKO_HOST: '192.168.1.50', NIKO_TOKEN: 'jwt', NIKO_SENSOR_NAME: 'Woonkamer', IFTTT_KEY: 'k' };

test('standaardwaarden en komma als decimaalteken', () => {
  const c = loadConfig({ ...base, TARGET_TEMP: '20,5' });
  assert.equal(c.control.targetTemp, 20.5);
  assert.equal(c.niko.port, 8884);
  assert.equal(c.control.minSwitchIntervalMs, 600_000);
});

test('ontbrekende verplichte waarden geven een duidelijke fout', () => {
  assert.throws(() => loadConfig({ ...base, NIKO_TOKEN: '' }), /NIKO_TOKEN/);
  assert.throws(() => loadConfig({ ...base, IFTTT_KEY: '' }), /IFTTT_KEY/);
  assert.throws(() => loadConfig({ ...base, NIKO_SENSOR_NAME: '' }), /NIKO_SENSOR/);
});

test('setpoints moeten buiten de regelmarge liggen', () => {
  assert.throws(() => loadConfig({ ...base, HEAT_SETPOINT: '21' }), /HEAT_SETPOINT/);
  assert.throws(() => loadConfig({ ...base, IDLE_SETPOINT: '21' }), /IDLE_SETPOINT/);
});

test('in DRY_RUN is de IFTTT-sleutel niet nodig', () => {
  assert.doesNotThrow(() => loadConfig({ ...base, IFTTT_KEY: '', DRY_RUN: 'true' }));
});

test('DEMO heeft geen Niko- of IFTTT-gegevens nodig en verstuurt niets', () => {
  const c = loadConfig({ DEMO: 'true' });
  assert.equal(c.demo, true);
  assert.equal(c.dryRun, true);
  assert.equal(c.web.port, 8080);
});

test('targetBounds houdt het doel tussen de setpoints', () => {
  assert.deepEqual(targetBounds({ heatSetpoint: 25, idleSetpoint: 12, hysteresis: 0.3 }), { min: 13, max: 24 });
});
