export interface SoundEngine {
  init(): void;
  setEnabled(state: boolean): void;
  isEnabled(): boolean;
  toggle(): boolean;
  playKey(): void;
  playReturn(): void;
  playDelete(): void;
}

export declare const soundEngine: SoundEngine;
