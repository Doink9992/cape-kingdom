// Small synthesized sound-effect engine (Web Audio API). No external audio
// files are used, so every sound here is generated at runtime.
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicGain = null;
    this.musicNodes = [];
    this.musicTimer = null;
  }

  _ensureCtx() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.12;
      this.musicGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  unlock() {
    this._ensureCtx();
  }

  setMuted(m) {
    this.muted = m;
  }

  _tone(freq, dur, type = 'square', gainVal = 0.18, delay = 0, slideTo = null) {
    if (this.muted) return;
    const ctx = this._ensureCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    const t0 = ctx.currentTime + delay;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
    gain.gain.setValueAtTime(gainVal, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  jump() { this._tone(420, 0.18, 'square', 0.15, 0, 700); }
  bigJump() { this._tone(300, 0.28, 'square', 0.16, 0, 620); }
  stomp() { this._tone(180, 0.12, 'square', 0.2, 0, 90); }
  kick() { this._tone(220, 0.1, 'square', 0.2, 0, 500); }
  coin() { this._tone(988, 0.09, 'square', 0.18); this._tone(1318, 0.18, 'square', 0.16, 0.08); }
  powerup() {
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((f, i) => this._tone(f, 0.12, 'square', 0.15, i * 0.07));
  }
  powerdown() { this._tone(300, 0.4, 'sawtooth', 0.15, 0, 80); }
  breakBlock() { this._tone(140, 0.15, 'square', 0.2, 0, 60); }
  bump() { this._tone(220, 0.08, 'square', 0.18, 0, 180); }
  die() {
    this._tone(400, 0.15, 'square', 0.2, 0, 620);
    this._tone(300, 0.4, 'square', 0.18, 0.18, 60);
  }
  flagpole() {
    const notes = [392, 440, 494, 523, 587, 659, 698, 784];
    notes.forEach((f, i) => this._tone(f, 0.1, 'square', 0.14, i * 0.05));
  }
  oneUp() {
    const notes = [659, 784, 988, 1319, 1568];
    notes.forEach((f, i) => this._tone(f, 0.1, 'triangle', 0.15, i * 0.06));
  }
  fireball() { this._tone(600, 0.08, 'sawtooth', 0.12, 0, 300); }
  pause() { this._tone(500, 0.06, 'square', 0.1); this._tone(700, 0.06, 'square', 0.1, 0.07); }
  select() { this._tone(600, 0.05, 'square', 0.12); }
  star() { this._tone(880, 0.06, 'triangle', 0.1); }
  switchPress() { this._tone(220, 0.1, 'square', 0.18); this._tone(440, 0.15, 'square', 0.15, 0.1); }

  startMusic(theme = 'overworld') {
    this.stopMusic();
    if (this.muted) return;
    const ctx = this._ensureCtx();
    const patterns = {
      overworld: [523, 523, 0, 523, 0, 415, 523, 0, 659, 0, 0, 0, 311, 0, 0, 0],
      castle: [220, 0, 220, 0, 233, 0, 220, 0, 196, 0, 220, 0, 174, 0, 0, 0],
      map: [392, 0, 440, 0, 494, 0, 440, 0, 392, 0, 349, 0, 392, 0, 0, 0],
    };
    const seq = patterns[theme] || patterns.overworld;
    let step = 0;
    const playStep = () => {
      if (this.muted) return;
      const f = seq[step % seq.length];
      if (f) this._tone(f, 0.14, 'triangle', 0.1);
      step++;
    };
    this.musicTimer = setInterval(playStep, 180);
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const Sound = new SoundEngine();
