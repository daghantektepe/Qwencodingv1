/**
 * Presence Tracker - Tracks real-time presence, peer cursors, and active collaboration state
 */
import type { ClientId, PeerPresence } from '../types/sync';

export class PresenceTracker {
  private peers: Map<ClientId, PeerPresence> = new Map();
  private localClientId: ClientId;
  private readonly heartbeatTimeoutMs: number;

  constructor(localClientId: ClientId, heartbeatTimeoutMs: number = 10000) {
    this.localClientId = localClientId;
    this.heartbeatTimeoutMs = heartbeatTimeoutMs;
  }

  /**
   * Updates or registers presence information for a peer
   */
  updatePresence(presence: PeerPresence): void {
    this.peers.set(presence.clientId, {
      ...presence,
      lastSeen: Date.now(),
    });
  }

  /**
   * Returns list of currently active online peers
   */
  getActivePeers(): PeerPresence[] {
    const now = Date.now();
    const active: PeerPresence[] = [];

    for (const [id, peer] of this.peers.entries()) {
      if (id !== this.localClientId && now - peer.lastSeen <= this.heartbeatTimeoutMs) {
        active.push(peer);
      }
    }
    return active;
  }

  /**
   * Cleans up stale peer records
   */
  cleanupStalePeers(): void {
    const now = Date.now();
    for (const [id, peer] of this.peers.entries()) {
      if (now - peer.lastSeen > this.heartbeatTimeoutMs) {
        this.peers.delete(id);
      }
    }
  }

  /**
   * Removes a specific peer immediately
   */
  removePeer(clientId: ClientId): void {
    this.peers.delete(clientId);
  }
}
