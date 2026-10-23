import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  textExpanderService,
  resolveMacros,
  useSnippetStore
} from '../../src/services/snippets/textExpander';
import { SnippetManagerModal } from '../../src/components/Snippets/SnippetManagerModal';

describe('Phase 91: Text Expander & Macro Snippets', () => {
  beforeEach(() => {
    textExpanderService.resetToDefault();
  });

  describe('resolveMacros', () => {
    it('should replace dynamic macro placeholders with context values', () => {
      const template = 'Tarih: {date}, Saat: {time}, Sahne: {doc_title}, Yazar: {author}';
      const result = resolveMacros(template, {
        date: '2026-10-24',
        time: '14:30',
        docTitle: 'Bölüm 5 - Zirve',
        author: 'Daghan'
      });

      expect(result).toBe('Tarih: 2026-10-24, Saat: 14:30, Sahne: Bölüm 5 - Zirve, Yazar: Daghan');
    });

    it('should fallback to defaults when context is omitted', () => {
      const template = 'Giriş: {doc_title}';
      const result = resolveMacros(template);
      expect(result).toContain('Başlıksız Sahne');
    });
  });

  describe('TextExpanderService Core CRUD & Matching', () => {
    it('should find matching snippet at end of text buffer', () => {
      const match = textExpanderService.findMatchingSnippet('Bugün hava çok soğuktu ;bolum');
      expect(match).not.toBeNull();
      expect(match?.trigger).toBe(';bolum');
      expect(match?.expandedText).toContain('* * *');
    });

    it('should add custom snippet and expand it correctly', () => {
      textExpanderService.addSnippet({
        trigger: ';eren',
        expansion: 'Eren Yılmaz (32 yaşında, siyah saçlı dedektif)',
        description: 'Baş karakter profili',
        category: 'character'
      });

      const expanded = textExpanderService.expandText('Odaya ;eren girdi.');
      expect(expanded).toBe('Odaya Eren Yılmaz (32 yaşında, siyah saçlı dedektif) girdi.');
    });

    it('should reject duplicate triggers', () => {
      expect(() => {
        textExpanderService.addSnippet({
          trigger: ';tarih', // already built-in
          expansion: 'Başka tarih',
          description: 'Hata olmalı',
          category: 'macro'
        });
      }).toThrow();
    });

    it('should delete user snippet and handle export/import', () => {
      const s = textExpanderService.addSnippet({
        trigger: ';kurt',
        expansion: 'Gümüş Kurt',
        description: 'Hayvan dost',
        category: 'world'
      });

      const json = textExpanderService.exportToJson();
      expect(json).toContain(';kurt');

      textExpanderService.deleteSnippet(s.id);
      expect(textExpanderService.getSnapshot().some((item) => item.id === s.id)).toBe(false);

      const count = textExpanderService.importFromJson(json);
      expect(count).toBe(1);
      expect(textExpanderService.getSnapshot().some((item) => item.trigger === ';kurt')).toBe(true);
    });
  });

  describe('SnippetManagerModal UI Component', () => {
    it('should render snippet list and built-in indicators', () => {
      render(<SnippetManagerModal currentDocTitle="Test Bölümü" />);

      expect(screen.getByText('Hızlı Metin Genişletici ve Makro Snippet\'lar')).toBeDefined();
      expect(screen.getByText(';tarih')).toBeDefined();
      expect(screen.getByText(';bolum')).toBeDefined();
    });

    it('should open new snippet form and save new snippet', () => {
      render(<SnippetManagerModal currentDocTitle="Test Bölümü" />);

      const newBtn = screen.getByRole('button', { name: /Yeni Snippet/i });
      fireEvent.click(newBtn);

      expect(screen.getByText('Yeni Metin Genişletici Ekle')).toBeDefined();

      const triggerInput = screen.getByPlaceholderText(';kısayol');
      const expansionInput = screen.getByPlaceholderText('Kısayol yazıldığında bu metin belirecek...');

      fireEvent.change(triggerInput, { target: { value: ';ejderha' } });
      fireEvent.change(expansionInput, { target: { value: 'Kızıl Kanatlı Ulu Ejderha' } });

      const submitBtn = screen.getByRole('button', { name: 'Kaydet' });
      fireEvent.click(submitBtn);

      expect(textExpanderService.getSnapshot().some((s) => s.trigger === ';ejderha')).toBe(true);
    });

    it('should simulate expansion in the live test playground', () => {
      render(<SnippetManagerModal currentDocTitle="Test Bölümü" />);

      const testInput = screen.getByPlaceholderText(/Örn: Bölümün adı ;bolum/i);
      fireEvent.change(testInput, { target: { value: 'Sahne sonu ;bolum' } });

      const expandBtn = screen.getByText('Genişlet (Simüle Et)');
      fireEvent.click(expandBtn);

      expect((testInput as HTMLInputElement).value).toContain('* * *');
    });
  });
});
