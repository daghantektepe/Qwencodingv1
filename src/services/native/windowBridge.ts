/**
 * Detached Multi-Window Bridge & Real-Time Sync Service
 * Phase 105: Çoklu Pencere (Detached Multi-Window) ve Yüzen Araçlar Köprüsü
 */

export interface DetachedWindowConfig {
  windowId: string;
  title: string;
  width?: number;
  height?: number;
  route?: string;
  data?: any;
}

export interface WindowSyncMessage {
  channel: string;
  payload: any;
  senderId?: string;
  timestamp: number;
}

type SyncCallback = (payload: any) => void;

export class WindowBridge {
  private static listeners = new Map<string, Set<SyncCallback>>();
  private static broadcastChannel: BroadcastChannel | null = null;
  private static isInitialized = false;

  private static ensureInitialized() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Web BroadcastChannel fallback
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.broadcastChannel = new BroadcastChannel('openscriv_windows_sync');
        this.broadcastChannel.onmessage = (event) => {
          const msg = event.data as WindowSyncMessage;
          if (msg && msg.channel) {
            this.notifyListeners(msg.channel, msg.payload);
          }
        };
      }
    } catch {
      // ignore
    }
  }

  private static notifyListeners(channel: string, payload: any) {
    const set = this.listeners.get(channel);
    if (set) {
      for (const cb of set) {
        try {
          cb(payload);
        } catch (err) {
          console.error(`[WindowBridge] Listener error on ${channel}:`, err);
        }
      }
    }
  }

  /**
   * Yeni bir ayrık pencere (Scratchpad, Corkboard, Codex vb.) açar.
   */
  static async openDetachedWindow(config: DetachedWindowConfig): Promise<{ ok: boolean; windowId: string; reused?: boolean; error?: string }> {
    this.ensureInitialized();

    if (window.electronAPI?.invoke) {
      try {
        const res = await window.electronAPI.invoke('window:open-detached', config);
        return res;
      } catch (err: any) {
        return { ok: false, windowId: config.windowId, error: err.message };
      }
    }

    // Web Fallback: window.open
    try {
      const width = config.width || 800;
      const height = config.height || 600;
      const left = window.screenX + 50;
      const top = window.screenY + 50;
      window.open(
        `#${config.route || config.windowId}`,
        config.windowId,
        `width=${width},height=${height},left=${left},top=${top},resizable=yes`
      );
      return { ok: true, windowId: config.windowId, reused: false };
    } catch (err: any) {
      return { ok: false, windowId: config.windowId, error: err.message };
    }
  }

  /**
   * Ayrık pencereyi kapatır.
   */
  static async closeDetachedWindow(windowId: string): Promise<boolean> {
    if (window.electronAPI?.invoke) {
      try {
        const res = await window.electronAPI.invoke('window:close-detached', { windowId });
        return Boolean(res?.ok);
      } catch {
        return false;
      }
    }
    return true;
  }

  /**
   * Tüm açık pencerelere (ana pencere + tüm ayrık pop-out pencereler) anlık mesaj yayınlar.
   */
  static broadcast(channel: string, payload: any, senderId?: string): void {
    this.ensureInitialized();

    // 1) Yerel dinleyicileri tetikle
    this.notifyListeners(channel, payload);

    // 2) Electron IPC yayını
    if (window.electronAPI?.invoke) {
      window.electronAPI.invoke('window:broadcast-event', {
        channel,
        payload,
        senderId,
      }).catch(() => {});
    }

    // 3) Web BroadcastChannel yayını
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          channel,
          payload,
          senderId,
          timestamp: Date.now(),
        });
      } catch {
        // ignore
      }
    }
  }

  /**
   * Pencereler arası senkronizasyon kanalını dinler.
   */
  static subscribe(channel: string, callback: SyncCallback): () => void {
    this.ensureInitialized();

    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)!.add(callback);

    return () => {
      const set = this.listeners.get(channel);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(channel);
        }
      }
    };
  }
}
