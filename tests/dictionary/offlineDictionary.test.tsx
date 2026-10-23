import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  offlineDictionary,
  OfflineDictionaryEngine
} from '../../src/services/dictionary/offlineDictionary';
import { DictionaryLookupPopover } from '../../src/components/Dictionary/DictionaryLookupPopover';

describe('Phase 94: Offline Dictionary & Etymology Assistant', () => {
  beforeEach(() => {
    offlineDictionary.init();
  });

  describe('OfflineDictionaryEngine Core Logic', () => {
    it('should lookup definitions with origin and etymology details', () => {
      const entry = offlineDictionary.lookup('kurgu');
      expect(entry).not.toBeNull();
      expect(entry?.partOfSpeech).toBe('isim');
      expect(entry?.origin).toBe('Öz Türkçe');
      expect(entry?.etymologyDetails).toContain('Eski Türkçe kur-');
      expect(entry?.synonyms).toContain('entrika');
    });

    it('should handle inflected words with suffix stripping (e.g. kurgular)', () => {
      const entry = offlineDictionary.lookup('kurgular');
      expect(entry).not.toBeNull();
      expect(entry?.word).toBe('kurgu');
    });

    it('should execute dictionary lookups under 20ms benchmark', () => {
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        offlineDictionary.lookup('melankoli');
        offlineDictionary.lookup('pusula');
        offlineDictionary.lookup('kadim');
      }
      const duration = performance.now() - start;

      // 300 lookups should be well under 100ms
      expect(duration).toBeLessThan(100);
    });

    it('should return suggestions and support custom user additions', () => {
      const engine = new OfflineDictionaryEngine();
      engine.addCustomWord({
        word: 'ejderhamı',
        partOfSpeech: 'isim',
        meaning: 'Mitolojik ulu yaratık.',
        origin: 'Farsça',
        etymologyDetails: 'Ajdahā kelimesinden alıntı.',
        examples: ['Ejderha göklerde süzüldü.']
      });

      const res = engine.lookup('ejderhamı');
      expect(res?.word).toBe('ejderhamı');
      expect(res?.origin).toBe('Farsça');
    });
  });

  describe('DictionaryLookupPopover UI Component', () => {
    it('should render word definition, origin and etymology details', () => {
      render(<DictionaryLookupPopover initialWord="kurgu" />);

      expect(screen.getByText('Çevrimdışı Sözlük ve Etimoloji')).toBeDefined();
      expect(screen.getByText('kurgu')).toBeDefined();
      expect(screen.getByText('Öz Türkçe')).toBeDefined();
      expect(screen.getByText(/Bir eserin olay örgüsü/i)).toBeDefined();
      expect(screen.getByText(/Eski Türkçe kur-/i)).toBeDefined();
    });

    it('should allow searching for another word and update view', () => {
      render(<DictionaryLookupPopover initialWord="kurgu" />);

      const searchInput = screen.getByPlaceholderText('Kelime ara...');
      fireEvent.change(searchInput, { target: { value: 'melankoli' } });
      fireEvent.submit(searchInput.closest('form')!);

      expect(screen.getByText('melankoli')).toBeDefined();
      expect(screen.getByText('Eski Yunanca')).toBeDefined();
      expect(screen.getByText(/melas \(kara, siyah\)/i)).toBeDefined();
    });

    it('should handle clicking synonyms to navigate', () => {
      const onSelectSynonym = vi.fn();
      render(
        <DictionaryLookupPopover
          initialWord="kurgu"
          onSelectSynonym={onSelectSynonym}
        />
      );

      const synonymChip = screen.getByText('tasarım');
      fireEvent.click(synonymChip);

      expect(onSelectSynonym).toHaveBeenCalledWith('tasarım');
    });
  });
});
