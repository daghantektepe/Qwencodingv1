import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isDesktop,
  getPlatform,
  invoke,
  send,
  on,
  channels,
} from '../src/services/ipcBridge';

type Bridge = {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
  send: (channel: string, ...args: unknown[]) => void;
  on: (channel: string, listener: (...args: unknown[]) => void) => () => void;
  platform: string;
};

function setBridge(bridge: Bridge | null): void {
  if (bridge === null) {
    delete (window as unknown as { electronAPI?: Bridge }).electronAPI;
  } else {
    (window as unknown as { electronAPI?: Bridge }).electronAPI = bridge;
  }
}

describe('ipcBridge', () => {
  beforeEach(() => setBridge(null));

  it('bridge yokken isDesktop false döner ve güvenli fallback üretir', async () => {
    expect(isDesktop()).toBe(false);
    expect(getPlatform()).toBe('web');
    const result = await invoke('x');
    expect(result.ok).toBe(false);
    expect(send('x')).toBe(false);
    const off = on('x', () => undefined);
    expect(typeof off).toBe('function');
    expect(off()).toBeUndefined();
  });

  it('bridge varsa invoke başarılı sonuç döner', async () => {
    const invokeMock = vi.fn(async () => ({ hello: 'world' }));
    setBridge({
      invoke: invokeMock,
      send: vi.fn(),
      on: vi.fn(() => () => undefined),
      platform: 'darwin',
    });
    expect(isDesktop()).toBe(true);
    expect(getPlatform()).toBe('darwin');
    const result = await invoke<{ hello: string }>(channels.projectOpen, { id: '1' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.hello).toBe('world');
    expect(invokeMock).toHaveBeenCalledWith(channels.projectOpen, { id: '1' });
  });

  it('invoke hata durumunda ok:false ve error döner', async () => {
    setBridge({
      invoke: vi.fn(async () => {
        throw new Error('boom');
      }),
      send: vi.fn(),
      on: vi.fn(() => () => undefined),
      platform: 'linux',
    });
    const result = await invoke('x');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('boom');
  });

  it('send ve on başarılı şekilde bridge ile konuşur', () => {
    const sendMock = vi.fn();
    const off = vi.fn();
    const onMock = vi.fn(() => off);
    setBridge({
      invoke: vi.fn(async () => undefined),
      send: sendMock,
      on: onMock,
      platform: 'win32',
    });
    expect(send(channels.appReady)).toBe(true);
    expect(sendMock).toHaveBeenCalledWith(channels.appReady);
    const cleanup = on(channels.projectSave, () => undefined);
    expect(typeof cleanup).toBe('function');
    cleanup();
    expect(off).toHaveBeenCalled();
  });
});
