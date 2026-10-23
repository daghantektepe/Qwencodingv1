/**
 * timeTravelReplay.ts — Faz 73: Zaman Yolculuğu ve Yazım Geçmişi Oynatıcı
 */

import { JournalEntry } from './journalLogger';

export class TimeTravelReplay {
  private entries: JournalEntry[] = [];
  private currentStepIndex: number = 0;
  private playbackInterval: any = null;
  private listeners = new Set<() => void>();

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  public loadEntries(entries: JournalEntry[]): void {
    this.pause();
    this.entries = [...entries];
    this.currentStepIndex = Math.max(0, this.entries.length - 1);
    this.notify();
  }

  public getTotalSteps(): number {
    return this.entries.length;
  }

  public getCurrentStep(): number {
    return this.currentStepIndex;
  }

  public getCurrentEntry(): JournalEntry | null {
    if (this.entries.length === 0) return null;
    return this.entries[this.currentStepIndex] || null;
  }

  public goToStep(index: number): JournalEntry | null {
    if (this.entries.length === 0) return null;
    const clamped = Math.max(0, Math.min(this.entries.length - 1, index));
    this.currentStepIndex = clamped;
    this.notify();
    return this.entries[clamped];
  }

  public nextStep(): JournalEntry | null {
    return this.goToStep(this.currentStepIndex + 1);
  }

  public prevStep(): JournalEntry | null {
    return this.goToStep(this.currentStepIndex - 1);
  }

  public play(speedMs: number = 400, onStep?: (entry: JournalEntry) => void): void {
    this.pause();

    // Sona gelindiyse baştan başlat
    if (this.currentStepIndex >= this.entries.length - 1) {
      this.currentStepIndex = 0;
    }

    this.playbackInterval = setInterval(() => {
      if (this.currentStepIndex < this.entries.length - 1) {
        this.currentStepIndex++;
        const entry = this.entries[this.currentStepIndex];
        onStep?.(entry);
        this.notify();
      } else {
        this.pause();
      }
    }, speedMs);

    this.notify();
  }

  public pause(): void {
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
      this.notify();
    }
  }

  public isPlaying(): boolean {
    return this.playbackInterval !== null;
  }

  public getProgressPercentage(): number {
    if (this.entries.length <= 1) return 100;
    return Math.round((this.currentStepIndex / (this.entries.length - 1)) * 100);
  }
}

export const timeTravelReplay = new TimeTravelReplay();
export default timeTravelReplay;
