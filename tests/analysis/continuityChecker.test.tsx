import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  continuityChecker,
  CharacterProfile,
  DocumentSection,
} from '../../src/services/analysis/continuityChecker';
import { ContinuityReportModal } from '../../src/components/Analysis/ContinuityReportModal';

describe('ContinuityChecker Engine (Faz 84)', () => {
  beforeEach(() => {
    continuityChecker.clear();
  });

  const characters: CharacterProfile[] = [
    { name: 'Sherlock', aliases: ['Dedektif'] },
    { name: 'Kont Drakula', aliases: ['Kont'] },
  ];

  it('bölümler arasında göz rengi çelişkisini yakalar', () => {
    const docs: DocumentSection[] = [
      {
        docId: 'doc-1',
        docTitle: 'Bölüm 1',
        order: 1,
        content: 'Mavi gözlü dedektif Sherlock odaya girdi.',
      },
      {
        docId: 'doc-2',
        docTitle: 'Bölüm 5',
        order: 5,
        content: 'Sherlock yeşil gözleri ile şüpheliye baktı.',
      },
    ];

    const conflicts = continuityChecker.analyzeProject(characters, docs);
    expect(conflicts.length).toBe(1);
    expect(conflicts[0].characterName).toBe('Sherlock');
    expect(conflicts[0].traitKey).toBe('Göz Rengi');
    expect(conflicts[0].docA.value).toBe('mavi');
    expect(conflicts[0].docB.value).toBe('yeşil');
  });

  it('ölen karakterin sonraki bölümlerde konuşmasını (yüksek risk) tespit eder', () => {
    const docs: DocumentSection[] = [
      {
        docId: 'ch-2',
        docTitle: 'Bölüm 2',
        order: 2,
        content: 'Kont Drakula savaşta hayatını kaybetti ve cansız bedeni bulundu.',
      },
      {
        docId: 'ch-4',
        docTitle: 'Bölüm 4',
        order: 4,
        content: 'Kont sessizce fısıldadı: "Geri döneceğim."',
      },
    ];

    const conflicts = continuityChecker.analyzeProject(characters, docs);
    expect(conflicts.length).toBe(1);
    expect(conflicts[0].traitKey).toBe('Hayatta Olma Durumu');
    expect(conflicts[0].severity).toBe('high');
    expect(conflicts[0].docA.docTitle).toBe('Bölüm 2');
    expect(conflicts[0].docB.docTitle).toBe('Bölüm 4');
  });

  it('çelişki durumunu resolved veya ignored olarak günceller', () => {
    const docs: DocumentSection[] = [
      {
        docId: 'd1',
        docTitle: 'Bölüm 1',
        order: 1,
        content: 'Sherlock sarı saçlı biriydi.',
      },
      {
        docId: 'd2',
        docTitle: 'Bölüm 2',
        order: 2,
        content: 'Sherlock siyah saçlarını düzeltti.',
      },
    ];

    const conflicts = continuityChecker.analyzeProject(characters, docs);
    expect(conflicts.length).toBe(1);

    continuityChecker.setConflictStatus(conflicts[0].id, 'resolved');
    expect(continuityChecker.getConflicts()[0].status).toBe('resolved');
  });
});

describe('ContinuityReportModal Component', () => {
  const sampleConflicts = [
    {
      id: 'conf-1',
      characterName: 'Sherlock',
      traitKey: 'Göz Rengi',
      severity: 'medium' as const,
      docA: {
        docId: 'd1',
        docTitle: 'Bölüm 1',
        snippet: 'Mavi gözlü dedektif Sherlock',
        value: 'mavi',
      },
      docB: {
        docId: 'd2',
        docTitle: 'Bölüm 5',
        snippet: 'Sherlock yeşil gözleri ile baktı',
        value: 'yeşil',
      },
      description: 'Göz rengi tutarsızlığı',
      status: 'pending' as const,
    },
  ];

  it('isOpen false olduğunda render etmez', () => {
    const { container } = render(
      <ContinuityReportModal
        isOpen={false}
        conflicts={sampleConflicts}
        onClose={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('çelişkileri gösterir ve çözüldü butonuna basıldığında callback tetikler', () => {
    const onResolve = vi.fn();
    const onClose = vi.fn();

    render(
      <ContinuityReportModal
        isOpen={true}
        conflicts={sampleConflicts}
        onResolveConflict={onResolve}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Kurgu Mantık & Çelişki Avcısı')).toBeDefined();
    expect(screen.getByText('Sherlock')).toBeDefined();
    expect(screen.getByText('Göz Rengi')).toBeDefined();
    expect(screen.getByText(/Mavi gözlü dedektif Sherlock/)).toBeDefined();

    const resolveBtn = screen.getByRole('button', { name: /Çözüldü Olarak İşaretle/i });
    fireEvent.click(resolveBtn);

    expect(onResolve).toHaveBeenCalledWith('conf-1', 'resolved');
  });

  it('yoksay butonuna basıldığında callback tetikler', () => {
    const onResolve = vi.fn();

    render(
      <ContinuityReportModal
        isOpen={true}
        conflicts={sampleConflicts}
        onResolveConflict={onResolve}
        onClose={() => {}}
      />
    );

    const ignoreBtn = screen.getByRole('button', { name: /👁️ Yoksay/i });
    fireEvent.click(ignoreBtn);

    expect(onResolve).toHaveBeenCalledWith('conf-1', 'ignored');
  });
});
