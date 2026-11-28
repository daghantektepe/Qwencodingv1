/**
 * IPC Bridge Service
 * Electron ile renderer arasındaki tüm IPC çağrılarını tek bir yerde toplar.
 * window.electronAPI yoksa (tarayıcı/test ortamı) güvenli fallback döner.
 */

export type IpcResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

type ElectronAPI = {
  invoke?: (channel: string, ...args: unknown[]) => Promise<unknown>;
  send?: (channel: string, ...args: unknown[]) => void;
  on?: (channel: string, listener: (...args: unknown[]) => void) => () => void;
  platform?: string;
};

function getBridge(): ElectronAPI | null {
  if (typeof window === 'undefined') return null;
  const api = (window as unknown as { electronAPI?: ElectronAPI }).electronAPI;
  return api ?? null;
}

export function isDesktop(): boolean {
  return getBridge() !== null;
}

export function getPlatform(): string {
  return getBridge()?.platform ?? 'web';
}

export async function invoke<T = unknown>(
  channel: string,
  ...args: unknown[]
): Promise<IpcResult<T>> {
  const bridge = getBridge();
  if (!bridge || typeof bridge.invoke !== 'function') {
    return { ok: false, error: `IPC bridge unavailable for channel: ${channel}` };
  }
  try {
    const data = (await bridge.invoke(channel, ...args)) as T;
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function send(channel: string, ...args: unknown[]): boolean {
  const bridge = getBridge();
  if (!bridge || typeof bridge.send !== 'function') return false;
  try {
    bridge.send(channel, ...args);
    return true;
  } catch {
    return false;
  }
}

export function on(
  channel: string,
  listener: (...args: unknown[]) => void,
): () => void {
  const bridge = getBridge();
  if (!bridge || typeof bridge.on !== 'function') return () => undefined;
  try {
    return bridge.on(channel, listener);
  } catch {
    return () => undefined;
  }
}

export const channels = {
  projectOpen: 'project:open',
  projectSave: 'project:save',
  projectClose: 'project:close',
  projectExport: 'project:export',
  projectCreate: 'project:create',
  appQuit: 'app:quit',
  appReady: 'app:ready',
} as const;
