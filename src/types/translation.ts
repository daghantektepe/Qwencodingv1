/**
 * translation.ts — Faz 59: Çoklu Dil Çeviri ve Yerelleştirme Tip Tanımları
 */

export type TranslationStatus = 'empty' | 'draft' | 'approved';

export interface TranslationParagraph {
  id: string;
  sourceText: string;
  targetText: string;
  status: TranslationStatus;
  notes?: string;
}

export interface GlossaryTerm {
  id: string;
  sourceWord: string;
  targetWord: string;
  notes?: string;
  caseSensitive?: boolean;
}

export interface TranslationSession {
  id: string;
  sourceDocId: string;
  sourceDocTitle: string;
  sourceLang: string;
  targetLang: string;
  paragraphs: TranslationParagraph[];
  glossary: GlossaryTerm[];
  createdAt: string;
  updatedAt: string;
}

export interface TranslationProgress {
  totalParagraphs: number;
  translatedCount: number;
  approvedCount: number;
  percentage: number;
}
