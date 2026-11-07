// Gesimuleerde temperatuursensor voor DEMO=true: zelfde events als NikoClient.
// De kamer warmt op zolang de "ketel" brandt en koelt af als hij uit staat.

import { EventEmitter } from 'node:events';

export class DemoSensor extends EventEmitter {
  constructor({ getMode, start = 19.2, intervalMs = 5_000 }) {
    super();
    this.getMode = getMode;
    this.temperature = start;
    this.intervalMs = intervalMs;
    this.timer = null;
  }

  connect() {
    setTimeout(() => {
      this.emit('connect');
      this.tick();
    }, 200);
    this.timer = setInterval(() => this.tick(), this.intervalMs);
    return this;
  }

  tick() {
    const heating = this.getMode() === 'heat';
    const drift = heating ? 0.08 : -0.04;
    const noise = (Math.random() - 0.5) * 0.02;
    this.temperature = Math.round((this.temperature + drift + noise) * 100) / 100;
    this.emit('temperature', this.temperature, { Name: 'Woonkamer (demo)' });
  }

  close() {
    clearInterval(this.timer);
    return Promise.resolve();
  }
}
