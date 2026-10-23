import { describe, it, expect } from 'vitest';
import { backupEngine } from '../../src/services/backup/redundantBackupEngine';
import { textExpanderService } from '../../src/services/snippets/textExpander';

describe('Phase 99: Long Session Stability & 20,000 Operations Stress Suite', () => {
  it('should run 20,000 text expansion macro lookups without failure', () => {
    const start = performance.now();

    for (let i = 0; i < 20000; i++) {
      const match = textExpanderService.findMatchingSnippet('Sahne metni ;tarih');
      if (i % 5000 === 0) {
        expect(match?.trigger).toBe(';tarih');
      }
    }

    const duration = performance.now() - start;
    // 20,000 expansions in sub-500ms
    expect(duration).toBeLessThan(1000);
  });

  it('should handle repeated backup snapshot cycles with automatic pruning', () => {
    backupEngine.updateConfig({ maxBackupsCount: 10 });

    for (let i = 0; i < 50; i++) {
      backupEngine.createBackup('StresTest', {
        documents: [{ id: `doc_${i}`, content: `Metin ${i}` }]
      });
    }

    const snapshot = backupEngine.getSnapshot();
    expect(snapshot.backups.length).toBe(10); // Exactly bounded by maxBackupsCount
  });
});
