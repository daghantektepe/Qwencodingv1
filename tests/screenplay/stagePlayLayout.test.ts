import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  parseDramaScript,
  analyzeCharacterLines,
  generateCharacterSceneMatrix,
} from '../../src/services/screenplay/stagePlayLayout';
import CharacterSceneMatrix from '../../src/components/Screenplay/CharacterSceneMatrix';

describe('Phase 54: Stage Play & BBC Radio Drama Layout Suite', () => {
  const samplePlay = `
PERDE 1

SAHNE 1

(Karanlık bir oda. Masanın üzerinde eski bir gaz lambası yanmaktadır.)

FX: UZAKTAN KÖPEK HAVLAMASI DUYULUR

MURAT: Kim var orada? Gecenin bu vaktinde kapıyı kim çalar?

SELİM: Benim Murat, aç kapıyı! Acele etmemiz gerek.

MURAT:
(kapıyı açarak)
Ne oldu Selim? Neden bu kadar soluk soluğasın?

SAHNE 2

SELİM: Şehirdeki muhafızlar kütüphaneyi kuşattı. Tüm parşömenleri yakıyorlar.
`;

  describe('Drama Script Parser', () => {
    it('parses acts, scenes, sound FX, stage directions, and dialogues', () => {
      const elements = parseDramaScript(samplePlay);

      const actEl = elements.find((e) => e.type === 'act');
      expect(actEl).toBeDefined();
      expect(actEl?.actNumber).toBe(1);

      const sceneEls = elements.filter((e) => e.type === 'scene');
      expect(sceneEls.length).toBe(2);

      const soundEl = elements.find((e) => e.type === 'sound_fx');
      expect(soundEl).toBeDefined();
      expect(soundEl?.text).toContain('FX: UZAKTAN KÖPEK HAVLAMASI DUYULUR');

      const stageDirEl = elements.find((e) => e.type === 'stage_direction');
      expect(stageDirEl).toBeDefined();
      expect(stageDirEl?.text).toContain('Karanlık bir oda');

      const characters = elements.filter((e) => e.type === 'character').map((e) => e.text);
      expect(characters).toContain('MURAT');
      expect(characters).toContain('SELİM');
    });
  });

  describe('Character Dialogue Analysis', () => {
    it('calculates line and word count per character', () => {
      const stats = analyzeCharacterLines(samplePlay);

      expect(stats.length).toBe(2);
      const murat = stats.find((s) => s.character === 'MURAT');
      const selim = stats.find((s) => s.character === 'SELİM');

      expect(murat).toBeDefined();
      expect(selim).toBeDefined();

      expect(murat?.lineCount).toBeGreaterThanOrEqual(2);
      expect(murat?.wordCount).toBeGreaterThan(10);
      expect(murat?.scenesPresent).toContain(1);

      expect(selim?.scenesPresent).toContain(1);
      expect(selim?.scenesPresent).toContain(2);
    });
  });

  describe('Character-Scene Matrix Generation', () => {
    it('generates 2D matrix mapping characters to scenes', () => {
      const matrix = generateCharacterSceneMatrix(samplePlay);

      expect(matrix.characters).toContain('MURAT');
      expect(matrix.characters).toContain('SELİM');
      expect(matrix.scenes.length).toBe(2);

      // Scene 1 has both Murat and Selim
      const s1 = matrix.scenes.find((s) => s.sceneNumber === 1);
      expect(s1?.charactersPresent).toContain('MURAT');
      expect(s1?.charactersPresent).toContain('SELİM');

      // Scene 2 has Selim only
      const s2 = matrix.scenes.find((s) => s.sceneNumber === 2);
      expect(s2?.charactersPresent).toContain('SELİM');
      expect(s2?.charactersPresent).not.toContain('MURAT');
    });
  });

  describe('CharacterSceneMatrix UI Component', () => {
    it('renders the interactive matrix table and filters characters', () => {
      render(React.createElement(CharacterSceneMatrix, { scriptText: samplePlay }));

      expect(screen.getByText(/Karakter-Sahne Varlık Çizelgesi/i)).toBeDefined();
      expect(screen.getAllByText('MURAT').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('SELİM').length).toBeGreaterThanOrEqual(1);

      const searchInput = screen.getByPlaceholderText(/Karakter Ara/i);
      fireEvent.change(searchInput, { target: { value: 'Murat' } });

      expect(screen.queryByText('MURAT')).not.toBeNull();
      expect(screen.queryByText('SELİM')).toBeNull();
    });
  });
});
