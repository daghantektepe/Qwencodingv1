/**
 * soundscapeEngine.ts — Faz 69: Daktilo ve Ortam Sesleri Ses Motoru
 */

export type SoundscapeTrackId = 'rain' | 'fireplace' | 'library' | 'cafe' | 'white_noise' | 'typewriter';

export interface SoundscapeTrack {
  id: SoundscapeTrackId;
  name: string;
  icon: string;
  volume: number; // 0.0 - 1.0
  isEnabled: boolean;
}

export class SoundscapeEngine {
  private masterVolume: number = 0.8;
  private muted: boolean = false;
  private tracks: Map<SoundscapeTrackId, SoundscapeTrack> = new Map([
    ['rain', { id: 'rain', name: 'Yağmur Sesi', icon: '🌧️', volume: 0.5, isEnabled: false }],
    ['fireplace', { id: 'fireplace', name: 'Şömine Ateşi', icon: '🔥', volume: 0.4, isEnabled: false }],
    ['library', { id: 'library', name: 'Kütüphane Fısıltısı', icon: '📚', volume: 0.3, isEnabled: false }],
    ['cafe', { id: 'cafe', name: 'Kahve Dükkanı Uğultusu', icon: '☕', volume: 0.4, isEnabled: false }],
    ['white_noise', { id: 'white_noise', name: 'Beyaz Gürültü', icon: '📻', volume: 0.2, isEnabled: false }],
    ['typewriter', { id: 'typewriter', name: 'Mekanik Daktilo Tuşları', icon: '⌨️', volume: 0.6, isEnabled: true }],
  ]);

  private audioCtx: any = null;
  private listeners = new Set<() => void>();

  constructor() {
    // Lazy AudioContext initialization
  }

  private getAudioContext(): any {
    if (typeof window !== 'undefined' && !this.audioCtx) {
      const AudioCtxClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    return this.audioCtx;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  public getTracks(): SoundscapeTrack[] {
    return Array.from(this.tracks.values());
  }

  public getTrack(id: SoundscapeTrackId): SoundscapeTrack | undefined {
    return this.tracks.get(id);
  }

  public setTrackVolume(id: SoundscapeTrackId, volume: number): void {
    const t = this.tracks.get(id);
    if (!t) return;
    t.volume = Math.max(0, Math.min(1, Math.round(volume * 100) / 100));
    this.notify();
  }

  public toggleTrack(id: SoundscapeTrackId, enabled?: boolean): void {
    const t = this.tracks.get(id);
    if (!t) return;
    t.isEnabled = enabled !== undefined ? enabled : !t.isEnabled;
    this.notify();
  }

  public setMasterVolume(vol: number): void {
    this.masterVolume = Math.max(0, Math.min(1, Math.round(vol * 100) / 100));
    this.notify();
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public toggleMute(): void {
    this.muted = !this.muted;
    this.notify();
  }

  public isMuted(): boolean {
    return this.muted;
  }

  /**
   * Daktilo tuş vuruşu sentetik ses simülatörü
   */
  public playTypewriterClick(type: 'key' | 'return' | 'space' = 'key'): void {
    const twTrack = this.tracks.get('typewriter');
    if (this.muted || !twTrack || !twTrack.isEnabled) return;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const effectiveVolume = twTrack.volume * this.masterVolume * 0.2;
      const now = ctx.currentTime;

      if (type === 'return') {
        // Carriage return zili (Ding!)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1760, now); // A6
        gain.gain.setValueAtTime(effectiveVolume * 1.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.6);
      } else {
        // Mekanik vuruş sesi (Click-clack)
        osc.type = 'triangle';
        const freq = type === 'space' ? 320 : 500 + Math.random() * 200;
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(effectiveVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    } catch (e) {
      // Ses engellendiğinde güvenle yoksay
    }
  }

  public getActiveTrackCount(): number {
    if (this.muted) return 0;
    return Array.from(this.tracks.values()).filter((t) => t.isEnabled).length;
  }
}

export const soundscapeEngine = new SoundscapeEngine();
export default soundscapeEngine;
