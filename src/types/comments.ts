/**
 * comments.ts — Faz 62: Satır İçi İnceleme ve Başlıklı Yorum Tipleri
 */

export type HighlightColor = 'yellow' | 'green' | 'pink' | 'blue' | 'purple';

export interface CommentReply {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface InlineComment {
  id: string;
  docId: string;
  selectedText: string;
  range: {
    startOffset: number;
    endOffset: number;
  };
  author: string;
  content: string;
  replies: CommentReply[];
  highlightColor?: HighlightColor;
  status: 'open' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

export interface CommentFilter {
  status?: 'all' | 'open' | 'resolved';
  color?: HighlightColor | 'all';
  author?: string;
}
