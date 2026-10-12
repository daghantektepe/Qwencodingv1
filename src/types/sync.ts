/**
 * Sync Types - Senkronizasyon işlemleri için TypeScript arayüzleri ve tipleri
 */

/**
 * Benzersiz istemci kimliği
 */
export type ClientId = string;

/**
 * Vektör saati - her istemcinin son bildiği olay sayısını tutar
 */
export type VectorClock = Record<ClientId, number>;

/**
 * CRDT Operasyon türleri
 */
export type OperationType = 'create' | 'update' | 'delete';

/**
 * CRDT Operasyonu
 */
export interface CrdtOperation {
  /** Operasyon kimliği */
  id: string;
  /** Operasyon türü */
  type: OperationType;
  /** Hedef belge kimliği */
  docId: string;
  /** Değişiklik yapılan alan */
  field: string;
  /** Yeni değer */
  value: any;
  /** Operasyonu yapan istemci */
  clientId: ClientId;
  /** Vektör saati */
  clock: VectorClock;
  /** Zaman damgası */
  timestamp: number;
}

/**
 * Senkronize belge
 */
export interface SyncDocument {
  /** Belge kimliği */
  docId: string;
  /** Belge içeriği */
  content: string;
  /** Başlık */
  title: string;
  /** Son değişiklik vektör saati */
  clock: VectorClock;
  /** Son değişiklik zamanı */
  lastModified: number;
  /** Silindi mi */
  deleted: boolean;
}

/**
 * Çevrimiçi kullanıcı (presence)
 */
export interface Presence {
  /** İstemci kimliği */
  clientId: ClientId;
  /** Kullanıcı adı */
  username: string;
  /** Aktif belge kimliği */
  activeDocId: string | null;
  /** İmleç pozisyonu */
  cursorPosition: number;
  /** Son görülme zamanı */
  lastSeen: number;
  /** Çevrimiçi mi */
  online: boolean;
}

/**
 * Senkronizasyon durumu
 */
export interface SyncState {
  /** Yerel vektör saati */
  localClock: VectorClock;
  /** Bekleyen operasyonlar */
  pendingOps: CrdtOperation[];
  /** Çevrimiçi kullanıcılar */
  presences: Presence[];
  /** Senkronize mi */
  isSynced: boolean;
  /** Son senkronizasyon zamanı */
  lastSyncTime: number;
}

/**
 * Senkronizasyon mesajı (BroadcastChannel için)
 */
export interface SyncMessage {
  /** Mesaj türü */
  type: 'operation' | 'presence' | 'sync-request' | 'sync-response';
  /** Gönderen istemci */
  clientId: ClientId;
  /** Mesaj içeriği */
  payload: any;
  /** Zaman damgası */
  timestamp: number;
}

/**
 * Çatışma çözümü stratejisi
 */
export type ConflictResolutionStrategy = 'lww' | 'merge' | 'manual';

/**
 * Senkronizasyon ayarları
 */
export interface SyncConfig {
  /** İstemci kimliği */
  clientId: ClientId;
  /** Kullanıcı adı */
  username: string;
  /** BroadcastChannel adı */
  channelName: string;
  /** Çatışma çözümü stratejisi */
  conflictStrategy: ConflictResolutionStrategy;
  /** Senkronizasyon aralığı (ms) */
  syncInterval: number;
  /** Presence timeout (ms) */
  presenceTimeout: number;
}

/**
 * Varsayılan senkronizasyon ayarları
 */
export const DEFAULT_SYNC_CONFIG: Omit<SyncConfig, 'clientId' | 'username'> = {
  channelName: 'scrivener-sync',
  conflictStrategy: 'lww',
  syncInterval: 1000,
  presenceTimeout: 5000,
};
