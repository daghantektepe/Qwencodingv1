/**
 * pluginSandbox.ts — Faz 49: Güvenli Eklenti Çalıştırma Ortamı ve İzolasyon
 */

import { OpenScrivPlugin, PluginContext, PluginStorage } from '../../types/plugins';

export class PluginSandbox {
  /**
   * Eklentiye özel izole yerel depolama adaptörü oluşturur.
   */
  public static createStorage(pluginId: string): PluginStorage {
    const prefix = `openscriv_plugin_${pluginId}_`;
    const memoryStore = new Map<string, any>();

    return {
      get: <T = any>(key: string): T | null => {
        try {
          if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(prefix + key);
            return raw ? JSON.parse(raw) : null;
          }
        } catch {
          // Fallback to memory
        }
        return memoryStore.has(key) ? memoryStore.get(key) : null;
      },
      set: (key: string, value: any): void => {
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(prefix + key, JSON.stringify(value));
          }
        } catch {
          // Fallback
        }
        memoryStore.set(key, value);
      },
      remove: (key: string): void => {
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(prefix + key);
          }
        } catch {
          // Fallback
        }
        memoryStore.delete(key);
      },
      clear: (): void => {
        try {
          if (typeof localStorage !== 'undefined') {
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (k && k.startsWith(prefix)) {
                keysToRemove.push(k);
              }
            }
            keysToRemove.forEach((k) => localStorage.removeItem(k));
          }
        } catch {
          // Fallback
        }
        memoryStore.clear();
      },
    };
  }

  /**
   * Eklenti fonksiyonlarını hata yakalayıcı (fault-tolerant) wrapper ile korur.
   */
  public static async executeSafe<T>(
    pluginName: string,
    action: () => Promise<T> | T,
    fallback?: T
  ): Promise<T | undefined> {
    try {
      return await action();
    } catch (error) {
      console.error(`[PluginSandbox] Error inside plugin "${pluginName}":`, error);
      return fallback;
    }
  }
}
