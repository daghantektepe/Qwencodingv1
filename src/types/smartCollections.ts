// Smart Collections Type Definitions
// Akıllı Koleksiyonlar - Kural tabanlı dinamik doküman listeleri

export type FilterOperator = 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'starts_with' | 'ends_with';

export type FilterField = 'title' | 'status' | 'wordCount' | 'lastModified' | 'created' | 'tags' | 'pov' | 'synopsis' | 'notes' | 'label' | 'folder';

export type LogicOperator = 'and' | 'or';

export interface FilterRule {
  id: string;
  field: FilterField;
  operator: FilterOperator;
  value: string | number | boolean | string[];
}

export interface FilterGroup {
  id: string;
  logic: LogicOperator;
  rules: FilterRule[];
  groups?: FilterGroup[];
}

export interface SmartCollection {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  filterGroup: FilterGroup;
  sortBy?: 'title' | 'created' | 'modified' | 'wordCount' | 'status';
  sortOrder?: 'asc' | 'desc';
  createdAt: string;
  updatedAt: string;
  documentIds?: string[]; // Cached results
}

export interface Document {
  id: string;
  title: string;
  status: string;
  wordCount: number;
  lastModified: string;
  created: string;
  tags: string[];
  pov?: string;
  synopsis?: string;
  notes?: string;
  label?: string;
  folder?: string;
}

export interface SmartCollectionsState {
  collections: SmartCollection[];
  documents: Document[];
  selectedCollectionId: string | null;
  searchQuery: string;
}

export interface SmartCollectionsAction {
  type:
    | 'ADD_COLLECTION'
    | 'UPDATE_COLLECTION'
    | 'DELETE_COLLECTION'
    | 'SELECT_COLLECTION'
    | 'SET_SEARCH_QUERY'
    | 'UPDATE_DOCUMENTS'
    | 'LOAD_STATE';
  payload?: unknown;
}

export const FILTER_FIELD_LABELS: Record<FilterField, string> = {
  title: 'Başlık',
  status: 'Durum',
  wordCount: 'Kelime Sayısı',
  lastModified: 'Son Değiştirilme',
  created: 'Oluşturulma',
  tags: 'Etiketler',
  pov: 'Bakış Açısı',
  synopsis: 'Özet',
  notes: 'Notlar',
  label: 'Etiket',
  folder: 'Klasör',
};

export const FILTER_OPERATOR_LABELS: Record<FilterOperator, string> = {
  equals: 'Eşittir',
  not_equals: 'Eşit Değildir',
  contains: 'İçerir',
  not_contains: 'İçermez',
  greater_than: 'Büyüktür',
  less_than: 'Küçüktür',
  starts_with: 'İle Başlar',
  ends_with: 'İle Biter',
};

export const DOCUMENT_STATUSES = [
  'İlk Taslak',
  'İkinci Taslak',
  'Üçüncü Taslak',
  'Revizyon',
  'Tamamlandı',
  'Arşiv',
];

export const POV_CHARACTERS = [
  'Ahmet',
  'Ayşe',
  'Mehmet',
  'Zeynep',
  'Anlatıcı',
];
