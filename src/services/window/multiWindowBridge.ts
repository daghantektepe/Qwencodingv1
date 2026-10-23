/**
 * multiWindowBridge.ts — Faz 81: Çoklu Pencere ve Harici Ekran Köprüsü
 */

export interface PopoutWindowInfo {
  id: string;
  viewId: string;
  title: string;
  url?: string;
  openedAt: number;
}

export interface DisplayInfo {
  id: number | string;
  isPrimary: boolean;
  label: string;
  bounds?: { x: number; y: number; width: number; height: number };
}

export class MultiWindowBridge {
  private broadcastChannel: BroadcastChannel | null = null;
  private openPopouts = new Map<string, PopoutWindowInfo>();
  private listeners = new Map<string, Set<(payload: any) => void>>();

  constructor() {
    this.initChannel();
  }

  private initChannel(): void {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel('openscriv_multi_window_sync');
      this.broadcastChannel.onmessage = (event) => {
        const { channel, payload } = event.data || {};
        if (channel) {
          const cListeners = this.listeners.get(channel);
          cListeners?.forEach((fn) => fn(payload));
        }
      };
    }
  }

  /**
   * Şu anki pencerenin bağımsız bir popout olup olmadığını belirler
   */
  public isPopoutMode(): boolean {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('popout') === 'true';
  }

  /**
   * Popout penceresinde gösterilecek görünüm ID'sini döner (corkboard, editor, research vb.)
   */
  public getPopoutViewId(): string | null {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('view');
  }

  /**
   * Yeni bir bağımsız pencere açar (Harici ekrana veya işletim sistemi penceresine fırlatır)
   */
  public async openPopout(
    viewId: string,
    title = 'OpenScriv Panel',
    options?: { width?: number; height?: number; displayId?: string }
  ): Promise<string> {
    const popoutId = `win-${viewId}-${Date.now()}`;
    const url = `/?popout=true&view=${encodeURIComponent(viewId)}&id=${popoutId}`;

    // 1. Electron ortamı kontrolü
    if (typeof window !== 'undefined' && (window as any).electronAPI?.openPopout) {
      await (window as any).electronAPI.openPopout({
        viewId,
        title,
        width: options?.width || 900,
        height: options?.height || 700,
        displayId: options?.displayId,
      });
    } else if (typeof window !== 'undefined') {
      // 2. Tarayıcı fallback (window.open)
      const w = options?.width || 900;
      const h = options?.height || 700;
      window.open(url, popoutId, `width=${w},height=${h},menubar=no,toolbar=no,status=no`);
    }

    const info: PopoutWindowInfo = {
      id: popoutId,
      viewId,
      title,
      url,
      openedAt: Date.now(),
    };

    this.openPopouts.set(popoutId, info);
    this.syncData('window:opened', info);
    return popoutId;
  }

  /**
   * Açık popout penceresini kapatır
   */
  public closePopout(popoutId: string): void {
    const info = this.openPopouts.get(popoutId);
    if (info) {
      this.openPopouts.delete(popoutId);
      this.syncData('window:closed', { id: popoutId, viewId: info.viewId });
    }
  }

  /**
   * Tüm pencereler arasında veri senkronizasyonu yapar
   */
  public syncData(channel: string, payload: any): void {
    // 1. Yerel dinleyicilere ilet
    const localListeners = this.listeners.get(channel);
    localListeners?.forEach((fn) => fn(payload));

    // 2. BroadcastChannel ile diğer pencerelere ilet
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ channel, payload });
    }

    // 3. Electron IPC köprüsü
    if (typeof window !== 'undefined' && (window as any).electronAPI?.syncState) {
      (window as any).electronAPI.syncState({ channel, payload });
    }
  }

  /**
   * Belirli bir kanaldan gelen pencere güncellemelerini dinler
   */
  public subscribe(channel: string, callback: (payload: any) => void): () => void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    const set = this.listeners.get(channel)!;
    set.add(callback);

    return () => {
      set.delete(callback);
    };
  }

  /**
   * Aktif açık popout pencerelerin listesini döner
   */
  public getOpenPopouts(): PopoutWindowInfo[] {
    return Array.from(this.openPopouts.values());
  }

  /**
   * Bağlı ekranların listesini sorgular
   */
  public async getDisplays(): Promise<DisplayInfo[]> {
    if (typeof window !== 'undefined' && (window as any).electronAPI?.getDisplays) {
      return (window as any).electronAPI.getDisplays();
    }
    // Web fallback
    return [
      {
        id: 'primary',
        isPrimary: true,
        label: 'Ana Ekran (Masaüstü)',
        bounds: {
          x: 0,
          y: 0,
          width: typeof window !== 'undefined' ? window.innerWidth : 1920,
          height: typeof window !== 'undefined' ? window.innerHeight : 1080,
        },
      },
    ];
  }

  public clear(): void {
    this.openPopouts.clear();
    this.listeners.clear();
  }
}

export const multiWindowBridge = new MultiWindowBridge();
export default multiWindowBridge;
