import {
  ResearchMedia,
  ResearchFolder,
  ResearchState,
  ResearchAction,
  MediaType,
  MediaCategory,
  FOLDER_COLORS,
} from '../types/research';

const STORAGE_KEY = 'scrivener-research-state';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function getRandomFolderColor(): string {
  return FOLDER_COLORS[Math.floor(Math.random() * FOLDER_COLORS.length)];
}

const initialState: ResearchState = {
  media: [],
  folders: [],
  selectedMediaId: null,
  selectedFolderId: null,
  viewMode: 'grid',
  splitViewActive: false,
  splitViewRatio: 50,
  searchQuery: '',
  filterType: 'all',
  filterCategory: 'all',
  sortBy: 'date',
  sortOrder: 'desc',
};

function loadFromStorage(): ResearchState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...initialState, ...parsed };
    }
  } catch {
    // Ignore storage errors
  }
  return initialState;
}

function saveToStorage(state: ResearchState): void {
  try {
    const toSave = {
      media: state.media,
      folders: state.folders,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // Ignore storage errors
  }
}

function researchReducer(state: ResearchState, action: ResearchAction): ResearchState {
  switch (action.type) {
    case 'ADD_MEDIA': {
      const payload = action.payload as {
        title: string;
        description: string;
        type: MediaType;
        category: MediaCategory;
        fileData: string;
        fileName: string;
        fileSize: number;
        mimeType: string;
        tags?: string[];
        notes?: string;
        linkedCharacterIds?: string[];
        linkedLocationIds?: string[];
        linkedPlotlineIds?: string[];
      };
      const now = new Date().toISOString();
      const newMedia: ResearchMedia = {
        id: generateId(),
        title: payload.title,
        description: payload.description,
        type: payload.type,
        category: payload.category,
        fileData: payload.fileData,
        fileName: payload.fileName,
        fileSize: payload.fileSize,
        mimeType: payload.mimeType,
        tags: payload.tags || [],
        notes: payload.notes || '',
        linkedCharacterIds: payload.linkedCharacterIds || [],
        linkedLocationIds: payload.linkedLocationIds || [],
        linkedPlotlineIds: payload.linkedPlotlineIds || [],
        zoomLevel: 1,
        panX: 0,
        panY: 0,
        createdAt: now,
        updatedAt: now,
      };
      return {
        ...state,
        media: [...state.media, newMedia],
        selectedMediaId: newMedia.id,
      };
    }

    case 'UPDATE_MEDIA': {
      const payload = action.payload as { id: string; updates: Partial<ResearchMedia> };
      return {
        ...state,
        media: state.media.map((m) =>
          m.id === payload.id
            ? { ...m, ...payload.updates, updatedAt: new Date().toISOString() }
            : m
        ),
      };
    }

    case 'DELETE_MEDIA': {
      const mediaId = action.payload as string;
      // Remove from folders
      const updatedFolders = state.folders.map((f) => ({
        ...f,
        mediaIds: f.mediaIds.filter((id) => id !== mediaId),
      }));
      return {
        ...state,
        media: state.media.filter((m) => m.id !== mediaId),
        folders: updatedFolders,
        selectedMediaId: state.selectedMediaId === mediaId ? null : state.selectedMediaId,
      };
    }

    case 'ADD_FOLDER': {
      const payload = action.payload as {
        name: string;
        description: string;
        parentId?: string | null;
      };
      const now = new Date().toISOString();
      const newFolder: ResearchFolder = {
        id: generateId(),
        name: payload.name,
        description: payload.description,
        parentId: payload.parentId || null,
        mediaIds: [],
        color: getRandomFolderColor(),
        createdAt: now,
        updatedAt: now,
      };
      return {
        ...state,
        folders: [...state.folders, newFolder],
        selectedFolderId: newFolder.id,
      };
    }

    case 'UPDATE_FOLDER': {
      const payload = action.payload as { id: string; updates: Partial<ResearchFolder> };
      return {
        ...state,
        folders: state.folders.map((f) =>
          f.id === payload.id
            ? { ...f, ...payload.updates, updatedAt: new Date().toISOString() }
            : f
        ),
      };
    }

    case 'DELETE_FOLDER': {
      const folderId = action.payload as string;
      return {
        ...state,
        folders: state.folders.filter((f) => f.id !== folderId),
        selectedFolderId: state.selectedFolderId === folderId ? null : state.selectedFolderId,
      };
    }

    case 'SELECT_MEDIA':
      return { ...state, selectedMediaId: action.payload as string | null };

    case 'SELECT_FOLDER':
      return { ...state, selectedFolderId: action.payload as string | null };

    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload as ResearchState['viewMode'] };

    case 'TOGGLE_SPLIT_VIEW':
      return { ...state, splitViewActive: !state.splitViewActive };

    case 'SET_SPLIT_RATIO':
      return { ...state, splitViewRatio: action.payload as number };

    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload as string };

    case 'SET_FILTER_TYPE':
      return { ...state, filterType: action.payload as MediaType | 'all' };

    case 'SET_FILTER_CATEGORY':
      return { ...state, filterCategory: action.payload as MediaCategory | 'all' };

    case 'SET_SORT_BY':
      return { ...state, sortBy: action.payload as ResearchState['sortBy'] };

    case 'SET_SORT_ORDER':
      return { ...state, sortOrder: action.payload as 'asc' | 'desc' };

    case 'UPDATE_MEDIA_VIEWER_STATE': {
      const payload = action.payload as {
        id: string;
        zoomLevel?: number;
        panX?: number;
        panY?: number;
      };
      return {
        ...state,
        media: state.media.map((m) =>
          m.id === payload.id
            ? {
                ...m,
                zoomLevel: payload.zoomLevel ?? m.zoomLevel,
                panX: payload.panX ?? m.panX,
                panY: payload.panY ?? m.panY,
              }
            : m
        ),
      };
    }

    case 'LOAD_STATE':
      return { ...initialState, ...(action.payload as Partial<ResearchState>) };

    default:
      return state;
  }
}

