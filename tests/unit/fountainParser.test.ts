import { describe, it, expect, beforeEach } from 'vitest';
import { FountainParser } from '../../src/services/screenplay/fountainParser';

describe('Fountain Parser', () => {
  let parser: FountainParser;

  beforeEach(() => {
    parser = new FountainParser();
  });

  describe('Title Page', () => {
    it('should parse title page', () => {
      const text = `Title: Big Fish
Author: John August
Source: Based on the novel by Daniel Wallace
Draft date: 1/27/2003
Contact:
	John August
	555-1234`;

      const doc = parser.parse(text);

      expect(doc.titlePage).toBeDefined();
      expect(doc.titlePage?.title).toBe('Big Fish');
      expect(doc.titlePage?.author).toBe('John August');
      expect(doc.titlePage?.source).toBe('Based on the novel by Daniel Wallace');
      expect(doc.titlePage?.draftDate).toBe('1/27/2003');
    });

    it('should handle missing title page fields', () => {
      const text = `Title: My Script

INT. OFFICE - DAY`;

      const doc = parser.parse(text);

      expect(doc.titlePage).toBeDefined();
      expect(doc.titlePage?.title).toBe('My Script');
      expect(doc.titlePage?.author).toBeUndefined();
    });
  });

  describe('Scene Headings', () => {
    it('should parse INT. scene heading', () => {
      const text = 'INT. OFFICE - DAY';
      const doc = parser.parse(text);

      expect(doc.elements).toHaveLength(1);
      expect(doc.elements[0].type).toBe('scene_heading');
      expect(doc.elements[0].text).toBe('INT. OFFICE - DAY');
    });

    it('should parse EXT. scene heading', () => {
      const text = 'EXT. PARK - NIGHT';
      const doc = parser.parse(text);

      expect(doc.elements[0].type).toBe('scene_heading');
      expect(doc.elements[0].text).toBe('EXT. PARK - NIGHT');
    });

    it('should parse scene heading with scene number', () => {
      const text = 'INT. OFFICE - DAY #5#';
      const doc = parser.parse(text);

      expect(doc.elements[0].type).toBe('scene_heading');
      expect(doc.elements[0].sceneNumber).toBe('5');
    });

    it('should parse INT./EXT. scene heading', () => {
      const text = 'INT./EXT. CAR - DAY';
      const doc = parser.parse(text);

      expect(doc.elements[0].type).toBe('scene_heading');
    });
  });

  describe('Character and Dialogue', () => {
    it('should parse character name', () => {
      const text = `INT. OFFICE - DAY

JOHN
Hello there.`;

      const doc = parser.parse(text);

      const characterElement = doc.elements.find((e) => e.type === 'character');
      expect(characterElement).toBeDefined();
      expect(characterElement?.text).toBe('JOHN');
      expect(characterElement?.characterName).toBe('JOHN');
    });

    it('should parse character with extension', () => {
      const text = `JOHN (V.O.)
This is voice over.`;

      const doc = parser.parse(text);
      const characterElement = doc.elements.find((e) => e.type === 'character');

      expect(characterElement?.characterName).toBe('JOHN');
    });

    it('should parse parenthetical', () => {
      const text = `(whispering)`;
      const doc = parser.parse(text);

      expect(doc.elements[0].type).toBe('parenthetical');
      expect(doc.elements[0].text).toBe('(whispering)');
    });
  });

  describe('Transitions', () => {
    it('should parse FADE IN:', () => {
      const text = 'FADE IN:';
      const doc = parser.parse(text);

      expect(doc.elements[0].type).toBe('transition');
      expect(doc.elements[0].text).toBe('FADE IN:');
    });

    it('should parse CUT TO:', () => {
      const text = 'CUT TO:';
      const doc = parser.parse(text);

      expect(doc.elements[0].type).toBe('transition');
    });

    it('should parse FADE OUT.', () => {
      const text = 'FADE OUT.';
      const doc = parser.parse(text);

      expect(doc.elements[0].type).toBe('transition');
    });
  });

  describe('Sections and Synopsis', () => {
    it('should parse section header', () => {
      const text = '# Act One';
      const doc = parser.parse(text);

      expect(doc.elements[0].type).toBe('section');
      expect(doc.elements[0].text).toBe('Act One');
      expect(doc.elements[0].sectionLevel).toBe(1);
    });

    it('should parse nested section headers', () => {
      const text = '## Scene 1';
      const doc = parser.parse(text);

      expect(doc.elements[0].type).toBe('section');
      expect(doc.elements[0].sectionLevel).toBe(2);
    });

    it('should parse synopsis', () => {
      const text = '= John meets Mary for the first time.';
      const doc = parser.parse(text);

      expect(doc.elements[0].type).toBe('synopsis');
      expect(doc.elements[0].text).toBe('John meets Mary for the first time.');
    });
  });

  describe('Notes', () => {
    it('should parse note', () => {
      const text = '[[This is a note]]';
      const doc = parser.parse(text);

      expect(doc.elements[0].type).toBe('note');
      expect(doc.elements[0].text).toBe('This is a note');
    });
  });

  describe('Page Breaks', () => {
    it('should parse page break', () => {
      const text = '===';
      const doc = parser.parse(text);

      expect(doc.elements[0].type).toBe('page_break');
    });

    it('should not parse lines starting with === as page break', () => {
      const text = '===some text';
      const doc = parser.parse(text);

      // Should be parsed as action, not page_break
      expect(doc.elements[0].type).toBe('action');
    });
  });

  describe('Emphasis', () => {
    it('should parse italic text', () => {
      const text = '*italic text*';
      const doc = parser.parse(text);

      expect(doc.elements[0].emphasis).toBe('italic');
      expect(doc.elements[0].text).toBe('italic text');
    });

    it('should parse bold text', () => {
      const text = '**bold text**';
      const doc = parser.parse(text);

      expect(doc.elements[0].emphasis).toBe('bold');
      expect(doc.elements[0].text).toBe('bold text');
    });

    it('should parse bold italic text', () => {
      const text = '***bold italic text***';
      const doc = parser.parse(text);

      expect(doc.elements[0].emphasis).toBe('bold_italic');
      expect(doc.elements[0].text).toBe('bold italic text');
    });
  });

  describe('Lyrics', () => {
    it('should parse lyrics', () => {
      const text = '~Wishing only wounds the heart';
      const doc = parser.parse(text);

      expect(doc.elements[0].type).toBe('lyric');
      expect(doc.elements[0].text).toBe('Wishing only wounds the heart');
    });
  });

  describe('Complete Screenplay', () => {
    it('should parse complete screenplay', () => {
      const text = `Title: The Matrix
Author: Wachowski Brothers

FADE IN:

INT. OFFICE - DAY

THOMAS ANDERSON sits at his desk.

THOMAS
(quietly)
What is the Matrix?

CUT TO:

EXT. CITY STREET - NIGHT

Neo runs through the streets.

FADE OUT.`;

      const doc = parser.parse(text);

      expect(doc.titlePage).toBeDefined();
      expect(doc.titlePage?.title).toBe('The Matrix');
      expect(doc.elements.length).toBeGreaterThan(0);

      const sceneHeadings = doc.elements.filter((e) => e.type === 'scene_heading');
      expect(sceneHeadings.length).toBe(2);

      const characters = doc.elements.filter((e) => e.type === 'character');
      expect(characters.length).toBe(1); // Only THOMAS is a character

      const transitions = doc.elements.filter((e) => e.type === 'transition');
      expect(transitions.length).toBe(3); // FADE IN:, CUT TO:, FADE OUT.
    });
  });

  describe('Metadata', () => {
    it('should calculate word count', () => {
      const text = `INT. OFFICE - DAY

JOHN
Hello world.`;

      const doc = parser.parse(text);

      expect(doc.metadata?.wordCount).toBeGreaterThan(0);
    });

    it('should include version and timestamp', () => {
      const text = 'INT. OFFICE - DAY';
      const doc = parser.parse(text);

      expect(doc.metadata?.version).toBe('1.0');
      expect(doc.metadata?.lastModified).toBeDefined();
    });
  });

  describe('Validation', () => {
    it('should validate document with scene headings', () => {
      const text = `INT. OFFICE - DAY

Action line.

EXT. PARK - NIGHT

More action.`;

      const result = parser.validate(text);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn about missing scene headings', () => {
      const text = `This is just a bunch of text without any scene headings.
It goes on for many lines.
And more lines.
And even more lines.
This should trigger a warning.
Because it has more than five lines.
And no scene headings at all.
Just plain text.`;

      const result = parser.validate(text);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty text', () => {
      const doc = parser.parse('');

      expect(doc.elements).toHaveLength(0);
    });

    it('should handle whitespace only', () => {
      const doc = parser.parse('   \n\n   ');

      expect(doc.elements).toHaveLength(0);
    });

    it('should handle special characters', () => {
      const text = 'INT. CAFÉ - DAY';
      const doc = parser.parse(text);

      expect(doc.elements[0].type).toBe('scene_heading');
    });
  });
});
