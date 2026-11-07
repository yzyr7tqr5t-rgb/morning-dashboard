// Hygge-bridge: toont de temperatuur van Niko Home Control en stuurt de
// Seitron Hygge (via Hygge Way en IFTTT) vanaf een webpagina.
// De Hygge regelt de verwarming zelf, op zijn eigen thermometer.

import { readFileSync, writeFileSync } from 'node:fs';
import { loadConfig } from './config.js';
import { NikoClient } from './niko.js';
import { DemoSensor } from './demo.js';
import { SeitronHygge } from './seitron.js';
import { HyggeControl } from './hygge.js';
import { createWebServer } from './web.js';

const log = {
  info: (...a) => console.log(new Date().toISOString(), ...a),
  error: (...a) => console.error(new Date().toISOString(), 'FOUT:', ...a),
};

const config = loadConfig();
const seitron = new SeitronHygge(config.seitron, { dryRun: config.dryRun, log });
const hygge = new HyggeControl(seitron, config.hygge, loadSaved());
const sensor = config.demo ? new DemoSensor() : new NikoClient(config.niko);

// --- Niko-temperatuur (alleen om te tonen) ------------------------------------

let sensorName = config.niko.sensorName || 'Sensor';
let connected = false;
let temperature = null;
let lastReadingAt = null;

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
sensor.on('temperature', (value, device) => {
  connected = true;
  if (device.Name) sensorName = device.Name;
  if (temperature === null || value.toFixed(1) !== temperature.toFixed(1)) log.info(`${sensorName}: ${value.toFixed(1)} °C`);
  temperature = value;
  lastReadingAt = Date.now();
});

// --- Hygge aansturen vanaf de webpagina -----------------------------------------

async function setTemperature(value) {
  const result = await hygge.setTemperature(value);
  report(result);
}

async function setSchedule(on) {
  const result = await hygge.setSchedule(on);
  report(result);
}

function report(result) {
  saveState();
  const what = result.mode === 'auto' ? 'weekprogramma' : `${result.setpoint} °C`;
  if (result.ok) log.info(`Hygge -> ${what}`);
  else log.error(`Hygge -> ${what} mislukt: ${result.error}`);
}

function getStatus() {
  return {
    niko: { sensorName, connected, temperature, lastReadingAt },
    hygge,
    demo: config.demo,
    dryRun: config.dryRun,
  };
}

function loadSaved() {
  try {
    return JSON.parse(readFileSync(config.stateFile, 'utf8'));
  } catch {
    return {}; // eerste start
  }
}

function saveState() {
  try {
    writeFileSync(config.stateFile, JSON.stringify(hygge.saved()));
  } catch (err) {
    log.error('kon stand niet bewaren:', err.message);
  }
}

const web = config.web.port > 0 ? createWebServer({ getStatus, setTemperature, setSchedule }) : null;
web?.listen(config.web.port, config.web.host, () => {
  log.info(`Webpagina op http://${config.web.host === '0.0.0.0' ? '<ip-van-deze-computer>' : config.web.host}:${config.web.port}`);
});

// --- Starten en stoppen --------------------------------------------------------

const modeLabel = config.demo ? ' (DEMO: gesimuleerde Niko-sensor, er gaat niets naar de Hygge)'
  : config.dryRun ? ' (DRY_RUN: er gaat niets naar de Hygge)' : '';
log.info(`Hygge-bridge gestart${modeLabel}`);
sensor.connect();

async function shutdown(signal) {
  log.info(`${signal} ontvangen, afsluiten…`);
  web?.close();
  await sensor.close();
  process.exit(0);
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
