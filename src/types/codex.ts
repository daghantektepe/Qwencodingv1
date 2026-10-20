// Codex Module Type Definitions
// Character codex (story bible) system types

export type CharacterRole = 'protagonist' | 'antagonist' | 'supporting' | 'minor' | 'npc';

export type RelationshipType =
  | 'ally'
  | 'enemy'
  | 'family'
  | 'romantic'
  | 'mentor'
  | 'rival'
  | 'neutral'
  | 'complex';

export interface CharacterAttributes {
  age?: number;
  gender?: string;
  occupation?: string;
  location?: string;
  species?: string;
  alignment?: string;
  [key: string]: string | number | undefined;
}

export interface Character {
  id: string;
  name: string;
  role: CharacterRole;
  description: string;
  attributes: CharacterAttributes;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  color: string;
  imageUrl?: string;
}

export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  description: string;
  strength: number; // 1-10
  createdAt: string;
  updatedAt: string;
}

export interface CodexMention {
  characterId: string;
  characterName: string;
  position: number;
  length: number;
  context: string;
}

export interface CodexState {
  characters: Character[];
  relationships: Relationship[];
  selectedCharacterId: string | null;
  searchQuery: string;
  filterRole: CharacterRole | 'all';
  viewMode: 'grid' | 'list' | 'graph';
}

export interface CodexAction {
  type:
    | 'ADD_CHARACTER'
    | 'UPDATE_CHARACTER'
    | 'DELETE_CHARACTER'
    | 'ADD_RELATIONSHIP'
    | 'UPDATE_RELATIONSHIP'
    | 'DELETE_RELATIONSHIP'
    | 'SELECT_CHARACTER'
    | 'SET_SEARCH_QUERY'
    | 'SET_FILTER_ROLE'
    | 'SET_VIEW_MODE'
    | 'LOAD_STATE';
  payload?: unknown;
}

export interface CodexStore {
  getState(): CodexState;
  subscribe(listener: (state: CodexState) => void): () => void;
  dispatch(action: CodexAction): void;
}

export interface GraphNode {
  id: string;
  name: string;
  role: CharacterRole;
  color: string;
  x: number;
  y: number;
  radius: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: RelationshipType;
  strength: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const CHARACTER_COLORS: string[] = [
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

export const ROLE_LABELS: Record<CharacterRole, string> = {
  protagonist: 'Protagonist',
  antagonist: 'Antagonist',
  supporting: 'Supporting',
  minor: 'Minor',
  npc: 'NPC',
};

export const ROLE_COLORS: Record<CharacterRole, string> = {
  protagonist: '#3B82F6',
  antagonist: '#EF4444',
  supporting: '#10B981',
  minor: '#F59E0B',
  npc: '#6B7280',
};

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  ally: 'Ally',
  enemy: 'Enemy',
  family: 'Family',
  romantic: 'Romantic',
  mentor: 'Mentor',
  rival: 'Rival',
  neutral: 'Neutral',
  complex: 'Complex',
};

export const RELATIONSHIP_COLORS: Record<RelationshipType, string> = {
  ally: '#22C55E',
  enemy: '#EF4444',
  family: '#F97316',
  romantic: '#EC4899',
  mentor: '#3B82F6',
  rival: '#EAB308',
  neutral: '#6B7280',
  complex: '#8B5CF6',
};
