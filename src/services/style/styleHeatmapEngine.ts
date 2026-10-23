import { useSyncExternalStore } from 'react';

export type HeatmapSeverity = 'normal' | 'lengthy' | 'very_complex' | 'passive';

export interface HeatmapSentence {
  id: string;
  text: string;
  startIndex: number;
  endIndex: number;
  wordCount: number;
  level: HeatmapSeverity;
  reason: string;
}

export interface HeatmapThresholds {
  lengthyThreshold: number; // default 22 words (yellow)
  veryComplexThreshold: number; // default 32 words (red)
  detectPassive: boolean; // default true (purple)
  enabled: boolean;
}

export interface HeatmapAnalysisResult {
  sentences: HeatmapSentence[];
  totalSentences: number;
  lengthyCount: number;
  veryComplexCount: number;
  passiveCount: number;
  averageSentenceLength: number;
  readabilityScore: number; // 0 - 100
}

export const DEFAULT_THRESHOLDS: HeatmapThresholds = {
  lengthyThreshold: 22,
  veryComplexThreshold: 32,
  detectPassive: true,
  enabled: true
};

export class StyleHeatmapEngine {
  private thresholds: HeatmapThresholds = { ...DEFAULT_THRESHOLDS };
  private cachedSnapshot: HeatmapThresholds;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.cachedSnapshot = { ...this.thresholds };
  }

  private notify() {
    this.cachedSnapshot = { ...this.thresholds };
    this.listeners.forEach((l) => l());
  }

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  public getSnapshot = (): HeatmapThresholds => {
    return this.cachedSnapshot;
  };

  public setThresholds(partial: Partial<HeatmapThresholds>) {
    this.thresholds = { ...this.thresholds, ...partial };
    this.notify();
  }

  public resetThresholds() {
    this.thresholds = { ...DEFAULT_THRESHOLDS };
    this.notify();
  }

  /**
   * Detects whether a sentence contains common Turkish passive voice verb patterns
   * e.g. "yapıldı", "söylendi", "alındı", "verildi", "belirtilmiştir", "gözlemlendi"
   */
  public isPassiveVoice(sentence: string): boolean {
    // Matches common passive verbs with -il / -in stems, avoiding adjective false positives like "serindi"
    const passiveRegex = /(?<![\p{L}\p{N}_])(?:[\p{L}]*(?:yazıl|yapıl|alın|veril|seçil|açıl|kapatıl|söylen|belirtil|gözlemlen|kararlaştırıl|anlatıl|aktarıl|edil|çekil|atıl|bırakıl)(?:d[ıiuü]|m[ıiuü]ş|iyor|ir|mekt[ea]d[ıiuü]r|ec[ea]k)?)(?![\p{L}\p{N}_])/iu;
    return passiveRegex.test(sentence);
  }

  /**
   * Splits prose into sentences preserving index offsets.
   */
  public analyze(
    text: string,
    customThresholds?: Partial<HeatmapThresholds>
  ): HeatmapAnalysisResult {
    const config = { ...this.thresholds, ...customThresholds };
    if (!config.enabled || !text.trim()) {
      return {
        sentences: [],
        totalSentences: 0,
        lengthyCount: 0,
        veryComplexCount: 0,
        passiveCount: 0,
        averageSentenceLength: 0,
        readabilityScore: 100
      };
    }

    const sentences: HeatmapSentence[] = [];
    // Sentence boundary regex matching [.?!] followed by space or end
    const sentenceRegex = /[^.?!]+(?:[.?!]+["'”]?|$)/gu;

    let match: RegExpExecArray | null;
    let lengthyCount = 0;
    let veryComplexCount = 0;
    let passiveCount = 0;
    let totalWords = 0;

    let sentenceIdx = 0;
    while ((match = sentenceRegex.exec(text)) !== null) {
      const sentenceText = match[0];
      const trimmed = sentenceText.trim();
      if (!trimmed) continue;

      const startIndex = match.index;
      const endIndex = startIndex + sentenceText.length;
      const words = trimmed.split(/\s+/).filter(Boolean);
      const wordCount = words.length;
      totalWords += wordCount;

      let level: HeatmapSeverity = 'normal';
      let reason = 'Akıcı ve sade cümle.';

      if (wordCount >= config.veryComplexThreshold) {
        level = 'very_complex';
        reason = `Aşırı karmaşık ve uzun cümle (${wordCount} kelime). Cümleyi ikiye bölmeyi düşünün.`;
        veryComplexCount++;
      } else if (wordCount >= config.lengthyThreshold) {
        level = 'lengthy';
        reason = `Uzun cümle (${wordCount} kelime). Akıcılığı artırmak için kısaltılabilir.`;
        lengthyCount++;
      } else if (config.detectPassive && this.isPassiveVoice(trimmed)) {
        level = 'passive';
        reason = 'Edilgen (pasif) yapı tespit edildi. Etken fiil kullanımı anlatımı güçlendirecektir.';
        passiveCount++;
      }

      sentences.push({
        id: `sent_${sentenceIdx++}`,
        text: sentenceText,
        startIndex,
        endIndex,
        wordCount,
        level,
        reason
      });
    }

    const totalSentences = sentences.length;
    const avgLength = totalSentences > 0 ? Math.round(totalWords / totalSentences) : 0;

    // Score deduction
    let penalty = lengthyCount * 3 + veryComplexCount * 7 + passiveCount * 2;
    let readabilityScore = Math.max(10, Math.min(100, 100 - penalty));

    return {
      sentences,
      totalSentences,
      lengthyCount,
      veryComplexCount,
      passiveCount,
      averageSentenceLength: avgLength,
      readabilityScore
    };
  }

  public getHighlightClass(level: HeatmapSeverity): string {
    switch (level) {
      case 'very_complex':
        return 'bg-red-200/60 dark:bg-red-950/50 text-red-900 dark:text-red-200 rounded px-1 decoration-red-500';
      case 'lengthy':
        return 'bg-amber-200/60 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 rounded px-1 decoration-amber-500';
      case 'passive':
        return 'bg-purple-200/60 dark:bg-purple-950/50 text-purple-900 dark:text-purple-200 rounded px-1 decoration-purple-500';
      case 'normal':
      default:
        return '';
    }
  }
}

export const styleHeatmapEngine = new StyleHeatmapEngine();

export function useStyleHeatmapStore() {
  const thresholds = useSyncExternalStore(
    styleHeatmapEngine.subscribe,
    styleHeatmapEngine.getSnapshot,
    styleHeatmapEngine.getSnapshot
  );

  return {
    thresholds,
    setThresholds: styleHeatmapEngine.setThresholds.bind(styleHeatmapEngine),
    resetThresholds: styleHeatmapEngine.resetThresholds.bind(styleHeatmapEngine),
    analyze: styleHeatmapEngine.analyze.bind(styleHeatmapEngine),
    getHighlightClass: styleHeatmapEngine.getHighlightClass.bind(styleHeatmapEngine)
  };
}

useStyleHeatmapStore.getState = () => ({
  thresholds: styleHeatmapEngine.getSnapshot(),
  setThresholds: styleHeatmapEngine.setThresholds.bind(styleHeatmapEngine),
  resetThresholds: styleHeatmapEngine.resetThresholds.bind(styleHeatmapEngine),
  analyze: styleHeatmapEngine.analyze.bind(styleHeatmapEngine)
});
