import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContextMenuSpellcheck } from '../../src/components/Editor/ContextMenuSpellcheck';
import { SpellcheckerService } from '../../src/services/native/spellcheckerService';

const { SpellcheckerManager, levenshteinDistance } = require('../../electron/spellchecker.cjs');

describe('Phase 115: Native Spellchecker & Custom Dictionary', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Levenshtein mesafesini doğru hesaplar', () => {
    expect(levenshteinDistance('kitap', 'kitap')).toBe(0);
    expect(levenshteinDistance('kitap', 'katap')).toBe(1);
    expect(levenshteinDistance('roman', 'zaman')).toBe(2);
  });

  it('SpellcheckerManager dahili sözlük ve öneri üretimini doğru yönetir', () => {
    const mgr = new SpellcheckerManager();

    // Doğru kelimeler
    expect(mgr.checkSpelling('kurgu')).toBe(true);
    expect(mgr.checkSpelling('karakter')).toBe(true);

    // Yanlış yazım ve öneri
    expect(mgr.checkSpelling('tasllak')).toBe(false);
    const suggestions = mgr.getSuggestions('tasllak');
    expect(suggestions).toContain('taslak');

    // Özel sözlüğe ekleme
    expect(mgr.checkSpelling('daghantektepe')).toBe(false);
    mgr.addCustomWord('daghantektepe');
    expect(mgr.checkSpelling('daghantektepe')).toBe(true);
    expect(mgr.getCustomWords()).toContain('daghantektepe');
  });

  it('ContextMenuSpellcheck bileşeni önerileri listeler ve tıklandığında uygular', () => {
    const onApply = vi.fn();
    const onClose = vi.fn();

    render(
      <ContextMenuSpellcheck
        x={100}
        y={200}
        word="tasllak"
        checkResult={{
          word: 'tasllak',
          isCorrect: false,
          suggestions: ['taslak', 'taslaklar'],
        }}
        onApplySuggestion={onApply}
        onClose={onClose}
      />
    );

    expect(screen.getByRole('menu')).toBeTruthy();
    expect(screen.getByText('taslak')).toBeTruthy();

    fireEvent.click(screen.getByText('taslak'));
    expect(onApply).toHaveBeenCalledWith('taslak');
    expect(onClose).toHaveBeenCalled();
  });

  it('ContextMenuSpellcheck üzerinden sözlüğe kelime ekleme yapılabilir', async () => {
    const addSpy = vi.spyOn(SpellcheckerService, 'addCustomWord');
    const onClose = vi.fn();

    render(
      <ContextMenuSpellcheck
        x={100}
        y={200}
        word="fantastikdiyar"
        checkResult={{
          word: 'fantastikdiyar',
          isCorrect: false,
          suggestions: [],
        }}
        onApplySuggestion={() => {}}
        onClose={onClose}
      />
    );

    const addBtn = screen.getByTestId('spellcheck-add-dictionary');
    fireEvent.click(addBtn);

    expect(addSpy).toHaveBeenCalledWith('fantastikdiyar');
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});
