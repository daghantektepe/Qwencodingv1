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

import { getResearchStore, resetResearchStore } from '../../src/services/researchStore';

describe('ResearchStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    resetResearchStore();
  });

  afterEach(() => {
    localStorageMock.clear();
    resetResearchStore();
  });

  describe('Initial State', () => {
    it('should return initial state with empty arrays', () => {
      const store = getResearchStore();
      const state = store.getState();

      expect(state.media).toEqual([]);
      expect(state.folders).toEqual([]);
      expect(state.selectedMediaId).toBeNull();
      expect(state.selectedFolderId).toBeNull();
      expect(state.viewMode).toBe('grid');
      expect(state.splitViewActive).toBe(false);
      expect(state.splitViewRatio).toBe(50);
    });
  });

  describe('ADD_MEDIA', () => {
    it('should add a new media item', () => {
      const store = getResearchStore();
      store.dispatch({
        type: 'ADD_MEDIA',
        payload: {
          title: 'Test Image',
          description: 'A test image',
          type: 'image',
          category: 'reference',
          fileData: 'data:image/png;base64,test',
          fileName: 'test.png',
          fileSize: 1024,
          mimeType: 'image/png',
          tags: ['test', 'image'],
          notes: 'Test notes',
        },
      });

      const state = store.getState();
      expect(state.media).toHaveLength(1);
      expect(state.media[0].title).toBe('Test Image');
      expect(state.media[0].type).toBe('image');
      expect(state.media[0].tags).toEqual(['test', 'image']);
      expect(state.media[0].zoomLevel).toBe(1);
      expect(state.media[0].panX).toBe(0);
      expect(state.media[0].panY).toBe(0);
    });

    it('should set selectedMediaId to new media', () => {
      const store = getResearchStore();
      store.dispatch({
        type: 'ADD_MEDIA',
        payload: {
          title: 'Test',
          description: '',
          type: 'image',
          category: 'reference',
          fileData: 'data:image/png;base64,test',
          fileName: 'test.png',
          fileSize: 1024,
          mimeType: 'image/png',
        },
      });

      const state = store.getState();
      expect(state.selectedMediaId).toBe(state.media[0].id);
    });
  });

  describe('UPDATE_MEDIA', () => {
    it('should update media properties', () => {
      const store = getResearchStore();
      store.dispatch({
        type: 'ADD_MEDIA',
        payload: {
          title: 'Original',
          description: 'Original description',
          type: 'image',
          category: 'reference',
          fileData: 'data:image/png;base64,test',
          fileName: 'test.png',
          fileSize: 1024,
          mimeType: 'image/png',
        },
      });

      const mediaId = store.getState().media[0].id;
      store.dispatch({
        type: 'UPDATE_MEDIA',
        payload: {
          id: mediaId,
          updates: { title: 'Updated', description: 'Updated description' },
        },
      });

      const updated = store.getState().media[0];
      expect(updated.title).toBe('Updated');
      expect(updated.description).toBe('Updated description');
      expect(updated.type).toBe('image'); // unchanged
    });
  });

  describe('DELETE_MEDIA', () => {
    it('should remove a media item', () => {
      const store = getResearchStore();
      store.dispatch({
        type: 'ADD_MEDIA',
        payload: {
          title: 'To Delete',
          description: '',
          type: 'image',
          category: 'reference',
          fileData: 'data:image/png;base64,test',
          fileName: 'test.png',
          fileSize: 1024,
          mimeType: 'image/png',
        },
      });

      const mediaId = store.getState().media[0].id;
      store.dispatch({ type: 'DELETE_MEDIA', payload: mediaId });

      expect(store.getState().media).toHaveLength(0);
    });

    it('should remove media from folders', () => {
      const store = getResearchStore();

      // Add folder
      store.dispatch({
        type: 'ADD_FOLDER',
        payload: { name: 'Test Folder', description: '' },
      });
      const folderId = store.getState().folders[0].id;

      // Add media
      store.dispatch({
        type: 'ADD_MEDIA',
        payload: {
          title: 'Test Media',
          description: '',
          type: 'image',
          category: 'reference',
          fileData: 'data:image/png;base64,test',
          fileName: 'test.png',
          fileSize: 1024,
          mimeType: 'image/png',
        },
      });
      const mediaId = store.getState().media[0].id;

      // Add media to folder
      store.addMediaToFolder(mediaId, folderId);
      expect(store.getState().folders[0].mediaIds).toContain(mediaId);

      // Delete media
      store.dispatch({ type: 'DELETE_MEDIA', payload: mediaId });
      expect(store.getState().folders[0].mediaIds).not.toContain(mediaId);
    });
  });

  describe('ADD_FOLDER', () => {
    it('should add a new folder', () => {
      const store = getResearchStore();
      store.dispatch({
        type: 'ADD_FOLDER',
        payload: {
          name: 'Characters',
          description: 'Character references',
        },
      });

      const state = store.getState();
      expect(state.folders).toHaveLength(1);
      expect(state.folders[0].name).toBe('Characters');
      expect(state.folders[0].color).toBeTruthy();
    });
  });

  describe('DELETE_FOLDER', () => {
    it('should remove a folder', () => {
      const store = getResearchStore();
      store.dispatch({
        type: 'ADD_FOLDER',
        payload: { name: 'Test', description: '' },
      });

      const folderId = store.getState().folders[0].id;
      store.dispatch({ type: 'DELETE_FOLDER', payload: folderId });

      expect(store.getState().folders).toHaveLength(0);
    });
  });

  describe('Filters and Search', () => {
    beforeEach(() => {
      const store = getResearchStore();
      store.dispatch({
        type: 'ADD_MEDIA',
        payload: {
          title: 'Character Reference',
          description: 'A character image',
          type: 'image',
          category: 'character',
          fileData: 'data:image/png;base64,test',
          fileName: 'char.png',
          fileSize: 1024,
          mimeType: 'image/png',
          tags: ['protagonist'],
        },
      });
      store.dispatch({
        type: 'ADD_MEDIA',
        payload: {
          title: 'Location Map',
          description: 'A map of the story world',
          type: 'map',
          category: 'location',
          fileData: 'data:image/png;base64,map',
          fileName: 'map.png',
          fileSize: 2048,
          mimeType: 'image/png',
          tags: ['world'],
        },
      });
      store.dispatch({
        type: 'ADD_MEDIA',
        payload: {
          title: 'Research PDF',
          description: 'Historical research document',
          type: 'pdf',
          category: 'reference',
          fileData: 'data:application/pdf;base64,pdf',
          fileName: 'research.pdf',
          fileSize: 4096,
          mimeType: 'application/pdf',
          tags: ['history'],
        },
      });
    });

    it('should filter by search query', () => {
      const store = getResearchStore();
      store.dispatch({ type: 'SET_SEARCH_QUERY', payload: 'character' });

      const filtered = store.getFilteredMedia();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe('Character Reference');
    });

    it('should filter by type', () => {
      const store = getResearchStore();
      store.dispatch({ type: 'SET_FILTER_TYPE', payload: 'pdf' });

      const filtered = store.getFilteredMedia();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].type).toBe('pdf');
    });

    it('should filter by category', () => {
      const store = getResearchStore();
      store.dispatch({ type: 'SET_FILTER_CATEGORY', payload: 'location' });

      const filtered = store.getFilteredMedia();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].category).toBe('location');
    });

    it('should filter by tag', () => {
      const store = getResearchStore();
      store.dispatch({ type: 'SET_SEARCH_QUERY', payload: 'protagonist' });

      const filtered = store.getFilteredMedia();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe('Character Reference');
    });

    it('should sort by name ascending', () => {
      const store = getResearchStore();
      store.dispatch({ type: 'SET_SORT_BY', payload: 'name' });
      store.dispatch({ type: 'SET_SORT_ORDER', payload: 'asc' });

      const filtered = store.getFilteredMedia();
      expect(filtered[0].title).toBe('Character Reference');
      expect(filtered[2].title).toBe('Research PDF');
    });

    it('should sort by size descending', () => {
      const store = getResearchStore();
      store.dispatch({ type: 'SET_SORT_BY', payload: 'size' });
      store.dispatch({ type: 'SET_SORT_ORDER', payload: 'desc' });

      const filtered = store.getFilteredMedia();
      expect(filtered[0].fileSize).toBe(4096);
    });
  });

  describe('Viewer State', () => {
    it('should update media viewer state', () => {
      const store = getResearchStore();
      store.dispatch({
        type: 'ADD_MEDIA',
        payload: {
          title: 'Test',
          description: '',
          type: 'image',
          category: 'reference',
          fileData: 'data:image/png;base64,test',
          fileName: 'test.png',
          fileSize: 1024,
          mimeType: 'image/png',
        },
      });

      const mediaId = store.getState().media[0].id;
      store.dispatch({
        type: 'UPDATE_MEDIA_VIEWER_STATE',
        payload: {
          id: mediaId,
          zoomLevel: 2,
          panX: 100,
          panY: 50,
        },
      });

      const media = store.getState().media[0];
      expect(media.zoomLevel).toBe(2);
      expect(media.panX).toBe(100);
      expect(media.panY).toBe(50);
    });
  });

  describe('getMediaCount', () => {
    it('should return correct counts', () => {
      const store = getResearchStore();
      store.dispatch({
        type: 'ADD_MEDIA',
        payload: {
          title: 'Image 1',
          description: '',
          type: 'image',
          category: 'reference',
          fileData: 'data:image/png;base64,test1',
          fileName: 'test1.png',
          fileSize: 1024,
          mimeType: 'image/png',
        },
      });
      store.dispatch({
        type: 'ADD_MEDIA',
        payload: {
          title: 'Image 2',
          description: '',
          type: 'image',
          category: 'reference',
          fileData: 'data:image/png;base64,test2',
          fileName: 'test2.png',
          fileSize: 2048,
          mimeType: 'image/png',
        },
      });
      store.dispatch({
        type: 'ADD_MEDIA',
        payload: {
          title: 'PDF',
          description: '',
          type: 'pdf',
          category: 'reference',
          fileData: 'data:application/pdf;base64,test',
          fileName: 'test.pdf',
          fileSize: 4096,
          mimeType: 'application/pdf',
        },
      });

      const count = store.getMediaCount();
      expect(count.total).toBe(3);
      expect(count.byType.image).toBe(2);
      expect(count.byType.pdf).toBe(1);
    });
  });

  describe('Folder Operations', () => {
    it('should add media to folder', () => {
      const store = getResearchStore();

      store.dispatch({
        type: 'ADD_FOLDER',
        payload: { name: 'Test Folder', description: '' },
      });
      const folderId = store.getState().folders[0].id;

      store.dispatch({
        type: 'ADD_MEDIA',
        payload: {
          title: 'Test Media',
          description: '',
          type: 'image',
          category: 'reference',
          fileData: 'data:image/png;base64,test',
          fileName: 'test.png',
          fileSize: 1024,
          mimeType: 'image/png',
        },
      });
      const mediaId = store.getState().media[0].id;

      store.addMediaToFolder(mediaId, folderId);

      expect(store.getState().folders[0].mediaIds).toContain(mediaId);
    });

    it('should remove media from folder', () => {
      const store = getResearchStore();

      store.dispatch({
        type: 'ADD_FOLDER',
        payload: { name: 'Test Folder', description: '' },
      });
      const folderId = store.getState().folders[0].id;

      store.dispatch({
        type: 'ADD_MEDIA',
        payload: {
          title: 'Test Media',
          description: '',
          type: 'image',
          category: 'reference',
          fileData: 'data:image/png;base64,test',
          fileName: 'test.png',
          fileSize: 1024,
          mimeType: 'image/png',
        },
      });
      const mediaId = store.getState().media[0].id;

      store.addMediaToFolder(mediaId, folderId);
      store.removeMediaFromFolder(mediaId, folderId);

      expect(store.getState().folders[0].mediaIds).not.toContain(mediaId);
    });
  });

  describe('Subscribe', () => {
    it('should notify subscribers on dispatch', () => {
      const store = getResearchStore();
      const listener = vi.fn();
      store.subscribe(listener);

      store.dispatch({
        type: 'ADD_MEDIA',
        payload: {
          title: 'Test',
          description: '',
          type: 'image',
          category: 'reference',
          fileData: 'data:image/png;base64,test',
          fileName: 'test.png',
          fileSize: 1024,
          mimeType: 'image/png',
        },
      });

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe correctly', () => {
      const store = getResearchStore();
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);

      unsubscribe();

      store.dispatch({
        type: 'ADD_MEDIA',
        payload: {
          title: 'Test',
          description: '',
          type: 'image',
          category: 'reference',
          fileData: 'data:image/png;base64,test',
          fileName: 'test.png',
          fileSize: 1024,
          mimeType: 'image/png',
        },
      });

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
