import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  characterArcTracker,
  PresenceMatrixResult,
} from '../../src/services/analysis/characterArcTracker';
import { CharacterPresenceMatrix } from '../../src/components/Analysis/CharacterPresenceMatrix';

describe('CharacterArcTracker Service (Faz 87)', () => {
  const characters = [
    { name: 'Sherlock', aliases: ['Dedektif'], role: 'protagonist' as const },
    { name: 'Watson', aliases: ['Doktor'], role: 'supporting' as const },
    { name: 'Moriarty', aliases: ['Profesör'], role: 'minor' as const },
  ];

  const scenes = [
    {
      id: 'sc-1',
      title: 'Bölüm 1: Tanışma',
      order: 1,
      content: 'Sherlock ve Watson Baker Street evinde oturdular. "Merhaba" dedi Sherlock.',
    },
    {
      id: 'sc-2',
      title: 'Bölüm 2: İpuçları',
      order: 2,
      content: 'Watson tek başına polis merkezine gitti.',
    },
    {
      id: 'sc-3',
      title: 'Bölüm 3: Takip',
      order: 3,
      content: 'Watson limana doğru ilerledi.',
    },
    {
      id: 'sc-4',
      title: 'Bölüm 4: Karanlık Yol',
      order: 4,
      content: 'Watson gölgeleri izledi.',
    },
    {
      id: 'sc-5',
      title: 'Bölüm 5: Yüzleşme',
      order: 5,
      content: 'Sherlock aniden belirdi. Moriarty ile karşılaştı.',
    },
  ];

  it('karakterlerin bölümlerdeki bahsetme sayılarını ve varlık yüzdesini hesaplar', () => {
    const result = characterArcTracker.analyzePresence(characters, scenes);

    expect(result.characters.length).toBe(3);
    const sherlock = result.characters.find((c) => c.characterName === 'Sherlock');
    expect(sherlock).toBeDefined();
    // Sherlock Bölüm 1 ve Bölüm 5'te var (2 sahne / 5 sahne = %40)
    expect(sherlock?.totalScenesPresent).toBe(2);
    expect(sherlock?.presencePercentage).toBe(40);

    const watson = result.characters.find((c) => c.characterName === 'Watson');
    // Watson Bölüm 1, 2, 3, 4'te var (4 sahne / 5 = %80)
    expect(watson?.totalScenesPresent).toBe(4);
    expect(watson?.presencePercentage).toBe(80);
  });

  it('ana karakter 3 veya daha fazla sahne art arda yoksa unutulma uyarısı üretir', () => {
    const result = characterArcTracker.analyzePresence(characters, scenes);
    const sherlock = result.characters.find((c) => c.characterName === 'Sherlock');

    // Sherlock Bölüm 1'den sonra Bölüm 2, 3, 4'te (3 sahne art arda) yoktu!
    expect(sherlock?.forgottenWarning).toBeDefined();
    expect(sherlock?.forgottenWarning?.missingScenesCount).toBe(3);
    expect(sherlock?.forgottenWarning?.warning).toContain('art arda 3 sahne boyunca hiç görünmedi');
  });

  it('karakterlerin birlikte sahne alma (co-occurrence) sayısını hesaplar', () => {
    const result = characterArcTracker.analyzePresence(characters, scenes);
    // Sherlock ve Watson Bölüm 1'de birlikte yer alıyor
    const swPair = result.coOccurrences.find(
      (pair) =>
        (pair.charA === 'Sherlock' && pair.charB === 'Watson') ||
        (pair.charA === 'Watson' && pair.charB === 'Sherlock')
    );
    expect(swPair).toBeDefined();
    expect(swPair?.sharedScenesCount).toBe(1);
  });

  it('anlatı gelişim evrelerini doğru tespit eder', () => {
    expect(characterArcTracker.getArcStage(0, 10)).toBe('introduction');
    expect(characterArcTracker.getArcStage(6, 10)).toBe('crisis');
    expect(characterArcTracker.getArcStage(9, 10)).toBe('resolution');
  });
});

describe('CharacterPresenceMatrix Component', () => {
  const mockResult: PresenceMatrixResult = {
    characters: [
      {
        characterName: 'Sherlock',
        role: 'protagonist',
        totalMentions: 3,
        totalScenesPresent: 2,
        presencePercentage: 67,
        scenes: [
          {
            sceneId: 's1',
            sceneTitle: 'Sahne 1',
            order: 1,
            mentionCount: 2,
            dialogueWordCount: 10,
            presenceScore: 50,
            arcStage: 'introduction',
          },
          {
            sceneId: 's2',
            sceneTitle: 'Sahne 2',
            order: 2,
            mentionCount: 0,
            dialogueWordCount: 0,
            presenceScore: 0,
            arcStage: 'crisis',
          },
        ],
        forgottenWarning: {
          lastSeenSceneTitle: 'Sahne 1',
          missingScenesCount: 3,
          warning: 'Sherlock 3 sahnedir görünmedi.',
        },
      },
    ],
    allScenes: [
      { id: 's1', title: 'Sahne 1', order: 1, totalWords: 100 },
      { id: 's2', title: 'Sahne 2', order: 2, totalWords: 150 },
    ],
    coOccurrences: [],
  };

  it('matris tablosunu ve uyarı kutusunu render eder', () => {
    const onSelectScene = vi.fn();
    const onSelectChar = vi.fn();

    render(
      <CharacterPresenceMatrix
        result={mockResult}
        onSelectScene={onSelectScene}
        onSelectCharacter={onSelectChar}
      />
    );

    expect(screen.getByText('Karakter Varlık Matrisi ve Sahne Çizelgesi')).toBeDefined();
    expect(screen.getByText('Sherlock')).toBeDefined();
    expect(screen.getByText('Sahne 1')).toBeDefined();
    expect(screen.getByText('Sahne 2')).toBeDefined();

    // Uyarı kutusu
    expect(screen.getByTestId('forgotten-warnings-container')).toBeDefined();
    expect(screen.getByText(/Sherlock 3 sahnedir görünmedi/)).toBeDefined();

    // Sahneye tıklama
    const sceneTh = screen.getByText('Sahne 1');
    fireEvent.click(sceneTh);
    expect(onSelectScene).toHaveBeenCalledWith('s1');
  });
});
