import { describe, it, expect, beforeEach } from 'vitest';
import { SoundscapeEngine } from '../../src/services/audio/soundscapeEngine';

describe('Phase 69: Ambient Soundscape & Typewriter Audio Suite (soundscapeEngine)', () => {
  let engine: SoundscapeEngine;

  beforeEach(() => {
    engine = new SoundscapeEngine();
  });

  it('initializes with default soundscape tracks', () => {
    const tracks = engine.getTracks();
    expect(tracks.length).toBeGreaterThanOrEqual(6);

    const typewriter = engine.getTrack('typewriter');
    expect(typewriter).toBeDefined();
    expect(typewriter?.isEnabled).toBe(true);

    const rain = engine.getTrack('rain');
    expect(rain).toBeDefined();
    expect(rain?.isEnabled).toBe(false);
  });

  it('updates track volume and enforces 0.0 - 1.0 limits', () => {
    engine.setTrackVolume('rain', 0.85);
    expect(engine.getTrack('rain')?.volume).toBe(0.85);

    // Limit kontrolleri
    engine.setTrackVolume('rain', 1.5);
    expect(engine.getTrack('rain')?.volume).toBe(1);

    engine.setTrackVolume('rain', -0.5);
    expect(engine.getTrack('rain')?.volume).toBe(0);
  });

  it('toggles track states on and off', () => {
    expect(engine.getTrack('fireplace')?.isEnabled).toBe(false);

    engine.toggleTrack('fireplace');
    expect(engine.getTrack('fireplace')?.isEnabled).toBe(true);

    engine.toggleTrack('fireplace', false);
    expect(engine.getTrack('fireplace')?.isEnabled).toBe(false);
  });

  it('manages master volume and mute controls', () => {
    engine.setMasterVolume(0.5);
    expect(engine.getMasterVolume()).toBe(0.5);

    expect(engine.isMuted()).toBe(false);
    engine.toggleMute();
    expect(engine.isMuted()).toBe(true);
    expect(engine.getActiveTrackCount()).toBe(0); // Sessizdeyken 0 döner
  });

  it('triggers typewriter sound clicks safely without throwing', () => {
    expect(() => {
      engine.playTypewriterClick('key');
      engine.playTypewriterClick('space');
      engine.playTypewriterClick('return');
    }).not.toThrow();
  });
});
