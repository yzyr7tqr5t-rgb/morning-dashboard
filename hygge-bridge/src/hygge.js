// Houdt bij in welke stand de Hygge gezet is en stuurt opdrachten via Seitron/IFTTT.
// Opdrachten gaan één voor één de deur uit, in de volgorde waarin ze gegeven zijn.
//
// Standen:
//  - null     : nog niets verstuurd sinds de eerste start
//  - 'manual' : Hygge staat manueel op `setpoint`
//  - 'auto'   : Hygge volgt zijn eigen weekprogramma
//
// `changes` is het logboek van gelukte opdrachten voor de grafiek:
// [tijdstip, setpoint] met setpoint null voor het weekprogramma.

const KEEP_MS = 24 * 60 * 60_000;

export class HyggeControl {
  constructor(seitron, { min, max, defaultSetpoint }, saved = {}) {
    this.seitron = seitron;
    this.bounds = { min, max };
    this.setpoint = this.clamp(typeof saved.setpoint === 'number' ? saved.setpoint : defaultSetpoint);
    this.mode = saved.mode === 'manual' || saved.mode === 'auto' ? saved.mode : null;
    this.last = null; // { at, mode, setpoint?, ok, error? }
    this.changes = Array.isArray(saved.changes) ? saved.changes.filter(validChange) : [];
    this.queue = Promise.resolve();
  }

  clamp(value) {
    return Math.min(this.bounds.max, Math.max(this.bounds.min, Math.round(value * 2) / 2));
  }

  /** Hygge manueel op een temperatuur zetten. */
  setTemperature(value) {
    const setpoint = this.clamp(value);
    this.setpoint = setpoint;
    this.mode = 'manual';
    return this.send({ mode: 'manual', setpoint }, () => this.seitron.setTemperature(setpoint));
  }

  /** Weekprogramma aan (true) of terug naar de laatst gekozen temperatuur (false). */
  setSchedule(on) {
    if (on) {
      this.mode = 'auto';
      return this.send({ mode: 'auto' }, () => this.seitron.scheduledMode());
    }
    return this.setTemperature(this.setpoint);
  }

  send(command, action) {
    const run = async () => {
      try {
        await action();
        this.last = { at: Date.now(), ...command, ok: true };
        this.recordChange(this.last);
      } catch (err) {
        this.last = { at: Date.now(), ...command, ok: false, error: err.message };
      }
      return this.last;
    };
    this.queue = this.queue.then(run);
    return this.queue;
  }

  recordChange({ at, mode, setpoint }) {
    this.changes.push([at, mode === 'auto' ? null : setpoint]);
    // Alles van de laatste 24 u bewaren, plus de laatste wijziging daarvoor (de stand bij het begin).
    const cutoff = at - KEEP_MS;
    while (this.changes.length > 1 && this.changes[1][0] <= cutoff) this.changes.shift();
  }

  toJSON() {
    return { mode: this.mode, setpoint: this.setpoint, bounds: this.bounds, last: this.last, changes: this.changes };
  }

  /** Wat er bewaard wordt in state.json. */
  saved() {
    return { mode: this.mode, setpoint: this.setpoint, changes: this.changes };
  }
}

function validChange(c) {
  return Array.isArray(c) && typeof c[0] === 'number' && (c[1] === null || typeof c[1] === 'number');
}
