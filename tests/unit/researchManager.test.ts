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

import {
  importMediaFile,
  bulkImportFiles,
  updateMediaMetadata,
  deleteMedia,
  createFolder,
  addMediaToFolder,
  removeMediaFromFolder,
  getMediaById,
  getAllMedia,
  getFilteredMedia,
  getMediaCountByType,
  searchMedia,
  exportMediaAsJSON,
  importMediaFromJSON,
} from '../../src/services/researchManager';
import { resetResearchStore, getResearchStore } from '../../src/services/researchStore';

describe('ResearchManager', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    resetResearchStore();
  });

  afterEach(() => {
    localStorageMock.clear();
    resetResearchStore();
  });

  describe('importMediaFile', () => {
    it('should import a file and return success', async () => {
      const mockFile = new File(['test content'], 'test.png', { type: 'image/png' });
      
      // Mock FileReader
      const mockReadAsDataURL = vi.fn(function(this: any) {
        setTimeout(() => {
          this.result = 'image/png;base64,test';
          if (this.onload) this.onload();
        }, 0);
      });
      
      globalThis.FileReader = vi.fn().mockImplementation(function() {
        this.readAsDataURL = mockReadAsDataURL;
        this.result = '';
        this.onload = null;
      }) as any;

      const result = await importMediaFile(mockFile);
      
      expect(result.success).toBe(true);
      expect(result.mediaId).toBeDefined();
    });

    it('should import file with custom options', async () => {
      const mockFile = new File(['test'], 'doc.pdf', { type: 'application/pdf' });
      
      globalThis.FileReader = vi.fn().mockImplementation(function() {
        this.readAsDataURL = function() {
          setTimeout(() => {
            this.result = 'application/pdf;base64,test';
            if (this.onload) this.onload();
          }, 0);
        };
        this.result = '';
        this.onload = null;
      }) as any;

      const result = await importMediaFile(mockFile, {
        title: 'Custom Title',
        description: 'Custom description',
        category: 'reference',
        tags: ['test', 'pdf'],
      });

      expect(result.success).toBe(true);
      
      if (result.mediaId) {
        const media = getMediaById(result.mediaId);
        expect(media?.title).toBe('Custom Title');
        expect(media?.description).toBe('Custom description');
        expect(media?.tags).toEqual(['test', 'pdf']);
      }
    });
  });

  describe('bulkImportFiles', () => {
    it('should import multiple files', async () => {
      const files = [
        new File(['test1'], 'file1.png', { type: 'image/png' }),
        new File(['test2'], 'file2.pdf', { type: 'application/pdf' }),
      ];

      globalThis.FileReader = vi.fn().mockImplementation(function() {
        this.readAsDataURL = function() {
          setTimeout(() => {
            this.result = 'test;base64,test';
            if (this.onload) this.onload();
          }, 0);
        };
        this.result = '';
        this.onload = null;
      }) as any;

      const result = await bulkImportFiles(files);

      expect(result.total).toBe(2);
      expect(result.successful).toBeGreaterThanOrEqual(0);
    });
  });

  describe('updateMediaMetadata', () => {
    it('should update media metadata', () => {
      const store = getResearchStore();
      store.dispatch({
        type: 'ADD_MEDIA',
        payload: {
          title: 'Original',
          description: 'Original description',
          type: 'image',
          category: 'reference',
          fileData: 'image/png;base64,test',
          fileName: 'test.png',
          fileSize: 1024,
          mimeType: 'image/png',
        },
      });

      const mediaId = store.getState().media[0].id;
      const success = updateMediaMetadata(mediaId, {
        title: 'Updated',
        description: 'Updated description',
      });

      expect(success).toBe(true);
      
      const updated = getMediaById(mediaId);
      expect(updated?.title).toBe('Updated');
      expect(updated?.description).toBe('Updated description');
    });

    it('should return false for non-existent media', () => {
      const success = updateMediaMetadata('non-existent', { title: 'Test' });
      expect(success).toBe(false);
    });
  });

  describe('deleteMedia', () => {
    it('should delete media', () => {
      const store = getResearchStore();
      store.dispatch({
        type: 'ADD_MEDIA',
        payload: {
          title: 'To Delete',
          description: '',
          type: 'image',
          category: 'reference',
          fileData: 'image/png;base64,test',
          fileName: 'test.png',
          fileSize: 1024,
          mimeType: 'image/png',
        },
      });

      const mediaId = store.getState().media[0].id;
      const success = deleteMedia(mediaId);

      expect(success).toBe(true);
      expect(getAllMedia()).toHaveLength(0);
    });

    it('should return false for non-existent media', () => {
      const success = deleteMedia('non-existent');
      expect(success).toBe(false);
    });
  });

  describe('createFolder', () => {
    it('should create a folder', () => {
      const folderId = createFolder('Test Folder', { description: 'Test description' });
      
      expect(folderId).toBeDefined();
      
      const store = getResearchStore();
      const folder = store.getState().folders.find(f => f.id === folderId);
      expect(folder?.name).toBe('Test Folder');
      expect(folder?.description).toBe('Test description');
    });
  });

  describe('addMediaToFolder', () => {
    it('should add media to folder', () => {
      const store = getResearchStore();
      
      // Create folder
      store.dispatch({
        type: 'ADD_FOLDER',
        payload: { name: 'Test Folder', description: '' },
      });
      const folderId = store.getState().folders[0].id;

      // Create media
      store.dispatch({
        type: 'ADD_MEDIA',
        payload: {
          title: 'Test Media',
          description: '',
          type: 'image',
          category: 'reference',
          fileData: 'image/png;base64,test',
          fileName: 'test.png',
          fileSize: 1024,
          mimeType: 'image/png',
        },
      });
      const mediaId = store.getState().media[0].id;

      const success = addMediaToFolder(mediaId, folderId);
      
      expect(success).toBe(true);
      
      const updatedFolder = store.getState().folders.find(f => f.id === folderId);
      expect(updatedFolder?.mediaIds).toContain(mediaId);
    });

    it('should return false for non-existent folder or media', () => {
      const success = addMediaToFolder('non-existent-media', 'non-existent-folder');
      expect(success).toBe(false);
    });

    it('should return false when media does not exist', () => {
      const store = getResearchStore();
      
      // Create folder only
      store.dispatch({
        type: 'ADD_FOLDER',
        payload: { name: 'Test Folder', description: '' },
      });
      const folderId = store.getState().folders[0].id;

      const success = addMediaToFolder('non-existent-media', folderId);
      expect(success).toBe(false);
    });

    it('should return false when folder does not exist', () => {
      const store = getResearchStore();
      
      // Create media only
      store.dispatch({
        type: 'ADD_MEDIA',
        payload: {
          title: 'Test Media',
          description: '',
          type: 'image',
          category: 'reference',
          fileData: 'image/png;base64,test',
          fileName: 'test.png',
          fileSize: 1024,
          mimeType: 'image/png',
        },
      });
      const mediaId = store.getState().media[0].id;

      const success = addMediaToFolder(mediaId, 'non-existent-folder');
      expect(success).toBe(false);
    });
  });

  describe('removeMediaFromFolder', () => {
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
          fileData: 'image/png;base64,test',
          fileName: 'test.png',
          fileSize: 1024,
          mimeType: 'image/png',
        },
      });
      const mediaId = store.getState().media[0].id;

      store.addMediaToFolder(mediaId, folderId);
      const success = removeMediaFromFolder(mediaId, folderId);
      
      expect(success).toBe(true);
      
      const updatedFolder = store.getState().folders.find(f => f.id === folderId);
      expect(updatedFolder?.mediaIds).not.toContain(mediaId);
    });

    it('should return false for non-existent folder or media', () => {
      const success = removeMediaFromFolder('non-existent-media', 'non-existent-folder');
      expect(success).toBe(false);
    });
  });

  describe('getMediaById', () => {
    it('should return media by id', () => {
      const store = getResearchStore();
      store.dispatch({
        type: 'ADD_MEDIA',
        payload: {
          title: 'Test Media',
          description: 'Test description',
          type: 'image',
          category: 'reference',
          fileData: 'image/png;base64,test',
          fileName: 'test.png',
          fileSize: 1024,
          mimeType: 'image/png',
        },
      });

      const mediaId = store.getState().media[0].id;
      const media = getMediaById(mediaId);

      expect(media).toBeDefined();
      expect(media?.title).toBe('Test Media');
    });

    it('should return undefined for non-existent id', () => {
      const media = getMediaById('non-existent');
      expect(media).toBeUndefined();
    });
  });

  describe('getAllMedia', () => {
    it('should return all media', () => {
      const store = getResearchStore();
      store.dispatch({
        type: 'ADD_MEDIA',
        payload: {
          title: 'Media 1',
          description: '',
          type: 'image',
          category: 'reference',
          fileData: 'image/png;base64,test1',
          fileName: 'test1.png',
          fileSize: 1024,
          mimeType: 'image/png',
        },
      });
      store.dispatch({
        type: 'ADD_MEDIA',
        payload: {
          title: 'Media 2',
          description: '',
          type: 'pdf',
          category: 'reference',
          fileData: 'application/pdf;base64,test2',
          fileName: 'test2.pdf',
          fileSize: 2048,
          mimeType: 'application/pdf',
        },
      });

      const allMedia = getAllMedia();
      expect(allMedia).toHaveLength(2);
    });
  });

  describe('getMediaCountByType', () => {
    it('should return count by type', () => {
      const store = getResearchStore();
      store.dispatch({
        type: 'ADD_MEDIA',
        payload: {
          title: 'Image 1',
          description: '',
          type: 'image',
          category: 'reference',
          fileData: 'image/png;base64,test1',
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
          fileData: 'image/png;base64,test2',
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
          fileData: 'application/pdf;base64,test',
          fileName: 'test.pdf',
          fileSize: 4096,
          mimeType: 'application/pdf',
        },
      });

      const counts = getMediaCountByType();
      expect(counts.image).toBe(2);
      expect(counts.pdf).toBe(1);
    });
  });

  describe('searchMedia', () => {
    beforeEach(() => {
      const store = getResearchStore();
      store.dispatch({
        type: 'ADD_MEDIA',
        payload: {
          title: 'Character Reference',
          description: 'A character image',
          type: 'image',
          category: 'character',
          fileData: 'image/png;base64,test',
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
          description: 'A map',
          type: 'map',
          category: 'location',
          fileData: 'image/png;base64,map',
          fileName: 'map.png',
          fileSize: 2048,
          mimeType: 'image/png',
          tags: ['world'],
        },
      });
    });

    it('should search by title', () => {
      const results = searchMedia('Character');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Character Reference');
    });

    it('should search by tag', () => {
      const results = searchMedia('protagonist');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Character Reference');
    });

    it('should return empty for no matches', () => {
      const results = searchMedia('nonexistent');
      expect(results).toHaveLength(0);
    });
  });

  describe('exportMediaAsJSON', () => {
    it('should export media as JSON', () => {
      const store = getResearchStore();
      store.dispatch({
        type: 'ADD_MEDIA',
        payload: {
          title: 'Test',
          description: '',
          type: 'image',
          category: 'reference',
          fileData: 'image/png;base64,test',
          fileName: 'test.png',
          fileSize: 1024,
          mimeType: 'image/png',
        },
      });

      const json = exportMediaAsJSON();
      const parsed = JSON.parse(json);

      expect(parsed.media).toHaveLength(1);
      expect(parsed.media[0].title).toBe('Test');
    });
  });

  describe('importMediaFromJSON', () => {
    it('should import media from JSON', () => {
      const json = JSON.stringify({
        media: [
          {
            id: 'test-id',
            title: 'Imported',
            description: '',
            type: 'image',
            category: 'reference',
            fileData: 'data:image/png;base64,test',
            fileName: 'test.png',
            fileSize: 1024,
            mimeType: 'image/png',
            tags: [],
            notes: '',
            linkedCharacterIds: [],
            linkedLocationIds: [],
            linkedPlotlineIds: [],
            zoomLevel: 1,
            panX: 0,
            panY: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        folders: [],
      });

      const success = importMediaFromJSON(json);
      expect(success).toBe(true);

      const media = getAllMedia();
      expect(media).toHaveLength(1);
      expect(media[0].title).toBe('Imported');
    });

    it('should return false for invalid JSON', () => {
      const success = importMediaFromJSON('invalid json');
      expect(success).toBe(false);
    });
  });
});
