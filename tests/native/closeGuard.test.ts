import { describe, it, expect, vi } from 'vitest';

const { installCloseGuard } = require('../../electron/closeGuard.cjs');

// Kapanış koruması (CF-07): main süreç, renderer kaydı bitirip onaylamadan pencereyi kapatmaz.
function setup(response = 0) {
  const handlers: Record<string, any> = {};
  const ipcMain = { handle: vi.fn((ch: string, fn: any) => { handlers[ch] = fn; }) };
  const dialog = { showMessageBox: vi.fn(async () => ({ response })) };
  const listeners: Record<string, any> = {};
  const win: any = {
    webContents: { id: 7, send: vi.fn() },
    on: vi.fn((ev: string, fn: any) => { listeners[ev] = fn; }),
    isDestroyed: () => false,
    close: vi.fn(() => listeners.close({ preventDefault: vi.fn() })),
    destroy: vi.fn(),
  };
  installCloseGuard(win, { ipcMain, dialog, timeoutMs: 1000 });
  const fireClose = () => { const e = { preventDefault: vi.fn() }; listeners.close(e); return e; };
  const ack = (res: any) => handlers['app:close-ready']({ sender: { id: 7 } }, res);
  const tick = () => new Promise((r) => setTimeout(r, 0));
  return { win, dialog, fireClose, ack, tick };
}

describe('closeGuard (CF-07)', () => {
  it('blocks close until the renderer acks a finished save', async () => {
    const { win, fireClose, ack, tick } = setup();
    const e = fireClose();
    expect(e.preventDefault).toHaveBeenCalled();
    expect(win.webContents.send).toHaveBeenCalledWith('app:before-close');
    expect(win.close).not.toHaveBeenCalled();

    ack({ ok: true });
    await tick();
    expect(win.close).toHaveBeenCalledTimes(1);
    expect(win.destroy).not.toHaveBeenCalled();
  });

  it('asks the user when the save failed and stays open on "Açık kalsın"', async () => {
    const { win, dialog, fireClose, ack, tick } = setup(0);
    fireClose();
    ack({ ok: false });
    await tick();
    expect(dialog.showMessageBox).toHaveBeenCalledTimes(1);
    expect(win.close).not.toHaveBeenCalled();
    expect(win.destroy).not.toHaveBeenCalled();
    // Yeniden kapatma denenebilir
    fireClose();
    expect(win.webContents.send).toHaveBeenCalledTimes(2);
  });

  it('asks instead of closing when the renderer never answers', async () => {
    vi.useFakeTimers();
    const { win, dialog, fireClose } = setup(1);
    fireClose();
    await vi.advanceTimersByTimeAsync(1000);
    expect(dialog.showMessageBox).toHaveBeenCalledTimes(1);
    expect(win.destroy).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
