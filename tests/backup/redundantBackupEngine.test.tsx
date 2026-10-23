import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  backupEngine,
  useBackupStore
} from '../../src/services/backup/redundantBackupEngine';
import { BackupHistoryManager } from '../../src/components/Backup/BackupHistoryManager';

describe('Phase 93: Multi-Target Redundant Backup Engine', () => {
  const sampleProjectData = {
    documents: [
      { id: 'doc-1', title: 'Bölüm 1', content: 'Karanlık ormanda bir ışık parıldadı.' },
      { id: 'doc-2', title: 'Bölüm 2', content: 'Yol ayrımına vardılar.' }
    ],
    metadata: { author: 'Daghan', title: 'Eldoria Günlükleri' }
  };

  beforeEach(() => {
    backupEngine.clearAllBackups();
    backupEngine.updateConfig({
      enabled: true,
      secondaryPath: '~/OpenScrivBackups',
      externalDriveAutoBackup: true,
      retentionDays: 30,
      maxBackupsCount: 50
    });
  });

  describe('RedundantBackupEngine Core Logic', () => {
    it('should create backup with accurate word counts and checksum', () => {
      const backup = backupEngine.createBackup('Eldoria', sampleProjectData, 'manual');

      expect(backup.id).toBeDefined();
      expect(backup.filename).toContain('eldoria_backup');
      expect(backup.documentCount).toBe(2);
      expect(backup.wordCountTotal).toBe(8); // 5 + 3 = 8 words
      expect(backup.checksum).toBeDefined();
      expect(backupEngine.getSnapshot().backups.length).toBe(1);
    });

    it('should restore backup and verify integrity', () => {
      const backup = backupEngine.createBackup('Eldoria', sampleProjectData, 'daily');
      const restoreResult = backupEngine.restoreBackup(backup.id);

      expect(restoreResult.success).toBe(true);
      expect(restoreResult.data.metadata.author).toBe('Daghan');
      expect(restoreResult.data.documents.length).toBe(2);
    });

    it('should trigger external USB backup when drive is detected', () => {
      const usbEntry = backupEngine.detectExternalDrive(
        ['E:\\BackupDrive', 'F:\\Drive'],
        'Eldoria',
        sampleProjectData
      );

      expect(usbEntry).not.toBeNull();
      expect(usbEntry?.type).toBe('external_usb');
      expect(usbEntry?.targetPath).toBe('E:\\BackupDrive');
    });

    it('should prune old backups exceeding max count', () => {
      backupEngine.updateConfig({ maxBackupsCount: 3 });

      backupEngine.createBackup('P1', sampleProjectData);
      backupEngine.createBackup('P2', sampleProjectData);
      backupEngine.createBackup('P3', sampleProjectData);
      backupEngine.createBackup('P4', sampleProjectData);

      expect(backupEngine.getSnapshot().backups.length).toBe(3);
    });
  });

  describe('BackupHistoryManager UI Component', () => {
    it('should render manager and trigger manual backup', () => {
      render(
        <BackupHistoryManager
          projectName="Eldoria"
          getCurrentProjectData={() => sampleProjectData}
        />
      );

      expect(screen.getByText('Yedekleme ve Versiyon Arşivi Yöneticisi')).toBeDefined();
      expect(screen.getByText('Şimdi Manuel Yedek Al')).toBeDefined();

      // Trigger manual backup
      const manualBtn = screen.getByText('Şimdi Manuel Yedek Al');
      fireEvent.click(manualBtn);

      expect(backupEngine.getSnapshot().backups.length).toBe(1);
      expect(screen.getByText(/Başarıyla yeni yedek oluşturuldu/i)).toBeDefined();
    });

    it('should open restore confirmation dialog and trigger onRestoreProject', () => {
      const onRestore = vi.fn();
      backupEngine.createBackup('Eldoria', sampleProjectData, 'auto');

      render(
        <BackupHistoryManager
          projectName="Eldoria"
          getCurrentProjectData={() => sampleProjectData}
          onRestoreProject={onRestore}
        />
      );

      const restoreBtn = screen.getByText('Geri Yükle');
      fireEvent.click(restoreBtn);

      expect(screen.getByText('Yedekten Geri Yükleme Onayı')).toBeDefined();

      const confirmBtn = screen.getByText('Evet, Yedeği Geri Yükle');
      fireEvent.click(confirmBtn);

      expect(onRestore).toHaveBeenCalled();
      expect(screen.getByText(/başarıyla geri yüklendi/i)).toBeDefined();
    });
  });
});
