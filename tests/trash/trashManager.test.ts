import { describe, it, expect, beforeEach } from 'vitest';
import { TrashManager } from '../../src/services/trash/trashManager';

describe('Phase 66: Trash Bin & Granular Data Recovery Vault (trashManager)', () => {
  let manager: TrashManager;

  beforeEach(() => {
    manager = new TrashManager();
  });

  it('moves item to trash with timestamp and word count metadata', () => {
    const item = manager.moveToTrash({
      id: 'doc-99',
      title: 'İptal Edilen Bölüm',
      content: 'Bu bölüm romandan çıkarıldı.',
      originalParentId: 'folder-1',
      originalIndex: 2,
      wordCount: 5,
      itemType: 'document',
    });

    expect(item.deletedAt).toBeDefined();
    expect(manager.getCount()).toBe(1);
    expect(manager.getItem('doc-99')).toEqual(item);
  });

  it('restores soft-deleted item and removes it from trash', () => {
    manager.moveToTrash({
      id: 'doc-100',
      title: 'Önemli Taslak',
      content: 'Metin',
      originalParentId: null,
      originalIndex: 0,
      wordCount: 1,
      itemType: 'document',
    });

    expect(manager.getCount()).toBe(1);

    const restored = manager.restoreItem('doc-100');
    expect(restored.id).toBe('doc-100');
    expect(manager.getCount()).toBe(0);

    expect(() => manager.restoreItem('doc-100')).toThrow();
  });

  it('permanently deletes an item', () => {
    manager.moveToTrash({
      id: 'doc-101',
      title: 'Çöp 1',
      content: 'Test',
      originalParentId: null,
      originalIndex: 0,
      wordCount: 1,
      itemType: 'document',
    });

    manager.permanentDelete('doc-101');
    expect(manager.getCount()).toBe(0);
    expect(manager.getItem('doc-101')).toBeUndefined();
  });

  it('empties entire trash vault', () => {
    manager.moveToTrash({ id: '1', title: 'A', content: '', originalParentId: null, originalIndex: 0, wordCount: 0, itemType: 'document' });
    manager.moveToTrash({ id: '2', title: 'B', content: '', originalParentId: null, originalIndex: 1, wordCount: 0, itemType: 'document' });

    expect(manager.getCount()).toBe(2);
    const count = manager.emptyTrash();
    expect(count).toBe(2);
    expect(manager.getCount()).toBe(0);
  });

  it('searches and filters trash items by title or content', () => {
    manager.moveToTrash({ id: '1', title: 'Gizemli Cinayet', content: 'Katil uşak.', originalParentId: null, originalIndex: 0, wordCount: 2, itemType: 'document' });
    manager.moveToTrash({ id: '2', title: 'Aşk Mektubu', content: 'Sevgili Jane...', originalParentId: null, originalIndex: 1, wordCount: 2, itemType: 'document' });

    const searchTitle = manager.getTrashItems('cinayet');
    expect(searchTitle).toHaveLength(1);
    expect(searchTitle[0].title).toBe('Gizemli Cinayet');

    const searchContent = manager.getTrashItems('jane');
    expect(searchContent).toHaveLength(1);
    expect(searchContent[0].title).toBe('Aşk Mektubu');
  });
});
