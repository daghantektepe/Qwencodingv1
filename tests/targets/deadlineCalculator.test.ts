import { describe, it, expect, beforeEach } from 'vitest';
import { DeadlineCalculator } from '../../src/services/targets/deadlineCalculator';
import { DeadlineConfig } from '../../src/types/targets';

describe('Phase 68: Writing Sprints & Deadline Scheduler (deadlineCalculator)', () => {
  let calculator: DeadlineCalculator;

  beforeEach(() => {
    calculator = new DeadlineCalculator();
  });

  it('calculates daily word quotas and remaining days accurately', () => {
    const today = new Date('2026-10-01T00:00:00Z');
    const config: DeadlineConfig = {
      targetWordCount: 50000,
      deadlineDate: '2026-10-31', // 30 gün
      writingDaysPerWeek: 7,
      startDate: '2026-10-01',
    };

    const currentWords = 20000; // 30.000 kelime kaldı
    const progress = calculator.calculateProgress(config, currentWords, today);

    expect(progress.wordsRemaining).toBe(30000);
    expect(progress.daysRemaining).toBe(30);
    expect(progress.requiredWordsPerDay).toBe(1000); // 30.000 / 30 = 1000
    expect(progress.completionPercentage).toBe(40);
  });

  it('adjusts daily quota based on custom writing days per week (e.g., 5 days)', () => {
    const today = new Date('2026-10-01T00:00:00Z');
    const config: DeadlineConfig = {
      targetWordCount: 20000,
      deadlineDate: '2026-10-29', // 28 gün
      writingDaysPerWeek: 5, // 28 * (5/7) = 20 gün
      startDate: '2026-10-01',
    };

    const progress = calculator.calculateProgress(config, 0, today);
    expect(progress.daysRemaining).toBe(28);
    // 20.000 / 20 = 1000 kelime/yazma günü
    expect(progress.requiredWordsPerDay).toBe(1000);
  });

  it('creates and tracks writing sprint progress', () => {
    const sprint = calculator.createSprint(15, 1000);
    expect(sprint.durationMinutes).toBe(15);
    expect(sprint.remainingSeconds).toBe(15 * 60);
    expect(sprint.wordsGained).toBe(0);

    // 5 dakika (300 sn) geçti, kelime 1250 oldu (+250 kelime)
    const updated = calculator.updateSprintProgress(sprint, 1250, 300);
    expect(updated.wordsGained).toBe(250);
    expect(updated.wpm).toBe(50); // 250 / 5 dk = 50 WPM
    expect(updated.remainingSeconds).toBe(600); // 10 dk kaldı
  });

  it('completes sprint when elapsed time reaches duration', () => {
    const sprint = calculator.createSprint(10, 500);
    const completed = calculator.updateSprintProgress(sprint, 900, 600); // 600 sn = 10 dk
    expect(completed.status).toBe('completed');
    expect(completed.remainingSeconds).toBe(0);
    expect(completed.wordsGained).toBe(400);
  });
});
