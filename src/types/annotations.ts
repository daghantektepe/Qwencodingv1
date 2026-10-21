/**
 * annotations.ts — Faz 44: Yorumlar, Dipnotlar ve Kenar Notları Tipleri
 */

export type AnnotationType = 'comment' | 'footnote' | 'endnote' | 'marginalia';

export interface CommentReply {
  id: string;
  author: string;
  content: string;
  createdAt: number;
}

export interface CommentItem {
  id: string;
  docId: string;
  author: string;
  content: string;
  selectedText?: string;
  fromPos?: number;
  toPos?: number;
  createdAt: number;
  updatedAt?: number;
  resolved: boolean;
  replies: CommentReply[];
}

export interface FootnoteItem {
  id: string;
  docId: string;
  index: number;
  marker: string;
  content: string;
  format: 'numeric' | 'roman' | 'asterisk';
  isEndnote: boolean;
  createdAt: number;
}

export interface AnnotationFilter {
  showResolved?: boolean;
  type?: 'all' | 'comments' | 'footnotes' | 'endnotes';
  searchQuery?: string;
}
