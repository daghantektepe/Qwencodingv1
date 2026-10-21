import {
  ScreenplayDocument,
  ScreenplayElement,
  TitlePage,
  FountainParseOptions,
  SCENE_HEADING_PREFIXES,
  TRANSITION_KEYWORDS,
} from '../../types/screenplay';

/**
 * Fountain Parser Service
 * Parses Fountain format text into structured screenplay document
 */

export class FountainParser {
  private options: FountainParseOptions;

  constructor(options: FountainParseOptions = {}) {
    this.options = {
      preserveEmptyLines: false,
      strictMode: false,
      ...options,
    };
  }

  /**
   * Parse Fountain text into ScreenplayDocument
   */
  parse(text: string): ScreenplayDocument {
    const lines = text.split(/\r?\n/);
    const elements: ScreenplayElement[] = [];
    let titlePage: TitlePage | undefined;
    let currentLine = 0;

    // Check if document starts with title page
    if (this.isTitlePage(lines)) {
      const titlePageResult = this.parseTitlePage(lines);
      titlePage = titlePageResult.titlePage;
      currentLine = titlePageResult.endLine;
    }

    // Parse remaining content
    while (currentLine < lines.length) {
      const line = lines[currentLine];
      const element = this.parseLine(line, lines, currentLine);

      if (element) {
        elements.push(element);
      }

      currentLine++;
    }

    return {
      titlePage,
      elements,
      metadata: {
        version: '1.0',
        lastModified: new Date().toISOString(),
        wordCount: this.calculateWordCount(elements),
      },
    };
  }

  /**
   * Check if document starts with title page
   */
  private isTitlePage(lines: string[]): boolean {
    if (lines.length === 0) return false;

    const firstLine = lines[0].trim();
    return (
      firstLine.startsWith('Title:') ||
      firstLine.startsWith('Author:') ||
      firstLine.startsWith('Credit:') ||
      firstLine.startsWith('Source:')
    );
  }

  /**
   * Parse title page section
   */
  private parseTitlePage(lines: string[]): { titlePage: TitlePage; endLine: number } {
    const titlePage: TitlePage = { title: '' };
    let endLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Empty line indicates end of title page
      if (line.trim() === '' && i > 0) {
        endLine = i + 1;
        break;
      }

      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;

      const key = line.substring(0, colonIndex).trim().toLowerCase();
      const value = line.substring(colonIndex + 1).trim();

      switch (key) {
        case 'title':
          titlePage.title = value;
          break;
        case 'author':
        case 'credit':
          titlePage.author = value;
          break;
        case 'source':
          titlePage.source = value;
          break;
        case 'draft date':
        case 'date':
          titlePage.draftDate = value;
          break;
        case 'contact':
          titlePage.contact = value;
          break;
        case 'copyright':
          titlePage.copyright = value;
          break;
      }

      endLine = i + 1;
    }

