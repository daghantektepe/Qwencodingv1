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

import { 
  startSession, 
  updateSession, 
  endSession, 
  calculateStreak, 
  generateProductivityReport,
  getWeeklySummary,
  getMonthlySummary
} from '../../src/services/analyticsEngine';
import { getAnalyticsStore, resetAnalyticsStore } from '../../src/services/analyticsStore';

/**
 * Helper: Get today's date as YYYY-MM-DD string (local time)
 */
function getLocalTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Helper: Get date string N days ago (local time)
 */
function getLocalDaysAgoString(days: number): string {
  const now = new Date();
  now.setDate(now.getDate() - days);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

describe('Analytics Engine', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    resetAnalyticsStore();
  });

  afterEach(() => {
    localStorageMock.clear();
    resetAnalyticsStore();
  });

  describe('startSession', () => {
    it('should create a new session and return session ID', () => {
      const sessionId = startSession('doc-1');
      
      expect(sessionId).toBeTruthy();
      expect(sessionId).toContain('session-');
      
      const store = getAnalyticsStore();
      const state = store.getState();
      expect(state.sessions).toHaveLength(1);
      expect(state.sessions[0].documentId).toBe('doc-1');
    });
  });

  describe('updateSession', () => {
    it('should update session with word counts', () => {
      const sessionId = startSession('doc-1');
      
      updateSession(sessionId, 100, 10);
      
      const store = getAnalyticsStore();
      const state = store.getState();
      const session = state.sessions.find(s => s.id === sessionId);
      
      expect(session).toBeDefined();
      expect(session?.wordsWritten).toBe(100);
      expect(session?.wordsDeleted).toBe(10);
      expect(session?.netWords).toBe(90);
    });

    it('should calculate WPM correctly', () => {
      const sessionId = startSession('doc-1');
      
      updateSession(sessionId, 100, 0);
      
      const store = getAnalyticsStore();
      const state = store.getState();
      const session = state.sessions.find(s => s.id === sessionId);
      
      expect(session?.wpm).toBeGreaterThanOrEqual(0);
    });

    it('should handle non-existent session gracefully', () => {
      expect(() => {
        updateSession('non-existent-id', 100, 10);
      }).not.toThrow();
    });
  });

  describe('endSession', () => {
    it('should finalize session with end time and duration', () => {
      const sessionId = startSession('doc-1');
      
      // Add some words first
      updateSession(sessionId, 50, 5);
      
      // End the session
      endSession(sessionId);
      
      const store = getAnalyticsStore();
      const state = store.getState();
      const session = state.sessions.find(s => s.id === sessionId);
      
      expect(session).toBeDefined();
      expect(session?.endTime).toBeTruthy();
      expect(session?.endTime).not.toBe(session?.startTime);
      expect(session?.duration).toBeGreaterThanOrEqual(1);
      expect(session?.netWords).toBe(45);
    });

    it('should handle non-existent session gracefully', () => {
      expect(() => {
        endSession('non-existent-id');
      }).not.toThrow();
    });
  });

  describe('calculateStreak', () => {
    it('should return zero streak when no sessions', () => {
      const streak = calculateStreak();
      
      expect(streak.currentStreak).toBe(0);
      expect(streak.longestStreak).toBe(0);
      expect(streak.lastActiveDate).toBeNull();
    });

    it('should calculate streak of 1 from today\'s session', () => {
      const store = getAnalyticsStore();
      const todayStr = getLocalTodayString();
      
      // Use noon timestamp to avoid timezone edge cases
      const todayNoon = `${todayStr}T12:00:00.000Z`;
      
      store.dispatch({
        type: 'ADD_SESSION',
        payload: {
          startTime: todayNoon,
          endTime: todayNoon,
          duration: 1800,
          wordsWritten: 500,
          wordsDeleted: 50,
          netWords: 450,
          wpm: 15,
          documentId: 'doc-1',
        },
      });
      
      const streak = calculateStreak();
      
      expect(streak.currentStreak).toBeGreaterThanOrEqual(1);
      expect(streak.longestStreak).toBeGreaterThanOrEqual(1);
      expect(streak.lastActiveDate).toBe(todayStr);
    });

    it('should calculate streak of 3 from consecutive days', () => {
      const store = getAnalyticsStore();
      
      const todayStr = getLocalTodayString();
      const yesterdayStr = getLocalDaysAgoString(1);
      const twoDaysAgoStr = getLocalDaysAgoString(2);
      
      // Add sessions for 3 consecutive days using noon timestamps
      store.dispatch({
        type: 'ADD_SESSION',
        payload: {
          startTime: `${todayStr}T12:00:00.000Z`,
          endTime: `${todayStr}T12:30:00.000Z`,
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
          startTime: `${yesterdayStr}T12:00:00.000Z`,
          endTime: `${yesterdayStr}T12:30:00.000Z`,
          duration: 1800,
          wordsWritten: 400,
          wordsDeleted: 40,
          netWords: 360,
          wpm: 13,
          documentId: 'doc-1',
        },
      });
      
      store.dispatch({
        type: 'ADD_SESSION',
        payload: {
          startTime: `${twoDaysAgoStr}T12:00:00.000Z`,
          endTime: `${twoDaysAgoStr}T12:30:00.000Z`,
          duration: 1800,
          wordsWritten: 300,
          wordsDeleted: 30,
          netWords: 270,
          wpm: 10,
          documentId: 'doc-1',
        },
      });
      
      const streak = calculateStreak();
      
      expect(streak.currentStreak).toBe(3);
      expect(streak.longestStreak).toBe(3);
    });

    it('should handle gap in streak correctly', () => {
      const store = getAnalyticsStore();
      
      const todayStr = getLocalTodayString();
      const twoDaysAgoStr = getLocalDaysAgoString(2);
      const threeDaysAgoStr = getLocalDaysAgoString(3);
      
      // Today and 2 days ago (gap at yesterday)
      store.dispatch({
        type: 'ADD_SESSION',
        payload: {
          startTime: `${todayStr}T12:00:00.000Z`,
          endTime: `${todayStr}T12:30:00.000Z`,
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
          startTime: `${twoDaysAgoStr}T12:00:00.000Z`,
          endTime: `${twoDaysAgoStr}T12:30:00.000Z`,
          duration: 1800,
          wordsWritten: 300,
          wordsDeleted: 30,
          netWords: 270,
          wpm: 10,
          documentId: 'doc-1',
        },
      });
      
      store.dispatch({
        type: 'ADD_SESSION',
        payload: {
          startTime: `${threeDaysAgoStr}T12:00:00.000Z`,
          endTime: `${threeDaysAgoStr}T12:30:00.000Z`,
          duration: 1800,
          wordsWritten: 200,
          wordsDeleted: 20,
          netWords: 180,
          wpm: 7,
          documentId: 'doc-1',
        },
      });
      
      const streak = calculateStreak();
      
      // Current streak should be 1 (only today, gap at yesterday)
      expect(streak.currentStreak).toBe(1);
      // Longest streak should be 2 (twoDaysAgo + threeDaysAgo)
      expect(streak.longestStreak).toBe(2);
    });
  });

  describe('generateProductivityReport', () => {
    it('should return empty report when no sessions', () => {
      const report = generateProductivityReport();
      
      expect(report.totalWords).toBe(0);
      expect(report.totalSessions).toBe(0);
      expect(report.totalMinutes).toBe(0);
      expect(report.averageWpm).toBe(0);
      expect(report.bestWpm).toBe(0);
    });

    it('should calculate report from sessions', () => {
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
          wpm: 17,
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
      
      const report = generateProductivityReport();
      
      expect(report.totalWords).toBe(950);
      expect(report.totalSessions).toBe(2);
      expect(report.bestWpm).toBe(20);
      expect(report.averageWpm).toBeGreaterThan(0);
      expect(report.totalMinutes).toBeGreaterThan(0);
    });
  });

  describe('getWeeklySummary', () => {
    it('should return empty array when no activity', () => {
      const summary = getWeeklySummary();
      expect(summary).toEqual([]);
    });

    it('should return activities from last 7 days', () => {
      const store = getAnalyticsStore();
      const todayStr = getLocalTodayString();
      
      store.dispatch({
        type: 'ADD_SESSION',
        payload: {
          startTime: `${todayStr}T12:00:00.000Z`,
          endTime: `${todayStr}T12:30:00.000Z`,
          duration: 1800,
          wordsWritten: 500,
          wordsDeleted: 50,
          netWords: 450,
          wpm: 15,
          documentId: 'doc-1',
        },
      });
      
      const summary = getWeeklySummary();
      
      expect(summary.length).toBeGreaterThan(0);
    });
  });

  describe('getMonthlySummary', () => {
    it('should return empty array when no activity', () => {
      const summary = getMonthlySummary();
      expect(summary).toEqual([]);
    });

    it('should return activities from last 30 days', () => {
      const store = getAnalyticsStore();
      const todayStr = getLocalTodayString();
      
      store.dispatch({
        type: 'ADD_SESSION',
        payload: {
          startTime: `${todayStr}T12:00:00.000Z`,
          endTime: `${todayStr}T12:30:00.000Z`,
          duration: 1800,
          wordsWritten: 500,
          wordsDeleted: 50,
          netWords: 450,
          wpm: 15,
          documentId: 'doc-1',
        },
      });
      
      const summary = getMonthlySummary();
      
      expect(summary.length).toBeGreaterThan(0);
    });
  });
});
