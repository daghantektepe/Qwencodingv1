/**
 * multiSelectManager.ts — Faz 71: Çoklu Seçim ve Toplu İşlem Yöneticisi
 */

export interface BinderItemLike {
  id: string;
  title: string;
  status?: string;
  label?: string;
  parentId?: string | null;
  targetWordCount?: number;
}

export class MultiSelectManager {
  private selectedIds: Set<string> = new Set();
  private lastSelectedId: string | null = null;
  private listeners = new Set<() => void>();

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  public selectSingle(id: string): void {
    this.selectedIds.clear();
    this.selectedIds.add(id);
    this.lastSelectedId = id;
    this.notify();
  }

  /**
   * Ctrl / Cmd + Click: Bağımsız öğe seçme / seçimi kaldırma
   */
  public toggleSelect(id: string): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
      if (this.lastSelectedId === id) {
        this.lastSelectedId = Array.from(this.selectedIds).pop() || null;
      }
    } else {
      this.selectedIds.add(id);
      this.lastSelectedId = id;
    }
    this.notify();
  }

  /**
   * Shift + Click: Son seçilen öğe ile hedef öğe arasındaki tüm elemanları aralık olarak seçer
   */
  public selectRange(targetId: string, orderedIds: string[]): void {
    if (!this.lastSelectedId || !orderedIds.includes(this.lastSelectedId)) {
      this.selectSingle(targetId);
      return;
    }

    const startIdx = orderedIds.indexOf(this.lastSelectedId);
    const endIdx = orderedIds.indexOf(targetId);

    if (startIdx === -1 || endIdx === -1) {
      this.selectSingle(targetId);
      return;
    }

    const [minIdx, maxIdx] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];

    for (let i = minIdx; i <= maxIdx; i++) {
      this.selectedIds.add(orderedIds[i]);
    }

    this.lastSelectedId = targetId;
    this.notify();
  }

  public selectAll(allIds: string[]): void {
    this.selectedIds = new Set(allIds);
    this.lastSelectedId = allIds[allIds.length - 1] || null;
    this.notify();
  }

  public clearSelection(): void {
    this.selectedIds.clear();
    this.lastSelectedId = null;
    this.notify();
  }

  public getSelectedIds(): string[] {
    return Array.from(this.selectedIds);
  }

  public isSelected(id: string): boolean {
    return this.selectedIds.has(id);
  }

  public getSelectedCount(): number {
    return this.selectedIds.size;
  }

  // --- Toplu İşlem Eylemleri (Bulk Mutations) ---
  public applyBulkStatus<T extends BinderItemLike>(items: T[], newStatus: string): T[] {
    return items.map((item) => {
      if (this.selectedIds.has(item.id)) {
        return { ...item, status: newStatus };
      }
      return item;
    });
  }

  public applyBulkLabel<T extends BinderItemLike>(items: T[], newLabel: string): T[] {
    return items.map((item) => {
      if (this.selectedIds.has(item.id)) {
        return { ...item, label: newLabel };
      }
      return item;
    });
  }

  public applyBulkMove<T extends BinderItemLike>(items: T[], targetFolderId: string | null): T[] {
    return items.map((item) => {
      if (this.selectedIds.has(item.id)) {
        return { ...item, parentId: targetFolderId };
      }
      return item;
    });
  }

  public applyBulkTargetWords<T extends BinderItemLike>(items: T[], targetWords: number): T[] {
    return items.map((item) => {
      if (this.selectedIds.has(item.id)) {
        return { ...item, targetWordCount: targetWords };
      }
      return item;
    });
  }
}

export const multiSelectManager = new MultiSelectManager();
export default multiSelectManager;
