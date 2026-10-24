import {
  Character,
  Relationship,
  CodexState,
  CodexAction,
  CharacterRole,
  CodexMention,
  CHARACTER_COLORS,
} from '../types/codex';

const STORAGE_KEY = 'scrivener-codex-state';

// Fallback color array in case CHARACTER_COLORS is not available
const FALLBACK_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#06B6D4', // cyan
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#F43F5E', // rose
  '#14B8A6', // teal
];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function getRandomColor(): string {
  // Use CHARACTER_COLORS if available, otherwise fallback
  const colors = CHARACTER_COLORS && CHARACTER_COLORS.length > 0 
    ? CHARACTER_COLORS 
    : FALLBACK_COLORS;
  return colors[Math.floor(Math.random() * colors.length)];
}

const initialState: CodexState = {
  characters: [],
  relationships: [],
  selectedCharacterId: null,
  searchQuery: '',
  filterRole: 'all',
  viewMode: 'grid',
};

function loadFromStorage(): CodexState {
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

function saveToStorage(state: CodexState): void {
  try {
    const toSave = {
      characters: state.characters,
      relationships: state.relationships,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // Ignore storage errors
  }
}

function codexReducer(state: CodexState, action: CodexAction): CodexState {
  switch (action.type) {
    case 'ADD_CHARACTER': {
      const payload = action.payload as {
        name: string;
        role: CharacterRole;
        description: string;
        attributes?: Record<string, string | number | undefined>;
        tags?: string[];
      };
      const now = new Date().toISOString();
      const newCharacter: Character = {
        id: generateId(),
        name: payload.name,
        role: payload.role,
        description: payload.description,
        attributes: payload.attributes || {},
        tags: payload.tags || [],
        createdAt: now,
        updatedAt: now,
        color: getRandomColor(),
      };
      return {
        ...state,
        characters: [...state.characters, newCharacter],
        selectedCharacterId: newCharacter.id,
      };
    }

    case 'UPDATE_CHARACTER': {
      const payload = action.payload as { id: string; updates: Partial<Character> };
      return {
        ...state,
        characters: state.characters.map((c) =>
          c.id === payload.id
            ? { ...c, ...payload.updates, updatedAt: new Date().toISOString() }
            : c
        ),
      };
    }

    case 'DELETE_CHARACTER': {
      const characterId = action.payload as string;
      return {
        ...state,
        characters: state.characters.filter((c) => c.id !== characterId),
        relationships: state.relationships.filter(
          (r) => r.sourceId !== characterId && r.targetId !== characterId
        ),
        selectedCharacterId:
          state.selectedCharacterId === characterId ? null : state.selectedCharacterId,
      };
    }

    case 'ADD_RELATIONSHIP': {
      const payload = action.payload as {
        sourceId: string;
        targetId: string;
        type: Relationship['type'];
        description: string;
        strength: number;
      };
      const now = new Date().toISOString();
      const newRelationship: Relationship = {
        id: generateId(),
        sourceId: payload.sourceId,
        targetId: payload.targetId,
        type: payload.type,
        description: payload.description,
        strength: payload.strength,
        createdAt: now,
        updatedAt: now,
      };
      return {
        ...state,
        relationships: [...state.relationships, newRelationship],
      };
    }

    case 'UPDATE_RELATIONSHIP': {
      const payload = action.payload as { id: string; updates: Partial<Relationship> };
      return {
        ...state,
        relationships: state.relationships.map((r) =>
          r.id === payload.id
            ? { ...r, ...payload.updates, updatedAt: new Date().toISOString() }
            : r
        ),
      };
    }

    case 'DELETE_RELATIONSHIP': {
      const relationshipId = action.payload as string;
      return {
        ...state,
        relationships: state.relationships.filter((r) => r.id !== relationshipId),
      };
    }

    case 'SELECT_CHARACTER': {
      return {
        ...state,
        selectedCharacterId: action.payload as string | null,
      };
    }

    case 'SET_SEARCH_QUERY': {
      return {
        ...state,
        searchQuery: action.payload as string,
      };
    }

    case 'SET_FILTER_ROLE': {
      return {
        ...state,
        filterRole: action.payload as CharacterRole | 'all',
      };
    }

    case 'SET_VIEW_MODE': {
      return {
        ...state,
        viewMode: action.payload as 'grid' | 'list' | 'graph',
      };
    }

    case 'LOAD_STATE': {
      return {
        ...initialState,
        ...(action.payload as Partial<CodexState>),
      };
    }

    default:
      return state;
  }
}

// Simple store implementation
type Listener = (state: CodexState) => void;

class CodexStoreImpl {
  private state: CodexState;
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.state = loadFromStorage();
  }

  getState(): CodexState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  dispatch(action: CodexAction): void {
    this.state = codexReducer(this.state, action);
    saveToStorage(this.state);
    this.listeners.forEach((listener) => listener(this.state));
  }

  // Helper methods
  getFilteredCharacters(): Character[] {
    const { characters, searchQuery, filterRole } = this.state;
    return characters.filter((c) => {
      const matchesSearch =
        searchQuery === '' ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesRole = filterRole === 'all' || c.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }

  getCharacterById(id: string): Character | undefined {
    return this.state.characters.find((c) => c.id === id);
  }

  getCharacterRelationships(characterId: string): Relationship[] {
    return this.state.relationships.filter(
      (r) => r.sourceId === characterId || r.targetId === characterId
    );
  }

  findMentionsInText(text: string): CodexMention[] {
    const mentions: CodexMention[] = [];
    const { characters } = this.state;

    for (const character of characters) {
      const nameRegex = new RegExp(`\\b${escapeRegex(character.name)}\\b`, 'gi');
      let match;
      while ((match = nameRegex.exec(text)) !== null) {
        const start = Math.max(0, match.index - 30);
        const end = Math.min(text.length, match.index + match[0].length + 30);
        mentions.push({
          characterId: character.id,
          characterName: character.name,
          position: match.index,
          length: match[0].length,
          context: text.substring(start, end),
        });
      }
    }

    return mentions.sort((a, b) => a.position - b.position);
  }

  extractMentions(text: string): CodexMention[] {
    return this.findMentionsInText(text);
  }

  getGraphData() {
    const { characters, relationships } = this.state;
    return {
      nodes: characters.map((c) => ({ id: c.id, label: c.name, role: c.role })),
      edges: relationships.map((r) => ({ source: r.sourceId, target: r.targetId, label: r.type })),
    };
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Singleton store instance
let storeInstance: CodexStoreImpl | null = null;

/**
 * Get the singleton codex store instance
 */
export function getCodexStore(): CodexStoreImpl {
  if (!storeInstance) {
    storeInstance = new CodexStoreImpl();
  }
  return storeInstance;
}

/**
 * Reset the codex store to initial state
 * Useful for testing
 */
export function resetCodexStore(): void {
  storeInstance = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export const codexStore = {
  getState: () => getCodexStore().getState(),
  dispatch: (action: CodexAction) => getCodexStore().dispatch(action),
  subscribe: (listener: (state: CodexState) => void) => getCodexStore().subscribe(listener),
  getFilteredCharacters: () => getCodexStore().getFilteredCharacters(),
  getCharacterById: (id: string) => getCodexStore().getCharacterById(id),
  getCharacterRelationships: (characterId: string) => getCodexStore().getCharacterRelationships(characterId),
  getGraphData: () => getCodexStore().getGraphData(),
  extractMentions: (text: string) => getCodexStore().extractMentions(text),
};

export type { CodexStoreImpl };

