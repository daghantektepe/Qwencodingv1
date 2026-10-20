import { WritingSession, DailyActivity, HeatmapCell } from '../types/analytics';
import { getAnalyticsStore } from './analyticsStore';
import { calculateWPM } from '../utils/textAnalysis';

/**
 * Analytics Engine - Advanced analytics calculations and session management
 */

export interface SessionInput {
  documentId: string;
  startTime: string;
  endTime: string;
  wordsWritten: number;
  wordsDeleted: number;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
}

export interface ProductivityReport {
  totalWords: number;
  totalSessions: number;
  totalMinutes: number;
  averageWpm: number;
  bestWpm: number;
  averageSessionLength: number;
  mostProductiveDay: string | null;
  streakInfo: StreakInfo;
}

/**
 * Get today's date as YYYY-MM-DD string (local time)
 */
function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get a date string N days ago from a given date string
 */
function getDaysAgoString(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T12:00:00'); // Use noon to avoid timezone issues
  date.setDate(date.getDate() - days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get difference in days between two date strings
 */
function daysBetween(dateStr1: string, dateStr2: string): number {
  const date1 = new Date(dateStr1 + 'T12:00:00');
  const date2 = new Date(dateStr2 + 'T12:00:00');
  const diffMs = date2.getTime() - date1.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Start a new writing session
 */
export function startSession(documentId: string): string {
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  const startTime = new Date().toISOString();
  
  const store = getAnalyticsStore();
  store.dispatch({
    type: 'ADD_SESSION',
    payload: {
      id: sessionId,
      documentId,
      startTime,
      endTime: startTime,
      duration: 0,
      wordsWritten: 0,
      wordsDeleted: 0,
      netWords: 0,
      wpm: 0,
    },
  });
  
  return sessionId;
}

/**
 * Update an active session
 */
export function updateSession(
  sessionId: string,
  wordsWritten: number,
  wordsDeleted: number
): void {
  const store = getAnalyticsStore();
  const state = store.getState();
  const session = state.sessions.find(s => s.id === sessionId);
  
  if (!session) {
    console.warn(`Session not found: ${sessionId}`);
    return;
  }
  
  const endTime = new Date().toISOString();
  const startTime = new Date(session.startTime);
  const endTimeObj = new Date(endTime);
  const duration = Math.floor((endTimeObj.getTime() - startTime.getTime()) / 1000);
  
  const netWords = wordsWritten - wordsDeleted;
  const wpm = duration > 0 ? calculateWPM(wordsWritten, duration) : 0;
  
  store.dispatch({
    type: 'UPDATE_SESSION',
    payload: {
      id: sessionId,
      updates: {
        endTime,
        duration,
        wordsWritten,
        wordsDeleted,
        netWords,
        wpm,
      },
    },
  });
}

/**
 * End a writing session
 */
export function endSession(sessionId: string): void {
  const store = getAnalyticsStore();
  const state = store.getState();
  const session = state.sessions.find(s => s.id === sessionId);
  
  if (!session) {
    console.warn(`Session not found: ${sessionId}`);
    return;
  }
  
  let endTimeObj = new Date();
  const startTime = new Date(session.startTime);
  if (endTimeObj.getTime() <= startTime.getTime()) {
    endTimeObj = new Date(startTime.getTime() + 1000);
  }
  const endTime = endTimeObj.toISOString();
  const duration = Math.max(1, Math.floor((endTimeObj.getTime() - startTime.getTime()) / 1000));
  
  const netWords = session.wordsWritten - session.wordsDeleted;
  const wpm = duration > 0 ? calculateWPM(session.wordsWritten, duration) : 0;
  
  store.dispatch({
    type: 'UPDATE_SESSION',
    payload: {
      id: sessionId,
      updates: {
        endTime,
        duration,
        netWords,
        wpm,
      },
    },
  });
}

/**
 * Calculate writing streak information
 * Uses string-based date comparison to avoid timezone issues
 */
export function calculateStreak(): StreakInfo {
  const store = getAnalyticsStore();
  const state = store.getState();
  const dailyActivity = state.dailyActivity;
  
  if (dailyActivity.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
    };
  }
  
  // Get unique dates sorted in descending order (most recent first)
  const uniqueDates = [...new Set(dailyActivity.map(a => a.date))].sort().reverse();
  
  if (uniqueDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
    };
  }
  
  const todayStr = getTodayString();
  
  // Calculate current streak: count consecutive days ending at today or yesterday
  let currentStreak = 0;
  let lastActiveDate: string | null = uniqueDates[0];
  
  // Check if most recent activity was today or yesterday
  const daysSinceLastActivity = daysBetween(uniqueDates[0], todayStr);
  
  if (daysSinceLastActivity <= 1) {
    // Start counting from the most recent date
    let checkDate = uniqueDates[0];
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const expectedDate = getDaysAgoString(checkDate, i);
      
      if (uniqueDates.includes(expectedDate)) {
        currentStreak++;
      } else {
        break;
      }
    }
  }
  
  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;
  
  // Sort dates ascending for longest streak calculation
  const sortedAsc = [...uniqueDates].sort();
  
  for (let i = 1; i < sortedAsc.length; i++) {
    const diff = daysBetween(sortedAsc[i - 1], sortedAsc[i]);
    
    if (diff === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  
  longestStreak = Math.max(longestStreak, tempStreak, currentStreak);
  
  return {
    currentStreak,
    longestStreak,
    lastActiveDate,
  };
}

/**
 * Generate comprehensive productivity report
 */
export function generateProductivityReport(): ProductivityReport {
  const store = getAnalyticsStore();
  const state = store.getState();
  const sessions = state.sessions;
  
  if (sessions.length === 0) {
    return {
      totalWords: 0,
      totalSessions: 0,
      totalMinutes: 0,
      averageWpm: 0,
      bestWpm: 0,
      averageSessionLength: 0,
      mostProductiveDay: null,
      streakInfo: calculateStreak(),
    };
  }
  
  const totalWords = sessions.reduce((sum, s) => sum + s.netWords, 0);
  const totalSessions = sessions.length;
  const totalMinutes = Math.round(sessions.reduce((sum, s) => sum + s.duration / 60, 0));
  const averageWpm = Math.round(sessions.reduce((sum, s) => sum + s.wpm, 0) / totalSessions);
  const bestWpm = Math.max(...sessions.map(s => s.wpm));
  const averageSessionLength = Math.round(totalMinutes / totalSessions);
  
  // Find most productive day
  const dailyWords: Record<string, number> = {};
  sessions.forEach(session => {
    const date = session.startTime.split('T')[0];
    dailyWords[date] = (dailyWords[date] || 0) + session.netWords;
  });
  
  const mostProductiveDay = Object.entries(dailyWords).reduce(
    (max, [date, words]) => words > max.words ? { date, words } : max,
    { date: '', words: 0 }
  ).date || null;
  
  return {
    totalWords,
    totalSessions,
    totalMinutes,
    averageWpm,
    bestWpm,
    averageSessionLength,
    mostProductiveDay,
    streakInfo: calculateStreak(),
  };
}

/**
 * Get weekly summary
 */
export function getWeeklySummary(): DailyActivity[] {
  const store = getAnalyticsStore();
  const state = store.getState();
  const dailyActivity = state.dailyActivity;
  
  const todayStr = getTodayString();
  const weekAgoStr = getDaysAgoString(todayStr, 7);
  
  return dailyActivity.filter(activity => {
    return activity.date >= weekAgoStr && activity.date <= todayStr;
  }).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get monthly summary
 */
export function getMonthlySummary(): DailyActivity[] {
  const store = getAnalyticsStore();
  const state = store.getState();
  const dailyActivity = state.dailyActivity;
  
  const todayStr = getTodayString();
  
  // Calculate month ago
  const now = new Date();
  const monthAgo = new Date(now);
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const monthAgoStr = `${monthAgo.getFullYear()}-${String(monthAgo.getMonth() + 1).padStart(2, '0')}-${String(monthAgo.getDate()).padStart(2, '0')}`;
  
  return dailyActivity.filter(activity => {
    return activity.date >= monthAgoStr && activity.date <= todayStr;
  }).sort((a, b) => a.date.localeCompare(b.date));
}
