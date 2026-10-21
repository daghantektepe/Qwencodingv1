import { describe, it, expect, beforeEach } from 'vitest';
import { FountainParser } from '../../src/services/screenplay/fountainParser';
import {
  getNextElementTypeOnEnter,
  getNextElementTypeOnTab,
  calculateScreenplayDuration,
  applySceneNumbers,
  extractCharacterList,
} from '../../src/services/screenplay/screenplayFormatter';
import { ScreenplayElement } from '../../src/types/screenplay';

describe('Phase 53: Screenplay Industry Standard Formatter Suite', () => {
  let parser: FountainParser;

  beforeEach(() => {
    parser = new FountainParser();
  });

  describe('Keyboard Tab & Enter State Machine Transitions', () => {
    it('advances to correct element type on Enter press', () => {
      expect(getNextElementTypeOnEnter('scene_heading', 'INT. LABORATORY - NIGHT')).toBe('action');
      expect(getNextElementTypeOnEnter('action', 'The scientist adjusts the dials.')).toBe('action');
      expect(getNextElementTypeOnEnter('character', 'DR. ARIS (V.O.)')).toBe('dialogue');
      expect(getNextElementTypeOnEnter('parenthetical', '(whispering)')).toBe('dialogue');
      expect(getNextElementTypeOnEnter('dialogue', 'It is working...')).toBe('action');
      expect(getNextElementTypeOnEnter('transition', 'FADE OUT.')).toBe('scene_heading');

      // Empty character switches back to action
      expect(getNextElementTypeOnEnter('character', '   ')).toBe('action');
    });

    it('advances to character or parenthetical on Tab press', () => {
      expect(getNextElementTypeOnTab('action')).toBe('character');
      expect(getNextElementTypeOnTab('character')).toBe('parenthetical');
      expect(getNextElementTypeOnTab('dialogue')).toBe('parenthetical');
    });
  });

  describe('1-Minute-Per-Page Duration & Statistics Estimation', () => {
    it('estimates duration, page count, scene count, and characters', () => {
      const elements: ScreenplayElement[] = [
        { type: 'scene_heading', text: 'EXT. DESERT HIGHWAY - DAY' },
        { type: 'action', text: 'A rusty sedan speeds down the cracked asphalt under a scorching sun.' },
        { type: 'character', text: 'JACK' },
        { type: 'dialogue', text: 'We need to make it to the border before dusk.' },
        { type: 'character', text: 'SARA (O.S.)' },
        { type: 'parenthetical', text: '(checking the fuel gauge)' },
        { type: 'dialogue', text: 'The tank is already half empty.' },
        { type: 'scene_heading', text: 'INT. SEDAN - CONTINUOUS' },
        { type: 'action', text: 'Sara taps the glass needle.' },
      ];

      const stats = calculateScreenplayDuration(elements);

      expect(stats.sceneCount).toBe(2);
      expect(stats.speakingCharactersCount).toBe(2);
      expect(stats.estimatedPages).toBeGreaterThanOrEqual(1);
      expect(stats.estimatedMinutes).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Scene Numbering & Character Extraction', () => {
    it('assigns sequential scene numbers to scene headings', () => {
      const elements: ScreenplayElement[] = [
        { type: 'scene_heading', text: 'INT. COFFEE SHOP - MORNING' },
        { type: 'action', text: 'Steam rises.' },
        { type: 'scene_heading', text: 'EXT. STREET - CONTINUOUS' },
      ];

      const numbered = applySceneNumbers(elements);

      expect(numbered[0].sceneNumber).toBe('1');
      expect(numbered[2].sceneNumber).toBe('2');
      expect(numbered[1].sceneNumber).toBeUndefined();
    });

    it('extracts unique character names stripped of extensions', () => {
      const elements: ScreenplayElement[] = [
        { type: 'character', text: 'MARIA' },
        { type: 'dialogue', text: 'Hello.' },
        { type: 'character', text: 'MARIA (O.S.)' },
        { type: 'dialogue', text: 'Are you there?' },
        { type: 'character', text: 'ALEX (V.O.)' },
        { type: 'dialogue', text: 'Yes.' },
      ];

      const characters = extractCharacterList(elements);
      expect(characters).toEqual(['ALEX', 'MARIA']);
    });
  });

  describe('Fountain Parsing Integration', () => {
    it('parses formatted Fountain screenplay text accurately', () => {
      const script = `
INT. LIBRARY - NIGHT

The ancient clock chimes midnight.

PROFESSOR
(urgent)
The books must not fall into their hands!
`;

      const doc = parser.parse(script);
      expect(doc.elements.length).toBeGreaterThanOrEqual(4);

      const heading = doc.elements.find((el) => el.type === 'scene_heading');
      expect(heading?.text).toBe('INT. LIBRARY - NIGHT');

      const char = doc.elements.find((el) => el.type === 'character');
      expect(char?.text).toBe('PROFESSOR');
    });
  });
});
