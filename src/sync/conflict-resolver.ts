/**
 * Conflict Resolver - Handles concurrent update collisions with deterministic resolution
 */
import type { CrdtOperation, SyncDocument, VectorClock } from '../types/sync';

export interface ConflictResolutionResult {
  winner: 'local' | 'remote' | 'merged';
  resolvedContent: string;
  appliedClock: VectorClock;
  conflictType: 'concurrent' | 'clock_dominated' | 'same_timestamp';
}

export class ConflictResolver {
  /**
   * Resolves concurrent edits between two document states using LWW with vector clock tie-breaking
   */
  static resolveDocument(
    localDoc: SyncDocument,
    remoteDoc: SyncDocument
  ): ConflictResolutionResult {
    // 1. If timestamps differ, latest timestamp wins
    if (remoteDoc.lastModified > localDoc.lastModified) {
      return {
        winner: 'remote',
        resolvedContent: remoteDoc.content,
        appliedClock: this.mergeClocks(localDoc.clock, remoteDoc.clock),
        conflictType: 'concurrent',
      };
    } else if (localDoc.lastModified > remoteDoc.lastModified) {
      return {
        winner: 'local',
        resolvedContent: localDoc.content,
        appliedClock: this.mergeClocks(localDoc.clock, remoteDoc.clock),
        conflictType: 'concurrent',
      };
    }

    // 2. If timestamps are equal, deterministic tie-breaking (lexicographical content comparison)
    const remoteWins = remoteDoc.content.localeCompare(localDoc.content) > 0;
    return {
      winner: remoteWins ? 'remote' : 'local',
      resolvedContent: remoteWins ? remoteDoc.content : localDoc.content,
      appliedClock: this.mergeClocks(localDoc.clock, remoteDoc.clock),
      conflictType: 'same_timestamp',
    };
  }

  /**
   * Merges two vector clocks taking the maximum scalar per client
   */
  static mergeClocks(clock1: VectorClock, clock2: VectorClock): VectorClock {
    const merged: VectorClock = { ...clock1 };
    for (const [clientId, counter] of Object.entries(clock2)) {
      merged[clientId] = Math.max(merged[clientId] || 0, counter);
    }
    return merged;
  }
}
