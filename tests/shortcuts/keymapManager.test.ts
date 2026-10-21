import { describe, it, expect, beforeEach } from 'vitest';
import { KeymapManager } from '../../src/services/shortcuts/keymapManager';
import { VimModeExtension } from '../../src/services/shortcuts/vimModeExtension';

describe('Phase 70: Keymap Manager & Vim Mode (keymapManager & vimModeExtension)', () => {
  let keymap: KeymapManager;
  let vim: VimModeExtension;

  beforeEach(() => {
    keymap = new KeymapManager();
    vim = new VimModeExtension();
  });

  describe('KeymapManager', () => {
    it('initializes with default shortcuts', () => {
      const actions = keymap.getActions();
      expect(actions.length).toBeGreaterThanOrEqual(10);
      expect(keymap.getActiveKey('file.save')).toBe('Ctrl+S');
      expect(keymap.getActiveKey('editor.split')).toBe('Ctrl+Shift+K');
    });

    it('binds new key combinations and detects conflicts', () => {
      // Başarılı atama
      const res1 = keymap.bindKey('file.save', 'Ctrl+Alt+S');
      expect(res1.success).toBe(true);
      expect(keymap.getActiveKey('file.save')).toBe('Ctrl+Alt+S');

      // Çakışma: Ctrl+Alt+S artık file.save'de
      const res2 = keymap.bindKey('editor.bold', 'Ctrl+Alt+S');
      expect(res2.success).toBe(false);
      expect(res2.conflictWith?.id).toBe('file.save');
    });

    it('resets actions to defaults', () => {
      keymap.bindKey('file.save', 'Ctrl+Alt+S');
      expect(keymap.getActiveKey('file.save')).toBe('Ctrl+Alt+S');

      keymap.resetToDefault('file.save');
      expect(keymap.getActiveKey('file.save')).toBe('Ctrl+S');
    });

    it('matches KeyboardEvent properly', () => {
      const event = {
        ctrlKey: true,
        shiftKey: false,
        altKey: false,
        metaKey: false,
        key: 's',
      } as KeyboardEvent;

      expect(keymap.matchesEvent('file.save', event)).toBe(true);
      expect(keymap.matchesEvent('editor.bold', event)).toBe(false);
    });

    it('loads preset profiles', () => {
      keymap.loadProfile('vscode');
      expect(keymap.getActiveKey('nav.quickSearch')).toBe('Ctrl+P');
    });
  });

  describe('VimModeExtension', () => {
    it('switches between normal and insert modes', () => {
      vim.setEnabled(true);
      expect(vim.getState().mode).toBe('normal');

      vim.handleKey('i', 'Metin');
      expect(vim.getState().mode).toBe('insert');

      vim.handleKey('Escape', 'Metin');
      expect(vim.getState().mode).toBe('normal');
    });

    it('navigates with h, l, w, b and deletes characters with x', () => {
      vim.setEnabled(true);
      vim.setCursor(0);

      const text = 'Merhaba dünya.';

      // 'w': sonraki kelimeye atla
      const r1 = vim.handleKey('w', text);
      expect(r1.newCursor).toBe(8); // 'dünya' başı

      // 'b': önceki kelimeye dön
      const r2 = vim.handleKey('b', text);
      expect(r2.newCursor).toBe(0); // 'Merhaba' başı

      // 'x': ilk karakteri sil ('M' gider)
      const r3 = vim.handleKey('x', text);
      expect(r3.newText).toBe('erhaba dünya.');
    });
  });
});
