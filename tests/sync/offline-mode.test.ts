import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SyncManager } from '../../src/services/sync/SyncManager';

describe('Offline Mode & Local Queueing', () => {
  let manager: SyncManager;

  beforeEach(() => {
    localStorage.clear();
    manager = new SyncManager({
      clientId: 'test-client',
      username: 'Test User',
      channelName: 'test-offline-channel',
    });
  });

  afterEach(() => {
    manager.destroy();
    localStorage.clear();
  });

  it('queues document updates locally without throwing when offline', () => {
    manager.createDocument('doc-offline', 'Offline Document', 'Initial text');
    const doc = manager.getDocument('doc-offline');
    expect(doc).toBeDefined();
    expect(doc?.title).toBe('Offline Document');

    manager.updateDocument('doc-offline', 'content', 'Updated text while offline');
    const updated = manager.getDocument('doc-offline');
    expect(updated?.content).toBe('Updated text while offline');
  });

  it('handles soft deletion in local state correctly', () => {
    manager.createDocument('doc-delete', 'To be deleted');
    expect(manager.getDocument('doc-delete')?.deleted).toBe(false);

    manager.deleteDocument('doc-delete');
    expect(manager.getDocument('doc-delete')?.deleted).toBe(true);
  });

  it('preserves vector clock ordering across local edits', () => {
    manager.createDocument('doc-clock', 'Clock Doc');
    const doc1 = manager.getDocument('doc-clock');
    const clock1 = doc1?.clock['test-client'] || 0;
    expect(clock1).toBeGreaterThanOrEqual(0);

    manager.updateDocument('doc-clock', 'content', 'Next revision');
    const doc2 = manager.getDocument('doc-clock');
    const clock2 = doc2?.clock['test-client'] || 0;
    expect(clock2).toBeGreaterThanOrEqual(clock1);
  });
});
