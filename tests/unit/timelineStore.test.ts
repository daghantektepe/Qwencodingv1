/**
 * Unit tests for timelineStore
 * 
 * Run: npx vitest run tests/unit/timelineStore.test.ts
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

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

import { getTimelineStore, resetTimelineStore } from '../../src/services/timelineStore';

describe('TimelineStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    resetTimelineStore();
  });

  afterEach(() => {
    localStorageMock.clear();
    resetTimelineStore();
  });

  describe('Initial State', () => {
    it('should return initial state with empty arrays', () => {
      const store = getTimelineStore();
      const state = store.getState();

      expect(state.events).toEqual([]);
      expect(state.plotlines).toEqual([]);
      expect(state.markers).toEqual([]);
      expect(state.selectedEventId).toBeNull();
      expect(state.selectedPlotlineId).toBeNull();
      expect(state.viewMode).toBe('chronological');
      expect(state.timeScale).toBe('years');
      expect(state.zoomLevel).toBe(5);
    });
  });

  describe('ADD_EVENT', () => {
    it('should add a new event', () => {
      const store = getTimelineStore();
      store.dispatch({
        type: 'ADD_EVENT',
        payload: {
          title: 'The Discovery',
          description: 'Hero finds the ancient artifact',
          timelinePosition: 10,
          timelineLabel: 'Year 1, Spring',
          narrativeOrder: 1,
          category: 'plot',
          tags: ['discovery', 'artifact'],
          isMajorEvent: true,
        },
      });

      const state = store.getState();
      expect(state.events).toHaveLength(1);
      expect(state.events[0].title).toBe('The Discovery');
      expect(state.events[0].timelinePosition).toBe(10);
      expect(state.events[0].timelineLabel).toBe('Year 1, Spring');
      expect(state.events[0].isMajorEvent).toBe(true);
      expect(state.events[0].tags).toEqual(['discovery', 'artifact']);
    });

    it('should set selectedEventId to new event', () => {
      const store = getTimelineStore();
      store.dispatch({
        type: 'ADD_EVENT',
        payload: {
          title: 'Test Event',
          description: '',
          timelinePosition: 0,
          timelineLabel: 'Start',
          narrativeOrder: 1,
          category: 'plot',
        },
      });

      const state = store.getState();
      expect(state.selectedEventId).toBe(state.events[0].id);
    });

    it('should add multiple events', () => {
      const store = getTimelineStore();
      store.dispatch({
        type: 'ADD_EVENT',
        payload: {
          title: 'Event 1',
          description: '',
          timelinePosition: 1,
          timelineLabel: 'Day 1',
          narrativeOrder: 1,
          category: 'plot',
        },
      });
      store.dispatch({
        type: 'ADD_EVENT',
        payload: {
          title: 'Event 2',
          description: '',
          timelinePosition: 2,
          timelineLabel: 'Day 2',
          narrativeOrder: 2,
          category: 'character',
        },
      });

      expect(store.getState().events).toHaveLength(2);
    });
  });

  describe('UPDATE_EVENT', () => {
    it('should update event properties', () => {
      const store = getTimelineStore();
      store.dispatch({
        type: 'ADD_EVENT',
        payload: {
          title: 'Original Title',
          description: 'Original description',
          timelinePosition: 5,
          timelineLabel: 'Year 1',
          narrativeOrder: 1,
          category: 'plot',
        },
      });

      const eventId = store.getState().events[0].id;
      store.dispatch({
        type: 'UPDATE_EVENT',
        payload: {
          id: eventId,
          updates: { title: 'Updated Title', description: 'Updated description' },
        },
      });

      const updated = store.getState().events[0];
      expect(updated.title).toBe('Updated Title');
      expect(updated.description).toBe('Updated description');
      expect(updated.timelinePosition).toBe(5); // unchanged
    });
  });

  describe('DELETE_EVENT', () => {
    it('should remove an event', () => {
      const store = getTimelineStore();
      store.dispatch({
        type: 'ADD_EVENT',
        payload: {
          title: 'To Delete',
          description: '',
          timelinePosition: 0,
          timelineLabel: 'Now',
          narrativeOrder: 1,
          category: 'plot',
        },
      });

      const eventId = store.getState().events[0].id;
      store.dispatch({ type: 'DELETE_EVENT', payload: eventId });

      expect(store.getState().events).toHaveLength(0);
    });

    it('should remove event from plotlines', () => {
      const store = getTimelineStore();
      
      store.dispatch({
        type: 'ADD_PLOTLINE',
        payload: { name: 'Main Plot', type: 'main', description: '' },
      });
      const plotlineId = store.getState().plotlines[0].id;

      store.dispatch({
        type: 'ADD_EVENT',
        payload: {
          title: 'Event',
          description: '',
          timelinePosition: 0,
          timelineLabel: 'Now',
          narrativeOrder: 1,
          category: 'plot',
          plotlineIds: [plotlineId],
        },
      });

      const eventId = store.getState().events[0].id;
      expect(store.getState().plotlines[0].eventIds).toContain(eventId);

      store.dispatch({ type: 'DELETE_EVENT', payload: eventId });
      expect(store.getState().plotlines[0].eventIds).not.toContain(eventId);
    });
  });

  describe('ADD_PLOTLINE', () => {
    it('should add a new plotline', () => {
      const store = getTimelineStore();
      store.dispatch({
        type: 'ADD_PLOTLINE',
        payload: {
          name: 'Hero Arc',
          type: 'character-arc',
          description: 'The hero journey',
        },
      });

      const state = store.getState();
      expect(state.plotlines).toHaveLength(1);
      expect(state.plotlines[0].name).toBe('Hero Arc');
      expect(state.plotlines[0].type).toBe('character-arc');
      expect(state.plotlines[0].color).toBeTruthy();
    });
  });

  describe('DELETE_PLOTLINE', () => {
    it('should remove plotline references from events', () => {
      const store = getTimelineStore();
      
      store.dispatch({
        type: 'ADD_PLOTLINE',
        payload: { name: 'Subplot', type: 'subplot', description: '' },
      });
      const plotlineId = store.getState().plotlines[0].id;

      store.dispatch({
        type: 'ADD_EVENT',
        payload: {
          title: 'Event',
          description: '',
          timelinePosition: 0,
          timelineLabel: 'Now',
          narrativeOrder: 1,
          category: 'plot',
          plotlineIds: [plotlineId],
        },
      });

      store.dispatch({ type: 'DELETE_PLOTLINE', payload: plotlineId });

      expect(store.getState().plotlines).toHaveLength(0);
      expect(store.getState().events[0].plotlineIds).not.toContain(plotlineId);
    });
  });

  describe('ADD_MARKER', () => {
    it('should add a timeline marker', () => {
      const store = getTimelineStore();
      store.dispatch({
        type: 'ADD_MARKER',
        payload: {
          label: 'Chapter 1',
          position: 0,
          type: 'chapter',
          color: '#3B82F6',
        },
      });

      const state = store.getState();
      expect(state.markers).toHaveLength(1);
      expect(state.markers[0].label).toBe('Chapter 1');
      expect(state.markers[0].position).toBe(0);
    });
  });

  describe('Filters', () => {
    beforeEach(() => {
      const store = getTimelineStore();
      store.dispatch({
        type: 'ADD_EVENT',
        payload: {
          title: 'Plot Event',
          description: 'A plot event',
          timelinePosition: 1,
          timelineLabel: 'Day 1',
          narrativeOrder: 1,
          category: 'plot',
          tags: ['action'],
        },
      });
      store.dispatch({
        type: 'ADD_EVENT',
        payload: {
          title: 'Character Moment',
          description: 'A character moment',
          timelinePosition: 2,
          timelineLabel: 'Day 2',
          narrativeOrder: 2,
          category: 'character',
          tags: ['emotion'],
        },
      });
    });

    it('should filter by category', () => {
      const store = getTimelineStore();
      store.dispatch({ type: 'SET_FILTER_CATEGORY', payload: 'plot' });
      
      const filtered = store.getFilteredEvents();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe('Plot Event');
    });

    it('should filter by search query', () => {
      const store = getTimelineStore();
      store.dispatch({ type: 'SET_SEARCH_QUERY', payload: 'character' });
      
      const filtered = store.getFilteredEvents();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe('Character Moment');
    });

    it('should filter by tag', () => {
      const store = getTimelineStore();
      store.dispatch({ type: 'SET_SEARCH_QUERY', payload: 'action' });
      
      const filtered = store.getFilteredEvents();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe('Plot Event');
    });
  });

  describe('getFilteredEvents sorting', () => {
    it('should sort by timeline position in chronological mode', () => {
      const store = getTimelineStore();
      store.dispatch({
        type: 'ADD_EVENT',
        payload: {
          title: 'Later',
          description: '',
          timelinePosition: 10,
          timelineLabel: 'Day 10',
          narrativeOrder: 1,
          category: 'plot',
        },
      });
      store.dispatch({
        type: 'ADD_EVENT',
        payload: {
          title: 'Earlier',
          description: '',
          timelinePosition: 5,
          timelineLabel: 'Day 5',
          narrativeOrder: 2,
          category: 'plot',
        },
      });

      store.dispatch({ type: 'SET_VIEW_MODE', payload: 'chronological' });
      const filtered = store.getFilteredEvents();
      expect(filtered[0].title).toBe('Earlier');
      expect(filtered[1].title).toBe('Later');
    });

    it('should sort by narrative order in narrative mode', () => {
      const store = getTimelineStore();
      store.dispatch({
        type: 'ADD_EVENT',
        payload: {
          title: 'Chapter 2 Event',
          description: '',
          timelinePosition: 5,
          timelineLabel: 'Day 5',
          narrativeOrder: 2,
          category: 'plot',
        },
      });
      store.dispatch({
        type: 'ADD_EVENT',
        payload: {
          title: 'Chapter 1 Event',
          description: '',
          timelinePosition: 10,
          timelineLabel: 'Day 10',
          narrativeOrder: 1,
          category: 'plot',
        },
      });

      store.dispatch({ type: 'SET_VIEW_MODE', payload: 'narrative' });
      const filtered = store.getFilteredEvents();
      expect(filtered[0].title).toBe('Chapter 1 Event');
      expect(filtered[1].title).toBe('Chapter 2 Event');
    });
  });

  describe('getTimelineRange', () => {
    it('should return default range when no events', () => {
      const store = getTimelineStore();
      const range = store.getTimelineRange();
      expect(range.min).toBe(0);
      expect(range.max).toBe(100);
    });

    it('should calculate range from events', () => {
      const store = getTimelineStore();
      store.dispatch({
        type: 'ADD_EVENT',
        payload: {
          title: 'Start',
          description: '',
          timelinePosition: 5,
          timelineLabel: 'Day 5',
          narrativeOrder: 1,
          category: 'plot',
        },
      });
      store.dispatch({
        type: 'ADD_EVENT',
        payload: {
          title: 'End',
          description: '',
          timelinePosition: 25,
          timelineLabel: 'Day 25',
          narrativeOrder: 2,
          category: 'plot',
        },
      });

      const range = store.getTimelineRange();
      expect(range.min).toBe(5);
      expect(range.max).toBe(25);
    });
  });

  describe('Subscribe', () => {
    it('should notify subscribers on dispatch', () => {
      const store = getTimelineStore();
      const listener = vi.fn();
      store.subscribe(listener);

      store.dispatch({
        type: 'ADD_EVENT',
        payload: {
          title: 'Test',
          description: '',
          timelinePosition: 0,
          timelineLabel: 'Now',
          narrativeOrder: 1,
          category: 'plot',
        },
      });

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe correctly', () => {
      const store = getTimelineStore();
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);

      unsubscribe();

      store.dispatch({
        type: 'ADD_EVENT',
        payload: {
          title: 'Test',
          description: '',
          timelinePosition: 0,
          timelineLabel: 'Now',
          narrativeOrder: 1,
          category: 'plot',
        },
      });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Persistence', () => {
    it('should save state to localStorage', () => {
      const store = getTimelineStore();
      store.dispatch({
        type: 'ADD_EVENT',
        payload: {
          title: 'Persistent',
          description: '',
          timelinePosition: 0,
          timelineLabel: 'Now',
          narrativeOrder: 1,
          category: 'plot',
        },
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });
});
