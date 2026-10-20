// Analytics Module Type Definitions
// Smart Writing Analytics & Deep Statistics Dashboard

export interface WritingSession {
  id: string;
  startTime: string; // ISO timestamp
  endTime: string; // ISO timestamp
  duration: number; // in seconds
  wordsWritten: number;
  wordsDeleted: number;
  netWords: number;
  wpm: number; // words per minute
  documentId: string;
}

export interface DailyActivity {
  date: string; // YYYY-MM-DD format
  totalWords: number;
  sessionCount: number;
  totalMinutes: number;
}

export interface WordFrequency {
  word: string;
  count: number;
  percentage: number;
}

export interface ReadabilityMetrics {
  fleschKincaid: number; // 0-100 scale
  fleschKincaidGrade: number; // US grade level
  gunningFog: number; // years of education
  avgSentenceLength: number;
  avgWordLength: number;
  complexWordPercentage: number;
  totalSentences: number;
  totalWords: number;
  totalSyllables: number;
}

export interface WpmDataPoint {
  timestamp: string;
  wpm: number;
  cumulativeWords: number;
}

export interface AnalyticsState {
  sessions: WritingSession[];
  dailyActivity: DailyActivity[];
  currentDocumentText: string;
  wpmHistory: WpmDataPoint[];
  startDate: string;
  endDate: string;
}

export interface AnalyticsAction {
  type:
    | 'ADD_SESSION'
    | 'UPDATE_SESSION'
    | 'DELETE_SESSION'
    | 'SET_CURRENT_TEXT'
    | 'SET_DATE_RANGE'
    | 'LOAD_STATE';
  payload?: unknown;
}

export interface HeatmapCell {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4; // intensity level
}
