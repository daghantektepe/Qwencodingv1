/**
 * System Theme & Accent Color Bridge
 * Phase 116: İşletim Sistemi Tema & Vurgu Rengi Senkronu
 */

export interface SystemThemeInfo {
  isDark: boolean;
  themeSource: 'system' | 'light' | 'dark';
  accentColor: string;
}

export class SystemThemeBridge {
  private static currentTheme: SystemThemeInfo = {
    isDark: false,
    themeSource: 'system',
    accentColor: '#3b82f6',
  };

  private static listeners: Set<(info: SystemThemeInfo) => void> = new Set();

  static isElectron(): boolean {
    return typeof window !== 'undefined' && !!(window as any).electronBridge?.isDesktop;
  }

  static applyThemeToDom(info: SystemThemeInfo) {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    root.setAttribute('data-system-theme', info.isDark ? 'dark' : 'light');
    root.style.setProperty('--native-accent-color', info.accentColor);

    // Accent hover türetme
    root.style.setProperty('--native-accent-hover', `${info.accentColor}dd`);

    this.currentTheme = info;
    for (const listener of this.listeners) {
      try {
        listener(info);
      } catch (err) {
        console.error('[SystemThemeBridge] Listener hatası:', err);
      }
    }
  }

  static async initSystemThemeSync(): Promise<SystemThemeInfo> {
    if (this.isElectron()) {
      try {
        const info = await (window as any).electronBridge.invoke('theme:get-system-info');
        if (info) this.applyThemeToDom(info);

        (window as any).electronBridge.on?.('theme:changed', (_evt: any, updated: SystemThemeInfo) => {
          this.applyThemeToDom(updated);
        });

        return this.currentTheme;
      } catch (err) {
        console.warn('[SystemThemeBridge] IPC tema bilgisi alınamadı:', err);
      }
    }

    // Web Fallback
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const updateFromMedia = (e: MediaQueryListEvent | MediaQueryList) => {
        this.applyThemeToDom({
          isDark: e.matches,
          themeSource: 'system',
          accentColor: '#2563eb',
        });
      };

      updateFromMedia(mediaQuery);
      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', updateFromMedia);
      }
    }

    return this.currentTheme;
  }

  static async setThemeSource(source: 'system' | 'light' | 'dark'): Promise<SystemThemeInfo> {
    if (this.isElectron()) {
      try {
        const updated = await (window as any).electronBridge.invoke('theme:set-source', { source });
        if (updated) this.applyThemeToDom(updated);
        return updated;
      } catch {
        // fallback
      }
    }

    const isDark = source === 'dark';
    const updated: SystemThemeInfo = {
      ...this.currentTheme,
      themeSource: source,
      isDark,
    };
    this.applyThemeToDom(updated);
    return updated;
  }

  static subscribe(fn: (info: SystemThemeInfo) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  static getCurrentTheme(): SystemThemeInfo {
    return { ...this.currentTheme };
  }
}
