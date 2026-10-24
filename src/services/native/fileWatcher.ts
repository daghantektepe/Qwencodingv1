/**
 * File Watcher & Conflict Resolution Service
 * Phase 108: Yerel Dosya Değişiklik İzleyicisi ve Otomatik Eşzamanlama (Native File Watcher)
 */

export interface FileChangeEvent {
  packagePath: string;
  relativePath: string;
  eventType: string;
  timestamp: number;
}

export interface ConflictResolution {
  docId: string;
  localContent: string;
  remoteContent: string;
  resolvedContent: string;
  resolvedAt: number;
}

type FileChangeCallback = (event: FileChangeEvent) => void;
type ConflictCallback = (conflict: { docId: string; localContent: string; remoteContent: string }) => void;

export class FileWatcherService {
  private static listeners = new Set<FileChangeCallback>();
  private static conflictListeners = new Set<ConflictCallback>();
  private static currentPackage: string | null = null;
  private static isListening = false;

  private static initIpcListener() {
    if (this.isListening) return;
    this.isListening = true;

    if (typeof window !== 'undefined' && (window as any).electron?.ipcRenderer) {
      (window as any).electron.ipcRenderer.on(
        'watcher:file-changed',
        (_evt: any, event: FileChangeEvent) => {
          this.handleFileChange(event);
        }
      );
    }
  }

  private static handleFileChange(event: FileChangeEvent) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[FileWatcherService] Listener hatası:', err);
      }
    }
  }

  /**
   * Belirtilen proje paketini arka planda izlemeye başlar.
   */
  static async startWatching(packagePath: string): Promise<boolean> {
    this.initIpcListener();
    this.currentPackage = packagePath;

    if (window.electronAPI?.invoke) {
      try {
        const res = await window.electronAPI.invoke('watcher:start', { packagePath });
        return Boolean(res?.ok);
      } catch {
        return false;
      }
    }
    return true; // Web fallback
  }

  /**
   * İzlemeyi durdurur.
   */
  static async stopWatching(): Promise<boolean> {
    if (!this.currentPackage) return true;

    const pkg = this.currentPackage;
    this.currentPackage = null;

    if (window.electronAPI?.invoke) {
      try {
        const res = await window.electronAPI.invoke('watcher:stop', { packagePath: pkg });
        return Boolean(res?.ok);
      } catch {
        return false;
      }
    }
    return true;
  }

  /**
   * Dosya değişiklik olayına abone olur.
   */
  static subscribe(callback: FileChangeCallback): () => void {
    this.initIpcListener();
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Harici değişiklik ile yerel değişiklik arasında çakışma (conflict) değerlendirmesi yapar.
   */
  static evaluateConflict({
    docId,
    isLocalDirty,
    localContent,
    remoteContent,
  }: {
    docId: string;
    isLocalDirty: boolean;
    localContent: string;
    remoteContent: string;
  }): { hasConflict: boolean; action: 'auto-reload' | 'conflict-dialog' | 'none' } {
    if (localContent === remoteContent) {
      return { hasConflict: false, action: 'none' };
    }

    if (!isLocalDirty) {
      // Kullanıcı herhangi bir düzenleme yapmadı, güvenle diskteki yeni versiyona güncelle
      return { hasConflict: false, action: 'auto-reload' };
    }

    // Hem kullanıcı yazdı hem de dışarıdan dosya değişti -> Çakışma
    for (const cb of this.conflictListeners) {
      cb({ docId, localContent, remoteContent });
    }

    return { hasConflict: true, action: 'conflict-dialog' };
  }

  /**
   * Çakışma dinleyicisi ekler.
   */
  static onConflict(callback: ConflictCallback): () => void {
    this.conflictListeners.add(callback);
    return () => {
      this.conflictListeners.delete(callback);
    };
  }

  /**
   * Çakışmayı kullanıcının seçimine göre çözümler.
   */
  static resolveConflict(
    choice: 'keep-local' | 'take-remote' | 'merge',
    localContent: string,
    remoteContent: string
  ): string {
    if (choice === 'keep-local') return localContent;
    if (choice === 'take-remote') return remoteContent;

    // Basit birleştirme
    return `${localContent}\n\n--- [Harici Güncelleme] ---\n\n${remoteContent}`;
  }

  static clear(): void {
    this.listeners.clear();
    this.conflictListeners.clear();
  }
}