    return { titlePage, endLine };
  }

  /**
   * Parse a single line into a ScreenplayElement
   */
  private parseLine(line: string, lines: string[], lineNumber: number): ScreenplayElement | null {
    const trimmedLine = line.trim();

    // Skip empty lines
    if (trimmedLine === '') {
      return this.options.preserveEmptyLines
        ? { type: 'action', text: '', lineNumber }
        : null;
    }

    // Check for forced element types (starting with !)
    if (trimmedLine.startsWith('!')) {
      return this.parseForcedElement(trimmedLine.substring(1).trim(), lineNumber);
    }

    // Check for section headers (# ## ###)
    if (trimmedLine.startsWith('#')) {
      return this.parseSection(trimmedLine, lineNumber);
    }

    // Check for page breaks (===) - MUST be checked BEFORE synopsis
    if (trimmedLine === '===') {
      return {
        type: 'page_break',
        text: '',
        lineNumber,
      };
    }

    // Check for synopsis (=) - single = followed by non-=
    if (trimmedLine.startsWith('=') && !trimmedLine.startsWith('==')) {
      return {
        type: 'synopsis',
        text: trimmedLine.substring(1).trim(),
        lineNumber,
      };
    }

    // Check for notes ([[text]])
    if (trimmedLine.startsWith('[[') && trimmedLine.endsWith(']]')) {
      return {
        type: 'note',
        text: trimmedLine.substring(2, trimmedLine.length - 2).trim(),
        lineNumber,
      };
    }

    // Check for scene headings
    if (this.isSceneHeading(trimmedLine)) {
      return this.parseSceneHeading(trimmedLine, lineNumber);
    }

    // Check for transitions
    if (this.isTransition(trimmedLine)) {
      return {
        type: 'transition',
        text: trimmedLine,
        lineNumber,
      };
    }

    // Check for character names (all caps, followed by dialogue)
    if (this.isCharacter(trimmedLine, lines, lineNumber)) {
      return {
        type: 'character',
        text: trimmedLine,
        characterName: this.extractCharacterName(trimmedLine),
        lineNumber,
      };
    }

    // Check for parenthetical
    if (trimmedLine.startsWith('(') && trimmedLine.endsWith(')')) {
      return {
        type: 'parenthetical',
        text: trimmedLine,
        lineNumber,
      };
    }

    // Check for lyrics (starting with ~)
    if (trimmedLine.startsWith('~')) {
      return {
        type: 'lyric',
        text: trimmedLine.substring(1).trim(),
        lineNumber,
      };
    }

    // Check for centered text (>text<)
    if (trimmedLine.startsWith('>') && trimmedLine.endsWith('<')) {
      return {
        type: 'action',
        text: trimmedLine.substring(1, trimmedLine.length - 1).trim(),
        lineNumber,
      };
    }

    // Check for emphasis
    const emphasis = this.parseEmphasis(trimmedLine);
    if (emphasis) {
      return {
        type: 'action',
        text: emphasis.text,
        emphasis: emphasis.type,
        lineNumber,
      };
    }

    // Default to action
    return {
      type: 'action',
      text: trimmedLine,
      lineNumber,
    };
  }

  /**
   * Parse forced element type
   */
  private parseForcedElement(text: string, lineNumber: number): ScreenplayElement {
    // Forced scene heading
    if (text.startsWith('.')) {
      return {
        type: 'scene_heading',
        text: text.substring(1).trim(),
        lineNumber,
      };
    }

    // Forced action
    return {
      type: 'action',
      text,
      lineNumber,
    };
  }

  /**
   * Parse section header
   */
  private parseSection(line: string, lineNumber: number): ScreenplayElement {
    let level = 0;
    for (const char of line) {
      if (char === '#') level++;
      else break;
    }

    return {
      type: 'section',
      text: line.substring(level).trim(),
      sectionLevel: level,
      lineNumber,
    };
  }

  /**
   * Check if line is a scene heading
   */
  private isSceneHeading(line: string): boolean {
    const upperLine = line.toUpperCase();
    return SCENE_HEADING_PREFIXES.some((prefix) => upperLine.startsWith(prefix));
  }

  /**
   * Parse scene heading
   */
  private parseSceneHeading(line: string, lineNumber: number): ScreenplayElement {
    // Extract scene number if present
    const sceneNumberMatch = line.match(/#(\d+)#$/);
    const sceneNumber = sceneNumberMatch ? sceneNumberMatch[1] : undefined;

    const text = sceneNumberMatch ? line.replace(/#\d+#$/, '').trim() : line;

    return {
      type: 'scene_heading',
      text,
      sceneNumber,
      lineNumber,
    };
  }

  /**
   * Check if line is a transition
   */
  private isTransition(line: string): boolean {
    const upperLine = line.toUpperCase();
    return (
      TRANSITION_KEYWORDS.some((keyword) => upperLine === keyword) ||
      upperLine.endsWith(':')
    );
  }

  /**
   * Check if line is a character name
   */
  private isCharacter(line: string, lines: string[], lineNumber: number): boolean {
    if (line.startsWith('(')) {
      return false;
    }

    // Strip extensions like (V.O.), (O.S.), (CONT'D)
    const cleanLine = line.replace(/\s*\(.*?\)\s*$/, '').trim();

    // Character names are typically ALL CAPS
    // and followed by dialogue or parenthetical
    if (!cleanLine || !/^[A-Z][A-Z\s\.\-\']+$/.test(cleanLine)) {
      return false;
    }

    // Check if next non-empty line is dialogue or parenthetical
    for (let i = lineNumber + 1; i < lines.length; i++) {
      const nextLine = lines[i].trim();
      if (nextLine === '') continue;

      // If next line is parenthetical or dialogue, this is a character
      if (
        (nextLine.startsWith('(') && nextLine.endsWith(')')) ||
        !this.isSceneHeading(nextLine)
      ) {
        return true;
      }

      break;
    }

    return false;
  }

  /**
   * Extract character name from line
   */
  private extractCharacterName(line: string): string {
    // Remove extensions like (V.O.), (O.S.), (CONT'D)
    return line.replace(/\s*\(.*?\)\s*$/, '').trim();
  }

  /**
   * Parse emphasis markers
   */
  private parseEmphasis(
    text: string
  ): { text: string; type: 'italic' | 'bold' | 'bold_italic' | 'underline' } | null {
    // Bold italic: ***text***
    if (text.startsWith('***') && text.endsWith('***')) {
      return {
        text: text.substring(3, text.length - 3),
        type: 'bold_italic',
      };
    }

    // Bold: **text**
    if (text.startsWith('**') && text.endsWith('**')) {
      return {
        text: text.substring(2, text.length - 2),
        type: 'bold',
      };
    }

    // Italic: *text*
    if (text.startsWith('*') && text.endsWith('*')) {
      return {
        text: text.substring(1, text.length - 1),
        type: 'italic',
      };
    }

    // Underline: _text_
    if (text.startsWith('_') && text.endsWith('_')) {
      return {
        text: text.substring(1, text.length - 1),
        type: 'underline',
      };
    }

    return null;
  }

  /**
   * Calculate total word count
   */
  private calculateWordCount(elements: ScreenplayElement[]): number {
    return elements.reduce((count, element) => {
      const words = element.text.split(/\s+/).filter((w) => w.length > 0);
      return count + words.length;
    }, 0);
  }

  /**
   * Validate Fountain document
   */
  validate(text: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const lines = text.split(/\r?\n/);

    let hasSceneHeading = false;
    let lastCharacter: string | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check for scene heading
      if (this.isSceneHeading(line)) {
        hasSceneHeading = true;
      }

      // Check for character without dialogue
      if (this.isCharacter(line, lines, i)) {
        lastCharacter = line;
      } else if (lastCharacter && line !== '') {
        // Character should be followed by dialogue or parenthetical
        if (!line.startsWith('(') && !this.isSceneHeading(line)) {
          // This is dialogue, reset lastCharacter
          lastCharacter = null;
        }
      }
    }

    // Warn if no scene headings found in documents with more than 5 lines
    if (!hasSceneHeading && lines.length > 5) {
      errors.push('Document appears to be missing scene headings');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const fountainParser = new FountainParser();
