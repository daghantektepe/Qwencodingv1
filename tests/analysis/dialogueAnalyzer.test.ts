import { describe, it, expect, beforeEach } from 'vitest';
import { DialogueAnalyzer } from '../../src/services/analysis/dialogueAnalyzer';

describe('Phase 60: Dialogue Tone & Voice Distinctiveness Analyzer (dialogueAnalyzer)', () => {
  let analyzer: DialogueAnalyzer;

  beforeEach(() => {
    analyzer = new DialogueAnalyzer();
  });

  it('detects tones accurately based on keywords and punctuation', () => {
    expect(analyzer.detectTone('Yeter artık, kes sesini nefret ediyorum!')).toBe('angry');
    expect(analyzer.detectTone('Harika bir gün, seni çok seviyorum.')).toBe('joyful');
    expect(analyzer.detectTone('Müteşekkirim efendim, elbette yerine getireceğiz.')).toBe('formal');
    expect(analyzer.detectTone('Bravo, gerçekten harikasın hah!')).toBe('sarcastic');
    expect(analyzer.detectTone('Saat üçte orada buluşuruz.')).toBe('neutral');
  });

  it('extracts quoted dialogue lines and character tags', () => {
    const text = `
      Sherlock piposunu yaktı. "Bu cinayet sıradan bir vaka değil dostum," dedi Sherlock.
      Watson hayretle baktı. "Peki delil nerede?" diye sordu Watson.
    `;

    const lines = analyzer.extractDialogueLines(text, ['Sherlock', 'Watson']);
    expect(lines).toHaveLength(2);
    expect(lines[0].characterName).toBe('Sherlock');
    expect(lines[0].text).toBe('Bu cinayet sıradan bir vaka değil dostum,');
    expect(lines[1].characterName).toBe('Watson');
    expect(lines[1].text).toBe('Peki delil nerede?');
  });

  it('analyzes document dialogue vs narrative ratio and character metrics', () => {
    const text = `
      Karanlık ve fırtınalı bir geceydi. Sokaklar bomboştu.
      "Defol git buradan!" diye bağırdı Arthur.
      "Asla olmaz, beni dinleyeceksin!" dedi Arthur.
    `;

    const result = analyzer.analyzeDocument(text, ['Arthur']);

    expect(result.totalWords).toBeGreaterThan(0);
    expect(result.dialogueWords).toBeGreaterThan(0);
    expect(result.narrativeWords).toBeGreaterThan(0);
    expect(result.dialogueRatio).toBeGreaterThan(0);
    expect(result.dialogueRatio).toBeLessThanOrEqual(1);

    expect(result.characterMetrics).toHaveLength(1);
    const arthur = result.characterMetrics[0];
    expect(arthur.characterName).toBe('Arthur');
    expect(arthur.totalLines).toBe(2);
    expect(arthur.dominantTone).toBe('angry');
    expect(arthur.lexicalRichness).toBeGreaterThan(0);
  });

  it('computes distinctiveness similarity between distinct characters', () => {
    const text = `
      "Harika güzel mutlu bir gün!" dedi Alice.
      "Kes sesini nefret ediyorum defol!" diye bağırdı Bob.
    `;

    const result = analyzer.analyzeDocument(text, ['Alice', 'Bob']);
    expect(result.characterMetrics).toHaveLength(2);
    expect(result.similarityPairs).toHaveLength(1);

    const pair = result.similarityPairs[0];
    expect(pair.charA).toBe('Alice');
    expect(pair.charB).toBe('Bob');
    // Biri neşeli aşk dolu diğeri öfkeli, benzerlik düşük (özgün sesler) olmalı
    expect(pair.similarityScore).toBeLessThan(0.5);
  });
});
