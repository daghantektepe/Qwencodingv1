import { describe, it, expect, vi } from 'vitest';
import {
  normalizeWordTarget,
  toLegacyFormat,
  parseWordTargetFromStorage,
  LegacyWordTargetState,
  NormalizedWordTarget,
} from '../../src/services/targets/wordTargetNormalizer';

describe('wordTargetNormalizer', () => {
  describe('normalizeWordTarget', () => {
    it('should normalize legacy state with wordTarget', () => {
      const normalized = normalizeWordTarget({ wordTarget: 100 });
      expect(normalized.targetWords).toBe(100);
      expect(normalized.unit).toBe('words');
      expect(normalized.isActive).toBe(true);
      expect(normalized.sourceField).toBe('wordTarget');
    });

    it('should normalize when targetWords is provided', () => {
      const normalized = normalizeWordTarget({ targetWords: 250, unit: 'sentences', isActive: false });
      expect(normalized.targetWords).toBe(250);
      expect(normalized.unit).toBe('sentences');
      expect(normalized.isActive).toBe(false);
      expect(normalized.sourceField).toBe('targetWords');
    });
  });

  describe('toLegacyFormat', () => {
    it('should convert a normalized object back to legacy state without wordTarget', () => {
      const normalized: NormalizedWordTarget = {
        targetWords: 100,
        unit: 'words',
        isActive: true,
        sourceField: 'targetWords',
      };
      const legacy = toLegacyFormat(normalized);
      // Legacy format must not contain the new field name "wordTarget"
      expect('wordTarget' in legacy).toBe(false);
      // It should still contain the original fields that are kept in legacy format
      expect(legacy.unit).toBe('words');
      expect(legacy.isActive).toBe(true);
    });

    it('should convert normalized object with different unit without wordTarget', () => {
      const normalized: NormalizedWordTarget = {
        targetWords: 5,
        unit: 'sentences',
        isActive: false,
        sourceField: 'targetWords',
      };
      const legacy = toLegacyFormat(normalized);
      expect('wordTarget' in legacy).toBe(false);
      expect(legacy.unit).toBe('sentences');
      expect(legacy.isActive).toBe(false);
    });
  });

  describe('parseWordTargetFromStorage', () => {
    it('should parse valid legacy JSON string', () => {
      const raw = JSON.stringify({ wordTarget: 150, unit: 'words', isActive: true });
      const parsed = parseWordTargetFromStorage(raw);
      expect(parsed).toBeTruthy();
      expect(parsed?.wordTarget).toBe(150);
      expect(parsed?.unit).toBe('words');
      expect(parsed?.isActive).toBe(true);
    });

    it('should return null for malformed JSON', () => {
      const raw = '{ not a json';
      const parsed = parseWordTargetFromStorage(raw);
      expect(parsed).toBeNull();
    });

    it('should return null when no recognizable fields exist', () => {
      const raw = JSON.stringify({ someOtherField: 42 });
      const parsed = parseWordTargetFromStorage(raw);
      expect(parsed).toBeNull();
    });
  });
});
