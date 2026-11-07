// Gesimuleerde Niko-temperatuursensor voor DEMO=true: zelfde events als NikoClient.

import { EventEmitter } from 'node:events';

export class DemoSensor extends EventEmitter {
  constructor({ start = 20.4, intervalMs = 10_000 } = {}) {
    super();
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
    // Rustig schommelen rond 20,5 °C
    const pull = (20.5 - this.temperature) * 0.05;
    this.temperature = Math.round((this.temperature + pull + (Math.random() - 0.5) * 0.1) * 100) / 100;
    this.emit('temperature', this.temperature, { Name: 'Woonkamer (demo)' });
  }

  close() {
    clearInterval(this.timer);
    return Promise.resolve();
  }
}
