import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CrdtEngine } from '../../src/services/sync/CrdtEngine';
import { SyncManager } from '../../src/services/sync/SyncManager';
import { ConflictResolver } from '../../src/sync/conflict-resolver';
import { PresenceTracker } from '../../src/sync/presence-tracker';

describe('CRDT Integration & Multi-Client Sync', () => {
  let engineA: CrdtEngine;
  let engineB: CrdtEngine;

  beforeEach(() => {
    localStorage.clear();
    engineA = new CrdtEngine();
    engineB = new CrdtEngine();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('converges two replicas after applying concurrent operations', () => {
    const clockA = engineA.incrementClock('client-A');
    const clockB = engineB.incrementClock('client-B');

    const opA = engineA.createOperation('doc-1', 'title', 'Title from A', 'client-A', 'update');
    const opB = engineB.createOperation('doc-1', 'title', 'Title from B', 'client-B', 'update');

    engineA.applyOperation(opB);
    engineB.applyOperation(opA);

    const docA = engineA.getDocument('doc-1');
    const docB = engineB.getDocument('doc-1');

    expect(docA).not.toBeNull();
    expect(docB).not.toBeNull();
    expect(docA?.title).toBe(docB?.title);
  });

  it('resolves conflicts deterministically using ConflictResolver', () => {
    const doc1 = {
      docId: 'chapter-1',
      title: 'Chapter 1',
      content: 'Local Draft Content',
      clock: { 'client-A': 2 },
      lastModified: 1000,
      deleted: false,
    };

    const doc2 = {
      docId: 'chapter-1',
      title: 'Chapter 1',
      content: 'Remote Draft Content',
      clock: { 'client-B': 3 },
      lastModified: 2000,
      deleted: false,
    };

    const result = ConflictResolver.resolveDocument(doc1, doc2);
    expect(result.winner).toBe('remote');
    expect(result.resolvedContent).toBe('Remote Draft Content');
    expect(result.appliedClock['client-A']).toBe(2);
    expect(result.appliedClock['client-B']).toBe(3);
  });

  it('tracks peer presence and removes stale peers correctly', () => {
    const tracker = new PresenceTracker('client-A', 500);
    tracker.updatePresence({
      clientId: 'client-B',
      username: 'Alice',
      lastSeen: Date.now(),
      status: 'online',
    });

    expect(tracker.getActivePeers().length).toBe(1);
    expect(tracker.getActivePeers()[0].username).toBe('Alice');

    tracker.removePeer('client-B');
    expect(tracker.getActivePeers().length).toBe(0);
  });
});
