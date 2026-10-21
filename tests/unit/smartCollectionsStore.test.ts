import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

import { getSmartCollectionsStore, resetSmartCollectionsStore } from '../../src/services/smartCollectionsStore';
import { Document } from '../../src/types/smartCollections';

describe('SmartCollectionsStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    resetSmartCollectionsStore();
  });

  afterEach(() => {
    localStorageMock.clear();
    resetSmartCollectionsStore();
  });

  describe('Initial State', () => {
    it('should return initial state with empty arrays', () => {
      const store = getSmartCollectionsStore();
      const state = store.getState();

      expect(state.collections).toEqual([]);
      expect(state.documents).toEqual([]);
      expect(state.selectedCollectionId).toBeNull();
      expect(state.searchQuery).toBe('');
    });
  });

  describe('ADD_COLLECTION', () => {
    it('should add a new smart collection', () => {
      const store = getSmartCollectionsStore();
      store.dispatch({
        type: 'ADD_COLLECTION',
        payload: {
          name: 'Son 3 Günde Değiştirilenler',
          description: 'Son 3 gün içinde değiştirilen dokümanlar',
          icon: '🕐',
          color: '#10B981',
          filterGroup: {
            id: 'group-1',
            logic: 'and',
            rules: [
              {
                id: 'rule-1',
                field: 'lastModified',
                operator: 'greater_than',
                value: '3 days ago',
              },
            ],
          },
          sortBy: 'modified',
          sortOrder: 'desc',
        },
      });

      const state = store.getState();
      expect(state.collections).toHaveLength(1);
      expect(state.collections[0].name).toBe('Son 3 Günde Değiştirilenler');
      expect(state.collections[0].icon).toBe('🕐');
      expect(state.selectedCollectionId).toBe(state.collections[0].id);
    });

    it('should add collection with multiple rules', () => {
      const store = getSmartCollectionsStore();
      store.dispatch({
        type: 'ADD_COLLECTION',
        payload: {
          name: 'İlk Taslak ve >1500 Kelime',
          filterGroup: {
            id: 'group-1',
            logic: 'and',
            rules: [
              {
                id: 'rule-1',
                field: 'status',
                operator: 'equals',
                value: 'İlk Taslak',
              },
              {
                id: 'rule-2',
                field: 'wordCount',
                operator: 'greater_than',
                value: 1500,
              },
            ],
          },
        },
      });

      const state = store.getState();
      expect(state.collections).toHaveLength(1);
      expect(state.collections[0].filterGroup.rules).toHaveLength(2);
    });
  });

  describe('UPDATE_COLLECTION', () => {
    it('should update collection properties', () => {
      const store = getSmartCollectionsStore();
      
      // Add collection first
      store.dispatch({
        type: 'ADD_COLLECTION',
        payload: {
          name: 'Original Name',
          filterGroup: {
            id: 'group-1',
            logic: 'and',
            rules: [],
          },
        },
      });

      const collectionId = store.getState().collections[0].id;
      
      // Update collection
      store.dispatch({
        type: 'UPDATE_COLLECTION',
        payload: {
          id: collectionId,
          updates: {
            name: 'Updated Name',
            description: 'Updated description',
          },
        },
      });

      const updated = store.getState().collections[0];
      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('Updated description');
    });
  });

  describe('DELETE_COLLECTION', () => {
    it('should remove a collection', () => {
      const store = getSmartCollectionsStore();
      
      store.dispatch({
        type: 'ADD_COLLECTION',
        payload: {
          name: 'To Delete',
          filterGroup: {
            id: 'group-1',
            logic: 'and',
            rules: [],
          },
        },
      });

      const collectionId = store.getState().collections[0].id;
      store.dispatch({ type: 'DELETE_COLLECTION', payload: collectionId });

      expect(store.getState().collections).toHaveLength(0);
    });

    it('should clear selection if deleted collection was selected', () => {
      const store = getSmartCollectionsStore();
      
      store.dispatch({
        type: 'ADD_COLLECTION',
        payload: {
          name: 'Selected Collection',
          filterGroup: {
            id: 'group-1',
            logic: 'and',
            rules: [],
          },
        },
      });

      const collectionId = store.getState().collections[0].id;
      expect(store.getState().selectedCollectionId).toBe(collectionId);

      store.dispatch({ type: 'DELETE_COLLECTION', payload: collectionId });
      expect(store.getState().selectedCollectionId).toBeNull();
    });
  });

  describe('getCollectionDocuments', () => {
    let store: ReturnType<typeof getSmartCollectionsStore>;
    let testDocuments: Document[];

    beforeEach(() => {
      store = getSmartCollectionsStore();
      
      // Add test documents
      testDocuments = [
        {
          id: 'doc-1',
          title: 'Bölüm 1',
          status: 'İlk Taslak',
          wordCount: 2000,
          lastModified: new Date().toISOString(),
          created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['roman', 'macera'],
          pov: 'Ahmet',
        },
        {
          id: 'doc-2',
          title: 'Bölüm 2',
          status: 'Tamamlandı',
          wordCount: 1500,
          lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          created: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['roman'],
          pov: 'Ayşe',
        },
        {
          id: 'doc-3',
          title: 'Bölüm 3',
          status: 'İlk Taslak',
          wordCount: 800,
          lastModified: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['roman', 'gizem'],
          pov: 'Ahmet',
        },
      ];

      store.dispatch({
        type: 'UPDATE_DOCUMENTS',
        payload: testDocuments,
      });
    });

    it('should filter documents by status', () => {
      store.dispatch({
        type: 'ADD_COLLECTION',
        payload: {
          name: 'İlk Taslaklar',
          filterGroup: {
            id: 'group-1',
            logic: 'and',
            rules: [
              {
                id: 'rule-1',
                field: 'status',
                operator: 'equals',
                value: 'İlk Taslak',
              },
            ],
          },
        },
      });

      const collectionId = store.getState().collections[0].id;
      const docs = store.getCollectionDocuments(collectionId);

      expect(docs).toHaveLength(2);
      expect(docs.every(d => d.status === 'İlk Taslak')).toBe(true);
    });

    it('should filter documents by word count', () => {
      store.dispatch({
        type: 'ADD_COLLECTION',
        payload: {
          name: 'Uzun Dokümanlar',
          filterGroup: {
            id: 'group-1',
            logic: 'and',
            rules: [
              {
                id: 'rule-1',
                field: 'wordCount',
                operator: 'greater_than',
                value: 1000,
              },
            ],
          },
        },
      });

      const collectionId = store.getState().collections[0].id;
      const docs = store.getCollectionDocuments(collectionId);

      expect(docs).toHaveLength(2);
      expect(docs.every(d => d.wordCount > 1000)).toBe(true);
    });

    it('should filter documents by POV character', () => {
      store.dispatch({
        type: 'ADD_COLLECTION',
        payload: {
          name: 'Ahmet POV',
          filterGroup: {
            id: 'group-1',
            logic: 'and',
            rules: [
              {
                id: 'rule-1',
                field: 'pov',
                operator: 'equals',
                value: 'Ahmet',
              },
            ],
          },
        },
      });

      const collectionId = store.getState().collections[0].id;
      const docs = store.getCollectionDocuments(collectionId);

      expect(docs).toHaveLength(2);
      expect(docs.every(d => d.pov === 'Ahmet')).toBe(true);
    });

    it('should filter documents by tags', () => {
      store.dispatch({
        type: 'ADD_COLLECTION',
        payload: {
          name: 'Gizem Etiketli',
          filterGroup: {
            id: 'group-1',
            logic: 'and',
            rules: [
              {
                id: 'rule-1',
                field: 'tags',
                operator: 'contains',
                value: 'gizem',
              },
            ],
          },
        },
      });

      const collectionId = store.getState().collections[0].id;
      const docs = store.getCollectionDocuments(collectionId);

      expect(docs).toHaveLength(1);
      expect(docs[0].tags).toContain('gizem');
    });

    it('should combine multiple rules with AND logic', () => {
      store.dispatch({
        type: 'ADD_COLLECTION',
        payload: {
          name: 'Ahmet POV ve İlk Taslak',
          filterGroup: {
            id: 'group-1',
            logic: 'and',
            rules: [
              {
                id: 'rule-1',
                field: 'pov',
                operator: 'equals',
                value: 'Ahmet',
              },
              {
                id: 'rule-2',
                field: 'status',
                operator: 'equals',
                value: 'İlk Taslak',
              },
            ],
          },
        },
      });

      const collectionId = store.getState().collections[0].id;
      const docs = store.getCollectionDocuments(collectionId);

      expect(docs).toHaveLength(2);
      expect(docs.every(d => d.pov === 'Ahmet' && d.status === 'İlk Taslak')).toBe(true);
    });
  });
});
