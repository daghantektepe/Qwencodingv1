/**
 * CRDT Engine - Conflict-free Replicated Data Type implementasyonu
 * Last-Writer-Wins (LWW) stratejisi ile çatışma çözümü
 */

import type {
  CrdtOperation,
  VectorClock,
  SyncDocument,
  ClientId,
} from '../../types/sync';

/**
 * CRDT Engine - Operasyonları uygular ve vektör saatlerini yönetir
 */
export class CrdtEngine {
  private documents: Map<string, SyncDocument> = new Map();
  private operations: CrdtOperation[] = [];
  private localClock: VectorClock = {};

  /**
   * Yeni bir CRDT Engine oluşturur
   */
  constructor() {
    this.loadFromStorage();
  }

  /**
   * Vektör saatini karşılaştırır
   * @returns -1: clock1 < clock2, 0: eşit, 1: clock1 > clock2, 2: çakışma
   */
  compareClocks(clock1: VectorClock, clock2: VectorClock): number {
    const allClients = new Set([...Object.keys(clock1), ...Object.keys(clock2)]);
    
    let clock1Greater = false;
    let clock2Greater = false;

    for (const client of allClients) {
      const val1 = clock1[client] || 0;
      const val2 = clock2[client] || 0;

      if (val1 > val2) clock1Greater = true;
      if (val2 > val1) clock2Greater = true;
    }

    if (clock1Greater && clock2Greater) return 2; // Çakışma
    if (clock1Greater) return 1;
    if (clock2Greater) return -1;
    return 0;
  }

  /**
   * Yerel vektör saatini günceller
   */
  incrementClock(clientId: ClientId): VectorClock {
    this.localClock[clientId] = (this.localClock[clientId] || 0) + 1;
    return { ...this.localClock };
  }

  /**
   * İki vektör saatini birleştirir (merge)
   */
  mergeClocks(clock1: VectorClock, clock2: VectorClock): VectorClock {
    const merged: VectorClock = {};
    const allClients = new Set([...Object.keys(clock1), ...Object.keys(clock2)]);

    for (const client of allClients) {
      merged[client] = Math.max(clock1[client] || 0, clock2[client] || 0);
    }

    return merged;
  }

  /**
   * Yeni bir operasyon oluşturur
   */
  createOperation(
    clientId: ClientId,
    type: 'create' | 'update' | 'delete',
    docId: string,
    field: string,
    value: any
  ): CrdtOperation {
    const clock = this.incrementClock(clientId);

    const operation: CrdtOperation = {
      id: `${clientId}-${clock[clientId]}-${Date.now()}`,
      type,
      docId,
      field,
      value,
      clientId,
      clock,
      timestamp: Date.now(),
    };

    this.operations.push(operation);
    this.applyOperation(operation);
    this.saveToStorage();

    return operation;
  }

  /**
   * Bir operasyonu uygular
   */
  applyOperation(operation: CrdtOperation): void {
    const { docId, field, value, type, clock } = operation;

    let doc = this.documents.get(docId);

    if (type === 'create') {
      if (!doc) {
        doc = {
          docId,
          content: '',
          title: '',
          clock: {},
          lastModified: operation.timestamp,
          deleted: false,
        };
        this.documents.set(docId, doc);
      }
    }

    if (!doc) return;

    // Çatışma kontrolü - LWW stratejisi
    const comparison = this.compareClocks(clock, doc.clock);
    
    // Eğer gelen operasyon daha yeniyse veya çakışma varsa ve timestamp daha yeni ise uygula
    if (comparison >= 0 || (comparison === 2 && operation.timestamp > doc.lastModified)) {
      if (type === 'delete') {
        doc.deleted = true;
      } else {
        (doc as any)[field] = value;
      }
      doc.clock = this.mergeClocks(doc.clock, clock);
      doc.lastModified = operation.timestamp;
    }

    // Yerel saati güncelle
    this.localClock = this.mergeClocks(this.localClock, clock);
  }

  /**
   * Uzak bir operasyonu alır ve uygular
   */
  receiveOperation(operation: CrdtOperation): boolean {
    // Operasyon zaten uygulanmış mı kontrol et
    if (this.operations.some(op => op.id === operation.id)) {
      return false;
    }

    this.operations.push(operation);
    this.applyOperation(operation);
    this.saveToStorage();
    return true;
  }

  /**
   * Belgeyi alır
   */
  getDocument(docId: string): SyncDocument | undefined {
    return this.documents.get(docId);
  }

  /**
   * Tüm belgeleri alır
   */
  getAllDocuments(): SyncDocument[] {
    return Array.from(this.documents.values()).filter(doc => !doc.deleted);
  }

  /**
   * Yerel vektör saatini alır
   */
  getLocalClock(): VectorClock {
    return { ...this.localClock };
  }

  /**
   * Belirli bir saatten sonraki operasyonları alır
   */
  getOperationsSince(clock: VectorClock): CrdtOperation[] {
    return this.operations.filter(op => {
      const comparison = this.compareClocks(op.clock, clock);
      
      // Sadece verilen saatten SONRA gelen operasyonları dahil et
      // comparison > 0: op.clock > clock (sonra)
      // comparison === 0: eşit (dahil etme)
      // comparison < 0: önce (dahil etme)
      return comparison > 0;
    });
  }

  /**
   * Tüm operasyonları alır
   */
  getAllOperations(): CrdtOperation[] {
    return [...this.operations];
  }

  /**
   * localStorage'a kaydeder
   */
  private saveToStorage(): void {
    try {
      const data = {
        documents: Array.from(this.documents.entries()),
        operations: this.operations,
        localClock: this.localClock,
      };
      localStorage.setItem('crdt-engine', JSON.stringify(data));
    } catch (e) {
      console.error('[CrdtEngine] Failed to save to storage:', e);
    }
  }

  /**
   * localStorage'dan yükler
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('crdt-engine');
      if (stored) {
        const data = JSON.parse(stored);
        this.documents = new Map(data.documents);
        this.operations = data.operations || [];
        this.localClock = data.localClock || {};
      }
    } catch (e) {
      console.error('[CrdtEngine] Failed to load from storage:', e);
    }
  }

  /**
   * Tüm verileri temizler
   */
  clear(): void {
    this.documents.clear();
    this.operations = [];
    this.localClock = {};
    localStorage.removeItem('crdt-engine');
  }
}
