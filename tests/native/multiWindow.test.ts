/**
 * Tests for Detached Multi-Window & Floating Tools Bridge
 * Phase 105: Çoklu Pencere (Detached Multi-Window) ve Yüzen Araçlar Köprüsü
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WindowBridge } from '../../src/services/native/windowBridge';

describe('Phase 105: Detached Multi-Window & Real-Time Sync Bridge', () => {
  beforeEach(() => {
    window.electronAPI = {
      invoke: vi.fn(async (channel: string, payload?: any) => {
        if (channel === 'window:open-detached') {
          return { ok: true, windowId: payload.windowId, created: true };
        }
        if (channel === 'window:close-detached') {
          return { ok: true };
        }
        if (channel === 'window:broadcast-event') {
          return { ok: true };
        }
        return { ok: true };
      }),
    } as any;
  });

  it('opens detached pop-out window via IPC bridge', async () => {
    const res = await WindowBridge.openDetachedWindow({
      windowId: 'detached_scratchpad',
      title: 'Hızlı Karalama Defteri',
      width: 700,
      height: 500,
      route: '/scratchpad',
    });

    expect(res.ok).toBe(true);
    expect(res.windowId).toBe('detached_scratchpad');
  });

  it('closes detached pop-out window cleanly', async () => {
    const closed = await WindowBridge.closeDetachedWindow('detached_scratchpad');
    expect(closed).toBe(true);
  });

  it('broadcasts real-time events to all subscribed window listeners', () => {
    const onNoteUpdate = vi.fn();
    const unsubscribe = WindowBridge.subscribe('scratchpad:update', onNoteUpdate);

    WindowBridge.broadcast('scratchpad:update', {
      noteText: 'Gizli ajan limanda bekliyor...',
      docId: 'note_01',
    });

    expect(onNoteUpdate).toHaveBeenCalledTimes(1);
    expect(onNoteUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        noteText: 'Gizli ajan limanda bekliyor...',
        docId: 'note_01',
      })
    );

    // Unsubscribe
    unsubscribe();
    WindowBridge.broadcast('scratchpad:update', { noteText: 'İkinci güncelleme' });
    expect(onNoteUpdate).toHaveBeenCalledTimes(1);
  });

  it('supports multiple independent subscribers on separate channels', () => {
    const corkboardListener = vi.fn();
    const codexListener = vi.fn();

    const unsub1 = WindowBridge.subscribe('corkboard:reorder', corkboardListener);
    const unsub2 = WindowBridge.subscribe('codex:character-updated', codexListener);

    WindowBridge.broadcast('corkboard:reorder', { cardId: 'c1', newIndex: 3 });
    expect(corkboardListener).toHaveBeenCalledWith({ cardId: 'c1', newIndex: 3 });
    expect(codexListener).not.toHaveBeenCalled();

    WindowBridge.broadcast('codex:character-updated', { characterName: 'Eren' });
    expect(codexListener).toHaveBeenCalledWith({ characterName: 'Eren' });

    unsub1();
    unsub2();
  });
});
