/**
 * pluginHost.ts — Faz 49: Merkezi Eklenti Barındırıcı ve Tema SDK Yöneticisi
 */

import { OpenScrivPlugin, PluginContext, CustomTheme } from '../../types/plugins';
import { PluginSandbox } from './pluginSandbox';

export class PluginHostService {
  private plugins: Map<string, OpenScrivPlugin> = new Map();
  private enabledPlugins: Set<string> = new Set();
  private customThemes: Map<string, CustomTheme> = new Map();
  private activeThemeId: string | null = null;
  private changeListeners: Set<() => void> = new Set();

  private activeDocumentProvider: () => { id: string; title: string; content: string } | null = () => null;
  private wordCountProvider: () => number = () => 0;
  private notifyHandler: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void = () => {};

  public setProviders(providers: {
    getActiveDocument?: () => { id: string; title: string; content: string } | null;
    getWordCount?: () => number;
    notify?: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  }): void {
    if (providers.getActiveDocument) this.activeDocumentProvider = providers.getActiveDocument;
    if (providers.getWordCount) this.wordCountProvider = providers.getWordCount;
    if (providers.notify) this.notifyHandler = providers.notify;
  }

  public subscribe(listener: () => void): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  private notifySubscribers(): void {
    this.changeListeners.forEach((l) => l());
  }

  /**
   * Yeni bir eklentiyi sisteme kaydeder ve varsayılan olarak etkinleştirir.
   */
  public async registerPlugin(plugin: OpenScrivPlugin, autoEnable = true): Promise<void> {
    if (!plugin?.metadata?.id) {
      throw new Error('Geçersiz eklenti tanımı: metadata.id eksik.');
    }

    this.plugins.set(plugin.metadata.id, plugin);

    if (autoEnable) {
      await this.enablePlugin(plugin.metadata.id);
    } else {
      this.notifySubscribers();
    }
  }

  public async unregisterPlugin(pluginId: string): Promise<void> {
    if (this.enabledPlugins.has(pluginId)) {
      await this.disablePlugin(pluginId);
    }
    this.plugins.delete(pluginId);
    this.notifySubscribers();
  }

  public async enablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin || this.enabledPlugins.has(pluginId)) return;

    this.enabledPlugins.add(pluginId);

    const context: PluginContext = {
      pluginId,
      api: {
        notify: (message, type = 'info') => this.notifyHandler(message, type),
        getActiveDocument: () => this.activeDocumentProvider(),
        getWordCount: () => this.wordCountProvider(),
        setTheme: (themeId) => this.applyCustomTheme(themeId),
        registerCommand: (id, name, handler) => {
          // Komut paleti entegrasyon noktası
        },
        storage: PluginSandbox.createStorage(pluginId),
      },
    };

    if (plugin.onLoad) {
      await PluginSandbox.executeSafe(plugin.metadata.name, () => plugin.onLoad!(context));
    }

    this.notifySubscribers();
  }

  public async disablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin || !this.enabledPlugins.has(pluginId)) return;

    if (plugin.onUnload) {
      await PluginSandbox.executeSafe(plugin.metadata.name, () => plugin.onUnload!());
    }

    this.enabledPlugins.delete(pluginId);
    this.notifySubscribers();
  }

  public isPluginEnabled(pluginId: string): boolean {
    return this.enabledPlugins.has(pluginId);
  }

  public getLoadedPlugins(): OpenScrivPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Olay yayımı (Event broadcasting)
   */
  public emitDocumentChange(docId: string, content: string): void {
    this.enabledPlugins.forEach((id) => {
      const plugin = this.plugins.get(id);
      if (plugin?.onDocumentChange) {
        PluginSandbox.executeSafe(plugin.metadata.name, () =>
          plugin.onDocumentChange!(docId, content)
        );
      }
    });
  }

  public emitWordCountChange(wordCount: number): void {
    this.enabledPlugins.forEach((id) => {
      const plugin = this.plugins.get(id);
      if (plugin?.onWordCountChange) {
        PluginSandbox.executeSafe(plugin.metadata.name, () =>
          plugin.onWordCountChange!(wordCount)
        );
      }
    });
  }

  public emitThemeChange(themeId: string): void {
    this.enabledPlugins.forEach((id) => {
      const plugin = this.plugins.get(id);
      if (plugin?.onThemeChange) {
        PluginSandbox.executeSafe(plugin.metadata.name, () =>
          plugin.onThemeChange!(themeId)
        );
      }
    });
  }

  /**
   * Özel Tema SDK İşlemleri (.osctheme JSON formatı)
   */
  public importCustomTheme(themeJson: string): CustomTheme {
    let parsed: any;
    try {
      parsed = JSON.parse(themeJson);
    } catch {
      throw new Error('Geçersiz tema JSON verisi.');
    }

    if (!parsed.id || !parsed.name || !parsed.colors) {
      throw new Error('Tema id, name ve colors nesnesi zorunludur.');
    }

    const theme: CustomTheme = {
      id: parsed.id,
      name: parsed.name,
      author: parsed.author || 'Bilinmiyor',
      colors: parsed.colors,
      typography: parsed.typography,
      isCustom: true,
    };

    this.customThemes.set(theme.id, theme);
    this.notifySubscribers();
    return theme;
  }

  public getCustomThemes(): CustomTheme[] {
    return Array.from(this.customThemes.values());
  }

  public applyCustomTheme(themeId: string): boolean {
    const theme = this.customThemes.get(themeId);
    if (!theme) return false;

    this.activeThemeId = themeId;

    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--bg-primary', theme.colors.bgPrimary);
      root.style.setProperty('--bg-secondary', theme.colors.bgSecondary);
      root.style.setProperty('--text-primary', theme.colors.textPrimary);
      root.style.setProperty('--text-secondary', theme.colors.textSecondary);
      root.style.setProperty('--accent-color', theme.colors.accent);
      root.style.setProperty('--border-color', theme.colors.border);
    }

    this.emitThemeChange(themeId);
    return true;
  }

  public reset(): void {
    this.enabledPlugins.clear();
    this.plugins.clear();
    this.customThemes.clear();
    this.activeThemeId = null;
    this.changeListeners.clear();
  }
}

export const pluginHost = new PluginHostService();
export default pluginHost;
