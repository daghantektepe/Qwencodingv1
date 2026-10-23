import { useSyncExternalStore } from 'react';

export type StickyColor = 'yellow' | 'blue' | 'green' | 'pink' | 'amber' | 'purple';

export interface StickyNoteItem {
  id: string;
  title: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: StickyColor;
  opacity: number; // 30 to 100
  isPinned: boolean;
  zIndex: number;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'openscriv_sticky_notes_data';

export const DEFAULT_STICKY_NOTE: StickyNoteItem = {
  id: 'sticky_welcome',
  title: 'Yazar Karalama Notu',
  content: 'Fikirleri, geçici diyalogları ve hatırlatıcıları buraya serbestçe yazabilirsiniz. Opaklık ve boyut ayarlanabilir.',
  x: 80,
  y: 120,
  width: 260,
  height: 200,
  color: 'yellow',
  opacity: 90,
  isPinned: true,
  zIndex: 100,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export interface StickyStoreSnapshot {
  notes: StickyNoteItem[];
  isVisible: boolean; // Global visibility toggle (F12)
}

export class StickyNotesStore {
  private notes: StickyNoteItem[] = [];
  private isVisible: boolean = true;
  private highestZIndex: number = 100;
  private cachedSnapshot: StickyStoreSnapshot;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.cachedSnapshot = { notes: this.notes, isVisible: this.isVisible };
    this.loadFromStorage();
    this.updateSnapshot();
  }

  private loadFromStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.notes = parsed;
            this.highestZIndex = Math.max(100, ...this.notes.map((n) => n.zIndex || 100));
            return;
          }
        }
      }
    } catch {
      // Ignore
    }
    this.notes = [{ ...DEFAULT_STICKY_NOTE }];
  }

  private saveToStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.notes));
      }
    } catch {
      // Ignore
    }
    this.updateSnapshot();
    this.notify();
  }

  private updateSnapshot() {
    this.cachedSnapshot = {
      notes: [...this.notes],
      isVisible: this.isVisible
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  public getSnapshot = (): StickyStoreSnapshot => {
    return this.cachedSnapshot;
  };

  public getState() {
    return {
      ...this.getSnapshot(),
      createNote: this.createNote.bind(this),
      updateNote: this.updateNote.bind(this),
      deleteNote: this.deleteNote.bind(this),
      bringToFront: this.bringToFront.bind(this),
      toggleVisibility: this.toggleVisibility.bind(this),
      setVisibility: this.setVisibility.bind(this),
      exportToJson: this.exportToJson.bind(this),
      importFromJson: this.importFromJson.bind(this),
      resetToDefault: this.resetToDefault.bind(this)
    };
  }

  public createNote(initial?: Partial<StickyNoteItem>): StickyNoteItem {
    this.highestZIndex += 1;
    const newNote: StickyNoteItem = {
      id: `sticky_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: initial?.title || 'Yeni Not',
      content: initial?.content || '',
      x: initial?.x ?? (100 + (this.notes.length % 5) * 30),
      y: initial?.y ?? (100 + (this.notes.length % 5) * 30),
      width: initial?.width ?? 260,
      height: initial?.height ?? 200,
      color: initial?.color ?? 'yellow',
      opacity: initial?.opacity ?? 90,
      isPinned: initial?.isPinned ?? false,
      zIndex: this.highestZIndex,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.notes.push(newNote);
    this.saveToStorage();
    return newNote;
  }

  public updateNote(id: string, partial: Partial<Omit<StickyNoteItem, 'id'>>) {
    const idx = this.notes.findIndex((n) => n.id === id);
    if (idx === -1) return;

    this.notes[idx] = {
      ...this.notes[idx],
      ...partial,
      opacity:
        partial.opacity !== undefined
          ? Math.max(30, Math.min(100, partial.opacity))
          : this.notes[idx].opacity,
      updatedAt: new Date().toISOString()
    };

    this.saveToStorage();
  }

  public deleteNote(id: string): boolean {
    const initial = this.notes.length;
    this.notes = this.notes.filter((n) => n.id !== id);
    const removed = this.notes.length < initial;
    if (removed) this.saveToStorage();
    return removed;
  }

  public bringToFront(id: string) {
    const note = this.notes.find((n) => n.id === id);
    if (!note) return;

    this.highestZIndex += 1;
    note.zIndex = this.highestZIndex;
    this.saveToStorage();
  }

  public toggleVisibility() {
    this.isVisible = !this.isVisible;
    this.updateSnapshot();
    this.notify();
  }

  public setVisibility(visible: boolean) {
    this.isVisible = visible;
    this.updateSnapshot();
    this.notify();
  }

  public exportToJson(): string {
    return JSON.stringify(this.notes, null, 2);
  }

  public importFromJson(jsonString: string): number {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) return 0;
      let count = 0;
      for (const item of parsed) {
        if (item.content !== undefined) {
          this.notes.push({
            id: `sticky_imp_${Date.now()}_${count}`,
            title: item.title || 'İçe Aktarılan Not',
            content: item.content || '',
            x: item.x || 100,
            y: item.y || 100,
            width: item.width || 260,
            height: item.height || 200,
            color: item.color || 'yellow',
            opacity: item.opacity || 90,
            isPinned: item.isPinned || false,
            zIndex: ++this.highestZIndex,
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          count++;
        }
      }
      if (count > 0) this.saveToStorage();
      return count;
    } catch {
      return 0;
    }
  }

  public resetToDefault() {
    this.notes = [{ ...DEFAULT_STICKY_NOTE }];
    this.highestZIndex = 100;
    this.isVisible = true;
    this.saveToStorage();
  }
}

export const stickyNotesStore = new StickyNotesStore();

export function useStickyNotesStore() {
  const snapshot = useSyncExternalStore(
    stickyNotesStore.subscribe,
    stickyNotesStore.getSnapshot,
    stickyNotesStore.getSnapshot
  );

  return {
    ...snapshot,
    createNote: stickyNotesStore.createNote.bind(stickyNotesStore),
    updateNote: stickyNotesStore.updateNote.bind(stickyNotesStore),
    deleteNote: stickyNotesStore.deleteNote.bind(stickyNotesStore),
    bringToFront: stickyNotesStore.bringToFront.bind(stickyNotesStore),
    toggleVisibility: stickyNotesStore.toggleVisibility.bind(stickyNotesStore),
    setVisibility: stickyNotesStore.setVisibility.bind(stickyNotesStore),
    exportToJson: stickyNotesStore.exportToJson.bind(stickyNotesStore),
    importFromJson: stickyNotesStore.importFromJson.bind(stickyNotesStore),
    resetToDefault: stickyNotesStore.resetToDefault.bind(stickyNotesStore)
  };
}

useStickyNotesStore.getState = () => stickyNotesStore.getState();
