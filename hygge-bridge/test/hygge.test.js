import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HyggeControl } from '../src/hygge.js';

const limits = { min: 10, max: 28, defaultSetpoint: 20 };

function fakeSeitron({ fail = false, delayMs = 0 } = {}) {
  const calls = [];
  const wait = () => new Promise((r) => setTimeout(r, delayMs));
  return {
    calls,
    async setTemperature(t) { await wait(); calls.push(['set', t]); if (fail) throw new Error('IFTTT antwoordde 401'); },
    async scheduledMode() { await wait(); calls.push(['auto']); if (fail) throw new Error('IFTTT antwoordde 401'); },
  };
}

test('start zonder opgeslagen stand: niets verstuurd, standaard setpoint', () => {
  const h = new HyggeControl(fakeSeitron(), limits);
  assert.equal(h.mode, null);
  assert.equal(h.setpoint, 20);
});

test('opgeslagen stand wordt hersteld', () => {
  const h = new HyggeControl(fakeSeitron(), limits, { mode: 'auto', setpoint: 21.5 });
  assert.deepEqual(h.saved(), { mode: 'auto', setpoint: 21.5 });
});

test('temperatuur instellen: afronden op 0,5 en binnen de grenzen houden', async () => {
  const s = fakeSeitron();
  const h = new HyggeControl(s, limits);
  await h.setTemperature(21.3);
  await h.setTemperature(40);
  assert.deepEqual(s.calls, [['set', 21.5], ['set', 28]]);
  assert.equal(h.mode, 'manual');
  assert.equal(h.last.ok, true);
});

test('weekprogramma aan en weer uit gaat terug naar de laatste temperatuur', async () => {
  const s = fakeSeitron();
  const h = new HyggeControl(s, limits);
  await h.setTemperature(22);
  await h.setSchedule(true);
  assert.equal(h.mode, 'auto');
  await h.setSchedule(false);
  assert.deepEqual(s.calls, [['set', 22], ['auto'], ['set', 22]]);
  assert.equal(h.mode, 'manual');
});

test('opdrachten gaan in volgorde, ook als ze snel na elkaar komen', async () => {
  const s = fakeSeitron({ delayMs: 20 });
  const h = new HyggeControl(s, limits);
  await Promise.all([h.setTemperature(19), h.setSchedule(true), h.setTemperature(23)]);
  assert.deepEqual(s.calls, [['set', 19], ['auto'], ['set', 23]]);
  assert.equal(h.last.setpoint, 23);
});

test('mislukte opdracht wordt gemeld', async () => {
  const h = new HyggeControl(fakeSeitron({ fail: true }), limits);
  const result = await h.setTemperature(21);
  assert.equal(result.ok, false);
  assert.match(result.error, /401/);
});
