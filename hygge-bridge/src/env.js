// Laadt .env (naast package.json) in process.env, zonder extra pakketten.
// Waarden die al in de omgeving staan, winnen (handig voor DEMO=true npm start).

import { readFileSync } from 'node:fs';

export function parseEnv(text) {
  const out = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

export function loadEnvFile(file = new URL('../.env', import.meta.url), env = process.env) {
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    return false; // geen .env: alleen de omgeving gebruiken
  }
  for (const [key, value] of Object.entries(parseEnv(text))) {
    if (env[key] === undefined) env[key] = value;
  }
  return true;
}

/**
 * Home Assistant-add-on: de opties uit het tabblad "Configuratie" staan in /data/options.json.
 * Elke optie wordt een omgevingsvariabele in hoofdletters (niko_host -> NIKO_HOST).
 */
export function loadAddonOptions(file = '/data/options.json', env = process.env) {
  let options;
  try {
    options = JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return false; // geen add-on
  }
  for (const [key, value] of Object.entries(options)) {
    if (value === null || value === undefined || value === '') continue;
    const name = key.toUpperCase();
    if (env[name] === undefined) env[name] = String(value);
  }
  return true;
}
