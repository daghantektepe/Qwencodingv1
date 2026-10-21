/**
 * annotationStore.ts — Faz 44: Yorum, Dipnot ve Kenar Notları Servis Deposu
 */

import { CommentItem, CommentReply, FootnoteItem } from '../types/annotations';

class AnnotationStore {
  private comments: Map<string, CommentItem> = new Map();
  private footnotes: Map<string, FootnoteItem> = new Map();
  private listeners: Set<() => void> = new Set();
  private storageKey = 'openscriv:annotations';

  constructor() {
    this.loadFromStorage();
  }

  // --- Kalıcılık (Storage) ---
  private loadFromStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data.comments)) {
          this.comments.clear();
          data.comments.forEach((c: CommentItem) => this.comments.set(c.id, c));
        }
        if (Array.isArray(data.footnotes)) {
          this.footnotes.clear();
          data.footnotes.forEach((f: FootnoteItem) => this.footnotes.set(f.id, f));
        }
      }
    } catch {
      // JSON parse fallback
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const data = {
        comments: Array.from(this.comments.values()),
        footnotes: Array.from(this.footnotes.values()),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch {
      // Storage error fallback
    }
  }

  private notify(): void {
    this.saveToStorage();
    this.listeners.forEach((listener) => listener());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // --- Yorumlar (Comments) ---
  public addComment(data: {
    docId: string;
    author: string;
    content: string;
    selectedText?: string;
    fromPos?: number;
    toPos?: number;
  }): CommentItem {
    const id = `comment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const comment: CommentItem = {
      id,
      docId: data.docId,
      author: data.author || 'Yazar',
      content: data.content,
      selectedText: data.selectedText,
      fromPos: data.fromPos,
      toPos: data.toPos,
      createdAt: Date.now(),
      resolved: false,
      replies: [],
    };

    this.comments.set(id, comment);
    this.notify();
    return comment;
  }

  public updateComment(id: string, content: string): boolean {
    const comment = this.comments.get(id);
    if (!comment) return false;

    comment.content = content;
    comment.updatedAt = Date.now();
    this.notify();
    return true;
  }

  public deleteComment(id: string): boolean {
    const deleted = this.comments.delete(id);
    if (deleted) this.notify();
    return deleted;
  }

  public toggleResolveComment(id: string): boolean {
    const comment = this.comments.get(id);
    if (!comment) return false;

    comment.resolved = !comment.resolved;
    this.notify();
    return true;
  }

  public addReply(commentId: string, author: string, content: string): CommentReply | null {
    const comment = this.comments.get(commentId);
    if (!comment) return null;

    const reply: CommentReply = {
      id: `reply-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      author: author || 'Yazar',
      content,
      createdAt: Date.now(),
    };

    comment.replies.push(reply);
    this.notify();
    return reply;
  }

  public deleteReply(commentId: string, replyId: string): boolean {
    const comment = this.comments.get(commentId);
    if (!comment) return false;

    const initialLength = comment.replies.length;
    comment.replies = comment.replies.filter((r) => r.id !== replyId);
    if (comment.replies.length !== initialLength) {
      this.notify();
      return true;
    }
    return false;
  }

  public getComments(docId: string, options?: { showResolved?: boolean }): CommentItem[] {
    const list = Array.from(this.comments.values()).filter((c) => c.docId === docId);
    if (options?.showResolved === false) {
      return list.filter((c) => !c.resolved);
    }
    return list.sort((a, b) => (a.fromPos ?? 0) - (b.fromPos ?? 0) || a.createdAt - b.createdAt);
  }

  // --- Dipnotlar (Footnotes & Endnotes) ---
  public addFootnote(data: {
    docId: string;
    content: string;
    format?: 'numeric' | 'roman' | 'asterisk';
    isEndnote?: boolean;
  }): FootnoteItem {
    const id = `fn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const docFootnotes = this.getFootnotes(data.docId, data.isEndnote ?? false);
    const nextIndex = docFootnotes.length + 1;
    const format = data.format || 'numeric';

    const footnote: FootnoteItem = {
      id,
      docId: data.docId,
      index: nextIndex,
      marker: this.formatMarker(nextIndex, format),
      content: data.content,
      format,
      isEndnote: data.isEndnote ?? false,
      createdAt: Date.now(),
    };

    this.footnotes.set(id, footnote);
    this.notify();
    return footnote;
  }

  public updateFootnote(id: string, content: string): boolean {
    const fn = this.footnotes.get(id);
    if (!fn) return false;

    fn.content = content;
    this.notify();
    return true;
  }

  public deleteFootnote(id: string): boolean {
    const fn = this.footnotes.get(id);
    if (!fn) return false;

    const docId = fn.docId;
    const isEndnote = fn.isEndnote;
    this.footnotes.delete(id);
    this.renumberFootnotes(docId, isEndnote);
    this.notify();
    return true;
  }

  public getFootnotes(docId: string, isEndnote = false): FootnoteItem[] {
    return Array.from(this.footnotes.values())
      .filter((f) => f.docId === docId && f.isEndnote === isEndnote)
      .sort((a, b) => a.index - b.index);
  }

  public renumberFootnotes(docId: string, isEndnote: boolean): void {
    const items = this.getFootnotes(docId, isEndnote);
    items.forEach((item, idx) => {
      item.index = idx + 1;
      item.marker = this.formatMarker(item.index, item.format);
    });
  }

  public formatMarker(index: number, format: 'numeric' | 'roman' | 'asterisk'): string {
    if (format === 'asterisk') {
      return '*'.repeat(index);
    }
    if (format === 'roman') {
      const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];
      return romanNumerals[index - 1] || String(index);
    }
    return String(index);
  }

  public clearAll(docId?: string): void {
    if (docId) {
      for (const [id, c] of this.comments.entries()) {
        if (c.docId === docId) this.comments.delete(id);
      }
      for (const [id, f] of this.footnotes.entries()) {
        if (f.docId === docId) this.footnotes.delete(id);
      }
    } else {
      this.comments.clear();
      this.footnotes.clear();
    }
    this.notify();
  }
}

export const annotationStore = new AnnotationStore();
export default annotationStore;
