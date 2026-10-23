/**
 * Window State Keeper Service
 * Phase 104: Pencere Konumu, Boyutu ve Çoklu Monitör Durum Hafızası
 */

export interface WindowStateData {
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized: boolean;
  savedAt?: string;
}

export class WindowStateService {
  private static STORAGE_KEY = 'openscriv_window_state';

  /**
   * Mevcut pencere durumunu alır.
   */
  static async getWindowState(): Promise<WindowStateData> {
    if (window.electronAPI?.invoke) {
      try {
        const res = await window.electronAPI.invoke('window:get-state');
        if (res?.state) return res.state;
      } catch {
        // fallback
      }
    }

    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }

    return {
      x: 100,
      y: 100,
      width: 1280,
      height: 820,
      isMaximized: false,
    };
  }

  /**
   * Pencere durumunu güvenli koordinatlara sıfırlar.
   */
  static async resetToCenter(): Promise<WindowStateData> {
    const defaultState: WindowStateData = {
      x: 100,
      y: 100,
      width: 1280,
      height: 820,
      isMaximized: false,
      savedAt: new Date().toISOString(),
    };

    if (window.electronAPI?.invoke) {
      try {
        await window.electronAPI.invoke('window:reset-state');
      } catch {
        // ignore
      }
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(defaultState));
    } catch {
      // ignore
    }

    return defaultState;
  }

  /**
   * Pencere durumunu saklar.
   */
  static saveState(state: Partial<WindowStateData>): void {
    try {
      const current = {
        x: state.x ?? 100,
        y: state.y ?? 100,
        width: state.width ?? 1280,
        height: state.height ?? 820,
        isMaximized: Boolean(state.isMaximized),
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(current));
    } catch {
      // ignore
    }
  }
}
