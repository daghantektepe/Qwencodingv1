/**
 * Tests for Native Application Menu Template & Dispatcher
 * Phase 107: Tam Yerel İşletim Sistemi Menüleri ve Kısayol Haritası (Native Application Menus)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NativeMenuBridge } from '../../src/services/native/nativeMenuBridge';

const { buildMenuTemplate, sendAction } = require('../../electron/menuTemplate.cjs');

describe('Phase 107: Native Application Menus & Shortcut Map', () => {
  beforeEach(() => {
    NativeMenuBridge.clear();
  });

  it('builds full 7-section native menu hierarchy', () => {
    const mockWin = {
      isDestroyed: () => false,
      webContents: { send: vi.fn() },
    };

    const template = buildMenuTemplate(mockWin);
    expect(Array.isArray(template)).toBe(true);

    const labels = template.map((m: any) => m.label);
    expect(labels).toContain('Dosya');
    expect(labels).toContain('Düzen');
    expect(labels).toContain('Görünüm');
    expect(labels).toContain('Proje');
    expect(labels).toContain('Araçlar');
    expect(labels).toContain('Pencere');
    expect(labels).toContain('Yardım');
  });

  it('contains expected accelerator shortcuts in File, View and Tools menus', () => {
    const mockWin = {
      isDestroyed: () => false,
      webContents: { send: vi.fn() },
    };

    const template = buildMenuTemplate(mockWin);

    const fileMenu = template.find((m: any) => m.label === 'Dosya');
    const saveItem = fileMenu.submenu.find((item: any) => item.label === 'Kaydet');
    expect(saveItem.accelerator).toBe('CmdOrCtrl+S');

    const viewMenu = template.find((m: any) => m.label === 'Görünüm');
    const corkboardItem = viewMenu.submenu.find((item: any) => item.label.includes('Mantar Pano'));
    expect(corkboardItem.accelerator).toBe('CmdOrCtrl+2');

    const toolsMenu = template.find((m: any) => m.label === 'Araçlar');
    const paletteItem = toolsMenu.submenu.find((item: any) => item.label.includes('Komut Paleti'));
    expect(paletteItem.accelerator).toBe('CmdOrCtrl+Shift+P');
  });

  it('invokes webContents.send on menu item click callback', () => {
    const mockSend = vi.fn();
    const mockWin = {
      isDestroyed: () => false,
      webContents: { send: mockSend },
    };

    const template = buildMenuTemplate(mockWin);
    const fileMenu = template.find((m: any) => m.label === 'Dosya');
    const compileItem = fileMenu.submenu.find((item: any) => item.label?.includes('Derle ve Dışa Aktar'));

    expect(compileItem).toBeDefined();
    expect(compileItem.click).toBeDefined();
    compileItem.click();

    expect(mockSend).toHaveBeenCalledWith(
      'menu:action',
      expect.objectContaining({ action: 'file:compile' })
    );
  });

  it('subscribes and receives dispatched menu actions via NativeMenuBridge', () => {
    const onCompile = vi.fn();
    const unsubscribe = NativeMenuBridge.on('file:compile', onCompile);

    NativeMenuBridge.dispatch('file:compile', { target: 'epub' });
    expect(onCompile).toHaveBeenCalledTimes(1);
    expect(onCompile).toHaveBeenCalledWith({ target: 'epub' });

    unsubscribe();
    NativeMenuBridge.dispatch('file:compile');
    expect(onCompile).toHaveBeenCalledTimes(1);
  });
});
