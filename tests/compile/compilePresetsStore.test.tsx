import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  compilePresetsStore,
  BUILTIN_PRESETS,
} from '../../src/services/compile/compilePresetsStore';
import { PresetManagerDialog } from '../../src/components/Compile/PresetManagerDialog';

describe('CompilePresetsStore (Faz 85)', () => {
  beforeEach(() => {
    compilePresetsStore.resetUserPresets();
  });

  it('yerleşik endüstri standart profillerini (KDP, Shunn, Yarışma) içerir', () => {
    const presets = compilePresetsStore.getPresets();
    expect(presets.length).toBeGreaterThanOrEqual(BUILTIN_PRESETS.length);

    const kdp = compilePresetsStore.getPreset('kdp-paperback-standard');
    expect(kdp).toBeDefined();
    expect(kdp?.format).toBe('pdf');
    expect(kdp?.pageSize).toBe('a5');

    const shunn = compilePresetsStore.getPreset('standard-manuscript-shunn');
    expect(shunn).toBeDefined();
    expect(shunn?.lineSpacing).toBe(2.0);
  });

  it('yeni özel profil oluşturur ve günceller', () => {
    const custom = compilePresetsStore.createPreset({
      name: 'Özel Yarışma Formatı',
      description: 'Benim formatım',
      format: 'pdf',
      fontFamily: 'Courier, monospace',
      fontSizePt: 12,
      lineSpacing: 2.0,
      pageSize: 'a4',
      orientation: 'portrait',
      marginsMm: { top: 25, right: 25, bottom: 25, left: 25 },
      firstLineIndentMm: 10,
      includeTOC: false,
      includeTitlePage: true,
      chapterBreak: 'page',
    });

    expect(custom.id).toBeDefined();
    expect(custom.name).toBe('Özel Yarışma Formatı');

    const updated = compilePresetsStore.updatePreset(custom.id, {
      name: 'Güncel Yarışma Formatı',
    });
    expect(updated.name).toBe('Güncel Yarışma Formatı');
  });

  it('özel profili siler', () => {
    const custom = compilePresetsStore.createPreset({
      name: 'Silinecek Profil',
      description: 'Geçici',
      format: 'epub',
      fontFamily: 'Arial',
      fontSizePt: 11,
      lineSpacing: 1.15,
      pageSize: 'a5',
      orientation: 'portrait',
      marginsMm: { top: 10, right: 10, bottom: 10, left: 10 },
      firstLineIndentMm: 0,
      includeTOC: true,
      includeTitlePage: true,
      chapterBreak: 'page',
    });

    expect(compilePresetsStore.getPreset(custom.id)).toBeDefined();
    const deleted = compilePresetsStore.deletePreset(custom.id);
    expect(deleted).toBe(true);
    expect(compilePresetsStore.getPreset(custom.id)).toBeUndefined();
  });

  it('JSON dışa aktar ve içe aktar döngüsü çalışır', () => {
    compilePresetsStore.createPreset({
      name: 'Paylaşılabilir Profil',
      description: 'JSON testi',
      format: 'html',
      fontFamily: 'Merriweather',
      fontSizePt: 12,
      lineSpacing: 1.5,
      pageSize: 'letter',
      orientation: 'portrait',
      marginsMm: { top: 20, right: 20, bottom: 20, left: 20 },
      firstLineIndentMm: 5,
      includeTOC: true,
      includeTitlePage: false,
      chapterBreak: 'separator',
    });

    const json = compilePresetsStore.exportPresetsJson();
    expect(json).toContain('Paylaşılabilir Profil');

    compilePresetsStore.resetUserPresets();
    expect(compilePresetsStore.getPresets().length).toBe(BUILTIN_PRESETS.length);

    const importedCount = compilePresetsStore.importPresetsJson(json);
    expect(importedCount).toBe(1);
    expect(compilePresetsStore.getPresets().some((p) => p.name === 'Paylaşılabilir Profil')).toBe(true);
  });
});

describe('PresetManagerDialog Component', () => {
  beforeEach(() => {
    compilePresetsStore.resetUserPresets();
  });

  it('isOpen false olduğunda render etmez', () => {
    const { container } = render(
      <PresetManagerDialog isOpen={false} onClose={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('profilleri listeler ve profili uygula butonu onSelectPreset tetikler', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    render(
      <PresetManagerDialog
        isOpen={true}
        onSelectPreset={onSelect}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Derleme Format Profilleri Stüdyosu')).toBeDefined();
    expect(screen.getByText('Amazon KDP Standart Baskı')).toBeDefined();

    // İlk profilin 'Profili Uygula' butonuna tıkla
    const applyBtns = screen.getAllByRole('button', { name: /Profili Uygula/i });
    fireEvent.click(applyBtns[0]);

    expect(onSelect).toHaveBeenCalled();
  });
});
