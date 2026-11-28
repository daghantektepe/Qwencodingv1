import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createProject,
  writeContent,
  saveProject,
  closeProject,
  openProject,
  exportProject,
  listProjects,
  clearProjectsForTest,
} from '../src/services/projectLifecycle';

type Bridge = {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
  send: (channel: string, ...args: unknown[]) => void;
  on: (channel: string, listener: (...args: unknown[]) => void) => () => void;
  platform: string;
};

function clearBridge(): void {
  delete (window as unknown as { electronAPI?: Bridge }).electronAPI;
}

describe('projectLifecycle (web fallback)', () => {
  beforeEach(() => {
    clearBridge();
    clearProjectsForTest();
  });

  it('oluşturur, yazar, kaydeder ve açar', async () => {
    const created = await createProject('Deneme');
    expect(created.id).toBeTruthy();
    expect(created.title).toBe('Deneme');

    const wrote = await writeContent(created.id, 'içerik');
    expect(wrote).toBe(true);

    const updated = { ...created, content: 'içerik' };
    expect(await saveProject(updated)).toBe(true);

    const opened = await openProject(created.id);
    expect(opened?.content).toBe('içerik');
  });

  it('export JSON ve TXT formatlarını üretir', async () => {
    const created = await createProject('Exp');
    await writeContent(created.id, 'satır');
    await saveProject({ ...created, content: 'satır' });

    const json = await exportProject(created.id, 'json');
    expect(json.ok).toBe(true);
    expect(json.payload).toContain('satır');

    const txt = await exportProject(created.id, 'txt');
    expect(txt.ok).toBe(true);
    expect(txt.payload).toBe('satır');
  });

  it('var olmayan proje export edilemez', async () => {
    const result = await exportProject('nope', 'txt');
    expect(result.ok).toBe(false);
  });

  it('closeProject true döner, listProjects projeleri sayar', async () => {
    const created = await createProject('X');
    expect(await closeProject(created.id)).toBe(true);
    expect(listProjects().length).toBe(1);
  });

  it('writeContent var olmayan id için false döner', async () => {
    expect(await writeContent('missing', 'x')).toBe(false);
  });
});

describe('projectLifecycle (electron bridge)', () => {
  beforeEach(() => {
    clearProjectsForTest();
    (window as unknown as { electronAPI?: Bridge }).electronAPI = {
      platform: 'linux',
      invoke: vi.fn(async (channel: string, payload: unknown) => {
        if (channel === 'project:create') return payload;
        if (channel === 'project:save') return true;
        if (channel === 'project:close') return true;
        if (channel === 'project:open') {
          const { id } = payload as { id: string };
          return { id, title: 't', content: 'remote', createdAt: 1, updatedAt: 2 };
        }
        if (channel === 'project:export') return { payload: 'remote-export' };
        throw new Error('unhandled');
      }),
      send: vi.fn(),
      on: vi.fn(() => () => undefined),
    };
  });

  it('IPC üzerinden remote yaşam döngüsünü yürütür', async () => {
    const created = await createProject('remote');
    expect(created.id).toBeTruthy();
    expect(await writeContent(created.id, 'x')).toBe(true);
    expect(await saveProject(created)).toBe(true);
    expect(await closeProject(created.id)).toBe(true);
    const opened = await openProject(created.id);
    expect(opened?.content).toBe('remote');
    const exported = await exportProject(created.id, 'txt');
    expect(exported.ok).toBe(true);
    expect(exported.payload).toBe('remote-export');
  });
});
