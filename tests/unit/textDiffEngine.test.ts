import { describe, it, expect } from 'vitest';
import {
  tokenizeWords,
  computeLcsDiff,
  computeWordDiff,
  computeLineDiff,
  computeSplitDiff,
  computeParagraphDiff,
  rollbackParagraph,
  getDiffStats,
} from '../../src/services/diff/textDiffEngine';

describe('textDiffEngine', () => {
  describe('tokenizeWords', () => {
    it('should return empty array for empty string', () => {
      expect(tokenizeWords('')).toEqual([]);
    });

    it('should split words and spaces accurately', () => {
      const tokens = tokenizeWords('Merhaba dünya!');
      expect(tokens).toContain('Merhaba');
      expect(tokens).toContain(' ');
      expect(tokens).toContain('dünya');
      expect(tokens).toContain('!');
    });
  });

  describe('computeWordDiff', () => {
    it('should handle identical texts as equal', () => {
      const result = computeWordDiff('Aynı metin burası.', 'Aynı metin burası.');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('equal');
      expect(result[0].value).toBe('Aynı metin burası.');
    });

    it('should handle empty old text as pure insert', () => {
      const result = computeWordDiff('', 'Yeni eklenen metin');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('insert');
      expect(result[0].value).toBe('Yeni eklenen metin');
    });

    it('should handle empty new text as pure delete', () => {
      const result = computeWordDiff('Eski silinen metin', '');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('delete');
      expect(result[0].value).toBe('Eski silinen metin');
    });

    it('should highlight word replacement', () => {
      const result = computeWordDiff('Kırmızı elma ağaçta.', 'Yeşil elma ağaçta.');
      expect(result.some((r) => r.type === 'delete' && r.value.includes('Kırmızı'))).toBe(true);
      expect(result.some((r) => r.type === 'insert' && r.value.includes('Yeşil'))).toBe(true);
      expect(result.some((r) => r.type === 'equal' && r.value.includes('elma'))).toBe(true);
    });
  });

  describe('computeLineDiff', () => {
    it('should calculate line differences with numbers', () => {
      const oldText = 'Satır 1\nSatır 2\nSatır 3';
      const newText = 'Satır 1\nSatır 2 güncellendi\nSatır 3\nSatır 4';

      const lines = computeLineDiff(oldText, newText);
      expect(lines.length).toBeGreaterThan(0);

      const equalLines = lines.filter((l) => l.type === 'equal');
      const inserts = lines.filter((l) => l.type === 'insert');
      const deletes = lines.filter((l) => l.type === 'delete');

      expect(equalLines.some((l) => l.text === 'Satır 1')).toBe(true);
      expect(deletes.some((l) => l.text === 'Satır 2')).toBe(true);
      expect(inserts.some((l) => l.text === 'Satır 2 güncellendi')).toBe(true);
      expect(inserts.some((l) => l.text === 'Satır 4')).toBe(true);
    });
  });

  describe('computeSplitDiff', () => {
    it('should generate side-by-side rows', () => {
      const oldText = 'Giriş paragrafı\nEski gövde';
      const newText = 'Giriş paragrafı\nYeni gövde\nSonuç';

      const split = computeSplitDiff(oldText, newText);
      expect(split.length).toBeGreaterThan(0);

      // First row should be equal
      expect(split[0].type).toBe('equal');
      expect(split[0].oldText).toBe('Giriş paragrafı');
      expect(split[0].newText).toBe('Giriş paragrafı');

      // Second row should be paired as modify
      expect(split[1].type).toBe('modify');
      expect(split[1].oldText).toBe('Eski gövde');
      expect(split[1].newText).toBe('Yeni gövde');

      // Third row should be insert
      expect(split[2].type).toBe('insert');
      expect(split[2].newText).toBe('Sonuç');
    });
  });

  describe('computeParagraphDiff & Selective Rollback', () => {
    const oldDoc = `Bölüm Bir: Başlangıç.\n\nEski paragraf içeriği burada duruyordu.\n\nSon bölüm metni.`;
    const newDoc = `Bölüm Bir: Başlangıç.\n\nYeni güncellenmiş gövde paragrafı.\n\nSon bölüm metni.\n\nEkstra eklenen son paragraf.`;

    it('should detect paragraph changes and pairings', () => {
      const diffs = computeParagraphDiff(oldDoc, newDoc);

      expect(diffs).toHaveLength(4);
      expect(diffs[0].type).toBe('equal');
      expect(diffs[1].type).toBe('modify');
      expect(diffs[1].oldContent).toBe('Eski paragraf içeriği burada duruyordu.');
      expect(diffs[1].newContent).toBe('Yeni güncellenmiş gövde paragrafı.');
      expect(diffs[2].type).toBe('equal');
      expect(diffs[3].type).toBe('insert');
    });

    it('should perform selective rollback on modified paragraph', () => {
      const diffs = computeParagraphDiff(oldDoc, newDoc);
      const modifiedDiff = diffs.find((d) => d.type === 'modify')!;

      const rolledBack = rollbackParagraph(newDoc, diffs, modifiedDiff.id);
      expect(rolledBack).toContain('Eski paragraf içeriği burada duruyordu.');
      expect(rolledBack).not.toContain('Yeni güncellenmiş gövde paragrafı.');
      // Other new parts should remain
      expect(rolledBack).toContain('Ekstra eklenen son paragraf.');
    });

    it('should rollback an inserted paragraph by removing it', () => {
      const diffs = computeParagraphDiff(oldDoc, newDoc);
      const insertedDiff = diffs.find((d) => d.type === 'insert')!;

      const rolledBack = rollbackParagraph(newDoc, diffs, insertedDiff.id);
      expect(rolledBack).not.toContain('Ekstra eklenen son paragraf.');
    });

    it('should rollback a deleted paragraph by re-inserting it', () => {
      const initial = 'Paragraf 1\n\nSilinecek olan Paragraf 2\n\nParagraf 3';
      const modified = 'Paragraf 1\n\nParagraf 3';

      const diffs = computeParagraphDiff(initial, modified);
      const deletedDiff = diffs.find((d) => d.type === 'delete')!;

      const restored = rollbackParagraph(modified, diffs, deletedDiff.id);
      expect(restored).toContain('Silinecek olan Paragraf 2');
    });
  });

  describe('getDiffStats', () => {
    it('should return 1.0 similarity for identical texts', () => {
      const stats = getDiffStats('Test metni', 'Test metni');
      expect(stats.similarityRatio).toBe(1);
      expect(stats.addedWords).toBe(0);
      expect(stats.deletedWords).toBe(0);
    });

    it('should correctly count added and deleted words', () => {
      const oldText = 'Hızlı kahverengi tilki.';
      const newText = 'Hızlı beyaz kedi.';

      const stats = getDiffStats(oldText, newText);
      expect(stats.deletedWords).toBeGreaterThan(0);
      expect(stats.addedWords).toBeGreaterThan(0);
      expect(stats.similarityRatio).toBeLessThan(1);
      expect(stats.similarityRatio).toBeGreaterThan(0);
    });
  });
});
