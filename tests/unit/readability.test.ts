import { describe, it, expect } from 'vitest';
import {
  countSyllables,
  splitSentences,
  splitWords,
  isComplexWord,
  calculateFleschKincaid,
  calculateGunningFog,
  calculateReadabilityMetrics,
  getReadabilityLevel,
} from '../../src/utils/readability';

describe('Readability Utilities', () => {
  describe('countSyllables', () => {
    it('should count syllables in simple words', () => {
      expect(countSyllables('cat')).toBe(1);
      expect(countSyllables('hello')).toBe(2);
      expect(countSyllables('beautiful')).toBe(3);
    });

    it('should handle single letter words', () => {
      expect(countSyllables('a')).toBe(1);
      expect(countSyllables('I')).toBe(1);
    });

    it('should handle words with silent e', () => {
      expect(countSyllables('make')).toBe(1);
      expect(countSyllables('like')).toBe(1);
    });
  });

  describe('splitSentences', () => {
    it('should split text into sentences', () => {
      const text = 'Hello world. How are you? I am fine!';
      const sentences = splitSentences(text);
      expect(sentences).toHaveLength(3);
    });

    it('should handle text without punctuation', () => {
      const text = 'Hello world';
      const sentences = splitSentences(text);
      expect(sentences).toHaveLength(1);
    });

    it('should handle empty text', () => {
      const sentences = splitSentences('');
      expect(sentences).toHaveLength(0);
    });
  });

  describe('splitWords', () => {
    it('should split text into words', () => {
      const text = 'Hello world, how are you?';
      const words = splitWords(text);
      expect(words).toHaveLength(5);
    });

    it('should handle empty text', () => {
      const words = splitWords('');
      expect(words).toHaveLength(0);
    });
  });

  describe('isComplexWord', () => {
    it('should identify complex words (3+ syllables)', () => {
      expect(isComplexWord('beautiful')).toBe(true);
      expect(isComplexWord('wonderful')).toBe(true);
      expect(isComplexWord('cat')).toBe(false);
      expect(isComplexWord('hello')).toBe(false);
    });
  });

  describe('calculateFleschKincaid', () => {
    it('should calculate Flesch score for simple text', () => {
      const text = 'The cat sat on the mat. The dog ran in the park.';
      const result = calculateFleschKincaid(text);
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.gradeLevel).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for empty text', () => {
      const result = calculateFleschKincaid('');
      expect(result.score).toBe(0);
      expect(result.gradeLevel).toBe(0);
    });

    it('should give higher score for simpler text', () => {
      const simple = 'The cat sat. The dog ran.';
      const complex = 'The implementation of sophisticated algorithmic methodologies necessitates comprehensive understanding.';
      
      const simpleResult = calculateFleschKincaid(simple);
      const complexResult = calculateFleschKincaid(complex);
      
      expect(simpleResult.score).toBeGreaterThan(complexResult.score);
    });
  });

  describe('calculateGunningFog', () => {
    it('should calculate Gunning Fog index', () => {
      const text = 'The cat sat on the mat. The dog ran in the park.';
      const fog = calculateGunningFog(text);
      expect(fog).toBeGreaterThan(0);
    });

    it('should return 0 for empty text', () => {
      const fog = calculateGunningFog('');
      expect(fog).toBe(0);
    });
  });

  describe('calculateReadabilityMetrics', () => {
    it('should calculate all metrics', () => {
      const text = 'The cat sat on the mat. The dog ran in the park. It was a good day.';
      const metrics = calculateReadabilityMetrics(text);
      
      expect(metrics.fleschKincaid).toBeGreaterThan(0);
      expect(metrics.gunningFog).toBeGreaterThan(0);
      expect(metrics.totalWords).toBeGreaterThan(0);
      expect(metrics.totalSentences).toBeGreaterThan(0);
      expect(metrics.avgSentenceLength).toBeGreaterThan(0);
    });

    it('should return zeros for empty text', () => {
      const metrics = calculateReadabilityMetrics('');
      expect(metrics.fleschKincaid).toBe(0);
      expect(metrics.totalWords).toBe(0);
    });
  });

  describe('getReadabilityLevel', () => {
    it('should return correct level descriptions', () => {
      expect(getReadabilityLevel(95)).toContain('Very Easy');
      expect(getReadabilityLevel(85)).toContain('Easy');
      expect(getReadabilityLevel(65)).toContain('Standard');
      expect(getReadabilityLevel(40)).toContain('Difficult');
      expect(getReadabilityLevel(20)).toContain('Very Difficult');
    });
  });
});
