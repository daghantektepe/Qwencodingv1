import { describe, it, expect } from 'vitest';
import { documentSplitter } from '../../src/services/binder/documentSplitter';
import { documentMerger } from '../../src/services/binder/documentMerger';

describe('Phase 65: Document Split & Merge Power Suite', () => {
  describe('DocumentSplitter', () => {
    it('splits document at cursor position into two distinct chunks', () => {
      const text = 'Birinci kısım burada bitiyor. İkinci kısım ise buradan başlıyor.';
      const cursor = 29; // "Birinci kısım burada bitiyor." sonrası

      const [c1, c2] = documentSplitter.splitAtCursor(text, cursor, 'Bölüm 1', 'Bölüm 1 (Devam)');

      expect(c1.title).toBe('Bölüm 1');
      expect(c1.content).toBe('Birinci kısım burada bitiyor.');
      expect(c1.wordCount).toBe(4);

      expect(c2.title).toBe('Bölüm 1 (Devam)');
      expect(c2.content).toBe('İkinci kısım ise buradan başlıyor.');
      expect(c2.wordCount).toBe(5);
    });

    it('splits document automatically by chapter headings', () => {
      const text = `
Bölüm 1: Tanışma
Karanlık bir geceydi. Sherlock piposunu yaktı.

Bölüm 2: İpuçları
Ertesi sabah masada gizemli bir mektup vardı.

Bölüm 3: Çözüm
Katil uşaktı.
      `.trim();

      const chunks = documentSplitter.splitByPattern(text, 'chapters');

      expect(chunks).toHaveLength(3);
      expect(chunks[0].title).toBe('Bölüm 1: Tanışma');
      expect(chunks[1].title).toBe('Bölüm 2: İpuçları');
      expect(chunks[2].title).toBe('Bölüm 3: Çözüm');
      expect(chunks[0].wordCount).toBeGreaterThan(0);
    });

    it('splits document by scene breaks (***)', () => {
      const text = `
İlk sahne burada yaşandı ve bitti.
***
İkinci sahne bambaşka bir mekanda devam etti.
***
Üçüncü sahne finaldi.
      `.trim();

      const chunks = documentSplitter.splitByPattern(text, 'scenes');

      expect(chunks).toHaveLength(3);
      expect(chunks[0].title).toBe('Sahne 1');
      expect(chunks[1].title).toBe('Sahne 2');
      expect(chunks[2].title).toBe('Sahne 3');
    });
  });

  describe('DocumentMerger', () => {
    it('merges multiple documents with double newlines and scene breaks', () => {
      const docs = [
        { id: 'd1', title: 'Sahne A', content: 'Giriş metni.' },
        { id: 'd2', title: 'Sahne B', content: 'Gelişme metni.' },
      ];

      const resDouble = documentMerger.mergeDocuments(docs, 'double_newline', 'Birleşik');
      expect(resDouble.mergedTitle).toBe('Birleşik');
      expect(resDouble.mergedContent).toBe('Giriş metni.\n\nGelişme metni.');
      expect(resDouble.sourceDocIds).toEqual(['d1', 'd2']);

      const resBreak = documentMerger.mergeDocuments(docs, 'scene_break');
      expect(resBreak.mergedContent).toBe('Giriş metni.\n\n***\n\nGelişme metni.');

      const resHeadings = documentMerger.mergeDocuments(docs, 'chapter_heading');
      expect(resHeadings.mergedContent).toContain('## Sahne A');
      expect(resHeadings.mergedContent).toContain('## Sahne B');
    });
  });
});
