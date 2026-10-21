/**
 * documentMerger.ts — Faz 65: Birden Fazla Dokümanı Birleştirme Motoru
 */

export type MergeSeparator = 'double_newline' | 'scene_break' | 'chapter_heading';

export interface MergeDocumentInput {
  id: string;
  title: string;
  content: string;
}

export interface MergeResult {
  mergedTitle: string;
  mergedContent: string;
  totalWordCount: number;
  sourceDocIds: string[];
}

export class DocumentMerger {
  public mergeDocuments(
    documents: MergeDocumentInput[],
    separator: MergeSeparator = 'double_newline',
    newTitle?: string
  ): MergeResult {
    if (documents.length === 0) {
      return {
        mergedTitle: newTitle || 'Birleştirilmiş Belge',
        mergedContent: '',
        totalWordCount: 0,
        sourceDocIds: [],
      };
    }

    const title = newTitle && newTitle.trim().length > 0
      ? newTitle.trim()
      : `${documents[0].title} (Birleştirilmiş)`;

    const parts: string[] = [];

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const trimmed = doc.content.trim();

      if (separator === 'chapter_heading') {
        parts.push(`## ${doc.title}\n\n${trimmed}`);
      } else if (separator === 'scene_break') {
        if (i > 0) parts.push('***');
        parts.push(trimmed);
      } else {
        parts.push(trimmed);
      }
    }

    const mergedContent = separator === 'scene_break'
      ? parts.join('\n\n')
      : parts.join('\n\n');

    const totalWordCount = mergedContent.split(/\s+/).filter(Boolean).length;

    return {
      mergedTitle: title,
      mergedContent,
      totalWordCount,
      sourceDocIds: documents.map((d) => d.id),
    };
  }
}

export const documentMerger = new DocumentMerger();
export default documentMerger;
