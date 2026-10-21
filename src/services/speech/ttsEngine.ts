/**
 * ttsEngine.ts — Faz 57: Çok Kanallı Sesli Okuma ve Metin-Konuşma Prova Motoru
 */

export interface TtsSentence {
  index: number;
  text: string;
  charOffset: number;
  length: number;
}

export interface TtsVoiceProfile {
  id: string;
  name: string;
  lang: string;
  pitch: number;
  rate: number;
  characterId?: string;
}

export interface TtsPlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  currentSentenceIndex: number;
  currentSentence: TtsSentence | null;
  rate: number;
  pitch: number;
  voiceUri: string | null;
}

export class TtsEngine {
  private sentences: TtsSentence[] = [];
  private currentIndex: number = 0;
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private rate: number = 1.0;
  private pitch: number = 1.0;
  private voiceUri: string | null = null;
  private utterance: any = null;

  private stateListeners = new Set<(state: TtsPlaybackState) => void>();
  private sentenceListeners = new Set<(sentence: TtsSentence | null) => void>();

  constructor() {
    this.initVoices();
  }

  private initVoices(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.notifyState();
        };
      }
    }
  }

  public getAvailableVoices(): Array<{ name: string; lang: string; voiceURI: string }> {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        return voices.map((v) => ({ name: v.name, lang: v.lang, voiceURI: v.voiceURI }));
      }
    }
    // Fallback varsayılan ses profilleri
    return [
      { name: 'Turkish Female (Local)', lang: 'tr-TR', voiceURI: 'local-tr-f' },
      { name: 'Turkish Male (Local)', lang: 'tr-TR', voiceURI: 'local-tr-m' },
      { name: 'English Natural (Local)', lang: 'en-US', voiceURI: 'local-en' },
    ];
  }

  public loadText(text: string): TtsSentence[] {
    this.stop();
    if (!text || text.trim().length === 0) {
      this.sentences = [];
      this.currentIndex = 0;
      this.notifyState();
      return [];
    }

    // Cümle ayrıştırıcı (., !, ? veya satır sonları)
    const regex = /[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g;
    const matches: TtsSentence[] = [];
    let match: RegExpExecArray | null;
    let idx = 0;

    while ((match = regex.exec(text)) !== null) {
      const sentenceText = match[0].trim();
      if (sentenceText.length > 0) {
        matches.push({
          index: idx++,
          text: sentenceText,
          charOffset: match.index,
          length: match[0].length,
        });
      }
    }

    this.sentences = matches;
    this.currentIndex = 0;
    this.notifyState();
    return this.sentences;
  }

  public getSentences(): TtsSentence[] {
    return this.sentences;
  }

  public play(): void {
    if (this.sentences.length === 0) return;

    if (this.isPaused) {
      this.resume();
      return;
    }

    this.isPlaying = true;
    this.isPaused = false;
    this.speakCurrentSentence();
  }

  private speakCurrentSentence(): void {
    if (this.currentIndex >= this.sentences.length) {
      this.stop();
      return;
    }

    const current = this.sentences[this.currentIndex];
    this.notifySentence(current);
    this.notifyState();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(current.text);
      utterance.rate = this.rate;
      utterance.pitch = this.pitch;

      if (this.voiceUri) {
        const voices = window.speechSynthesis.getVoices();
        const selected = voices.find((v) => v.voiceURI === this.voiceUri);
        if (selected) utterance.voice = selected;
      }

      utterance.onend = () => {
        if (this.isPlaying && !this.isPaused) {
          this.currentIndex++;
          this.speakCurrentSentence();
        }
      };

      utterance.onerror = (e) => {
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('[TtsEngine] Speech synthesis error:', e);
        }
      };

      this.utterance = utterance;
      window.speechSynthesis.speak(utterance);
    } else {
      // Mock / Node.js çevresi: manuel ilerletme
      this.notifyState();
    }
  }

  public pause(): void {
    if (!this.isPlaying || this.isPaused) return;

    this.isPaused = true;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
    this.notifyState();
  }

  public resume(): void {
    if (!this.isPaused) return;

    this.isPaused = false;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
    this.notifyState();
  }

  public stop(): void {
    this.isPlaying = false;
    this.isPaused = false;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.notifySentence(null);
    this.notifyState();
  }

  public nextSentence(): void {
    if (this.currentIndex < this.sentences.length - 1) {
      this.currentIndex++;
      if (this.isPlaying) {
        this.speakCurrentSentence();
      } else {
        this.notifyState();
      }
    }
  }

  public previousSentence(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      if (this.isPlaying) {
        this.speakCurrentSentence();
      } else {
        this.notifyState();
      }
    }
  }

  public seekSentence(index: number): void {
    if (index >= 0 && index < this.sentences.length) {
      this.currentIndex = index;
      if (this.isPlaying) {
        this.speakCurrentSentence();
      } else {
        this.notifyState();
      }
    }
  }

  public setRate(rate: number): void {
    this.rate = Math.max(0.5, Math.min(2.5, rate));
    this.notifyState();
  }

  public setPitch(pitch: number): void {
    this.pitch = Math.max(0.5, Math.min(2.0, pitch));
    this.notifyState();
  }

  public setVoice(voiceUri: string): void {
    this.voiceUri = voiceUri;
    this.notifyState();
  }

  public getState(): TtsPlaybackState {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentSentenceIndex: this.currentIndex,
      currentSentence: (this.isPlaying || this.isPaused) ? (this.sentences[this.currentIndex] || null) : null,
      rate: this.rate,
      pitch: this.pitch,
      voiceUri: this.voiceUri,
    };
  }

  public subscribe(listener: (state: TtsPlaybackState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  public onSentenceChange(listener: (sentence: TtsSentence | null) => void): () => void {
    this.sentenceListeners.add(listener);
    return () => this.sentenceListeners.delete(listener);
  }

  private notifyState(): void {
    const state = this.getState();
    this.stateListeners.forEach((l) => l(state));
  }

  private notifySentence(sentence: TtsSentence | null): void {
    this.sentenceListeners.forEach((l) => l(sentence));
  }
}

export const ttsEngine = new TtsEngine();
export default ttsEngine;
