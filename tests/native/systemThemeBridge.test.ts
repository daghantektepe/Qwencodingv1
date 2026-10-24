import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SystemThemeBridge } from '../../src/services/native/systemThemeBridge';
const { getSystemThemeInfo } = require('../../electron/themeIpc.cjs');

describe('Phase 116: OS Theme & Accent Color Sync', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete (window as any).electronBridge;
    document.documentElement.removeAttribute('data-system-theme');
    document.documentElement.style.removeProperty('--native-accent-color');
  });

  it('Electron backend getSystemThemeInfo geçerli tema objesi döner', () => {
    const info = getSystemThemeInfo();
    expect(info).toHaveProperty('isDark');
    expect(info).toHaveProperty('themeSource');
    expect(info).toHaveProperty('accentColor');
  });

  it('applyThemeToDom DOM elementlerine tema özniteliklerini işler', () => {
    SystemThemeBridge.applyThemeToDom({
      isDark: true,
      themeSource: 'dark',
      accentColor: '#10b981',
    });

    expect(document.documentElement.getAttribute('data-system-theme')).toBe('dark');
    expect(document.documentElement.style.getPropertyValue('--native-accent-color')).toBe('#10b981');
    expect(document.documentElement.style.getPropertyValue('--native-accent-hover')).toBe('#10b981dd');
  });

  it('Tema aboneleri (subscriber) tema güncellendiğinde haberdar edilir', () => {
    const mockListener = vi.fn();
    const unsubscribe = SystemThemeBridge.subscribe(mockListener);

    SystemThemeBridge.applyThemeToDom({
      isDark: false,
      themeSource: 'light',
      accentColor: '#f59e0b',
    });

    expect(mockListener).toHaveBeenCalledWith(
      expect.objectContaining({
        isDark: false,
        accentColor: '#f59e0b',
      })
    );

    unsubscribe();
    SystemThemeBridge.applyThemeToDom({
      isDark: true,
      themeSource: 'dark',
      accentColor: '#000000',
    });

    // Unsubscribe olduğu için çağrı sayısı artmamalı
    expect(mockListener).toHaveBeenCalledTimes(1);
  });

  it('Web ortamında matchMedia fallback ile initSystemThemeSync çalışır', async () => {
    const mockMatchMedia = vi.fn().mockImplementation((query) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    window.matchMedia = mockMatchMedia;

    const theme = await SystemThemeBridge.initSystemThemeSync();
    expect(theme.isDark).toBe(true);
    expect(document.documentElement.getAttribute('data-system-theme')).toBe('dark');
  });
});
