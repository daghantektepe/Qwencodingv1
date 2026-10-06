/**
 * OpenScriv — Web Audio API Tabanlı Daktilo ve Mikro Etkileşim Ses Motoru (Faz 30)
 *
 * Harici ses dosyalarına (.wav / .mp3) ihtiyaç duymadan saf Web Audio osilatör ve
 * gürültü sentezleyicisi kullanarak otantik mekanik tuş vuruşu, enter/satırbaşı ve
 * geri alma sesleri üretir.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.volume = 0.25;

    // LocalStorage'dan tercihi oku
    try {
      const saved = localStorage.getItem('openscriv_sound_enabled');
      if (saved !== null) {
        this.enabled = saved === 'true';
      }
    } catch {
      this.enabled = false;
    }
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setEnabled(state) {
    this.enabled = Boolean(state);
    try {
      localStorage.setItem('openscriv_sound_enabled', String(this.enabled));
    } catch {}
    if (this.enabled) {
      this.init();
      this.playKey();
    }
  }

  isEnabled() {
    return this.enabled;
  }

  toggle() {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  /**
   * Hafif mekanik tuş tıkırtısı (Keypress)
   */
  playKey() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Hafif organik perde varyasyonu
      const pitchVar = (Math.random() - 0.5) * 40;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320 + pitchVar, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.04);

      gain.gain.setValueAtTime(this.volume * 0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.045);
    } catch {}
  }

  /**
   * Enter / Paragraf başı (Zil / Tok mekanik vuruş)
   */
  playReturn() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, t);
      osc.frequency.exponentialRampToValueAtTime(350, t + 0.09);

      gain.gain.setValueAtTime(this.volume * 0.6, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.095);
    } catch {}
  }

  /**
   * Backspace / Silme sesi (Tok ahşap klik)
   */
  playDelete() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.035);

      gain.gain.setValueAtTime(this.volume * 0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.04);
    } catch {}
  }
}

export const soundEngine = new SoundEngine();
