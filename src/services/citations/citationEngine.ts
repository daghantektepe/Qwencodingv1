/**
 * citationEngine.ts — Faz 74: Akıllı Dipnot, Sonnot ve Kaynakça Alıntı Motoru
 */

import {
  DocumentFootnote,
  CitationSource,
  NoteType,
  RenderedFootnoteOutput
} from '../../types/citations';

export class CitationEngine {
  private sources: Map<string, CitationSource> = new Map();
  private notes: Map<string, DocumentFootnote[]> = new Map();
  private listeners = new Set<() => void>();

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  public addFootnote(
    docId: string,
    charOffset: number,
    content: string,
    type: NoteType = 'footnote',
    citationSourceId?: string
  ): DocumentFootnote {
    const list = this.notes.get(docId) || [];
    const id = `fn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newNote: DocumentFootnote = {
      id,
      docId,
      indexNumber: 1, // yeniden indekslenecek
      charOffset,
      type,
      content,
      citationSourceId,
    };

    list.push(newNote);
    this.reindexNotes(list);
    this.notes.set(docId, list);
    this.notify();
    return newNote;
  }

  public removeFootnote(docId: string, footnoteId: string): void {
    let list = this.notes.get(docId);
    if (!list) return;

    list = list.filter((n) => n.id !== footnoteId);
    this.reindexNotes(list);
    this.notes.set(docId, list);
    this.notify();
  }

  public updateFootnoteContent(docId: string, footnoteId: string, newContent: string): void {
    const list = this.notes.get(docId);
    if (!list) return;
    const item = list.find((n) => n.id === footnoteId);
    if (item) {
      item.content = newContent;
      this.notify();
    }
  }

  public getFootnotes(docId: string): DocumentFootnote[] {
    return [...(this.notes.get(docId) || [])];
  }

  private reindexNotes(list: DocumentFootnote[]): void {
    list.sort((a, b) => a.charOffset - b.charOffset);
    list.forEach((n, idx) => {
      n.indexNumber = idx + 1;
    });
  }

  // --- Kaynakça / Citation Yönetimi ---
  public addCitationSource(data: Omit<CitationSource, 'id'>): CitationSource {
    const id = `src-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const source: CitationSource = { ...data, id };
    this.sources.set(id, source);
    this.notify();
    return source;
  }

  public getSources(): CitationSource[] {
    return Array.from(this.sources.values());
  }

  public getSource(id: string): CitationSource | undefined {
    return this.sources.get(id);
  }

  /**
   * Basit BibTeX girişlerini ayrıştırır (@article{key, title={...}, author={...}, year={...}})
   */
  public importBibtex(bibtex: string): CitationSource[] {
    const imported: CitationSource[] = [];
    const entryRegex = /@(\w+)\s*\{\s*([^,]+),([^@]*)\}/g;
    let match: RegExpExecArray | null;

    while ((match = entryRegex.exec(bibtex)) !== null) {
      const key = match[2].trim();
      const body = match[3];

      const extractField = (name: string): string => {
        const fieldRegex = new RegExp(`${name}\\s*=\\s*[{"]([^}"]+)[}"]`, 'i');
        const fMatch = body.match(fieldRegex);
        return fMatch ? fMatch[1].trim() : '';
      };

      const title = extractField('title') || 'Başlıksız Kaynak';
      const author = extractField('author') || 'Bilinmeyen Yazar';
      const year = parseInt(extractField('year'), 10) || new Date().getFullYear();
      const publisher = extractField('publisher') || undefined;
      const url = extractField('url') || undefined;

      const source = this.addCitationSource({
        key,
        title,
        author,
        year,
        publisher,
        url,
        rawBibtex: match[0],
      });
      imported.push(source);
    }

    return imported;
  }

  // --- Derleme Çıktıları ---
  public renderToMarkdown(docId: string, baseText: string): RenderedFootnoteOutput {
    const notes = this.getFootnotes(docId);
    if (notes.length === 0) {
      return { bodyTextWithMarkers: baseText, notesSection: '', fullRendered: baseText };
    }

    // Offset'lere göre ters sırada marker ekle (string offset kaymasını önlemek için)
    let body = baseText;
    const sortedDesc = [...notes].sort((a, b) => b.charOffset - a.charOffset);

    for (const n of sortedDesc) {
      const offset = Math.min(body.length, Math.max(0, n.charOffset));
      body = body.slice(0, offset) + `[^${n.indexNumber}]` + body.slice(offset);
    }

    const noteLines = notes.map((n) => `[^${n.indexNumber}]: ${n.content}`);
    const notesSection = `\n\n${noteLines.join('\n')}`;

    return {
      bodyTextWithMarkers: body,
      notesSection,
      fullRendered: body + notesSection,
    };
  }

  public renderToHtml(docId: string, baseText: string): RenderedFootnoteOutput {
    const notes = this.getFootnotes(docId);
    if (notes.length === 0) {
      return { bodyTextWithMarkers: baseText, notesSection: '', fullRendered: baseText };
    }

    let body = baseText;
    const sortedDesc = [...notes].sort((a, b) => b.charOffset - a.charOffset);

    for (const n of sortedDesc) {
      const offset = Math.min(body.length, Math.max(0, n.charOffset));
      const sup = `<sup><a href="#fn-${n.id}" id="ref-${n.id}">[${n.indexNumber}]</a></sup>`;
      body = body.slice(0, offset) + sup + body.slice(offset);
    }

    const htmlNotes = notes
      .map(
        (n) =>
          `<li id="fn-${n.id}">${n.content} <a href="#ref-${n.id}">↩</a></li>`
      )
      .join('\n');

    const notesSection = `<section class="footnotes"><ol>\n${htmlNotes}\n</ol></section>`;

    return {
      bodyTextWithMarkers: body,
      notesSection,
      fullRendered: `${body}\n\n${notesSection}`,
    };
  }

  public clear(): void {
    this.sources.clear();
    this.notes.clear();
    this.notify();
  }
}

export const citationEngine = new CitationEngine();
export default citationEngine;
