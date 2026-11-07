import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWebServer } from '../src/web.js';

async function withServer(fn) {
  const calls = [];
  const status = { target: 21, paused: false };
  const server = createWebServer({
    getStatus: () => status,
    setTarget: (t) => { calls.push(['target', t]); status.target = t; },
    setPaused: (p) => { calls.push(['pause', p]); status.paused = p; },
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await fn(base, calls);
  } finally {
    server.close();
  }
}

const post = (url, body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });

test('pagina en status worden geserveerd', () => withServer(async (base) => {
  const page = await fetch(`${base}/`);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /<title>Verwarming<\/title>/);
  assert.deepEqual(await (await fetch(`${base}/api/status`)).json(), { target: 21, paused: false });
}));

test('doel en pauze aanpassen', () => withServer(async (base, calls) => {
  assert.equal((await (await post(`${base}/api/target`, '{"target":21.5}')).json()).target, 21.5);
  assert.equal((await (await post(`${base}/api/pause`, '{"paused":true}')).json()).paused, true);
  assert.deepEqual(calls, [['target', 21.5], ['pause', true]]);
}));

test('foute invoer wordt geweigerd', () => withServer(async (base, calls) => {
  assert.equal((await post(`${base}/api/target`, '{"target":"warm"}')).status, 400);
  assert.equal((await post(`${base}/api/pause`, 'geen json')).status, 400);
  assert.equal((await fetch(`${base}/onbekend`)).status, 404);
  assert.equal(calls.length, 0);
}));
