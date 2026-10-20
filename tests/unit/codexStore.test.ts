/**
 * Unit tests for codexStore
 * 
 * These tests require a test runner (vitest or jest) to be configured.
 * To run: npx vitest run tests/unit/codexStore.test.ts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock localStorage BEFORE importing the module
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

// Define localStorage globally before any imports that might use it
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// Now import the module
import { getCodexStore, resetCodexStore } from '../../src/services/codexStore';
import type { Character, Relationship } from '../../src/types/codex';

describe('CodexStore', () => {
  beforeEach(() => {
    // Clear localStorage mock
    localStorageMock.clear();
    vi.clearAllMocks();
    
    // Reset the store singleton
    resetCodexStore();
  });

  afterEach(() => {
    // Clean up after each test
    localStorageMock.clear();
    resetCodexStore();
  });

  describe('Initial State', () => {
    it('should return initial state with empty arrays', () => {
      const store = getCodexStore();
      expect(store).toBeDefined();
      
      const state = store.getState();
      expect(state).toBeDefined();
      expect(state.characters).toEqual([]);
      expect(state.relationships).toEqual([]);
      expect(state.selectedCharacterId).toBeNull();
      expect(state.searchQuery).toBe('');
      expect(state.filterRole).toBe('all');
      expect(state.viewMode).toBe('grid');
    });
  });

  describe('ADD_CHARACTER', () => {
    it('should add a new character', () => {
      const store = getCodexStore();
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: {
          name: 'Aragorn',
          role: 'protagonist',
          description: 'The rightful king of Gondor',
          tags: ['human', 'king', 'ranger'],
          attributes: { age: '87', species: 'Dúnedain' },
        },
      });

      const state = store.getState();
      expect(state.characters).toHaveLength(1);
      expect(state.characters[0].name).toBe('Aragorn');
      expect(state.characters[0].role).toBe('protagonist');
      expect(state.characters[0].description).toBe('The rightful king of Gondor');
      expect(state.characters[0].tags).toEqual(['human', 'king', 'ranger']);
      expect(state.characters[0].attributes).toEqual({ age: '87', species: 'Dúnedain' });
      expect(state.characters[0].id).toBeTruthy();
      expect(state.characters[0].color).toBeTruthy();
      expect(state.characters[0].createdAt).toBeTruthy();
    });

    it('should set selectedCharacterId to new character', () => {
      const store = getCodexStore();
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Gandalf', role: 'supporting', description: 'Wizard' },
      });

      const state = store.getState();
      expect(state.selectedCharacterId).toBe(state.characters[0].id);
    });

    it('should add multiple characters', () => {
      const store = getCodexStore();
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Frodo', role: 'protagonist', description: '' },
      });
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Sam', role: 'supporting', description: '' },
      });
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Gollum', role: 'antagonist', description: '' },
      });

      const state = store.getState();
      expect(state.characters).toHaveLength(3);
    });
  });

  describe('UPDATE_CHARACTER', () => {
    it('should update character properties', () => {
      const store = getCodexStore();
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Legolas', role: 'supporting', description: 'Elf prince' },
      });

      const charId = store.getState().characters[0].id;
      store.dispatch({
        type: 'UPDATE_CHARACTER',
        payload: {
          id: charId,
          updates: { name: 'Legolas Greenleaf', description: 'Elf prince of Mirkwood' },
        },
      });

      const updated = store.getState().characters[0];
      expect(updated.name).toBe('Legolas Greenleaf');
      expect(updated.description).toBe('Elf prince of Mirkwood');
      expect(updated.role).toBe('supporting'); // unchanged
    });

    it('should update the updatedAt timestamp', () => {
      const store = getCodexStore();
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Test', role: 'minor', description: '' },
      });

      const original = store.getState().characters[0];
      
      // Small delay to ensure timestamp differs
      store.dispatch({
        type: 'UPDATE_CHARACTER',
        payload: { id: original.id, updates: { name: 'Updated' } },
      });

      const updated = store.getState().characters[0];
      expect(updated.updatedAt >= original.updatedAt).toBe(true);
    });
  });

  describe('DELETE_CHARACTER', () => {
    it('should remove a character', () => {
      const store = getCodexStore();
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Boromir', role: 'supporting', description: '' },
      });

      const charId = store.getState().characters[0].id;
      store.dispatch({ type: 'DELETE_CHARACTER', payload: charId });

      expect(store.getState().characters).toHaveLength(0);
    });

    it('should remove associated relationships', () => {
      const store = getCodexStore();
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Char1', role: 'supporting', description: '' },
      });
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Char2', role: 'supporting', description: '' },
      });

      const [char1, char2] = store.getState().characters;
      store.dispatch({
        type: 'ADD_RELATIONSHIP',
        payload: {
          sourceId: char1.id,
          targetId: char2.id,
          type: 'ally',
          description: 'Friends',
          strength: 8,
        },
      });

      expect(store.getState().relationships).toHaveLength(1);

      store.dispatch({ type: 'DELETE_CHARACTER', payload: char1.id });

      expect(store.getState().relationships).toHaveLength(0);
    });

    it('should clear selection if deleted character was selected', () => {
      const store = getCodexStore();
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Delete Me', role: 'npc', description: '' },
      });

      const charId = store.getState().characters[0].id;
      expect(store.getState().selectedCharacterId).toBe(charId);

      store.dispatch({ type: 'DELETE_CHARACTER', payload: charId });
      expect(store.getState().selectedCharacterId).toBeNull();
    });
  });

  describe('ADD_RELATIONSHIP', () => {
    it('should add a relationship between characters', () => {
      const store = getCodexStore();
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'A', role: 'protagonist', description: '' },
      });
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'B', role: 'antagonist', description: '' },
      });

      const [a, b] = store.getState().characters;
      store.dispatch({
        type: 'ADD_RELATIONSHIP',
        payload: {
          sourceId: a.id,
          targetId: b.id,
          type: 'enemy',
          description: 'Mortal enemies',
          strength: 10,
        },
      });

      const state = store.getState();
      expect(state.relationships).toHaveLength(1);
      expect(state.relationships[0].sourceId).toBe(a.id);
      expect(state.relationships[0].targetId).toBe(b.id);
      expect(state.relationships[0].type).toBe('enemy');
      expect(state.relationships[0].strength).toBe(10);
    });
  });

  describe('DELETE_RELATIONSHIP', () => {
    it('should remove a relationship', () => {
      const store = getCodexStore();
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'X', role: 'supporting', description: '' },
      });
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Y', role: 'supporting', description: '' },
      });

      const [x, y] = store.getState().characters;
      store.dispatch({
        type: 'ADD_RELATIONSHIP',
        payload: {
          sourceId: x.id,
          targetId: y.id,
          type: 'ally',
          description: '',
          strength: 5,
        },
      });

      const relId = store.getState().relationships[0].id;
      store.dispatch({ type: 'DELETE_RELATIONSHIP', payload: relId });

      expect(store.getState().relationships).toHaveLength(0);
    });
  });

  describe('Filters and Search', () => {
    it('should filter by search query', () => {
      const store = getCodexStore();
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Frodo Baggins', role: 'protagonist', description: 'Hobbit ring bearer' },
      });
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Sauron', role: 'antagonist', description: 'Dark lord' },
      });

      store.dispatch({ type: 'SET_SEARCH_QUERY', payload: 'hobbit' });
      const filtered = store.getFilteredCharacters();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Frodo Baggins');
    });

    it('should filter by role', () => {
      const store = getCodexStore();
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Hero', role: 'protagonist', description: '' },
      });
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Villain', role: 'antagonist', description: '' },
      });
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Sidekick', role: 'supporting', description: '' },
      });

      store.dispatch({ type: 'SET_FILTER_ROLE', payload: 'antagonist' });
      const filtered = store.getFilteredCharacters();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Villain');
    });

    it('should combine search and role filter', () => {
      const store = getCodexStore();
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Good Wizard', role: 'supporting', description: 'Wise' },
      });
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Evil Wizard', role: 'antagonist', description: 'Dark' },
      });
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Warrior', role: 'supporting', description: 'Brave' },
      });

      store.dispatch({ type: 'SET_SEARCH_QUERY', payload: 'wizard' });
      store.dispatch({ type: 'SET_FILTER_ROLE', payload: 'supporting' });
      
      const filtered = store.getFilteredCharacters();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Good Wizard');
    });
  });

  describe('getCharacterRelationships', () => {
    it('should return relationships for a character', () => {
      const store = getCodexStore();
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'A', role: 'protagonist', description: '' },
      });
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'B', role: 'supporting', description: '' },
      });
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'C', role: 'supporting', description: '' },
      });

      const [a, b, c] = store.getState().characters;
      store.dispatch({
        type: 'ADD_RELATIONSHIP',
        payload: { sourceId: a.id, targetId: b.id, type: 'ally', description: '', strength: 7 },
      });
      store.dispatch({
        type: 'ADD_RELATIONSHIP',
        payload: { sourceId: a.id, targetId: c.id, type: 'mentor', description: '', strength: 9 },
      });
      store.dispatch({
        type: 'ADD_RELATIONSHIP',
        payload: { sourceId: b.id, targetId: c.id, type: 'rival', description: '', strength: 4 },
      });

      const rels = store.getCharacterRelationships(a.id);
      expect(rels).toHaveLength(2);
    });
  });

  describe('findMentionsInText', () => {
    it('should find character mentions in text', () => {
      const store = getCodexStore();
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Gandalf', role: 'supporting', description: '' },
      });
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Frodo', role: 'protagonist', description: '' },
      });

      const mentions = store.findMentionsInText(
        'Gandalf told Frodo about the quest. Frodo was scared but Gandalf reassured him.'
      );

      expect(mentions).toHaveLength(4);
      expect(mentions[0].characterName).toBe('Gandalf');
      expect(mentions[1].characterName).toBe('Frodo');
      expect(mentions[2].characterName).toBe('Frodo');
      expect(mentions[3].characterName).toBe('Gandalf');
    });

    it('should return empty array for no matches', () => {
      const store = getCodexStore();
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Gandalf', role: 'supporting', description: '' },
      });

      const mentions = store.findMentionsInText('Nobody here matches.');
      expect(mentions).toHaveLength(0);
    });

    it('should handle special regex characters in names', () => {
      const store = getCodexStore();
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Dr. Smith', role: 'minor', description: '' },
      });

      const mentions = store.findMentionsInText('Dr. Smith arrived late.');
      expect(mentions).toHaveLength(1);
    });
  });

  describe('Subscribe', () => {
    it('should notify subscribers on dispatch', () => {
      const store = getCodexStore();
      const listener = vi.fn();
      store.subscribe(listener);

      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Test', role: 'npc', description: '' },
      });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(store.getState());
    });

    it('should unsubscribe correctly', () => {
      const store = getCodexStore();
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);

      unsubscribe();

      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Test', role: 'npc', description: '' },
      });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Persistence', () => {
    it('should save state to localStorage', () => {
      const store = getCodexStore();
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Persistent', role: 'minor', description: '' },
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should load state from localStorage on creation', () => {
      const existingState = {
        characters: [
          {
            id: 'test-id',
            name: 'Loaded',
            role: 'npc',
            description: '',
            attributes: {},
            tags: [],
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
            color: '#FF0000',
          },
        ],
        relationships: [],
      };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(existingState));

      resetCodexStore();
      const store = getCodexStore();
      const state = store.getState();

      expect(state.characters).toHaveLength(1);
      expect(state.characters[0].name).toBe('Loaded');
    });
  });
});
