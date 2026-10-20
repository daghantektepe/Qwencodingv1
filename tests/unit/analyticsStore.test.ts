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

import { getAnalyticsStore, resetAnalyticsStore } from '../../src/services/analyticsStore';

describe('AnalyticsStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    resetAnalyticsStore();
  });

  afterEach(() => {
    localStorageMock.clear();
    resetAnalyticsStore();
  });

  describe('Initial State', () => {
    it('should return initial state with empty arrays', () => {
      const store = getAnalyticsStore();
      const state = store.getState();

      expect(state.sessions).toEqual([]);
      expect(state.dailyActivity).toEqual([]);
      expect(state.currentDocumentText).toBe('');
      expect(state.wpmHistory).toEqual([]);
    });
  });

  describe('ADD_SESSION', () => {
    it('should add a writing session', () => {
      const store = getAnalyticsStore();
      store.dispatch({
        type: 'ADD_SESSION',
        payload: {
          startTime: '2024-01-15T10:00:00.000Z',
          endTime: '2024-01-15T10:30:00.000Z',
          duration: 1800,
          wordsWritten: 500,
          wordsDeleted: 50,
          netWords: 450,
          wpm: 15,
          documentId: 'doc-1',
        },
      });

      const state = store.getState();
      expect(state.sessions).toHaveLength(1);
      expect(state.sessions[0].netWords).toBe(450);
      expect(state.sessions[0].wpm).toBe(15);
    });

    it('should update daily activity when adding session', () => {
      const store = getAnalyticsStore();
      store.dispatch({
        type: 'ADD_SESSION',
        payload: {
          startTime: '2024-01-15T10:00:00.000Z',
          endTime: '2024-01-15T10:30:00.000Z',
          duration: 1800,
          wordsWritten: 500,
          wordsDeleted: 50,
          netWords: 450,
          wpm: 15,
          documentId: 'doc-1',
        },
      });

      const state = store.getState();
      expect(state.dailyActivity).toHaveLength(1);
      expect(state.dailyActivity[0].totalWords).toBe(450);
      expect(state.dailyActivity[0].sessionCount).toBe(1);
    });
  });

  describe('DELETE_SESSION', () => {
    it('should remove a session', () => {
      const store = getAnalyticsStore();
      store.dispatch({
        type: 'ADD_SESSION',
        payload: {
          startTime: '2024-01-15T10:00:00.000Z',
          endTime: '2024-01-15T10:30:00.000Z',
          duration: 1800,
          wordsWritten: 500,
          wordsDeleted: 50,
          netWords: 450,
          wpm: 15,
          documentId: 'doc-1',
        },
      });

      const sessionId = store.getState().sessions[0].id;
      store.dispatch({ type: 'DELETE_SESSION', payload: sessionId });

      expect(store.getState().sessions).toHaveLength(0);
    });
  });

  describe('SET_CURRENT_TEXT', () => {
    it('should set current document text', () => {
      const store = getAnalyticsStore();
      store.dispatch({
        type: 'SET_CURRENT_TEXT',
        payload: 'Hello world. This is a test document.',
      });

      expect(store.getState().currentDocumentText).toBe('Hello world. This is a test document.');
    });
  });

  describe('SET_DATE_RANGE', () => {
    it('should set date range', () => {
      const store = getAnalyticsStore();
      store.dispatch({
        type: 'SET_DATE_RANGE',
        payload: { startDate: '2024-01-01', endDate: '2024-01-31' },
      });

      const state = store.getState();
      expect(state.startDate).toBe('2024-01-01');
      expect(state.endDate).toBe('2024-01-31');
    });
  });

  describe('getHeatmapData', () => {
    it('should generate heatmap cells for date range', () => {
      const store = getAnalyticsStore();
      store.dispatch({
        type: 'SET_DATE_RANGE',
        payload: { startDate: '2024-01-01', endDate: '2024-01-07' },
      });

      const cells = store.getHeatmapData();
      expect(cells).toHaveLength(7);
      expect(cells[0].date).toBe('2024-01-01');
      expect(cells[6].date).toBe('2024-01-07');
    });

    it('should set correct intensity levels', () => {
      const store = getAnalyticsStore();
      store.dispatch({
        type: 'SET_DATE_RANGE',
        payload: { startDate: '2024-01-01', endDate: '2024-01-03' },
      });
      store.dispatch({
        type: 'ADD_SESSION',
        payload: {
          startTime: '2024-01-01T10:00:00.000Z',
          endTime: '2024-01-01T11:00:00.000Z',
          duration: 3600,
          wordsWritten: 1500,
          wordsDeleted: 100,
          netWords: 1400,
          wpm: 25,
          documentId: 'doc-1',
        },
      });

      const cells = store.getHeatmapData();
      expect(cells[0].level).toBeGreaterThan(0); // Has activity
      expect(cells[1].level).toBe(0); // No activity
    });
  });

  describe('getTotalStats', () => {
    it('should calculate total statistics', () => {
      const store = getAnalyticsStore();
      
      // Set date range to include the test sessions
      store.dispatch({
        type: 'SET_DATE_RANGE',
        payload: { startDate: '2024-01-01', endDate: '2024-12-31' },
      });
      
      store.dispatch({
        type: 'ADD_SESSION',
        payload: {
          startTime: '2024-01-15T10:00:00.000Z',
          endTime: '2024-01-15T10:30:00.000Z',
          duration: 1800,
          wordsWritten: 500,
          wordsDeleted: 50,
          netWords: 450,
          wpm: 15,
          documentId: 'doc-1',
        },
      });
      store.dispatch({
        type: 'ADD_SESSION',
        payload: {
          startTime: '2024-01-16T10:00:00.000Z',
          endTime: '2024-01-16T10:30:00.000Z',
          duration: 1800,
          wordsWritten: 600,
          wordsDeleted: 100,
          netWords: 500,
          wpm: 20,
          documentId: 'doc-1',
        },
      });

      const stats = store.getTotalStats();
      expect(stats.totalWords).toBe(950);
      expect(stats.totalSessions).toBe(2);
      expect(stats.avgWpm).toBe(18); // (15 + 20) / 2
    });
  });

  describe('Subscribe', () => {
    it('should notify subscribers on dispatch', () => {
      const store = getAnalyticsStore();
      const listener = vi.fn();
      store.subscribe(listener);

      store.dispatch({
        type: 'SET_CURRENT_TEXT',
        payload: 'Test text',
      });

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe correctly', () => {
      const store = getAnalyticsStore();
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);

      unsubscribe();

      store.dispatch({
        type: 'SET_CURRENT_TEXT',
        payload: 'Test text',
      });

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
