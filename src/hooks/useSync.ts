/**
 * useSync Hook - Senkronizasyon için React hook
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { SyncManager } from '../services/sync/SyncManager';
import type { SyncDocument, Presence, ClientId } from '../types/sync';

/**
 * useSync hook parametreleri
 */
interface UseSyncOptions {
  clientId: ClientId;
  username: string;
  channelName?: string;
}

/**
 * useSync hook dönüş tipi
 */
interface UseSyncReturn {
  /** Tüm belgeler */
  documents: SyncDocument[];
  /** Çevrimiçi kullanıcılar */
  presences: Presence[];
  /** Belge oluştur */
  createDocument: (docId: string, title: string, content?: string) => void;
  /** Belge güncelle */
  updateDocument: (docId: string, field: string, value: any) => void;
  /** Belge sil */
  deleteDocument: (docId: string) => void;
  /** Aktif belgeyi ayarla */
  setActiveDocument: (docId: string | null) => void;
  /** İmleç pozisyonunu güncelle */
  updateCursorPosition: (position: number) => void;
  /** Senkronize mi */
  isSynced: boolean;
}

/**
 * Senkronizasyon hook'u
 */
export function useSync(options: UseSyncOptions): UseSyncReturn {
  const [documents, setDocuments] = useState<SyncDocument[]>([]);
  const [presences, setPresences] = useState<Presence[]>([]);
  const [isSynced, setIsSynced] = useState(false);
  const managerRef = useRef<SyncManager | null>(null);

  // SyncManager'ı başlat
  useEffect(() => {
    const manager = new SyncManager({
      clientId: options.clientId,
      username: options.username,
      channelName: options.channelName,
    });

    managerRef.current = manager;

    // İlk yükleme
    setDocuments(manager.getAllDocuments());
    setPresences(manager.getPresences());

    // Event listener'lar
    const handleDocumentChange = () => {
      setDocuments(manager.getAllDocuments());
    };

    const handlePresenceChange = (newPresences: Presence[]) => {
      setPresences(newPresences);
    };

    const handleSynced = () => {
      setIsSynced(true);
      setTimeout(() => setIsSynced(false), 1000);
    };

    manager.on('document-created', handleDocumentChange);
    manager.on('document-updated', handleDocumentChange);
    manager.on('document-deleted', handleDocumentChange);
    manager.on('presence-updated', handlePresenceChange);
    manager.on('synced', handleSynced);

    return () => {
      manager.destroy();
    };
  }, [options.clientId, options.username, options.channelName]);

  const createDocument = useCallback((docId: string, title: string, content: string = '') => {
    managerRef.current?.createDocument(docId, title, content);
  }, []);

  const updateDocument = useCallback((docId: string, field: string, value: any) => {
    managerRef.current?.updateDocument(docId, field, value);
  }, []);

  const deleteDocument = useCallback((docId: string) => {
    managerRef.current?.deleteDocument(docId);
  }, []);

  const setActiveDocument = useCallback((docId: string | null) => {
    managerRef.current?.setActiveDocument(docId);
  }, []);

  const updateCursorPosition = useCallback((position: number) => {
    managerRef.current?.updateCursorPosition(position);
  }, []);

  return {
    documents,
    presences,
    createDocument,
    updateDocument,
    deleteDocument,
    setActiveDocument,
    updateCursorPosition,
    isSynced,
  };
}
