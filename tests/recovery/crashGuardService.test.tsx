/**
 * Tests for CrashGuard & Project Recovery Service
 * Phase 113: Çökme Koruması ve Otomatik Proje Kurtarma (CrashGuard & Recovery)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CrashGuardService } from '../../src/services/recovery/crashGuardService';
import { ProjectRecoveryModal } from '../../src/components/Recovery/ProjectRecoveryModal';

describe('Phase 113: CrashGuard & Recovery Service', () => {
  beforeEach(() => {
    localStorage.clear();
    CrashGuardService.clearJournal();
  });

  it('logs document changes to rolling crash journal', () => {
    CrashGuardService.logChange('doc_1', 'Bölüm 1: Kurtarılmış Satır', 'Giriş Bölümü');

    const status = CrashGuardService.checkRecoveryStatus();
    expect(status.hasCrash).toBe(true);
    expect(status.uncommittedDocs).toHaveLength(1);
    expect(status.uncommittedDocs[0].content).toBe('Bölüm 1: Kurtarılmış Satır');
    expect(status.uncommittedDocs[0].title).toBe('Giriş Bölümü');
  });

  it('restores all uncommitted documents and clears journal', () => {
    CrashGuardService.logChange('doc_a', 'Paragraf A', 'Bölüm A');
    CrashGuardService.logChange('doc_b', 'Paragraf B', 'Bölüm B');

    const restoredDocs: Record<string, string> = {};
    const result = CrashGuardService.applyRecovery((id, content) => {
      restoredDocs[id] = content;
    });

    expect(result.restoredCount).toBe(2);
    expect(restoredDocs.doc_a).toBe('Paragraf A');
    expect(restoredDocs.doc_b).toBe('Paragraf B');

    // Journal should be cleared after recovery
    const statusAfter = CrashGuardService.checkRecoveryStatus();
    expect(statusAfter.hasCrash).toBe(false);
  });

  it('renders ProjectRecoveryModal and lists recoverable documents', () => {
    const testEntries = [
      { docId: 'ch1', title: 'Bölüm 1', content: 'Metin 1', timestamp: Date.now(), checksum: 'c1' },
      { docId: 'ch2', title: 'Bölüm 2', content: 'Metin 2', timestamp: Date.now(), checksum: 'c2' },
    ];

    render(<ProjectRecoveryModal entries={testEntries} />);

    expect(screen.getByTestId('project-recovery-modal')).toBeInTheDocument();
    expect(screen.getByText(/Kurtarılabilir Otomatik Kayıtlar Bulundu/)).toBeInTheDocument();
    expect(screen.getByTestId('recovery-item-ch1')).toBeInTheDocument();
    expect(screen.getByTestId('recovery-item-ch2')).toBeInTheDocument();
  });

  it('triggers onRecovered when restore button clicked', () => {
    const onRecoveredMock = vi.fn();
    render(<ProjectRecoveryModal entries={[]} onRecovered={onRecoveredMock} />);

    const restoreBtn = screen.getByTestId('recovery-restore-btn');
    fireEvent.click(restoreBtn);

    expect(onRecoveredMock).toHaveBeenCalledTimes(1);
  });

  it('triggers onDismiss when dismiss button clicked', () => {
    const onDismissMock = vi.fn();
    render(<ProjectRecoveryModal entries={[]} onDismiss={onDismissMock} />);

    const dismissBtn = screen.getByTestId('recovery-dismiss-btn');
    fireEvent.click(dismissBtn);

    expect(onDismissMock).toHaveBeenCalledTimes(1);
  });
});