type Listener = (state: ResearchState) => void;

class ResearchStoreImpl {
  private state: ResearchState;
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.state = loadFromStorage();
  }

  getState(): ResearchState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  dispatch(action: ResearchAction): void {
    this.state = researchReducer(this.state, action);
    saveToStorage(this.state);
    this.listeners.forEach((listener) => listener(this.state));
  }

  // Helper methods
  getFilteredMedia(): ResearchMedia[] {
    const { media, searchQuery, filterType, filterCategory, sortBy, sortOrder, selectedFolderId } = this.state;

    let filtered = media.filter((m) => {
      const matchesSearch =
        searchQuery === '' ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = filterType === 'all' || m.type === filterType;
      const matchesCategory = filterCategory === 'all' || m.category === filterCategory;

      // If a folder is selected, only show media in that folder
      const matchesFolder = !selectedFolderId ||
        this.state.folders.find(f => f.id === selectedFolderId)?.mediaIds.includes(m.id);

      return matchesSearch && matchesType && matchesCategory && matchesFolder;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'size':
          comparison = a.fileSize - b.fileSize;
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }

  getMediaById(id: string): ResearchMedia | undefined {
    return this.state.media.find((m) => m.id === id);
  }

  getFolderById(id: string): ResearchFolder | undefined {
    return this.state.folders.find((f) => f.id === id);
  }

  getSubfolders(parentId: string | null): ResearchFolder[] {
    return this.state.folders.filter((f) => f.parentId === parentId);
  }

  getMediaCount(): { total: number; byType: Record<MediaType, number> } {
    const byType: Record<MediaType, number> = {
      image: 0,
      pdf: 0,
      audio: 0,
      map: 0,
      'web-archive': 0,
      document: 0,
      note: 0,
    };

    this.state.media.forEach((m) => {
      byType[m.type]++;
    });

    return {
      total: this.state.media.length,
      byType,
    };
  }

  addMediaToFolder(mediaId: string, folderId: string): void {
    const folder = this.getFolderById(folderId);
    if (folder && !folder.mediaIds.includes(mediaId)) {
      this.dispatch({
        type: 'UPDATE_FOLDER',
        payload: {
          id: folderId,
          updates: { mediaIds: [...folder.mediaIds, mediaId] },
        },
      });
    }
  }

  removeMediaFromFolder(mediaId: string, folderId: string): void {
    const folder = this.getFolderById(folderId);
    if (folder) {
      this.dispatch({
        type: 'UPDATE_FOLDER',
        payload: {
          id: folderId,
          updates: { mediaIds: folder.mediaIds.filter((id) => id !== mediaId) },
        },
      });
    }
  }
}

let storeInstance: ResearchStoreImpl | null = null;

export function getResearchStore(): ResearchStoreImpl {
  if (!storeInstance) {
    storeInstance = new ResearchStoreImpl();
  }
  return storeInstance;
}

export function resetResearchStore(): void {
  storeInstance = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export type { ResearchStoreImpl };
