/**
 * Tests for Auto-Updater & Sürüm Bütünlük Kontrolü
 * Phase 112: Otomatik Güncelleyici (Auto-Updater) ve Sürüm Bütünlük Kontrolü
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { UpdateNotificationModal } from '../../src/components/Updater/UpdateNotificationModal';

const { compareSemver, verifySha256 } = require('../../electron/updater.cjs');

describe('Phase 112: Auto-Updater & SHA-256 Verification', () => {
  it('correctly compares semantic version numbers', () => {
    expect(compareSemver('2.0.0', '2.1.0')).toBe(1); // latest is newer
    expect(compareSemver('v2.0.0', 'v2.0.0')).toBe(0); // identical
    expect(compareSemver('2.2.0', '2.1.5')).toBe(-1); // current is newer
    expect(compareSemver('2.0.1', '2.0.2')).toBe(1);
  });

  it('validates SHA-256 integrity checksum of downloaded package buffer', () => {
    const crypto = require('crypto');
    const content = 'OpenScriv v2.1.0 Setup Binary Content';
    const validHash = crypto.createHash('sha256').update(content).digest('hex');

    expect(verifySha256(content, validHash)).toBe(true);
    expect(verifySha256(content, 'tampered_or_invalid_hash')).toBe(false);
  });

  it('renders UpdateNotificationModal with version badges and release notes', () => {
    render(
      <UpdateNotificationModal
        updateInfo={{
          hasUpdate: true,
          currentVersion: '2.0.0',
          latestVersion: '2.1.0',
          releaseNotes: '• FTS5 arama motoru eklendi.',
        }}
      />
    );

    expect(screen.getByTestId('update-modal')).toBeInTheDocument();
    expect(screen.getByText(/v2.0.0 → Yeni: v2.1.0/)).toBeInTheDocument();
    expect(screen.getByText(/FTS5 arama motoru/)).toBeInTheDocument();
  });

  it('handles download flow and restart button click', async () => {
    vi.useFakeTimers();
    const onRestartMock = vi.fn();

    render(
      <UpdateNotificationModal
        updateInfo={{
          hasUpdate: true,
          currentVersion: '2.0.0',
          latestVersion: '2.1.0',
        }}
        onRestart={onRestartMock}
      />
    );

    const downloadBtn = screen.getByTestId('update-download-btn');
    fireEvent.click(downloadBtn);

    // Fast-forward timers for simulated download
    act(() => {
      vi.advanceTimersByTime(500);
    });

    const restartBtn = screen.getByTestId('update-restart-btn');
    expect(restartBtn).toBeInTheDocument();

    fireEvent.click(restartBtn);
    expect(onRestartMock).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
