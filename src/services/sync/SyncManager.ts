/**
 * Sync Manager - Senkronizasyon yöneticisi
 * BroadcastChannel API ile sekmeler arası iletişim
 */

import type {
  SyncConfig,
  SyncMessage,
  CrdtOperation,
  Presence,
  ClientId,
} from '../../types/sync';
import { DEFAULT_SYNC_CONFIG } from '../../types/sync';
import { CrdtEngine } from './CrdtEngine';

/**
 * Event listener tipi
 */
type SyncEventListener = (event: any) => void;

/**
 * Sync Manager - Çoklu sekme senkronizasyonu
 */
export class SyncManager {
  private config: SyncConfig;
  private engine: CrdtEngine;
  private channel: BroadcastChannel | null = null;
  private presence: Presence | null = null;
  private presences: Map<ClientId, Presence> = new Map();
  private eventListeners: Map<string, Set<SyncEventListener>> = new Map();
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private presenceInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<SyncConfig> & { clientId: ClientId; username: string }) {
    this.config = { ...DEFAULT_SYNC_CONFIG, ...config };
    this.engine = new CrdtEngine();
    this.initChannel();
    this.initPresence();
    this.startSyncLoop();
  }

  /**
   * BroadcastChannel'ı başlatır
   */
  private initChannel(): void {
    try {
      this.channel = new BroadcastChannel(this.config.channelName);
      this.channel.onmessage = (event) => this.handleMessage(event.data);
    } catch (e) {
      console.warn('[SyncManager] BroadcastChannel not supported:', e);
    }
  }

  /**
   * Presence bilgisini başlatır
   */
  private initPresence(): void {
    this.presence = {
      clientId: this.config.clientId,
      username: this.config.username,
      activeDocId: null,
      cursorPosition: 0,
      lastSeen: Date.now(),
      online: true,
    };

    this.broadcastPresence();

    // Periyodik presence güncellemesi
    this.presenceInterval = setInterval(() => {
      if (this.presence) {
        this.presence.lastSeen = Date.now();
        this.broadcastPresence();
        this.cleanupOldPresences();
      }
    }, this.config.presenceTimeout / 2);
  }

  /**
   * Senkronizasyon döngüsünü başlatır
   */
  private startSyncLoop(): void {
    this.syncInterval = setInterval(() => {
      this.requestSync();
    }, this.config.syncInterval);
  }

  /**
   * Mesaj alır
   */
  private handleMessage(message: SyncMessage): void {
    // Kendi mesajlarını ignore et
    if (message.clientId === this.config.clientId) return;

    switch (message.type) {
      case 'operation':
        this.handleOperation(message.payload as CrdtOperation);
        break;
      case 'presence':
        this.handlePresence(message.payload as Presence);
        break;
      case 'sync-request':
        this.handleSyncRequest(message.payload);
        break;
      case 'sync-response':
        this.handleSyncResponse(message.payload);
        break;
    }
  }

  /**
   * Operasyon mesajını işler
   */
  private handleOperation(operation: CrdtOperation): void {
    const applied = this.engine.receiveOperation(operation);
    if (applied) {
      this.emit('operation', operation);
      this.emit('document-updated', operation.docId);
    }
  }

  /**
   * Presence mesajını işler
   */
  private handlePresence(presence: Presence): void {
    this.presences.set(presence.clientId, presence);
    this.emit('presence-updated', Array.from(this.presences.values()));
  }

  /**
   * Senkronizasyon isteğini işler
   */
  private handleSyncRequest(payload: { clock: any }): void {
    const operations = this.engine.getOperationsSince(payload.clock);
    this.broadcast({
      type: 'sync-response',
      clientId: this.config.clientId,
      payload: { operations },
      timestamp: Date.now(),
    });
  }

  /**
   * Senkronizasyon yanıtını işler
   */
  private handleSyncResponse(payload: { operations: CrdtOperation[] }): void {
    for (const operation of payload.operations) {
      this.engine.receiveOperation(operation);
    }
    this.emit('synced');
  }

  /**
   * Eski presence bilgilerini temizler
   */
  private cleanupOldPresences(): void {
    const now = Date.now();
    const timeout = this.config.presenceTimeout;

    for (const [clientId, presence] of this.presences.entries()) {
      if (now - presence.lastSeen > timeout) {
        this.presences.delete(clientId);
      }
    }

    this.emit('presence-updated', Array.from(this.presences.values()));
  }

  /**
   * Mesaj broadcast eder
   */
  private broadcast(message: SyncMessage): void {
    if (this.channel) {
      this.channel.postMessage(message);
    }
  }

  /**
   * Presence bilgisini broadcast eder
   */
  private broadcastPresence(): void {
    if (this.presence) {
      this.broadcast({
        type: 'presence',
        clientId: this.config.clientId,
        payload: this.presence,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Senkronizasyon ister
   */
  private requestSync(): void {
    this.broadcast({
      type: 'sync-request',
      clientId: this.config.clientId,
      payload: { clock: this.engine.getLocalClock() },
      timestamp: Date.now(),
    });
  }

  /**
   * Belge oluşturur
   */
  createDocument(docId: string, title: string, content: string = ''): CrdtOperation {
    const operation = this.engine.createOperation(
      this.config.clientId,
      'create',
      docId,
      'title',
      title
    );

    if (content) {
      this.engine.createOperation(
        this.config.clientId,
        'update',
        docId,
        'content',
        content
      );
    }

    this.broadcast({
      type: 'operation',
      clientId: this.config.clientId,
      payload: operation,
      timestamp: Date.now(),
    });

    this.emit('document-created', docId);
    return operation;
  }

  /**
   * Belge günceller
   */
  updateDocument(docId: string, field: string, value: any): CrdtOperation {
    const operation = this.engine.createOperation(
      this.config.clientId,
      'update',
      docId,
      field,
      value
    );

    this.broadcast({
      type: 'operation',
      clientId: this.config.clientId,
      payload: operation,
      timestamp: Date.now(),
    });

    this.emit('document-updated', docId);
    return operation;
  }

  /**
   * Belge siler
   */
  deleteDocument(docId: string): CrdtOperation {
    const operation = this.engine.createOperation(
      this.config.clientId,
      'delete',
      docId,
      'deleted',
      true
    );

    this.broadcast({
      type: 'operation',
      clientId: this.config.clientId,
      payload: operation,
      timestamp: Date.now(),
    });

    this.emit('document-deleted', docId);
    return operation;
  }

  /**
   * Belge alır
   */
  getDocument(docId: string) {
    return this.engine.getDocument(docId);
  }

  /**
   * Tüm belgeleri alır
   */
  getAllDocuments() {
    return this.engine.getAllDocuments();
  }

  /**
   * Aktif belgeyi ayarlar (presence için)
   */
  setActiveDocument(docId: string | null): void {
    if (this.presence) {
      this.presence.activeDocId = docId;
      this.presence.lastSeen = Date.now();
      this.broadcastPresence();
    }
  }

  /**
   * İmleç pozisyonunu günceller (presence için)
   */
  updateCursorPosition(position: number): void {
    if (this.presence) {
      this.presence.cursorPosition = position;
      this.presence.lastSeen = Date.now();
      this.broadcastPresence();
    }
  }

  /**
   * Çevrimiçi kullanıcıları alır
   */
  getPresences(): Presence[] {
    return Array.from(this.presences.values());
  }

  /**
   * Event listener ekler
   */
  on(event: string, listener: SyncEventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  /**
   * Event listener kaldırır
   */
  off(event: string, listener: SyncEventListener): void {
    this.eventListeners.get(event)?.delete(listener);
  }

  /**
   * Event emit eder
   */
  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(data);
        } catch (e) {
          console.error('[SyncManager] Event listener error:', e);
        }
      }
    }
  }

  /**
   * Senkronizasyonu durdurur
   */
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    if (this.presenceInterval) {
      clearInterval(this.presenceInterval);
    }
    if (this.channel) {
      this.channel.close();
    }
    this.eventListeners.clear();
  }
}
