import {
  SmartCollection,
  Document,
  SmartCollectionsState,
  SmartCollectionsAction,
  FilterRule,
  FilterGroup,
} from '../types/smartCollections';

const STORAGE_KEY = 'scrivener-smart-collections-state';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

const initialState: SmartCollectionsState = {
  collections: [],
  documents: [],
  selectedCollectionId: null,
  searchQuery: '',
};

function loadFromStorage(): SmartCollectionsState {
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

function saveToStorage(state: SmartCollectionsState): void {
  try {
    const toSave = {
      collections: state.collections,
      documents: state.documents,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Evaluate a single filter rule against a document
 */
function evaluateRule(rule: FilterRule, document: Document): boolean {
  const { field, operator, value } = rule;
  
  let docValue: any;
  
  switch (field) {
    case 'title':
      docValue = document.title;
      break;
    case 'status':
      docValue = document.status;
      break;
    case 'wordCount':
      docValue = document.wordCount;
      break;
    case 'lastModified':
      docValue = document.lastModified;
      break;
    case 'created':
      docValue = document.created;
      break;
    case 'tags':
      docValue = document.tags;
      break;
    case 'pov':
      docValue = document.pov;
      break;
    case 'synopsis':
      docValue = document.synopsis;
      break;
    case 'notes':
      docValue = document.notes;
      break;
    case 'label':
      docValue = document.label;
      break;
    case 'folder':
      docValue = document.folder;
      break;
    default:
      return false;
  }

  // Handle array fields (like tags)
  if (Array.isArray(docValue)) {
    switch (operator) {
      case 'contains':
        return docValue.some((item: string) => 
          item.toLowerCase().includes(String(value).toLowerCase())
        );
      case 'not_contains':
        return !docValue.some((item: string) => 
          item.toLowerCase().includes(String(value).toLowerCase())
        );
      case 'equals':
        return docValue.includes(String(value));
      case 'not_equals':
        return !docValue.includes(String(value));
      default:
        return false;
    }
  }

  // Handle numeric comparisons
  if (typeof docValue === 'number' && typeof value === 'number') {
    switch (operator) {
      case 'equals':
        return docValue === value;
      case 'not_equals':
        return docValue !== value;
      case 'greater_than':
        return docValue > value;
      case 'less_than':
        return docValue < value;
      default:
        return false;
    }
  }

  // Handle date comparisons
  if (field === 'lastModified' || field === 'created') {
    const docDate = new Date(docValue).getTime();
    let compareDate: number;
    
    if (typeof value === 'string') {
      // Handle relative dates like "3 days ago"
      if (value.includes('day')) {
        const days = parseInt(value) || 3;
        compareDate = Date.now() - days * 24 * 60 * 60 * 1000;
      } else if (value.includes('week')) {
        const weeks = parseInt(value) || 1;
        compareDate = Date.now() - weeks * 7 * 24 * 60 * 60 * 1000;
      } else if (value.includes('month')) {
        const months = parseInt(value) || 1;
        compareDate = Date.now() - months * 30 * 24 * 60 * 60 * 1000;
      } else {
        compareDate = new Date(value).getTime();
      }
    } else {
      compareDate = value as number;
    }

    switch (operator) {
      case 'greater_than':
        return docDate > compareDate;
      case 'less_than':
        return docDate < compareDate;
      case 'equals':
        return Math.abs(docDate - compareDate) < 24 * 60 * 60 * 1000; // Same day
      default:
        return false;
    }
  }

  // Handle string comparisons
  const docStr = String(docValue || '').toLowerCase();
  const valStr = String(value || '').toLowerCase();

  switch (operator) {
    case 'equals':
      return docStr === valStr;
    case 'not_equals':
      return docStr !== valStr;
    case 'contains':
      return docStr.includes(valStr);
    case 'not_contains':
      return !docStr.includes(valStr);
    case 'starts_with':
      return docStr.startsWith(valStr);
    case 'ends_with':
      return docStr.endsWith(valStr);
    default:
      return false;
  }
}

/**
 * Evaluate a filter group against a document
 */
function evaluateFilterGroup(group: FilterGroup, document: Document): boolean {
  const { logic, rules, groups } = group;
  
  // Evaluate all rules in this group
  const ruleResults = rules.map(rule => evaluateRule(rule, document));
  
  // Evaluate nested groups recursively
  const groupResults = groups?.map(g => evaluateFilterGroup(g, document)) || [];
  
  const allResults = [...ruleResults, ...groupResults];
  
  if (allResults.length === 0) {
    return true; // Empty group matches everything
  }
  
  if (logic === 'and') {
    return allResults.every(result => result);
  } else {
    return allResults.some(result => result);
  }
}

function smartCollectionsReducer(
  state: SmartCollectionsState,
  action: SmartCollectionsAction
): SmartCollectionsState {
  switch (action.type) {
    case 'ADD_COLLECTION': {
      const payload = action.payload as {
        name: string;
        description?: string;
        icon?: string;
        color?: string;
        filterGroup: FilterGroup;
        sortBy?: SmartCollection['sortBy'];
        sortOrder?: SmartCollection['sortOrder'];
      };
      
      const now = new Date().toISOString();
      const newCollection: SmartCollection = {
        id: generateId(),
        name: payload.name,
        description: payload.description,
        icon: payload.icon || '📁',
        color: payload.color || '#3B82F6',
        filterGroup: payload.filterGroup,
        sortBy: payload.sortBy,
        sortOrder: payload.sortOrder || 'desc',
        createdAt: now,
        updatedAt: now,
      };
      
      return {
        ...state,
        collections: [...state.collections, newCollection],
        selectedCollectionId: newCollection.id,
      };
    }

    case 'UPDATE_COLLECTION': {
      const payload = action.payload as {
        id: string;
        updates: Partial<SmartCollection>;
      };
      
      return {
        ...state,
        collections: state.collections.map(c =>
          c.id === payload.id
            ? { ...c, ...payload.updates, updatedAt: new Date().toISOString() }
            : c
        ),
      };
    }

    case 'DELETE_COLLECTION': {
      const collectionId = action.payload as string;
      return {
        ...state,
        collections: state.collections.filter(c => c.id !== collectionId),
        selectedCollectionId: state.selectedCollectionId === collectionId ? null : state.selectedCollectionId,
      };
    }

    case 'SELECT_COLLECTION': {
      return {
        ...state,
        selectedCollectionId: action.payload as string | null,
      };
    }

    case 'SET_SEARCH_QUERY': {
      return {
        ...state,
        searchQuery: action.payload as string,
      };
    }

    case 'UPDATE_DOCUMENTS': {
      const documents = action.payload as Document[];
      return {
        ...state,
        documents,
      };
    }

    case 'LOAD_STATE': {
      return {
        ...initialState,
        ...(action.payload as Partial<SmartCollectionsState>),
      };
    }

    default:
      return state;
  }
}

type Listener = (state: SmartCollectionsState) => void;

class SmartCollectionsStoreImpl {
  private state: SmartCollectionsState;
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.state = loadFromStorage();
  }

  getState(): SmartCollectionsState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  dispatch(action: SmartCollectionsAction): void {
    this.state = smartCollectionsReducer(this.state, action);
    saveToStorage(this.state);
    this.listeners.forEach(listener => listener(this.state));
  }

  /**
   * Get documents matching a smart collection's filters
   */
  getCollectionDocuments(collectionId: string): Document[] {
    const collection = this.state.collections.find(c => c.id === collectionId);
    if (!collection) return [];

    let results = this.state.documents.filter(doc => 
      evaluateFilterGroup(collection.filterGroup, doc)
    );

    // Sort results
    if (collection.sortBy) {
      results.sort((a, b) => {
        let comparison = 0;
        
        switch (collection.sortBy) {
          case 'title':
            comparison = a.title.localeCompare(b.title);
            break;
          case 'created':
            comparison = new Date(a.created).getTime() - new Date(b.created).getTime();
            break;
          case 'modified':
            comparison = new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime();
            break;
          case 'wordCount':
            comparison = a.wordCount - b.wordCount;
            break;
          case 'status':
            comparison = a.status.localeCompare(b.status);
            break;
        }
        
        return collection.sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    return results;
  }

  /**
   * Get collection by ID
   */
  getCollectionById(id: string): SmartCollection | undefined {
    return this.state.collections.find(c => c.id === id);
  }

  /**
   * Get document count for a collection
   */
  getCollectionDocumentCount(collectionId: string): number {
    return this.getCollectionDocuments(collectionId).length;
  }
}

let storeInstance: SmartCollectionsStoreImpl | null = null;

export function getSmartCollectionsStore(): SmartCollectionsStoreImpl {
  if (!storeInstance) {
    storeInstance = new SmartCollectionsStoreImpl();
  }
  return storeInstance;
}

export function resetSmartCollectionsStore(): void {
  storeInstance = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export type { SmartCollectionsStoreImpl };
