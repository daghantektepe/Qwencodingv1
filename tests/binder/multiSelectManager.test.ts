import { describe, it, expect, beforeEach } from 'vitest';
import { MultiSelectManager, BinderItemLike } from '../../src/services/binder/multiSelectManager';

describe('Phase 71: Multi-Select Binder & Bulk Actions (multiSelectManager)', () => {
  let manager: MultiSelectManager;

  beforeEach(() => {
    manager = new MultiSelectManager();
  });

  it('selects single item and clears previous selection', () => {
    manager.selectSingle('doc-1');
    expect(manager.getSelectedIds()).toEqual(['doc-1']);
    expect(manager.isSelected('doc-1')).toBe(true);

    manager.selectSingle('doc-2');
    expect(manager.getSelectedIds()).toEqual(['doc-2']);
    expect(manager.isSelected('doc-1')).toBe(false);
  });

  it('toggles selection with Ctrl/Cmd behavior', () => {
    manager.toggleSelect('doc-1');
    manager.toggleSelect('doc-2');
    expect(manager.getSelectedCount()).toBe(2);
    expect(manager.isSelected('doc-1')).toBe(true);
    expect(manager.isSelected('doc-2')).toBe(true);

    manager.toggleSelect('doc-1');
    expect(manager.getSelectedCount()).toBe(1);
    expect(manager.isSelected('doc-1')).toBe(false);
    expect(manager.isSelected('doc-2')).toBe(true);
  });

  it('selects ranges of items with Shift behavior', () => {
    const list = ['d1', 'd2', 'd3', 'd4', 'd5'];

    manager.selectSingle('d2');
    manager.selectRange('d4', list);

    expect(manager.getSelectedCount()).toBe(3);
    expect(manager.isSelected('d2')).toBe(true);
    expect(manager.isSelected('d3')).toBe(true);
    expect(manager.isSelected('d4')).toBe(true);
    expect(manager.isSelected('d1')).toBe(false);
  });

  it('selects all items and clears selection', () => {
    const list = ['a', 'b', 'c'];
    manager.selectAll(list);
    expect(manager.getSelectedCount()).toBe(3);

    manager.clearSelection();
    expect(manager.getSelectedCount()).toBe(0);
  });

  it('applies bulk status and labels only to selected items', () => {
    const items: BinderItemLike[] = [
      { id: '1', title: 'Bölüm 1', status: 'Taslak', label: 'Eski' },
      { id: '2', title: 'Bölüm 2', status: 'Taslak', label: 'Eski' },
      { id: '3', title: 'Bölüm 3', status: 'Taslak', label: 'Eski' },
    ];

    manager.toggleSelect('1');
    manager.toggleSelect('3');

    const updatedStatus = manager.applyBulkStatus(items, 'Tamamlandı');
    expect(updatedStatus[0].status).toBe('Tamamlandı');
    expect(updatedStatus[1].status).toBe('Taslak'); // Seçilmemişti
    expect(updatedStatus[2].status).toBe('Tamamlandı');

    const updatedLabels = manager.applyBulkLabel(items, 'Final');
    expect(updatedLabels[0].label).toBe('Final');
    expect(updatedLabels[1].label).toBe('Eski');
    expect(updatedLabels[2].label).toBe('Final');
  });

  it('applies bulk move to target folder', () => {
    const items: BinderItemLike[] = [
      { id: 'd1', title: '1', parentId: null },
      { id: 'd2', title: '2', parentId: null },
    ];

    manager.selectSingle('d1');
    const moved = manager.applyBulkMove(items, 'folder-act-1');
    expect(moved[0].parentId).toBe('folder-act-1');
    expect(moved[1].parentId).toBeNull();
  });
});
