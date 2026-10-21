/**
 * targets.ts — Faz 68: Hedefler, Yazma Sprintleri ve Deadline Tipleri
 */

export interface DeadlineConfig {
  targetWordCount: number;
  deadlineDate: string; // YYYY-MM-DD
  writingDaysPerWeek: number; // 1 - 7
  startDate: string;
}

export interface DeadlineProgress {
  currentWordCount: number;
  wordsRemaining: number;
  daysRemaining: number;
  requiredWordsPerDay: number;
  isOnTrack: boolean;
  completionPercentage: number;
}

export interface WritingSprintSession {
  id: string;
  durationMinutes: number;
  remainingSeconds: number;
  startWordCount: number;
  currentWordCount: number;
  wordsGained: number;
  wpm: number;
  status: 'idle' | 'running' | 'paused' | 'completed';
  createdAt: string;
}
