/**
 * Electron köprüsü (preload) — masaüstü penceresinde renderer'a güvenli,
 * dar kapsamlı bir API yüzeyi tanımlır. Tarayıcıda (Vite dev / Vitest) bu
 * modül çalıştırılmaz; UI bileşenleri `window.electronAPI` yoksa kendi
 * no-op fallback'lerini kullanır.
 *
 * electron/main.js preload olarak bu dosyanın derlenmiş çıktısını yükler:
 *   new BrowserWindow({ webPreferences: { preload: path.join(__dirname, 'preload.js') } })
 */
import { contextBridge, ipcRenderer } from 'electron';

export interface SaveFileRequest {
  name: string; // önerilen dosya adı (örn. "corkboard.json")
  data: string; // UTF-8 içerik
}

export interface SaveFileResult {
  ok: boolean;
  canceled?: boolean;
  path?: string;
  error?: string;
}

const api = {
  /** Dosya kaydetme diyalogu açar; ana süreçte dialog + fs.write yürütülür. */
  async saveFile(req: SaveFileRequest): Promise<SaveFileResult> {
    try {
      const res = await ipcRenderer.invoke('bridge:save-file', req);
      return (res ?? { ok: false, error: 'ipc-no-response' }) as SaveFileResult;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: msg };
    }
  },

  /** Uygulama sürümü bilgisi (durum çubuğunda gösterilebilir). */
  getAppVersion(): Promise<string> {
    return ipcRenderer.invoke('bridge:app-version');
  },

  /** Ana süreçten gelen olaylara abone olma (tek kanal beyaz listesiyle). */
  on(channel: 'menu-command', listener: (payload: unknown) => void): () => void {
    if (channel !== 'menu-command') {
      throw new Error(`Electron bridge: "${channel}" kanalı izinli değil`);
    }
    const wrapped = (_evt: unknown, payload: unknown): void => {
      listener(payload);
    };
    ipcRenderer.on(channel, wrapped);
    return () => {
      ipcRenderer.removeListener(channel, wrapped);
    };
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type ElectronBridgeApi = typeof api;
