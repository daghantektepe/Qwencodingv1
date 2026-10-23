import { describe, it, expect, beforeEach } from 'vitest';
import { JournalLogger } from '../../src/services/journal/journalLogger';
import { TimeTravelReplay } from '../../src/services/journal/timeTravelReplay';

describe('Phase 73: Changelog Journal & Auto-Save Net (journalLogger & timeTravelReplay)', () => {
  let logger: JournalLogger;
  let replay: TimeTravelReplay;

  beforeEach(() => {
    logger = new JournalLogger();
    replay = new TimeTravelReplay();
  });

  describe('JournalLogger', () => {
    it('logs keystroke entries and calculates word counts', () => {
      const e1 = logger.logEntry('doc-1', 'Giriş cümlesi.', 'keystroke');
      expect(e1.id).toBeDefined();
      expect(e1.wordCount).toBe(2);
      expect(e1.charCount).toBe(14);
      expect(logger.getEntriesForDoc('doc-1')).toHaveLength(1);

      const e2 = logger.logEntry('doc-1', 'Giriş cümlesi. Ve ikinci cümle.', 'pause');
      expect(logger.getEntriesForDoc('doc-1')).toHaveLength(2);
      expect(e2.wordCount).toBe(5);
    });

    it('retrieves latest recovery snapshot on crash simulation', () => {
      logger.logEntry('doc-2', 'Adım 1', 'keystroke');
      logger.logEntry('doc-2', 'Adım 2', 'keystroke');
      logger.logEntry('doc-2', 'Son kurtarılan metin', 'manual_save');

      const recovery = logger.getLatestRecoverySnapshot('doc-2');
      expect(recovery).toBeDefined();
      expect(recovery?.textSnapshot).toBe('Son kurtarılan metin');
    });

    it('restores content to specific historic snapshot', () => {
      const e1 = logger.logEntry('doc-3', 'İlk versiyon', 'keystroke');
      logger.logEntry('doc-3', 'İkinci versiyon', 'keystroke');

      const restored = logger.restoreToSnapshot('doc-3', e1.id);
      expect(restored).toBe('İlk versiyon');
    });
  });

  describe('TimeTravelReplay', () => {
    it('steps forward and backward through writing history', () => {
      const entries = [
        { id: '1', docId: 'd', timestamp: 1, wordCount: 1, charCount: 3, textSnapshot: 'Bir', deltaType: 'keystroke' as const },
        { id: '2', docId: 'd', timestamp: 2, wordCount: 2, charCount: 7, textSnapshot: 'Bir iki', deltaType: 'keystroke' as const },
        { id: '3', docId: 'd', timestamp: 3, wordCount: 3, charCount: 11, textSnapshot: 'Bir iki üç', deltaType: 'keystroke' as const },
      ];

      replay.loadEntries(entries);
      expect(replay.getTotalSteps()).toBe(3);
      expect(replay.getCurrentStep()).toBe(2); // Son adımda başlar

      replay.goToStep(0);
      expect(replay.getCurrentEntry()?.textSnapshot).toBe('Bir');

      replay.nextStep();
      expect(replay.getCurrentEntry()?.textSnapshot).toBe('Bir iki');

      replay.prevStep();
      expect(replay.getCurrentEntry()?.textSnapshot).toBe('Bir');
    });

    it('computes progress percentage correctly', () => {
      const entries = [
        { id: '1', docId: 'd', timestamp: 1, wordCount: 1, charCount: 1, textSnapshot: 'A', deltaType: 'keystroke' as const },
        { id: '2', docId: 'd', timestamp: 2, wordCount: 1, charCount: 1, textSnapshot: 'B', deltaType: 'keystroke' as const },
        { id: '3', docId: 'd', timestamp: 3, wordCount: 1, charCount: 1, textSnapshot: 'C', deltaType: 'keystroke' as const },
      ];

      replay.loadEntries(entries);
      replay.goToStep(1);
      expect(replay.getProgressPercentage()).toBe(50);
    });
  });
});
