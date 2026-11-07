// Kleine webserver voor de statuspagina (alleen bedoeld voor je thuisnetwerk).
//  GET  /             -> de pagina
//  GET  /api/status   -> huidige toestand als JSON
//  POST /api/target   -> { "target": 21.5 }
//  POST /api/pause    -> { "paused": true }

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const PAGE = new URL('./web/index.html', import.meta.url);
const MAX_BODY = 1024;

export function createWebServer({ getStatus, setTarget, setPaused }) {
  return createServer(async (req, res) => {
    try {
      const { pathname } = new URL(req.url, 'http://localhost');

      if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
        return send(res, 200, await readFile(PAGE), 'text/html; charset=utf-8');
      }
      if (req.method === 'GET' && pathname === '/api/status') {
        return json(res, 200, getStatus());
      }
      if (req.method === 'POST' && pathname === '/api/target') {
        const { target } = await readJson(req);
        if (typeof target !== 'number' || !Number.isFinite(target)) {
          return json(res, 400, { error: 'target moet een getal zijn' });
        }
        setTarget(target);
        return json(res, 200, getStatus());
      }
      if (req.method === 'POST' && pathname === '/api/pause') {
        const { paused } = await readJson(req);
        if (typeof paused !== 'boolean') return json(res, 400, { error: 'paused moet true of false zijn' });
        setPaused(paused);
        return json(res, 200, getStatus());
      }
      return json(res, 404, { error: 'niet gevonden' });
    } catch (err) {
      return json(res, err.status ?? 500, { error: err.message });
    }
  });
}

function send(res, status, body, type) {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}

function json(res, status, data) {
  send(res, status, JSON.stringify(data), 'application/json; charset=utf-8');
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > MAX_BODY) {
        reject(Object.assign(new Error('verzoek te groot'), { status: 413 }));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(Object.assign(new Error('ongeldige JSON'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}
