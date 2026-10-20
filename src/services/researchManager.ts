import { getResearchStore } from './researchStore';
import { ResearchMedia, MediaType, MediaCategory } from '../types/research';

/**
 * Research Manager Service
 * Provides high-level operations for managing research media
 */

export interface ImportResult {
  success: boolean;
  mediaId?: string;
  error?: string;
}

export interface BulkImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ fileName: string; error: string }>;
}

/**
 * Import a file as research media
 */
export async function importMediaFile(
  file: File,
  options: {
    title?: string;
    description?: string;
    category?: MediaCategory;
    tags?: string[];
    folderId?: string;
  } = {}
): Promise<ImportResult> {
  try {
    const fileData = await readFileAsDataURL(file);
    const mediaType = determineMediaType(file.type, file.name);
    
    const store = getResearchStore();
    store.dispatch({
      type: 'ADD_MEDIA',
      payload: {
        title: options.title || file.name.replace(/\.[^/.]+$/, ''),
        description: options.description || '',
        type: mediaType,
        category: options.category || 'reference',
        fileData,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        tags: options.tags || [],
        notes: '',
      },
    });

    const state = store.getState();
    const mediaId = state.selectedMediaId;

    // Add to folder if specified
    if (options.folderId && mediaId) {
      store.addMediaToFolder(mediaId, options.folderId);
    }

    return {
      success: true,
      mediaId: mediaId || undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Import multiple files at once
 */
export async function bulkImportFiles(
  files: File[],
  options: {
    category?: MediaCategory;
    tags?: string[];
    folderId?: string;
  } = {}
): Promise<BulkImportResult> {
  const result: BulkImportResult = {
    total: files.length,
    successful: 0,
    failed: 0,
    errors: [],
  };

  for (const file of files) {
    const importResult = await importMediaFile(file, {
      category: options.category,
      tags: options.tags,
      folderId: options.folderId,
    });

    if (importResult.success) {
      result.successful++;
    } else {
      result.failed++;
      result.errors.push({
        fileName: file.name,
        error: importResult.error || 'Unknown error',
      });
    }
  }

  return result;
}

/**
 * Update media metadata
 */
export function updateMediaMetadata(
  mediaId: string,
  updates: {
    title?: string;
    description?: string;
    category?: MediaCategory;
    tags?: string[];
    notes?: string;
  }
): boolean {
  try {
    const store = getResearchStore();
    const media = store.getMediaById(mediaId);
    
    // Check if media exists
    if (!media) {
      return false;
    }
    
    store.dispatch({
      type: 'UPDATE_MEDIA',
      payload: {
        id: mediaId,
        updates,
      },
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Delete media
 */
export function deleteMedia(mediaId: string): boolean {
  try {
    const store = getResearchStore();
    const media = store.getMediaById(mediaId);
    
    // Check if media exists
    if (!media) {
      return false;
    }
    
    store.dispatch({
      type: 'DELETE_MEDIA',
      payload: mediaId,
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Create a new folder
 */
export function createFolder(
  name: string,
  options: {
    description?: string;
    parentId?: string | null;
  } = {}
): string | null {
  try {
    const store = getResearchStore();
    store.dispatch({
      type: 'ADD_FOLDER',
      payload: {
        name,
        description: options.description || '',
        parentId: options.parentId || null,
      },
    });
    const state = store.getState();
    return state.selectedFolderId;
  } catch (error) {
    return null;
  }
}

/**
 * Add media to folder
 */
export function addMediaToFolder(mediaId: string, folderId: string): boolean {
  try {
    const store = getResearchStore();
    const media = store.getMediaById(mediaId);
    const folder = store.getFolderById(folderId);
    
    // Check if both media and folder exist
    if (!media || !folder) {
      return false;
    }
    
    store.addMediaToFolder(mediaId, folderId);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Remove media from folder
 */
export function removeMediaFromFolder(mediaId: string, folderId: string): boolean {
  try {
    const store = getResearchStore();
    const media = store.getMediaById(mediaId);
    const folder = store.getFolderById(folderId);
    
    // Check if both media and folder exist
    if (!media || !folder) {
      return false;
    }
    
    store.removeMediaFromFolder(mediaId, folderId);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get media by ID
 */
export function getMediaById(mediaId: string): ResearchMedia | undefined {
  const store = getResearchStore();
  return store.getMediaById(mediaId);
}

/**
 * Get all media
 */
export function getAllMedia(): ResearchMedia[] {
  const store = getResearchStore();
  return store.getState().media;
}

/**
 * Get filtered media
 */
export function getFilteredMedia(): ResearchMedia[] {
  const store = getResearchStore();
  return store.getFilteredMedia();
}

/**
 * Get media count by type
 */
export function getMediaCountByType(): Record<MediaType, number> {
  const store = getResearchStore();
  const count = store.getMediaCount();
  return count.byType;
}

/**
 * Search media by query
 */
export function searchMedia(query: string): ResearchMedia[] {
  const store = getResearchStore();
  store.dispatch({
    type: 'SET_SEARCH_QUERY',
    payload: query,
  });
  return store.getFilteredMedia();
}

/**
 * Helper: Read file as DataURL
 */
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Helper: Determine media type from MIME type and file name
 */
function determineMediaType(mimeType: string, fileName: string): MediaType {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'web-archive';
  
  // Check file extension
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext || '')) return 'audio';
  if (['mp4', 'webm', 'mov'].includes(ext || '')) return 'web-archive';
  if (['txt', 'md', 'doc', 'docx'].includes(ext || '')) return 'document';
  
  return 'document';
}

/**
 * Export media as JSON
 */
export function exportMediaAsJSON(): string {
  const store = getResearchStore();
  const state = store.getState();
  return JSON.stringify({
    media: state.media,
    folders: state.folders,
  }, null, 2);
}

/**
 * Import media from JSON
 */
export function importMediaFromJSON(json: string): boolean {
  try {
    const data = JSON.parse(json);
    const store = getResearchStore();
    
    store.dispatch({
      type: 'LOAD_STATE',
      payload: {
        media: data.media || [],
        folders: data.folders || [],
      },
    });
    
    return true;
  } catch (error) {
    return false;
  }
}
