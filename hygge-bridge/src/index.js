// Hygge-bridge: Niko Home Control temperatuursensor -> Seitron Hygge Way.

import { readFileSync, writeFileSync } from 'node:fs';
import { loadConfig, targetBounds } from './config.js';
import { NikoClient } from './niko.js';
import { DemoSensor } from './demo.js';
import { SeitronHygge } from './seitron.js';
import { decide, initialState } from './controller.js';
import { createWebServer } from './web.js';

const log = {
  info: (...a) => console.log(new Date().toISOString(), ...a),
  error: (...a) => console.error(new Date().toISOString(), 'FOUT:', ...a),
};

const config = loadConfig();
const state = initialState();
const bounds = targetBounds(config.control);
restoreSettings();

const sensor = config.demo
  ? new DemoSensor({ getMode: () => state.mode })
  : new NikoClient(config.niko);
const hygge = new SeitronHygge(config.seitron, { dryRun: config.dryRun, log });

// Gegevens voor de webpagina
const HISTORY_STEP_MS = config.demo ? 10_000 : 60_000;
const HISTORY_MAX = 1440;
const history = []; // [tijdstip, temperatuur, verwarmt (0/1)]
let sensorName = config.niko.sensorName || 'Sensor';
let connected = false;
let lastCommand = null;
let lastReason = 'wacht op eerste meting';

let busy = false;
let again = false;

async function evaluate() {
  if (busy) {
    again = true;
    return;
  }
  busy = true;
  try {
    const now = Date.now();
    const { command, reason } = decide(state, now, config.control);
    lastReason = reason;
    if (!command) return;

    if (command.mode === 'auto') {
      log.info(`Hygge -> eigen weekprogramma (${reason})`);
      await hygge.scheduledMode();
    } else {
      log.info(`Hygge -> ${command.setpoint} °C (${reason})`);
      await hygge.setTemperature(command.setpoint);
    }
    state.mode = command.mode;
    state.lastCommandAt = now;
    lastCommand = { at: now, ...command, reason, ok: true };
  } catch (err) {
    log.error('commando naar Seitron mislukt:', err.message);
    lastCommand = { at: Date.now(), ok: false, reason: err.message };
  } finally {
    busy = false;
    if (again) {
      again = false;
      evaluate();
    }
  }
}

function recordHistory(temperature) {
  const now = Date.now();
  const point = [now, temperature, state.mode === 'heat' ? 1 : 0];
  const last = history.at(-1);
  if (last && now - last[0] < HISTORY_STEP_MS) history[history.length - 1] = [last[0], temperature, point[2]];
  else history.push(point);
  const cutoff = now - 24 * 60 * 60_000;
  while (history.length > HISTORY_MAX || (history.length && history[0][0] < cutoff)) history.shift();
}

sensor.on('connect', () => {
  connected = true;
  log.info(config.demo
    ? 'Demo-sensor gestart (gesimuleerde temperatuur)'
    : `Verbonden met Niko Home Control op ${config.niko.host}:${config.niko.port}`);
});
sensor.on('offline', () => {
  connected = false;
  log.error('verbinding met Niko verbroken, opnieuw proberen…');
});
sensor.on('error', (err) => log.error(err.message));
sensor.on('temperature', (temperature, device) => {
  connected = true;
  if (device.Name) sensorName = device.Name;
  if (temperature !== state.lastTemperature) {
    log.info(`${sensorName}: ${temperature.toFixed(1)} °C (doel ${config.control.targetTemp} °C)`);
  }
  state.lastTemperature = temperature;
  state.lastReadingAt = Date.now();
  recordHistory(temperature);
  evaluate();
});

// Ook zonder nieuwe meting regelmatig evalueren (failsafe, herhalingen, schakeltijd).
const timer = setInterval(evaluate, config.demo ? 5_000 : 60_000);

// --- Webpagina ---------------------------------------------------------------

function getStatus() {
  return {
    sensorName,
    connected,
    temperature: state.lastTemperature,
    lastReadingAt: state.lastReadingAt,
    target: config.control.targetTemp,
    hysteresis: config.control.hysteresis,
    bounds,
    mode: state.mode,
    paused: state.paused,
    reason: lastReason,
    lastCommand,
    history,
    demo: config.demo,
    dryRun: config.dryRun,
  };
}

function setTarget(target) {
  const clamped = Math.min(bounds.max, Math.max(bounds.min, Math.round(target * 2) / 2));
  if (clamped === config.control.targetTemp) return;
  config.control.targetTemp = clamped;
  log.info(`Doeltemperatuur aangepast naar ${clamped} °C (webpagina)`);
  saveSettings();
  evaluate();
}

function setPaused(paused) {
  if (paused === state.paused) return;
  state.paused = paused;
  log.info(paused ? 'Gepauzeerd via de webpagina' : 'Hervat via de webpagina');
  saveSettings();
  evaluate();
}

function restoreSettings() {
  try {
    const saved = JSON.parse(readFileSync(config.stateFile, 'utf8'));
    if (typeof saved.targetTemp === 'number') {
      config.control.targetTemp = Math.min(bounds.max, Math.max(bounds.min, saved.targetTemp));
    }
    state.paused = saved.paused === true;
  } catch {
    // geen opgeslagen instellingen: waarden uit .env gebruiken
  }
}

function saveSettings() {
  try {
    writeFileSync(config.stateFile, JSON.stringify({ targetTemp: config.control.targetTemp, paused: state.paused }));
  } catch (err) {
    log.error('kon instellingen niet bewaren:', err.message);
  }
}

const web = config.web.port > 0 ? createWebServer({ getStatus, setTarget, setPaused }) : null;
web?.listen(config.web.port, config.web.host, () => {
  log.info(`Webpagina op http://${config.web.host === '0.0.0.0' ? '<ip-van-deze-computer>' : config.web.host}:${config.web.port}`);
});

// --- Starten en stoppen --------------------------------------------------------

const modeLabel = config.demo ? ' (DEMO: gesimuleerde sensor, er wordt niets verstuurd)'
  : config.dryRun ? ' (DRY_RUN: er wordt niets verstuurd)' : '';
log.info(`Hygge-bridge gestart${modeLabel}`);
sensor.connect();

async function shutdown(signal) {
  log.info(`${signal} ontvangen, Hygge terug naar eigen weekprogramma en afsluiten…`);
  clearInterval(timer);
  web?.close();
  try {
    if (state.mode && state.mode !== 'auto') await hygge.scheduledMode();
  } catch (err) {
    log.error('kon Hygge niet terugzetten:', err.message);
  }
  await sensor.close();
  process.exit(0);
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
