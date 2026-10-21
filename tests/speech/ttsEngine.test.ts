import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TtsEngine } from '../../src/services/speech/ttsEngine';

describe('Phase 57: Text-to-Speech Proofreading Studio (ttsEngine)', () => {
  let engine: TtsEngine;

  beforeEach(() => {
    engine = new TtsEngine();
  });

  it('splits multiline and punctuated text into clean sentences', () => {
    const text = 'Bu birinci cümleydi. İkinci cümle çok heyecanlıydı! Peki ya üçüncüsü? Evet, bitti.';
    const sentences = engine.loadText(text);

    expect(sentences).toHaveLength(4);
    expect(sentences[0].text).toBe('Bu birinci cümleydi.');
    expect(sentences[1].text).toBe('İkinci cümle çok heyecanlıydı!');
    expect(sentences[2].text).toBe('Peki ya üçüncüsü?');
    expect(sentences[3].text).toBe('Evet, bitti.');
  });

  it('handles empty or whitespace text gracefully', () => {
    const sentences = engine.loadText('   ');
    expect(sentences).toHaveLength(0);
    expect(engine.getState().currentSentence).toBeNull();
  });

  it('manages playback states (play, pause, resume, stop)', () => {
    engine.loadText('İlk cümle. İkinci cümle.');

    engine.play();
    let state = engine.getState();
    expect(state.isPlaying).toBe(true);
    expect(state.isPaused).toBe(false);

    engine.pause();
    state = engine.getState();
    expect(state.isPlaying).toBe(true);
    expect(state.isPaused).toBe(true);

    engine.resume();
    state = engine.getState();
    expect(state.isPaused).toBe(false);

    engine.stop();
    state = engine.getState();
    expect(state.isPlaying).toBe(false);
    expect(state.isPaused).toBe(false);
    expect(state.currentSentence).toBeNull();
  });

  it('navigates through sentences with next, prev, and seek', () => {
    engine.loadText('Cümle bir. Cümle iki. Cümle üç.');

    expect(engine.getState().currentSentenceIndex).toBe(0);

    engine.nextSentence();
    expect(engine.getState().currentSentenceIndex).toBe(1);

    engine.nextSentence();
    expect(engine.getState().currentSentenceIndex).toBe(2);

    // Sınırı aşmamalı
    engine.nextSentence();
    expect(engine.getState().currentSentenceIndex).toBe(2);

    engine.previousSentence();
    expect(engine.getState().currentSentenceIndex).toBe(1);

    engine.seekSentence(0);
    expect(engine.getState().currentSentenceIndex).toBe(0);

    // Geçersiz seek indeksi mevcut index'i bozmamalı
    engine.seekSentence(99);
    expect(engine.getState().currentSentenceIndex).toBe(0);
  });

  it('updates rate and pitch within acceptable boundaries', () => {
    engine.setRate(1.5);
    expect(engine.getState().rate).toBe(1.5);

    // Limit kontrolü (0.5 - 2.5)
    engine.setRate(10.0);
    expect(engine.getState().rate).toBe(2.5);

    engine.setRate(0.1);
    expect(engine.getState().rate).toBe(0.5);

    engine.setPitch(1.2);
    expect(engine.getState().pitch).toBe(1.2);
  });

  it('returns available voice profiles (fallback or native)', () => {
    const voices = engine.getAvailableVoices();
    expect(voices.length).toBeGreaterThan(0);
    expect(voices[0]).toHaveProperty('name');
    expect(voices[0]).toHaveProperty('lang');
  });

  it('notifies listeners when sentence changes', () => {
    const sentenceListener = vi.fn();
    const unsub = engine.onSentenceChange(sentenceListener);

    engine.loadText('Örnek bir cümle. İkinci bir cümle.');
    engine.seekSentence(1);

    expect(sentenceListener).toHaveBeenCalled();
    unsub();
  });
});
