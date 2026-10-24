/**
 * Tests for Native File Watcher & Conflict Resolution
 * Phase 108: Yerel Dosya Değişiklik İzleyicisi ve Otomatik Eşzamanlama (Native File Watcher)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileWatcherService } from '../../src/services/native/fileWatcher';

const { markInternalWrite, isInternalWrite } = require('../../electron/watcherIpc.cjs');

describe('Phase 108: Native File Watcher & Conflict Resolution', () => {
  beforeEach(() => {
    FileWatcherService.clear();
    window.electronAPI = {
      invoke: vi.fn(async (channel: string) => {
        if (channel === 'watcher:start') return { ok: true };
        if (channel === 'watcher:stop') return { ok: true };
        return { ok: true };
      }),
    } as any;
  });

  it('starts and stops watching project package via IPC', async () => {
    const started = await FileWatcherService.startWatching('/path/to/project.opscriv');
    expect(started).toBe(true);

    const stopped = await FileWatcherService.stopWatching();
    expect(stopped).toBe(true);
  });

  it('determines auto-reload when file changed externally and user has no unsaved changes', () => {
    const result = FileWatcherService.evaluateConflict({
      docId: 'chapter_1',
      isLocalDirty: false,
      localContent: 'Eski metin',
      remoteContent: 'Buluttan gelen yeni metin',
    });

    expect(result.hasConflict).toBe(false);
    expect(result.action).toBe('auto-reload');
  });

  it('triggers conflict dialog when both user and external file modified the document', () => {
    const onConflictMock = vi.fn();
    FileWatcherService.onConflict(onConflictMock);

    const result = FileWatcherService.evaluateConflict({
      docId: 'chapter_1',
      isLocalDirty: true,
      localContent: 'Kullanıcının yazdığı yeni satır',
      remoteContent: 'Dropbox tarafından senkronlanan farklı satır',
    });

    expect(result.hasConflict).toBe(true);
    expect(result.action).toBe('conflict-dialog');
    expect(onConflictMock).toHaveBeenCalledWith(
      expect.objectContaining({
        docId: 'chapter_1',
        localContent: 'Kullanıcının yazdığı yeni satır',
        remoteContent: 'Dropbox tarafından senkronlanan farklı satır',
      })
    );
  });

  it('returns none action when contents are identical', () => {
    const result = FileWatcherService.evaluateConflict({
      docId: 'chapter_1',
      isLocalDirty: false,
      localContent: 'Aynı metin',
      remoteContent: 'Aynı metin',
    });

    expect(result.hasConflict).toBe(false);
    expect(result.action).toBe('none');
  });

  it('resolves conflicts based on user choice', () => {
    const local = 'Yerel içerik';
    const remote = 'Uzak içerik';

    expect(FileWatcherService.resolveConflict('keep-local', local, remote)).toBe(local);
    expect(FileWatcherService.resolveConflict('take-remote', local, remote)).toBe(remote);

    const merged = FileWatcherService.resolveConflict('merge', local, remote);
    expect(merged).toContain('Yerel içerik');
    expect(merged).toContain('Uzak içerik');
  });

  it('suppresses internal writes from triggering false external change events', () => {
    const testFile = 'D:/OpenScriv/project.opscriv/docs/doc_1.md';

    expect(isInternalWrite(testFile)).toBe(false);

    markInternalWrite(testFile);
    expect(isInternalWrite(testFile)).toBe(true);
  });
});
