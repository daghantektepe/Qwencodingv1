import {
  ScreenplayDocument,
  ScreenplayElement,
  TitlePage,
  FountainExportOptions,
} from '../../types/screenplay';

/**
 * Fountain Exporter Service
 * Converts ScreenplayDocument back to Fountain format text
 */

export class FountainExporter {
  private options: FountainExportOptions;

  constructor(options: FountainExportOptions = {}) {
    this.options = {
      includeTitlePage: true,
      includeMetadata: false,
      lineEnding: 'lf',
      ...options,
    };
  }

  /**
   * Export ScreenplayDocument to Fountain text
   */
  export(document: ScreenplayDocument): string {
    const lines: string[] = [];
    const lineEnding = this.options.lineEnding === 'crlf' ? '\r\n' : '\n';

    // Export title page
    if (this.options.includeTitlePage && document.titlePage) {
      lines.push(...this.exportTitlePage(document.titlePage));
      lines.push(''); // Empty line after title page
    }

    // Export elements
    for (const element of document.elements) {
      const elementLines = this.exportElement(element);
      lines.push(...elementLines);
    }

    // Add metadata as notes if requested
    if (this.options.includeMetadata && document.metadata) {
      lines.push('');
      lines.push('[[Metadata]]');
      lines.push(`Version: ${document.metadata.version}`);
      lines.push(`Last Modified: ${document.metadata.lastModified}`);
      lines.push(`Word Count: ${document.metadata.wordCount}`);
      if (document.metadata.pageCount) {
        lines.push(`Page Count: ${document.metadata.pageCount}`);
      }
      lines.push('[[/Metadata]]');
    }

    return lines.join(lineEnding);
  }

  /**
   * Export title page section
   */
  private exportTitlePage(titlePage: TitlePage): string[] {
    const lines: string[] = [];

    if (titlePage.title) {
      lines.push(`Title: ${titlePage.title}`);
    }

    if (titlePage.author) {
      lines.push(`Author: ${titlePage.author}`);
    }

    if (titlePage.source) {
      lines.push(`Source: ${titlePage.source}`);
    }

    if (titlePage.draftDate) {
      lines.push(`Draft date: ${titlePage.draftDate}`);
    }

    if (titlePage.contact) {
      lines.push(`Contact: ${titlePage.contact}`);
    }

    if (titlePage.copyright) {
      lines.push(`Copyright: ${titlePage.copyright}`);
    }

    return lines;
  }

  /**
   * Export a single element
   */
  private exportElement(element: ScreenplayElement): string[] {
    switch (element.type) {
      case 'scene_heading':
        return this.exportSceneHeading(element);
      case 'action':
        return this.exportAction(element);
      case 'character':
        return this.exportCharacter(element);
      case 'parenthetical':
        return this.exportParenthetical(element);
      case 'dialogue':
        return this.exportDialogue(element);
      case 'transition':
        return this.exportTransition(element);
      case 'lyric':
        return this.exportLyric(element);
      case 'note':
        return this.exportNote(element);
      case 'section':
        return this.exportSection(element);
      case 'synopsis':
        return this.exportSynopsis(element);
      case 'page_break':
        return this.exportPageBreak();
      default:
        return [element.text];
    }
  }

  /**
   * Export scene heading
   */
  private exportSceneHeading(element: ScreenplayElement): string[] {
    const lines: string[] = [];

    // Add empty line before scene heading
    lines.push('');

    let text = element.text;

    // Add scene number if present
    if (element.sceneNumber) {
      text += ` #${element.sceneNumber}#`;
    }

    lines.push(text);
    lines.push('');

    return lines;
  }

  /**
   * Export action
   */
  private exportAction(element: ScreenplayElement): string[] {
    let text = element.text;

    // Apply emphasis if present
    if (element.emphasis) {
      switch (element.emphasis) {
        case 'italic':
          text = `*${text}*`;
          break;
        case 'bold':
          text = `**${text}**`;
          break;
        case 'bold_italic':
          text = `***${text}***`;
          break;
        case 'underline':
          text = `_${text}_`;
          break;
      }
    }

    return [text, ''];
  }

  /**
   * Export character
   */
  private exportCharacter(element: ScreenplayElement): string[] {
    return ['', element.text, ''];
  }

  /**
   * Export parenthetical
   */
  private exportParenthetical(element: ScreenplayElement): string[] {
    return [element.text];
  }

  /**
   * Export dialogue
   */
  private exportDialogue(element: ScreenplayElement): string[] {
    return [element.text, ''];
  }

  /**
   * Export transition
   */
  private exportTransition(element: ScreenplayElement): string[] {
    return ['', element.text, ''];
  }

  /**
   * Export lyric
   */
  private exportLyric(element: ScreenplayElement): string[] {
    return [`~${element.text}`, ''];
  }

