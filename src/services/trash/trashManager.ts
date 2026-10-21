/**
 * trashManager.ts — Faz 66: Çöp Kutusu ve Gelişmiş Veri Kurtarma Kasası
 */

export interface TrashItem {
  id: string;
  title: string;
  content: string;
  originalParentId: string | null;
  originalIndex: number;
  deletedAt: string;
  wordCount: number;
  itemType: 'document' | 'folder' | 'research';
}

export class TrashManager {
  private items: Map<string, TrashItem> = new Map();
  private listeners = new Set<() => void>();

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  public moveToTrash(item: Omit<TrashItem, 'deletedAt'>): TrashItem {
    const trashItem: TrashItem = {
      ...item,
      deletedAt: new Date().toISOString(),
    };
    this.items.set(item.id, trashItem);
    this.notify();
    return trashItem;
  }

  public restoreItem(id: string): TrashItem {
    const item = this.items.get(id);
    if (!item) {
      throw new Error('Geri yüklenecek çöp öğesi bulunamadı');
    }
    this.items.delete(id);
    this.notify();
    return item;
  }

  public permanentDelete(id: string): void {
    this.items.delete(id);
    this.notify();
  }

  public emptyTrash(): number {
    const count = this.items.size;
    this.items.clear();
    this.notify();
    return count;
  }

  public getTrashItems(searchQuery?: string): TrashItem[] {
    const list = Array.from(this.items.values()).sort(
      (a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
    );

    if (!searchQuery || searchQuery.trim().length === 0) {
      return list;
    }

    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (i) => i.title.toLowerCase().includes(q) || i.content.toLowerCase().includes(q)
    );
  }

  public getItem(id: string): TrashItem | undefined {
    return this.items.get(id);
  }

  public getCount(): number {
    return this.items.size;
  }

  public clear(): void {
    this.items.clear();
    this.notify();
  }
}

export const trashManager = new TrashManager();
export default trashManager;
