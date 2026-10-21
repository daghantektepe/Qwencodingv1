/**
 * deadlineCalculator.ts — Faz 68: Hedef ve Deadline Hesaplama Motoru
 */

import { DeadlineConfig, DeadlineProgress, WritingSprintSession } from '../../types/targets';

export class DeadlineCalculator {
  public calculateProgress(
    config: DeadlineConfig,
    currentWordCount: number,
    now: Date = new Date()
  ): DeadlineProgress {
    const target = Math.max(1, config.targetWordCount);
    const current = Math.max(0, currentWordCount);
    const wordsRemaining = Math.max(0, target - current);

    const deadline = new Date(config.deadlineDate);
    // Saat/dakika farkını temizle
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDay = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());

    const diffTime = targetDay.getTime() - today.getTime();
    const totalDaysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // Haftalık çalışma gününe göre efektif gün sayısı
    const fraction = Math.max(1, Math.min(7, config.writingDaysPerWeek)) / 7;
    const effectiveDays = Math.max(1, Math.round(totalDaysRemaining * fraction));

    const requiredWordsPerDay = totalDaysRemaining > 0
      ? Math.ceil(wordsRemaining / effectiveDays)
      : wordsRemaining;

    const completionPercentage = Math.min(100, Math.round((current / target) * 100));

    // Beklenen ilerleme ile kıyaslama
    const start = new Date(config.startDate);
    const totalDurationDays = Math.max(1, Math.ceil((targetDay.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const elapsedDays = Math.max(0, Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const expectedWords = Math.round((elapsedDays / totalDurationDays) * target);
    const isOnTrack = current >= expectedWords;

    return {
      currentWordCount: current,
      wordsRemaining,
      daysRemaining: totalDaysRemaining,
      requiredWordsPerDay,
      isOnTrack,
      completionPercentage,
    };
  }

  // --- Yazma Koşusu (Writing Sprint) Yönetimi ---
  public createSprint(durationMinutes: number = 20, startWords: number = 0): WritingSprintSession {
    const duration = Math.max(1, durationMinutes);
    return {
      id: `sprint-${Date.now()}`,
      durationMinutes: duration,
      remainingSeconds: duration * 60,
      startWordCount: startWords,
      currentWordCount: startWords,
      wordsGained: 0,
      wpm: 0,
      status: 'idle',
      createdAt: new Date().toISOString(),
    };
  }

  public updateSprintProgress(
    sprint: WritingSprintSession,
    currentWordCount: number,
    elapsedSeconds: number
  ): WritingSprintSession {
    const wordsGained = Math.max(0, currentWordCount - sprint.startWordCount);
    const elapsedMinutes = Math.max(0.1, elapsedSeconds / 60);
    const wpm = Math.round(wordsGained / elapsedMinutes);

    return {
      ...sprint,
      currentWordCount,
      wordsGained,
      wpm,
      remainingSeconds: Math.max(0, sprint.durationMinutes * 60 - elapsedSeconds),
      status: elapsedSeconds >= sprint.durationMinutes * 60 ? 'completed' : sprint.status,
    };
  }
}

export const deadlineCalculator = new DeadlineCalculator();
export default deadlineCalculator;
