/**
 * CrashGuard & Journal-Based Automatic Recovery Service
 * Phase 113: Çökme Koruması ve Otomatik Proje Kurtarma (CrashGuard & Recovery)
 */

export interface JournalEntry {
  docId: string;
  title?: string;
  content: string;
  timestamp: number;
  checksum: string;
}

export interface CrashStatus {
  hasCrash: boolean;
  uncommittedDocs: JournalEntry[];
  lastSavedAt?: string;
}

export class CrashGuardService {
  private static journal = new Map<string, JournalEntry>();
  private static STORAGE_KEY = 'openscriv_crash_journal';

  /**
   * Doküman düzenlendiğinde son 30 saniyelik kurtarma günlüğüne (.journal) kaydeder.
   */
  static logChange(docId: string, content: string, title?: string): void {
    const entry: JournalEntry = {
      docId,
      title: title || docId,
      content,
      timestamp: Date.now(),
      checksum: `${content.length}_${Date.now()}`,
    };

    this.journal.set(docId, entry);

    try {
      const serialized = JSON.stringify(Array.from(this.journal.values()));
      localStorage.setItem(this.STORAGE_KEY, serialized);
    } catch {
      // ignore
    }
  }

  /**
   * Temiz bir kayıttan sonra günlüğü temizler (çökme durumunda bu çağrılmaz).
   */
  static clearJournal(): void {
    this.journal.clear();
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  /**
   * Uygulama açılışında beklenmeyen bir kapanma olup olmadığını denetler.
   */
  static checkRecoveryStatus(): CrashStatus {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const entries: JournalEntry[] = JSON.parse(raw);
        if (Array.isArray(entries) && entries.length > 0) {
          return {
            hasCrash: true,
            uncommittedDocs: entries,
            lastSavedAt: new Date(entries[0].timestamp).toLocaleString('tr-TR'),
          };
        }
      }
    } catch {
      // ignore
    }

    return {
      hasCrash: false,
      uncommittedDocs: [],
    };
  }

  /**
   * Kurtarma günlüğünü kalıcı projedeki belgelere geri yükler.
   */
  static applyRecovery(
    onRestoreDoc: (docId: string, content: string) => void
  ): { restoredCount: number } {
    const status = this.checkRecoveryStatus();
    let count = 0;

    for (const entry of status.uncommittedDocs) {
      onRestoreDoc(entry.docId, entry.content);
      count++;
    }

    this.clearJournal();
    return { restoredCount: count };
  }
}
