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
  // DEMO: gesimuleerde Niko-sensor, er wordt niets naar Seitron gestuurd.
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
    hygge: {
      defaultSetpoint: num(env, 'DEFAULT_SETPOINT', 20),
      min: num(env, 'MIN_SETPOINT', 10),
      max: num(env, 'MAX_SETPOINT', 28),
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
  const h = config.hygge;
  if (h.min >= h.max) throw new Error('MIN_SETPOINT moet lager zijn dan MAX_SETPOINT');
  if (h.defaultSetpoint < h.min || h.defaultSetpoint > h.max) {
    throw new Error('DEFAULT_SETPOINT moet tussen MIN_SETPOINT en MAX_SETPOINT liggen');
  }
  return config;
}
