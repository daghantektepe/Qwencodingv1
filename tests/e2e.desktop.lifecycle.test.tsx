/**
 * FAZ 125 - Uçtan Uca Masaüstü Yaşam Döngüsü E2E Testi
 * Oluştur -> Yaz -> Kaydet -> Kapat -> Aç -> Dışa Aktar
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import Workspace from '../src/components/Workspace';
import {
  clearProjectsForTest,
  listProjects,
} from '../src/services/projectLifecycle';

type ElectronBridge = {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
  send: (channel: string, ...args: unknown[]) => void;
  on: (channel: string, listener: (...args: unknown[]) => void) => () => void;
  platform: string;
};

function installBridge(): ElectronBridge {
  const bridge: ElectronBridge = {
    platform: 'linux',
    invoke: vi.fn(async (channel: string, payload: unknown) => {
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
            content: 'persisted-content',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
        }
        case 'project:export':
          return { payload: '{"exported":true}' };
        default:
          throw new Error(`unhandled channel ${channel}`);
      }
    }),
    send: vi.fn(),
    on: vi.fn(() => () => undefined),
  };
  (window as unknown as { electronAPI?: ElectronBridge }).electronAPI = bridge;
  return bridge;
}

function uninstallBridge(): void {
  delete (window as unknown as { electronAPI?: ElectronBridge }).electronAPI;
}

describe('E2E Masaüstü Yaşam Döngüsü', () => {
  beforeEach(() => {
    cleanup();
    uninstallBridge();
    clearProjectsForTest();
  });

  it('Oluştur -> Yaz -> Kaydet -> Kapat -> Aç -> Dışa Aktar akışını tamamlar', async () => {
    installBridge();
    render(<Workspace />);

    // 1. Oluştur
    fireEvent.click(screen.getByTestId('btn-create'));
    await waitFor(() => {
      expect(screen.getByTestId('workspace-status').textContent).toBe('saved');
    });
    const projectId = screen.getByTestId('workspace-project-id').textContent;
    expect(projectId).toBeTruthy();
    expect(projectId).not.toBe('no-project');

    // 2. Yaz
    const editor = screen.getByTestId('workspace-editor') as HTMLTextAreaElement;
    fireEvent.change(editor, { target: { value: 'Merhaba Scrivener' } });
    expect(editor.value).toBe('Merhaba Scrivener');

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
      'persisted-content',
    );

    // 6. Dışa Aktar
    fireEvent.click(screen.getByTestId('btn-export'));
    await waitFor(() => {
      expect(screen.getByTestId('workspace-message').textContent).toContain('Dışa aktarıldı');
    });
  });

  it('web fallback ile localStorage üzerinden tam yaşam döngüsünü tamamlar', async () => {
    render(<Workspace />);

    fireEvent.click(screen.getByTestId('btn-create'));
    await waitFor(() => {
      expect(screen.getByTestId('workspace-status').textContent).toBe('saved');
    });

    const editor = screen.getByTestId('workspace-editor') as HTMLTextAreaElement;
    fireEvent.change(editor, { target: { value: 'web içerik' } });

    fireEvent.click(screen.getByTestId('btn-save'));
    await waitFor(() => {
      expect(screen.getByTestId('workspace-message').textContent).toBe('Kaydedildi');
    });

    const projects = listProjects();
    expect(projects.length).toBe(1);
    expect(projects[0].content).toBe('web içerik');
  });
});
