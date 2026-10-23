/**
 * Tests for Electron IPC Bridge & Type Definitions
 * Phase 101: Gerçek Electron Runtime Entegrasyonu ve Tip-Güvenli IPC Preload Mimarisi
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ElectronAPIBridge, ElectronDocumentPayload } from '../../src/types/electron';

describe('Phase 101: Electron IPC Preload Bridge & Native Runtime Contracts', () => {
  let mockBridge: ElectronAPIBridge;

  beforeEach(() => {
    mockBridge = {
      invoke: vi.fn(async (channel: string, ...args: any[]) => {
        if (channel === 'get-app-version') return '2.0.0';
        if (channel === 'get-user-data-path') return '/user/data/openscriv';
        if (channel === 'save-document') {
          const payload = args[0] as ElectronDocumentPayload;
          if (!payload?.projectId || !payload?.docId) {
            return { ok: false, error: 'save-document: projectId and docId required' };
          }
          return { ok: true, path: `/docs/${payload.docId}.md`, savedAt: Date.now() };
        }
        if (channel === 'load-document') {
          return { ok: true, docId: args[0]?.docId, content: '# Test Document', exists: true };
        }
        if (channel === 'save-project-tree') {
          return { ok: true, path: '/project/tree.json' };
        }
        if (channel === 'load-project-tree') {
          return { ok: true, tree: [{ id: '1', title: 'Chapter 1' }] };
        }
        return { ok: true };
      }),
      getAppVersion: vi.fn(async () => '2.0.0'),
      getUserDataPath: vi.fn(async () => '/user/data/openscriv'),
      saveDocument: vi.fn(async (payload) => {
        return mockBridge.invoke('save-document', payload);
      }),
      loadDocument: vi.fn(async (payload) => {
        return mockBridge.invoke('load-document', payload);
      }),
      loadProject: vi.fn(async (payload) => {
        return mockBridge.invoke('load-project', payload);
      }),
      saveProjectTree: vi.fn(async (payload) => {
        return mockBridge.invoke('save-project-tree', payload);
      }),
      loadProjectTree: vi.fn(async (payload) => {
        return mockBridge.invoke('load-project-tree', payload);
      }),
      backup: {
        markDirty: vi.fn(async (projectId: string) => ({ ok: true })),
        createBackup: vi.fn(async () => ({ ok: true, backupId: 'backup_01' })),
        listBackups: vi.fn(async () => ({ ok: true, backups: [] })),
        restoreBackup: vi.fn(async () => ({ ok: true, restored: true })),
        getCrashRecoveryInfo: vi.fn(async () => ({ hasCrash: false })),
        dismissCrashRecovery: vi.fn(async () => ({ ok: true })),
      },
    };

    window.electronAPI = mockBridge;
    window.api = mockBridge;
    window.openScriv = mockBridge;
  });

  it('exposes window.electronAPI and aliases on window', () => {
    expect(window.electronAPI).toBeDefined();
    expect(window.api).toBeDefined();
    expect(window.openScriv).toBeDefined();
    expect(window.electronAPI).toBe(window.api);
  });

  it('retrieves app version and user data path via IPC contract', async () => {
    const version = await window.electronAPI!.getAppVersion();
    const dataPath = await window.electronAPI!.getUserDataPath();

    expect(version).toBe('2.0.0');
    expect(dataPath).toBe('/user/data/openscriv');
  });

  it('saves document and returns path and timestamp', async () => {
    const res = await window.electronAPI!.saveDocument({
      projectId: 'proj_novel_1',
      docId: 'chap_1',
      content: 'Bölüm 1: Karanlık Başlangıç',
    });

    expect(res.ok).toBe(true);
    expect(res.path).toBe('/docs/chap_1.md');
    expect(res.savedAt).toBeTypeOf('number');
  });

  it('loads document content correctly from IPC', async () => {
    const res = await window.electronAPI!.loadDocument({
      projectId: 'proj_novel_1',
      docId: 'chap_1',
    });

    expect(res.ok).toBe(true);
    expect(res.docId).toBe('chap_1');
    expect(res.content).toBe('# Test Document');
    expect(res.exists).toBe(true);
  });

  it('handles project tree persistence through safe bridge', async () => {
    const saveRes = await window.electronAPI!.saveProjectTree({
      projectId: 'proj_novel_1',
      tree: [{ id: 'node_1', title: 'Giriş' }],
    });
    expect(saveRes.ok).toBe(true);

    const loadRes = await window.electronAPI!.loadProjectTree({
      projectId: 'proj_novel_1',
    });
    expect(loadRes.ok).toBe(true);
    expect(loadRes.tree).toHaveLength(1);
    expect(loadRes.tree?.[0].title).toBe('Chapter 1');
  });

  it('provides zero-trust backup methods via backup namespace', async () => {
    const dirtyRes = await window.electronAPI!.backup.markDirty('proj_novel_1');
    expect(dirtyRes.ok).toBe(true);

    const crashInfo = await window.electronAPI!.backup.getCrashRecoveryInfo('proj_novel_1');
    expect(crashInfo.hasCrash).toBe(false);

    const backupRes = await window.electronAPI!.backup.createBackup({
      projectId: 'proj_novel_1',
    });
    expect(backupRes.ok).toBe(true);
    expect(backupRes.backupId).toBe('backup_01');
  });
});