  /**
   * Export note
   */
  private exportNote(element: ScreenplayElement): string[] {
    return [`[[${element.text}]]`, ''];
  }

  /**
   * Export section
   */
  private exportSection(element: ScreenplayElement): string[] {
    const level = element.sectionLevel || 1;
    const prefix = '#'.repeat(level);
    return ['', `${prefix} ${element.text}`, ''];
  }

  /**
   * Export synopsis
   */
  private exportSynopsis(element: ScreenplayElement): string[] {
    return [`= ${element.text}`, ''];
  }

  /**
   * Export page break
   */
  private exportPageBreak(): string[] {
    return ['', '===', ''];
  }

  /**
   * Export to plain text (without Fountain formatting)
   */
  exportPlainText(document: ScreenplayDocument): string {
    const lines: string[] = [];
    const lineEnding = this.options.lineEnding === 'crlf' ? '\r\n' : '\n';

    // Export title page
    if (this.options.includeTitlePage && document.titlePage) {
      if (document.titlePage.title) {
        lines.push(document.titlePage.title);
      }
      if (document.titlePage.author) {
        lines.push(`by ${document.titlePage.author}`);
      }
      lines.push('');
    }

    // Export elements
    for (const element of document.elements) {
      switch (element.type) {
        case 'scene_heading':
          lines.push('');
          lines.push(element.text.toUpperCase());
          lines.push('');
          break;
        case 'character':
          lines.push('');
          lines.push('\t\t' + element.text);
          break;
        case 'parenthetical':
          lines.push('\t' + element.text);
          break;
        case 'dialogue':
        case 'action':
          lines.push(element.text);
          lines.push('');
          break;
        case 'transition':
          lines.push('');
          lines.push('\t\t\t\t' + element.text);
          lines.push('');
          break;
        default:
          lines.push(element.text);
      }
    }

    return lines.join(lineEnding);
  }

  /**
   * Export to HTML
   */
  exportHTML(document: ScreenplayDocument): string {
    const lines: string[] = [];

    lines.push('<!DOCTYPE html>');
    lines.push('<html>');
    lines.push('<head>');
    lines.push('<meta charset="UTF-8">');
    lines.push('<title>Screenplay</title>');
    lines.push('<style>');
    lines.push('body { font-family: "Courier New", monospace; max-width: 8.5in; margin: 1in auto; }');
    lines.push('.scene-heading { font-weight: bold; text-transform: uppercase; margin-top: 2em; }');
    lines.push('.action { margin: 1em 0; }');
    lines.push('.character { font-weight: bold; text-transform: uppercase; margin-left: 2.5in; margin-top: 1em; }');
    lines.push('.parenthetical { margin-left: 2in; font-style: italic; }');
    lines.push('.dialogue { margin-left: 1.5in; margin-right: 1in; }');
    lines.push('.transition { text-align: right; text-transform: uppercase; margin-top: 2em; }');
    lines.push('.section { font-weight: bold; margin-top: 2em; }');
    lines.push('.synopsis { font-style: italic; color: #666; }');
    lines.push('</style>');
    lines.push('</head>');
    lines.push('<body>');

    // Title page
    if (this.options.includeTitlePage && document.titlePage) {
      lines.push('<div class="title-page">');
      if (document.titlePage.title) {
        lines.push(`<h1>${this.escapeHTML(document.titlePage.title)}</h1>`);
      }
      if (document.titlePage.author) {
        lines.push(`<p>by ${this.escapeHTML(document.titlePage.author)}</p>`);
      }
      lines.push('</div>');
    }

    // Elements
    for (const element of document.elements) {
      const escapedText = this.escapeHTML(element.text);

      switch (element.type) {
        case 'scene_heading':
          lines.push(`<div class="scene-heading">${escapedText}</div>`);
          break;
        case 'action':
          lines.push(`<div class="action">${escapedText}</div>`);
          break;
        case 'character':
          lines.push(`<div class="character">${escapedText}</div>`);
          break;
        case 'parenthetical':
          lines.push(`<div class="parenthetical">${escapedText}</div>`);
          break;
        case 'dialogue':
          lines.push(`<div class="dialogue">${escapedText}</div>`);
          break;
        case 'transition':
          lines.push(`<div class="transition">${escapedText}</div>`);
          break;
        case 'section':
          const level = element.sectionLevel || 1;
          lines.push(`<h${level} class="section">${escapedText}</h${level}>`);
          break;
        case 'synopsis':
          lines.push(`<div class="synopsis">${escapedText}</div>`);
          break;
        case 'page_break':
          lines.push('<div class="page-break"></div>');
          break;
      }
    }

    lines.push('</body>');
    lines.push('</html>');

    return lines.join('\n');
  }

  /**
   * Escape HTML special characters
   */
  private escapeHTML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Export singleton instance
export const fountainExporter = new FountainExporter();
