import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DocumentDiffViewer from '../../src/components/Diff/DocumentDiffViewer';

describe('DocumentDiffViewer Component', () => {
  const sampleOld = 'Birinci paragraf.\n\nEski ikinci paragraf burada.\n\nÜçüncü paragraf.';
  const sampleNew = 'Birinci paragraf.\n\nYeni güncellenmiş ikinci paragraf burada.\n\nÜçüncü paragraf.\n\nDördüncü yeni paragraf.';

  const mockSnapshots = [
    { timestamp: 1700000000000, title: 'Snapshot 1 - Giriş', note: 'İlk taslak' },
    { timestamp: 1700000050000, title: 'Snapshot 2 - Revizyon', note: 'Düzenlendi' },
  ];

  it('renders diff viewer, toolbar and statistics', () => {
    render(
      <DocumentDiffViewer
        oldText={sampleOld}
        newText={sampleNew}
        documentTitle="Bölüm 1"
        snapshots={mockSnapshots}
        selectedSnapshotTimestamp={1700000000000}
      />
    );

    expect(screen.getByTestId('document-diff-viewer')).toBeInTheDocument();
    expect(screen.getByText(/Versiyon Karşılaştır:/i)).toBeInTheDocument();
    expect(screen.getByText(/\(Bölüm 1\)/i)).toBeInTheDocument();

    // Stats should be displayed
    expect(screen.getByTestId('diff-stat-added')).toBeInTheDocument();
    expect(screen.getByTestId('diff-stat-deleted')).toBeInTheDocument();
    expect(screen.getByTestId('diff-stat-similarity')).toBeInTheDocument();
  });

  it('shows identical state message when texts are the same', () => {
    render(
      <DocumentDiffViewer
        oldText="Birebir aynı metin."
        newText="Birebir aynı metin."
        documentTitle="Bölüm 1"
      />
    );

    expect(screen.getByText(/İki versiyon tamamen aynı/i)).toBeInTheDocument();
  });

  it('toggles between inline and split diff views', () => {
    render(
      <DocumentDiffViewer
        oldText={sampleOld}
        newText={sampleNew}
        documentTitle="Bölüm 1"
      />
    );

    // Starts in inline view
    expect(screen.getByTestId('inline-diff-view')).toBeInTheDocument();

    // Click Yan Yana (split)
    const splitBtn = screen.getByRole('button', { name: /Yan Yana/i });
    fireEvent.click(splitBtn);

    expect(screen.getByTestId('split-diff-view')).toBeInTheDocument();
    expect(screen.getByText(/Eski Versiyon \(Snapshot\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Mevcut Taslak \(Güncel\)/i)).toBeInTheDocument();

    // Click back to Satır İçi
    const inlineBtn = screen.getByRole('button', { name: /Satır İçi/i });
    fireEvent.click(inlineBtn);

    expect(screen.getByTestId('inline-diff-view')).toBeInTheDocument();
  });

  it('renders deleted and inserted words with tags in inline view', () => {
    render(
      <DocumentDiffViewer
        oldText="Kırmızı elma"
        newText="Yeşil elma"
        documentTitle="Bölüm 1"
      />
    );

    // Should find <del> containing Kırmızı and <ins> containing Yeşil
    const delTag = screen.getByText('Kırmızı');
    expect(delTag.tagName.toLowerCase()).toBe('del');

    const insTag = screen.getByText('Yeşil');
    expect(insTag.tagName.toLowerCase()).toBe('ins');
  });

  it('calls onRollbackParagraph when selective rollback is clicked', () => {
    const onRollbackParagraph = vi.fn();

    render(
      <DocumentDiffViewer
        oldText={sampleOld}
        newText={sampleNew}
        documentTitle="Bölüm 1"
        onRollbackParagraph={onRollbackParagraph}
      />
    );

    // Find rollback buttons
    const rollbackButtons = screen.getAllByTitle(/Bu paragrafı eski versiyona geri döndür/i);
    expect(rollbackButtons.length).toBeGreaterThan(0);

    fireEvent.click(rollbackButtons[0]);
    expect(onRollbackParagraph).toHaveBeenCalledTimes(1);
    // Callback should receive the reconstructed full text and diff id
    expect(typeof onRollbackParagraph.mock.calls[0][0]).toBe('string');
    expect(typeof onRollbackParagraph.mock.calls[0][1]).toBe('string');
  });

  it('calls onFullRollback when full rollback button is clicked', () => {
    const onFullRollback = vi.fn();

    render(
      <DocumentDiffViewer
        oldText={sampleOld}
        newText={sampleNew}
        snapshots={mockSnapshots}
        selectedSnapshotTimestamp={1700000000000}
        onFullRollback={onFullRollback}
      />
    );

    const fullRollbackBtn = screen.getByRole('button', { name: /Tümünü Geri Al/i });
    fireEvent.click(fullRollbackBtn);

    expect(onFullRollback).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();

    render(
      <DocumentDiffViewer
        oldText={sampleOld}
        newText={sampleNew}
        onClose={onClose}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /Kapat/i });
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onSelectSnapshot when snapshot selection changes', () => {
    const onSelectSnapshot = vi.fn();

    render(
      <DocumentDiffViewer
        oldText={sampleOld}
        newText={sampleNew}
        snapshots={mockSnapshots}
        selectedSnapshotTimestamp={1700000000000}
        onSelectSnapshot={onSelectSnapshot}
      />
    );

    const select = screen.getByLabelText(/Hedef Sürüm:/i);
    fireEvent.change(select, { target: { value: '1700000050000' } });

    expect(onSelectSnapshot).toHaveBeenCalledWith(1700000050000);
  });
});
