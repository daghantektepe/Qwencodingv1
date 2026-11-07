/**
 * Faz 0 / 0.1: Hızlı not penceresi tam uygulamayı açmaz; not ana pencerede karalama defterine düşer.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const appRendered = vi.hoisted(() => vi.fn());

vi.mock('../../src/App.tsx', () => ({
  default: () => {
    appRendered();
    return <div data-testid="full-app" />;
  },
}));

describe('Hızlı not penceresi (#quick-note)', () => {
  beforeEach(() => {
    vi.resetModules();
    appRendered.mockClear();
    document.body.innerHTML = '<div id="root"></div>';
  });

  afterEach(() => {
    window.location.hash = '';
    delete (window as any).electronAPI;
  });

  it('yalnızca hızlı not arayüzünü çizer, App (proje açma/kaydetme) hiç yüklenmez; not ana sürece iletilir', async () => {
    window.location.hash = '#quick-note';
    const invoke = vi.fn(async () => ({ ok: true }));
    (window as any).electronAPI = { invoke };

    await act(async () => {
      await import('../../src/main.tsx');
    });
    await waitFor(() => expect(screen.getByTestId('quick-note-popup')).toBeInTheDocument());
    expect(appRendered).not.toHaveBeenCalled();

    const textarea = screen.getByTestId('quick-note-textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Tren istasyonu sahnesi' } });
    fireEvent.click(screen.getByTestId('quick-note-save-btn'));

    expect(invoke).toHaveBeenCalledWith(
      'tray:quick-note-save',
      expect.objectContaining({ text: 'Tren istasyonu sahnesi', category: 'Fikir' })
    );
    expect(invoke).not.toHaveBeenCalledWith('project:read-package', expect.anything());
    expect(invoke).not.toHaveBeenCalledWith('project:save-package', expect.anything());
    // Pencere yalnızca gizlenir: yeniden açılınca aynı not ikinci kez kaydedilmesin.
    expect(textarea.value).toBe('');
  });

  it('ana pencerede (hash yok) tam uygulama çizilir', async () => {
    await act(async () => {
      await import('../../src/main.tsx');
    });
    await waitFor(() => expect(screen.getByTestId('full-app')).toBeInTheDocument());
    expect(screen.queryByTestId('quick-note-popup')).toBeNull();
  });
});

describe('Ana pencere hızlı notu karalama defterine ekler', () => {
  it('tray:quick-note-save olayı notu karalama defterine (proje ağacına değil) kaydeder', async () => {
    window.localStorage.removeItem('openscriv:scratchpad:v1');
    const listeners: Record<string, Function> = {};
    (window as any).electronAPI = {
      invoke: vi.fn(async () => ({ ok: false })),
      on: vi.fn((channel: string, cb: Function) => {
        listeners[channel] = cb;
        return () => {};
      }),
    };
    const { App } = await vi.importActual<typeof import('../../src/App')>('../../src/App');
    render(<App />);

    expect(listeners['tray:quick-note-save']).toBeTypeOf('function');
    act(() => {
      listeners['tray:quick-note-save']({}, { text: 'Kayıp anahtar', category: 'Fikir', createdAt: '2026-01-01T00:00:00.000Z' });
    });

    const notes = JSON.parse(window.localStorage.getItem('openscriv:scratchpad:v1') || '[]');
    expect(notes[0]).toMatchObject({ text: '[Fikir] Kayıp anahtar', updated: '2026-01-01T00:00:00.000Z' });
    delete (window as any).electronAPI;
  });
});
