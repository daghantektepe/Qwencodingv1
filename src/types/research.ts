// Research Vault Module Type Definitions
// Research & Media Library system types

export type MediaType = 'image' | 'pdf' | 'audio' | 'map' | 'web-archive' | 'document' | 'note';

export type MediaCategory = 'character' | 'location' | 'plot' | 'reference' | 'inspiration' | 'custom';

export interface ResearchMedia {
  id: string;
  title: string;
  description: string;
  type: MediaType;
  category: MediaCategory;
  // File data (base64 or URL)
  fileData: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  // Metadata
  tags: string[];
  notes: string;
  // Associations
  linkedCharacterIds: string[];
  linkedLocationIds: string[];
  linkedPlotlineIds: string[];
  // Viewer state
  zoomLevel: number;
  panX: number;
  panY: number;
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface ResearchFolder {
  id: string;
  name: string;
  description: string;
  parentId: string | null;
  mediaIds: string[];
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResearchState {
  media: ResearchMedia[];
  folders: ResearchFolder[];
  selectedMediaId: string | null;
  selectedFolderId: string | null;
  viewMode: 'grid' | 'list' | 'split';
  splitViewActive: boolean;
  splitViewRatio: number; // 0-100, percentage for left panel
  searchQuery: string;
  filterType: MediaType | 'all';
  filterCategory: MediaCategory | 'all';
  sortBy: 'name' | 'date' | 'size' | 'type';
  sortOrder: 'asc' | 'desc';
}

export interface ResearchAction {
  type:
    | 'ADD_MEDIA'
    | 'UPDATE_MEDIA'
    | 'DELETE_MEDIA'
    | 'ADD_FOLDER'
    | 'UPDATE_FOLDER'
    | 'DELETE_FOLDER'
    | 'SELECT_MEDIA'
    | 'SELECT_FOLDER'
    | 'SET_VIEW_MODE'
    | 'TOGGLE_SPLIT_VIEW'
    | 'SET_SPLIT_RATIO'
    | 'SET_SEARCH_QUERY'
    | 'SET_FILTER_TYPE'
    | 'SET_FILTER_CATEGORY'
    | 'SET_SORT_BY'
    | 'SET_SORT_ORDER'
    | 'UPDATE_MEDIA_VIEWER_STATE'
    | 'LOAD_STATE';
  payload?: unknown;
}

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  image: 'Image',
  pdf: 'PDF Document',
  audio: 'Audio Recording',
  map: 'Map',
  'web-archive': 'Web Archive',
  document: 'Document',
  note: 'Note',
};

export const MEDIA_CATEGORY_LABELS: Record<MediaCategory, string> = {
  character: 'Character Reference',
  location: 'Location Reference',
  plot: 'Plot Reference',
  reference: 'General Reference',
  inspiration: 'Inspiration',
  custom: 'Custom',
};

export const MEDIA_TYPE_ICONS: Record<MediaType, string> = {
  image: '🖼️',
  pdf: '📄',
  audio: '🎵',
  map: '🗺️',
  'web-archive': '🌐',
  document: '📝',
  note: '📋',
};

export const FOLDER_COLORS = [
  '#3B82F6',
  '#EF4444',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
];
