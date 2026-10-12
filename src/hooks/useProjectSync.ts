/**
 * useProjectSync Hook - High-level hook managing local-first project synchronization
 */
import { useSync } from './useSync';
import type { ClientId, SyncStatus } from '../types/sync';

export interface UseProjectSyncOptions {
  clientId?: ClientId;
  username?: string;
  channelName?: string;
}

export function useProjectSync(options: UseProjectSyncOptions = {}) {
  const clientId = options.clientId || `client-${Math.random().toString(36).slice(2, 9)}`;
  const username = options.username || 'Yazar';
  
  const sync = useSync({
    clientId,
    username,
    channelName: options.channelName || 'openscriv-sync',
  });

  const syncStatus: SyncStatus = sync.isSynced ? 'synced' : 'offline';

  return {
    ...sync,
    clientId,
    username,
    syncStatus,
    peerCount: sync.presences.length,
  };
}

export { useProjectSync as default };
