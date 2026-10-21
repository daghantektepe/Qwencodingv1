/**
 * useProofreadingSpeech.ts — Faz 57: Sesli Okuma ve Metin-Konuşma Hook'u
 */

import { useState, useEffect, useCallback } from 'react';
import { ttsEngine, TtsPlaybackState, TtsSentence } from '../services/speech/ttsEngine';

export interface UseProofreadingSpeechOptions {
  autoScroll?: boolean;
  enableShortcuts?: boolean;
}

export function useProofreadingSpeech(initialText: string = '', options: UseProofreadingSpeechOptions = {}) {
  const [playbackState, setPlaybackState] = useState<TtsPlaybackState>(ttsEngine.getState());
  const [currentSentence, setCurrentSentence] = useState<TtsSentence | null>(null);

  useEffect(() => {
    if (initialText) {
      ttsEngine.loadText(initialText);
    }
  }, [initialText]);

  useEffect(() => {
    const unsubState = ttsEngine.subscribe(setPlaybackState);
    const unsubSentence = ttsEngine.onSentenceChange(setCurrentSentence);

    return () => {
      unsubState();
      unsubSentence();
    };
  }, []);

  // Klavye kısayolları (Ctrl+Alt+Space: Play/Pause, Ctrl+Alt+Right: Next, Ctrl+Alt+Left: Prev)
  useEffect(() => {
    if (options.enableShortcuts === false) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey) {
        if (e.code === 'Space') {
          e.preventDefault();
          if (playbackState.isPlaying && !playbackState.isPaused) {
            ttsEngine.pause();
          } else {
            ttsEngine.play();
          }
        } else if (e.code === 'ArrowRight') {
          e.preventDefault();
          ttsEngine.nextSentence();
        } else if (e.code === 'ArrowLeft') {
          e.preventDefault();
          ttsEngine.previousSentence();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playbackState.isPlaying, playbackState.isPaused, options.enableShortcuts]);

  const play = useCallback(() => ttsEngine.play(), []);
  const pause = useCallback(() => ttsEngine.pause(), []);
  const stop = useCallback(() => ttsEngine.stop(), []);
  const nextSentence = useCallback(() => ttsEngine.nextSentence(), []);
  const previousSentence = useCallback(() => ttsEngine.previousSentence(), []);
  const seekSentence = useCallback((idx: number) => ttsEngine.seekSentence(idx), []);
  const setRate = useCallback((rate: number) => ttsEngine.setRate(rate), []);
  const setPitch = useCallback((pitch: number) => ttsEngine.setPitch(pitch), []);
  const setVoice = useCallback((uri: string) => ttsEngine.setVoice(uri), []);
  const loadText = useCallback((text: string) => ttsEngine.loadText(text), []);

  return {
    ...playbackState,
    currentSentence,
    sentences: ttsEngine.getSentences(),
    play,
    pause,
    stop,
    nextSentence,
    previousSentence,
    seekSentence,
    setRate,
    setPitch,
    setVoice,
    loadText,
    availableVoices: ttsEngine.getAvailableVoices(),
  };
}
