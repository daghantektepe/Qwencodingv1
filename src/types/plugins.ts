/**
 * plugins.ts — Faz 49: Eklenti Mimarisi ve Tema SDK Tip Tanımları
 */

export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  icon?: string;
  permissions?: ('notifications' | 'storage' | 'editor-read' | 'theme-switch')[];
}

export interface PluginStorage {
  get: <T = any>(key: string) => T | null;
  set: (key: string, value: any) => void;
  remove: (key: string) => void;
  clear: () => void;
}

export interface PluginContext {
  pluginId: string;
  api: {
    notify: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
    getActiveDocument: () => { id: string; title: string; content: string } | null;
    getWordCount: () => number;
    setTheme: (themeId: string) => void;
    registerCommand: (id: string, name: string, handler: () => void) => void;
    storage: PluginStorage;
  };
}

export interface OpenScrivPlugin {
  metadata: PluginMetadata;
  onLoad?: (context: PluginContext) => Promise<void> | void;
  onUnload?: () => Promise<void> | void;
  onDocumentChange?: (docId: string, content: string) => void;
  onWordCountChange?: (wordCount: number) => void;
  onThemeChange?: (themeId: string) => void;
}

export interface CustomTheme {
  id: string;
  name: string;
  author?: string;
  colors: {
    bgPrimary: string;
    bgSecondary: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
    border: string;
  };
  typography?: {
    fontFamily: string;
    fontSize: string;
    lineHeight: string;
  };
  isCustom?: boolean;
}
