/**
 * commentStore.ts — Faz 62: Satır İçi İnceleme ve Yorum Deposu
 */

import { InlineComment, CommentReply, HighlightColor, CommentFilter } from '../../types/comments';

export class CommentStore {
  private comments: Map<string, InlineComment> = new Map();
  private listeners = new Set<() => void>();

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  public addComment(
    docId: string,
    selectedText: string,
    range: { startOffset: number; endOffset: number },
    author: string,
    content: string,
    highlightColor: HighlightColor = 'yellow'
  ): InlineComment {
    const id = `comm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const comment: InlineComment = {
      id,
      docId,
      selectedText,
      range,
      author,
      content,
      replies: [],
      highlightColor,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.comments.set(id, comment);
    this.notify();
    return comment;
  }

  public addReply(commentId: string, author: string, content: string): CommentReply {
    const comment = this.comments.get(commentId);
    if (!comment) throw new Error('Yorum bulunamadı');

    const reply: CommentReply = {
      id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      author,
      content,
      createdAt: new Date().toISOString(),
    };

    comment.replies.push(reply);
    comment.updatedAt = new Date().toISOString();
    this.notify();
    return reply;
  }

  public resolveComment(commentId: string): void {
    const comment = this.comments.get(commentId);
    if (!comment) return;

    comment.status = 'resolved';
    comment.updatedAt = new Date().toISOString();
    this.notify();
  }

  public reopenComment(commentId: string): void {
    const comment = this.comments.get(commentId);
    if (!comment) return;

    comment.status = 'open';
    comment.updatedAt = new Date().toISOString();
    this.notify();
  }

  public deleteComment(commentId: string): void {
    this.comments.delete(commentId);
    this.notify();
  }

  public getComment(id: string): InlineComment | undefined {
    return this.comments.get(id);
  }

  public getCommentsByDoc(docId: string, filter?: CommentFilter): InlineComment[] {
    const docComments = Array.from(this.comments.values()).filter((c) => c.docId === docId);

    return docComments.filter((c) => {
      if (filter?.status && filter.status !== 'all' && c.status !== filter.status) {
        return false;
      }
      if (filter?.color && filter.color !== 'all' && c.highlightColor !== filter.color) {
        return false;
      }
      if (filter?.author && !c.author.toLowerCase().includes(filter.author.toLowerCase())) {
        return false;
      }
      return true;
    }).sort((a, b) => a.range.startOffset - b.range.startOffset);
  }

  public exportCommentsWithText(docId: string, originalText: string): string {
    const comments = this.getCommentsByDoc(docId, { status: 'all' });
    if (comments.length === 0) return originalText;

    let output = originalText;
    // Yorumları metnin sonuna dipnotlar olarak ekle
    output += '\n\n--- DÜZENLEME VE İNCELEME NOTLARI ---\n';
    comments.forEach((c, idx) => {
      output += `\n[Not ${idx + 1}] "${c.selectedText}" (${c.author}): ${c.content} [${c.status === 'resolved' ? 'ÇÖZÜLDÜ' : 'AÇIK'}]`;
      c.replies.forEach((r) => {
        output += `\n   ↳ (${r.author}): ${r.content}`;
      });
    });

    return output;
  }

  public clear(): void {
    this.comments.clear();
    this.notify();
  }
}

export const commentStore = new CommentStore();
export default commentStore;
