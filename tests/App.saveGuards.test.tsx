import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App';

const { buildMenuTemplate } = require('../electron/menuTemplate.cjs');

const treeA = [
  { id: 'folder-a', type: 'folder', title: 'Taslak', children: [{ id: 'doc-a', type: 'doc', title: 'A Bölüm', content: 'A' }] },
];

// Masaüstü köprüsü taklidi: menüden ve main süreçten gelen olaylar yakalanır.
function mountDesktop(savePackage: (p: any) => Promise<any>) {
  const listeners: Record<string, (e: unknown, msg?: any) => any> = {};
  const api = {
    readPackage: vi.fn(async ({ packagePath }: any) => ({
      ok: true,
      packagePath,
      manifest: { id: packagePath, name: packagePath },
      tree: packagePath === '/A.opscriv' ? treeA : [],
    })),
    savePackage: vi.fn(savePackage),
    pickDirectory: vi.fn(async () => ({ canceled: false, path: '/B.opscriv' })),
    defaultProjectDir: vi.fn(async () => '/'),
    loadProjectTree: vi.fn(async () => ({ ok: false })),
    invoke: vi.fn(async () => ({ ok: true })),
    on: vi.fn((ch: string, fn: any) => { listeners[ch] = fn; return () => delete listeners[ch]; }),
  };
  (window as any).electronAPI = api;
  window.localStorage.setItem('openscriv:recent-projects:v1', JSON.stringify([{ path: '/A.opscriv', name: 'A' }]));
  render(<App />);
  return { api, listeners };
}

async function editActiveDoc(html: string) {
  await act(async () => { await new Promise((r) => setTimeout(r, 50)); }); // proje yüklemesi otursun
  const editor = await waitFor(() => {
    const surface = screen.getByLabelText('Metin editörü', { selector: '[role="textbox"]' }) as HTMLElement & { editor: any };
    expect(surface.editor).toBeTruthy();
    return surface.editor;
  });
  act(() => { editor.commands.setContent(html, true); });}

afterEach(() => {
  delete (window as any).electronAPI;
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('Faz 0.7: pending saves on close and project switch', () => {
  it('answers the main-process close request only after the in-flight save finished', async () => {
    let finish!: (v: any) => void;
    const { api, listeners } = mountDesktop(() => new Promise((r) => { finish = r; }));
    await editActiveDoc('<p>Son cümle</p>');

    const done = listeners['app:before-close'](null);
    await waitFor(() => expect(api.savePackage).toHaveBeenCalled());
    expect(api.invoke).not.toHaveBeenCalledWith('app:close-ready', expect.anything());

    await act(async () => { finish({ ok: true }); await done; });
    expect(api.invoke).toHaveBeenCalledWith('app:close-ready', { ok: true });
  });

  it('reports a failed save to the main process instead of letting the window close', async () => {
    const { api, listeners } = mountDesktop(async () => ({ ok: false, error: 'disk yok' }));
    await editActiveDoc('<p>Kaydedilemeyen</p>');

    await act(async () => { await listeners['app:before-close'](null); });
    expect(api.invoke).toHaveBeenCalledWith('app:close-ready', { ok: false });
  });

  it('keeps the current project open when its flush fails and the user declines', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { api, listeners } = mountDesktop(async () => ({ ok: false, error: 'disk yok' }));
    await editActiveDoc('<p>Kaydedilemeyen</p>');

    await act(async () => { await listeners['menu:action'](null, { action: 'file:open-project' }); });
    await waitFor(() => expect(confirm).toHaveBeenCalledWith(expect.stringContaining('kaydedilemedi')));
    expect(api.readPackage).not.toHaveBeenCalledWith({ packagePath: '/B.opscriv' });
    expect(screen.getByLabelText('Metin editörü', { selector: '[role="textbox"]' })).toHaveTextContent('Kaydedilemeyen');
  });
});

describe('Faz 0.5: "Yedekleme Geçmişi" is hidden until real disk backups exist', () => {
  it('has no entry in the tools drawer, command palette or native menu, and writes no localStorage backups', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    Element.prototype.scrollIntoView = vi.fn(); // jsdom'da yok; komut paleti çağırıyor
    render(<App />);

    fireEvent.click(screen.getByLabelText('Stüdyo araçları'));
    expect(screen.queryByText(/Yedekleme Geçmişi/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Komut paleti', { selector: 'button' }));
    expect(screen.queryByText(/Yedekleme/)).not.toBeInTheDocument();

    const labels = JSON.stringify(buildMenuTemplate({ isDestroyed: () => false, webContents: { send: vi.fn() } }), (k, v) => (typeof v === 'function' ? undefined : v));
    expect(labels).not.toMatch(/Yedekleme/);

    await act(async () => { await vi.advanceTimersByTimeAsync(10 * 60 * 1000); });
    expect(window.localStorage.getItem('openscriv_redundant_backups')).toBeNull();
    vi.useRealTimers();
  });
});
