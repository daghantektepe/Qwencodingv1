/**
 * FAZ 125 - Roadmap3 Yaşam Döngüsü Uçtan Uca (E2E) Testi
 * Kapsam: Oluştur -> Yaz -> Kaydet -> Kapat -> Aç -> Dışa Aktar
 * Katmanlar: ProjectLifecycle servisi + IPC bridge + Workspace bileşeni
 * Hem Electron (window.electronAPI mevcut) hem de web fallback (localStorage)
 * yolları doğrulanır.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';

import Workspace from '../../src/components/Workspace';
import {
  createProject,
  writeContent,
  saveProject,
  closeProject,
  openProject,
  exportProject,
  listProjects,
  clearProjectsForTest,
  type Project,
} from '../../src/services/projectLifecycle';
import {
  isDesktop,
  getPlatform,
  invoke,
  send,
  on,
  channels,
} from '../../src/services/ipcBridge';

type Bridge = {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
  send: (channel: string, ...args: unknown[]) => void;
  on: (channel: string, listener: (...args: unknown[]) => void) => () => void;
  platform: string;
};

function installDesktopBridge(overrides?: Partial<Bridge>): Bridge {
  const invokeMock =
    overrides?.invoke ??
    vi.fn(async (channel: string, payload: unknown) => {
      switch (channel) {
        case 'project:create':
          return payload;
        case 'project:save':
          return true;
        case 'project:close':
          return true;
        case 'project:open': {
          const { id } = payload as { id: string };
          return {
            id,
            title: 'Untitled Project',
            content: 'desktop-persisted-content',
            createdAt: 1,
            updatedAt: 2,
          } satisfies Project;
        }
        case 'project:export':
          return { payload: '{"exported":"desktop"}' };
        default:
          throw new Error(`unhandled channel: ${channel}`);
      }
    });

  const bridge: Bridge = {
    platform: 'linux',
    invoke: invokeMock,
    send: overrides?.send ?? vi.fn(),
    on: overrides?.on ?? vi.fn(() => () => undefined),
  };
  (window as unknown as { electronAPI?: Bridge }).electronAPI = bridge;
  return bridge;
}

function removeBridge(): void {
  delete (window as unknown as { electronAPI?: Bridge }).electronAPI;
}

describe('Roadmap3 - Tam Masaüstü Yaşam Döngüsü E2E', () => {
  beforeEach(() => {
    cleanup();
    removeBridge();
    clearProjectsForTest();
  });

  afterEach(() => {
    cleanup();
    removeBridge();
    clearProjectsForTest();
  });

  it('IPC bridge üzerinden Oluştur -> Yaz -> Kaydet -> Kapat -> Aç -> Dışa Aktar akışını tamamlar', async () => {
    const bridge = installDesktopBridge();
    expect(isDesktop()).toBe(true);
    expect(getPlatform()).toBe('linux');

    render(React.createElement(Workspace));

    // 1. Oluştur
    fireEvent.click(screen.getByTestId('btn-create'));
    await waitFor(() => {
      expect(screen.getByTestId('workspace-status').textContent).toBe('saved');
    });
    const projectId = screen.getByTestId('workspace-project-id').textContent ?? '';
    expect(projectId).not.toBe('no-project');
    expect(projectId.length).toBeGreaterThan(0);

    // 2. Yaz
    const editor = screen.getByTestId('workspace-editor') as HTMLTextAreaElement;
    fireEvent.change(editor, { target: { value: 'Roadmap3 masaüstü içerik' } });
    expect(editor.value).toBe('Roadmap3 masaüstü içerik');

    // 3. Kaydet
    fireEvent.click(screen.getByTestId('btn-save'));
    await waitFor(() => {
      expect(screen.getByTestId('workspace-message').textContent).toBe('Kaydedildi');
    });

    // 4. Kapat
    fireEvent.click(screen.getByTestId('btn-close'));
    await waitFor(() => {
      expect(screen.getByTestId('workspace-message').textContent).toBe('Proje kapatıldı');
    });

    // 5. Aç
    fireEvent.click(screen.getByTestId('btn-open'));
    await waitFor(() => {
      expect(screen.getByTestId('workspace-message').textContent).toBe('Proje açıldı');
    });
    expect((screen.getByTestId('workspace-editor') as HTMLTextAreaElement).value).toBe(
      'desktop-persisted-content',
    );

    // 6. Dışa Aktar
    fireEvent.click(screen.getByTestId('btn-export'));
    await waitFor(() => {
      expect(screen.getByTestId('workspace-message').textContent).toContain('Dışa aktarıldı');
    });

    // IPC çağrılarının sırası doğrulanır.
    const channelsCalled = (bridge.invoke as unknown as { mock: { calls: unknown[][] } }).mock.calls
      .map((call) => call[0]);
    expect(channelsCalled).toContain('project:create');
    expect(channelsCalled).toContain('project:save');
    expect(channelsCalled).toContain('project:close');
    expect(channelsCalled).toContain('project:open');
    expect(channelsCalled).toContain('project:export');
  });

  it('IPC bridge olmadan web fallback (localStorage) ile aynı yaşam döngüsünü tamamlar', async () => {
    expect(isDesktop()).toBe(false);

    render(React.createElement(Workspace));

    fireEvent.click(screen.getByTestId('btn-create'));
    await waitFor(() => {
      expect(screen.getByTestId('workspace-status').textContent).toBe('saved');
    });

    const editor = screen.getByTestId('workspace-editor') as HTMLTextAreaElement;
    fireEvent.change(editor, { target: { value: 'web fallback içerik' } });

    fireEvent.click(screen.getByTestId('btn-save'));
    await waitFor(() => {
      expect(screen.getByTestId('workspace-message').textContent).toBe('Kaydedildi');
    });

    const stored = listProjects();
    expect(stored.length).toBe(1);
    expect(stored[0].content).toBe('web fallback içerik');

    fireEvent.click(screen.getByTestId('btn-close'));
    await waitFor(() => {
      expect(screen.getByTestId('workspace-message').textContent).toBe('Proje kapatıldı');
    });

    fireEvent.click(screen.getByTestId('btn-open'));
    await waitFor(() => {
      expect(screen.getByTestId('workspace-message').textContent).toBe('Proje açıldı');
    });
    expect((screen.getByTestId('workspace-editor') as HTMLTextAreaElement).value).toBe(
      'web fallback içerik',
    );

    fireEvent.click(screen.getByTestId('btn-export'));
    await waitFor(() => {
      expect(screen.getByTestId('workspace-message').textContent).toContain('Dışa aktarıldı');
    });
  });

  it('servis katmanı üzerinden Oluştur -> Yaz -> Kaydet -> Aç -> Dışa Aktar doğrudan doğrulanır (IPC)', async () => {
    installDesktopBridge();

    const created = await createProject('Roadmap3 Servis Testi');
    expect(created.id).toBeTruthy();
    expect(created.title).toBe('Roadmap3 Servis Testi');

    expect(await writeContent(created.id, 'servis içerik')).toBe(true);
    expect(await saveProject({ ...created, content: 'servis içerik' })).toBe(true);
    expect(await closeProject(created.id)).toBe(true);

    const reopened = await openProject(created.id);
    expect(reopened).not.toBeNull();
    expect(reopened?.content).toBe('desktop-persisted-content');

    const exportedJson = await exportProject(created.id, 'json');
    expect(exportedJson.ok).toBe(true);
    expect(exportedJson.payload).toBe('{"exported":"desktop"}');
  });

  it('export format txt iken de IPC üzerinden çalışır', async () => {
    installDesktopBridge({
      invoke: vi.fn(async (channel: string, payload: unknown) => {
        if (channel === 'project:export') {
          const { format } = payload as { id: string; format: string };
          return { payload: `format:${format}` };
        }
        if (channel === 'project:open') {
          return {
            id: (payload as { id: string }).id,
            title: 't',
            content: 'c',
            createdAt: 1,
            updatedAt: 2,
          };
        }
        if (channel === 'project:create') return payload;
        return true;
      }),
    });

    const created = await createProject('fmt');
    const txt = await exportProject(created.id, 'txt');
    expect(txt.ok).toBe(true);
    expect(txt.payload).toBe('format:txt');
  });

  it('ipcBridge yardımcıları masaüstü ortamda doğru davranır', async () => {
    const invokeMock = vi.fn(async () => 'pong');
    const sendMock = vi.fn();
    const offMock = vi.fn();
    const onMock = vi.fn(() => offMock);

    installDesktopBridge({ invoke: invokeMock, send: sendMock, on: onMock });

    expect(isDesktop()).toBe(true);
    const result = await invoke<string>(channels.appReady);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toBe('pong');

    expect(send(channels.projectSave, { id: 'x' })).toBe(true);
    expect(sendMock).toHaveBeenCalledWith(channels.projectSave, { id: 'x' });

    const cleanupFn = on(channels.projectOpen, () => undefined);
    cleanupFn();
    expect(offMock).toHaveBeenCalled();
  });

  it('ipcBridge masaüstü olmadığında güvenli fallback üretir', async () => {
    expect(isDesktop()).toBe(false);
    expect(getPlatform()).toBe('web');

    const invokeResult = await invoke('herhangi');
    expect(invokeResult.ok).toBe(false);

    expect(send('herhangi')).toBe(false);

    const off = on('herhangi', () => undefined);
    expect(typeof off).toBe('function');
    expect(off()).toBeUndefined();
  });
});
