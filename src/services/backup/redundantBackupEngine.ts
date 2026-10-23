import { useSyncExternalStore } from 'react';

export interface BackupEntry {
  id: string;
  filename: string;
  timestamp: string; // ISO String
  sizeBytes: number;
  documentCount: number;
  wordCountTotal: number;
  targetPath: string;
  type: 'auto' | 'daily' | 'external_usb' | 'manual';
  checksum: string;
  snapshotData: string; // Serialized project snapshot
}

export interface BackupConfig {
  enabled: boolean;
  secondaryPath: string;
  externalDriveAutoBackup: boolean;
  retentionDays: number; // default 30
  maxBackupsCount: number; // default 50
  compressZip: boolean;
}

const STORAGE_KEY = 'openscriv_redundant_backups';
const CONFIG_KEY = 'openscriv_backup_config';

export const DEFAULT_BACKUP_CONFIG: BackupConfig = {
  enabled: true,
  secondaryPath: '~/OpenScrivBackups',
  externalDriveAutoBackup: true,
  retentionDays: 30,
  maxBackupsCount: 50,
  compressZip: true
};

export class RedundantBackupEngine {
  private backups: BackupEntry[] = [];
  private config: BackupConfig = { ...DEFAULT_BACKUP_CONFIG };
  private cachedSnapshot: { backups: BackupEntry[]; config: BackupConfig };
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.cachedSnapshot = { backups: this.backups, config: this.config };
    this.loadFromStorage();
    this.updateSnapshot();
  }

  private loadFromStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const rawBackups = localStorage.getItem(STORAGE_KEY);
        if (rawBackups) {
          const parsed = JSON.parse(rawBackups);
          if (Array.isArray(parsed)) this.backups = parsed;
        }

        const rawConfig = localStorage.getItem(CONFIG_KEY);
        if (rawConfig) {
          this.config = { ...DEFAULT_BACKUP_CONFIG, ...JSON.parse(rawConfig) };
        }
      }
    } catch {
      // Ignore
    }
  }

  private saveToStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.backups));
        localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config));
      }
    } catch {
      // Ignore
    }
    this.updateSnapshot();
    this.notify();
  }

  private updateSnapshot() {
    this.cachedSnapshot = {
      backups: [...this.backups],
      config: { ...this.config }
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  public getSnapshot = () => {
    return this.cachedSnapshot;
  };

  public getState() {
    return {
      ...this.getSnapshot(),
      updateConfig: this.updateConfig.bind(this),
      createBackup: this.createBackup.bind(this),
      restoreBackup: this.restoreBackup.bind(this),
      deleteBackup: this.deleteBackup.bind(this),
      detectExternalDrive: this.detectExternalDrive.bind(this),
      pruneOldBackups: this.pruneOldBackups.bind(this),
      clearAllBackups: this.clearAllBackups.bind(this)
    };
  }

  public updateConfig(partial: Partial<BackupConfig>) {
    this.config = { ...this.config, ...partial };
    this.saveToStorage();
  }

  /**
   * Generates a simple hash checksum for backup verification
   */
  private generateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = (hash << 5) - hash + data.charCodeAt(i);
      hash |= 0;
    }
    return `chk_${Math.abs(hash).toString(16)}`;
  }

  public createBackup(
    projectName: string,
    payload: { documents: any[]; metadata?: any },
    type: BackupEntry['type'] = 'auto',
    targetPath?: string
  ): BackupEntry {
    const jsonStr = JSON.stringify(payload);
    const date = new Date();
    const dateFormatted = date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `${projectName.toLowerCase().replace(/\s+/g, '_')}_backup_${dateFormatted}.openscriv.zip`;

    let totalWords = 0;
    if (Array.isArray(payload.documents)) {
      payload.documents.forEach((d) => {
        const text = typeof d.content === 'string' ? d.content : '';
        totalWords += text.split(/\s+/).filter(Boolean).length;
      });
    }

    const entry: BackupEntry = {
      id: `bk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      filename,
      timestamp: date.toISOString(),
      sizeBytes: jsonStr.length,
      documentCount: Array.isArray(payload.documents) ? payload.documents.length : 0,
      wordCountTotal: totalWords,
      targetPath: targetPath || this.config.secondaryPath,
      type,
      checksum: this.generateChecksum(jsonStr),
      snapshotData: jsonStr
    };

    this.backups.unshift(entry);

    // Prune retention
    this.pruneOldBackups();

    this.saveToStorage();
    return entry;
  }

  public restoreBackup(backupId: string): { success: boolean; data?: any; error?: string } {
    const backup = this.backups.find((b) => b.id === backupId);
    if (!backup) {
      return { success: false, error: 'Yedek bulunamadı.' };
    }

    // Verify integrity
    const currentChecksum = this.generateChecksum(backup.snapshotData);
    if (currentChecksum !== backup.checksum) {
      return { success: false, error: 'Yedek sağlama toplamı (Checksum) uyuşmuyor! Dosya bozulmuş olabilir.' };
    }

    try {
      const parsed = JSON.parse(backup.snapshotData);
      return { success: true, data: parsed };
    } catch (e: any) {
      return { success: false, error: `Geri yükleme başarısız: ${e.message}` };
    }
  }

  public deleteBackup(id: string): boolean {
    const initial = this.backups.length;
    this.backups = this.backups.filter((b) => b.id !== id);
    const removed = this.backups.length < initial;
    if (removed) this.saveToStorage();
    return removed;
  }

  /**
   * Cleans backups older than retentionDays or exceeding maxBackupsCount
   */
  public pruneOldBackups(): number {
    const cutoffTime = Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000;
    const initial = this.backups.length;

    // Filter by date
    let valid = this.backups.filter((b) => new Date(b.timestamp).getTime() >= cutoffTime);

    // Limit count
    if (valid.length > this.config.maxBackupsCount) {
      valid = valid.slice(0, this.config.maxBackupsCount);
    }

    this.backups = valid;
    return initial - this.backups.length;
  }

  public detectExternalDrive(
    drivePaths: string[],
    projectName: string,
    currentPayload: any
  ): BackupEntry | null {
    if (!this.config.externalDriveAutoBackup || drivePaths.length === 0) return null;

    const usbPath = drivePaths[0]; // Primary external target
    return this.createBackup(projectName, currentPayload, 'external_usb', usbPath);
  }

  public clearAllBackups() {
    this.backups = [];
    this.saveToStorage();
  }
}

export const backupEngine = new RedundantBackupEngine();

export function useBackupStore() {
  const snapshot = useSyncExternalStore(
    backupEngine.subscribe,
    backupEngine.getSnapshot,
    backupEngine.getSnapshot
  );

  return {
    ...snapshot,
    updateConfig: backupEngine.updateConfig.bind(backupEngine),
    createBackup: backupEngine.createBackup.bind(backupEngine),
    restoreBackup: backupEngine.restoreBackup.bind(backupEngine),
    deleteBackup: backupEngine.deleteBackup.bind(backupEngine),
    detectExternalDrive: backupEngine.detectExternalDrive.bind(backupEngine),
    pruneOldBackups: backupEngine.pruneOldBackups.bind(backupEngine),
    clearAllBackups: backupEngine.clearAllBackups.bind(backupEngine)
  };
}

useBackupStore.getState = () => backupEngine.getState();
