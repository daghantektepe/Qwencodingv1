/**
 * journalLogger.ts — Faz 73: Otomatik Kayıt Güvenlik Ağı ve Değişiklik Günlüğü
 */

export type JournalDeltaType = 'keystroke' | 'pause' | 'manual_save' | 'crash_recovery';

export interface JournalEntry {
  id: string;
  docId: string;
  timestamp: number;
  wordCount: number;
  charCount: number;
  textSnapshot: string;
  deltaType: JournalDeltaType;
}

export class JournalLogger {
  private entries: Map<string, JournalEntry[]> = new Map();
  private listeners = new Set<() => void>();

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  public logEntry(
    docId: string,
    text: string,
    deltaType: JournalDeltaType = 'keystroke'
  ): JournalEntry {
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const entry: JournalEntry = {
      id: `jrn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      docId,
      timestamp: Date.now(),
      wordCount,
      charCount: text.length,
      textSnapshot: text,
      deltaType,
    };

    if (!this.entries.has(docId)) {
      this.entries.set(docId, []);
    }

    const docLog = this.entries.get(docId)!;
    docLog.push(entry);

    // Bellek şişmesini önlemek için doküman başına son 200 girişi sakla
    if (docLog.length > 200) {
      docLog.shift();
    }

    this.notify();
    return entry;
  }

  public getEntriesForDoc(docId: string): JournalEntry[] {
    return [...(this.entries.get(docId) || [])];
  }

  public getLatestRecoverySnapshot(docId: string): JournalEntry | undefined {
    const list = this.entries.get(docId);
    if (!list || list.length === 0) return undefined;
    return list[list.length - 1];
  }

  public restoreToSnapshot(docId: string, entryId: string): string | null {
    const list = this.entries.get(docId);
    if (!list) return null;
    const target = list.find((e) => e.id === entryId);
    return target ? target.textSnapshot : null;
  }

  public clearDocJournal(docId: string): void {
    this.entries.delete(docId);
    this.notify();
  }

  public clearAll(): void {
    this.entries.clear();
    this.notify();
  }
}

export const journalLogger = new JournalLogger();
export default journalLogger;
