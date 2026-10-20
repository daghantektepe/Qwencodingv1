import {
  WritingSession,
  DailyActivity,
  AnalyticsState,
  AnalyticsAction,
  HeatmapCell,
} from '../types/analytics';

const STORAGE_KEY = 'scrivener-analytics-state';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

const initialState: AnalyticsState = {
  sessions: [],
  dailyActivity: [],
  currentDocumentText: '',
  wpmHistory: [],
  startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
};

function loadFromStorage(): AnalyticsState {
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

function saveToStorage(state: AnalyticsState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

function updateDailyActivity(sessions: WritingSession[]): DailyActivity[] {
  const activityMap: Record<string, DailyActivity> = {};
  
  sessions.forEach(session => {
    const date = session.startTime.split('T')[0];
    
    if (!activityMap[date]) {
      activityMap[date] = {
        date,
        totalWords: 0,
        sessionCount: 0,
        totalMinutes: 0,
      };
    }
    
    activityMap[date].totalWords += session.netWords;
    activityMap[date].sessionCount += 1;
    activityMap[date].totalMinutes += Math.round(session.duration / 60);
  });
  
  return Object.values(activityMap).sort((a, b) => a.date.localeCompare(b.date));
}

function analyticsReducer(state: AnalyticsState, action: AnalyticsAction): AnalyticsState {
  switch (action.type) {
    case 'ADD_SESSION': {
      const payload = action.payload as Partial<WritingSession> & Omit<WritingSession, 'id'>;
      const newSession: WritingSession = {
        ...payload,
        id: (payload as any).id || generateId(),
      };
      const sessions = [...state.sessions, newSession];
      return {
        ...state,
        sessions,
        dailyActivity: updateDailyActivity(sessions),
      };
    }

    case 'UPDATE_SESSION': {
      const payload = action.payload as { id: string; updates: Partial<WritingSession> };
      const sessions = state.sessions.map(s =>
        s.id === payload.id ? { ...s, ...payload.updates } : s
      );
      return {
        ...state,
        sessions,
        dailyActivity: updateDailyActivity(sessions),
      };
    }

    case 'DELETE_SESSION': {
      const sessionId = action.payload as string;
      const sessions = state.sessions.filter(s => s.id !== sessionId);
      return {
        ...state,
        sessions,
        dailyActivity: updateDailyActivity(sessions),
      };
    }

    case 'SET_CURRENT_TEXT': {
      return {
        ...state,
        currentDocumentText: action.payload as string,
      };
    }

    case 'SET_DATE_RANGE': {
      const payload = action.payload as { startDate: string; endDate: string };
      return {
        ...state,
        startDate: payload.startDate,
        endDate: payload.endDate,
      };
    }

    case 'LOAD_STATE': {
      return { ...initialState, ...(action.payload as Partial<AnalyticsState>) };
    }

    default:
      return state;
  }
}

type Listener = (state: AnalyticsState) => void;

class AnalyticsStoreImpl {
  private state: AnalyticsState;
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.state = loadFromStorage();
  }

  getState(): AnalyticsState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  dispatch(action: AnalyticsAction): void {
    this.state = analyticsReducer(this.state, action);
    saveToStorage(this.state);
    this.listeners.forEach(listener => listener(this.state));
  }

  // Helper methods
  getSessionsInRange(): WritingSession[] {
    const { sessions, startDate, endDate } = this.state;
    return sessions.filter(session => {
      const sessionDate = session.startTime.split('T')[0];
      return sessionDate >= startDate && sessionDate <= endDate;
    });
  }

  getHeatmapData(): HeatmapCell[] {
    const { dailyActivity, startDate, endDate } = this.state;
    const cells: HeatmapCell[] = [];
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);
    
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const activity = dailyActivity.find(a => a.date === dateStr);
      const count = activity ? activity.totalWords : 0;
      
      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (count > 0) level = 1;
      if (count > 500) level = 2;
      if (count > 1000) level = 3;
      if (count > 2000) level = 4;
      
      cells.push({ date: dateStr, count, level });
      current.setDate(current.getDate() + 1);
    }
    
    return cells;
  }

  getTotalStats() {
    const sessions = this.getSessionsInRange();
    const totalWords = sessions.reduce((sum, s) => sum + s.netWords, 0);
    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration / 60, 0);
    const avgWpm = sessions.length > 0
      ? sessions.reduce((sum, s) => sum + s.wpm, 0) / sessions.length
      : 0;
    
    return {
      totalWords,
      totalMinutes: Math.round(totalMinutes),
      totalSessions: sessions.length,
      avgWpm: Math.round(avgWpm),
    };
  }
}

let storeInstance: AnalyticsStoreImpl | null = null;

export function getAnalyticsStore(): AnalyticsStoreImpl {
  if (!storeInstance) {
    storeInstance = new AnalyticsStoreImpl();
  }
  return storeInstance;
}

export function resetAnalyticsStore(): void {
  storeInstance = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export type { AnalyticsStoreImpl };
