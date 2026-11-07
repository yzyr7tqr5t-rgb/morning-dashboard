// Leest en valideert de configuratie uit omgevingsvariabelen.

function num(env, key, fallback) {
  const raw = env[key];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(String(raw).replace(',', '.'));
  if (!Number.isFinite(value)) throw new Error(`${key} moet een getal zijn (kreeg "${raw}")`);
  return value;
}

function required(env, key) {
  const value = env[key];
  if (!value) throw new Error(`${key} ontbreekt in .env`);
  return value;
}

function bool(env, key) {
  return String(env[key] ?? '').toLowerCase() === 'true';
}

export function loadConfig(env = process.env, { needSeitron = true } = {}) {
  // DEMO: gesimuleerde sensor, er wordt niets naar Niko of Seitron gestuurd.
  const demo = bool(env, 'DEMO');
  const dryRun = demo || bool(env, 'DRY_RUN');
  const needNiko = !demo;

  const config = {
    niko: {
      host: needNiko ? required(env, 'NIKO_HOST') : env.NIKO_HOST || '',
      port: num(env, 'NIKO_PORT', 8884),
      username: env.NIKO_USERNAME || 'hobby',
      token: needNiko ? required(env, 'NIKO_TOKEN') : env.NIKO_TOKEN || '',
      sensorName: env.NIKO_SENSOR_NAME || '',
      sensorUuid: env.NIKO_SENSOR_UUID || '',
      caFile: env.NIKO_CA_FILE || new URL('../certs/niko_ca.pem', import.meta.url),
    },
    seitron: {
      iftttKey: needSeitron && !dryRun ? required(env, 'IFTTT_KEY') : env.IFTTT_KEY || '',
      eventSetTemperature: env.IFTTT_EVENT_SET_TEMPERATURE || 'hygge_set_temperature',
      eventAuto: env.IFTTT_EVENT_AUTO || 'hygge_auto',
    },
    control: {
      targetTemp: num(env, 'TARGET_TEMP', 21),
      hysteresis: num(env, 'HYSTERESIS', 0.3),
      heatSetpoint: num(env, 'HEAT_SETPOINT', 25),
      idleSetpoint: num(env, 'IDLE_SETPOINT', 12),
      minSwitchIntervalMs: num(env, 'MIN_SWITCH_INTERVAL_MIN', demo ? 1 : 10) * 60_000,
      staleAfterMs: num(env, 'STALE_AFTER_MIN', 30) * 60_000,
      resendAfterMs: num(env, 'RESEND_AFTER_MIN', 60) * 60_000,
    },
    web: {
      port: num(env, 'WEB_PORT', 8080),
      host: env.WEB_HOST || '0.0.0.0',
    },
    stateFile: env.STATE_FILE || new URL('../state.json', import.meta.url),
    dryRun,
    demo,
  };

  if (needSeitron && needNiko && !config.niko.sensorName && !config.niko.sensorUuid) {
    throw new Error('Geef NIKO_SENSOR_NAME of NIKO_SENSOR_UUID op');
  }
  const c = config.control;
  if (c.hysteresis < 0) throw new Error('HYSTERESIS mag niet negatief zijn');
  if (c.heatSetpoint <= c.targetTemp + c.hysteresis) {
    throw new Error('HEAT_SETPOINT moet duidelijk hoger liggen dan TARGET_TEMP + HYSTERESIS');
  }
  if (c.idleSetpoint >= c.targetTemp - c.hysteresis) {
    throw new Error('IDLE_SETPOINT moet duidelijk lager liggen dan TARGET_TEMP - HYSTERESIS');
  }
  return config;
}

/** Grenzen waarbinnen de doeltemperatuur via de webpagina mag bewegen. */
export function targetBounds({ heatSetpoint, idleSetpoint, hysteresis }) {
  return {
    min: Math.ceil((idleSetpoint + hysteresis + 0.5) * 2) / 2,
    max: Math.floor((heatSetpoint - hysteresis - 0.5) * 2) / 2,
  };
}
