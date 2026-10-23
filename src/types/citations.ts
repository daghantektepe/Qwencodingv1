/**
 * citations.ts — Faz 74: Akıllı Dipnot, Sonnot ve Akademik Alıntı Tipleri
 */

export type NoteType = 'footnote' | 'endnote';

export interface CitationSource {
  id: string;
  key: string;
  title: string;
  author: string;
  year: number;
  publisher?: string;
  url?: string;
  doi?: string;
  rawBibtex?: string;
}

export interface DocumentFootnote {
  id: string;
  docId: string;
  indexNumber: number;
  charOffset: number;
  type: NoteType;
  content: string;
  citationSourceId?: string;
}

export interface RenderedFootnoteOutput {
  bodyTextWithMarkers: string;
  notesSection: string;
  fullRendered: string;
}
