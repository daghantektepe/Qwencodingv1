import { describe, it, expect, beforeEach } from 'vitest';
import { CommentStore } from '../../src/services/comments/commentStore';

describe('Phase 62: Inline Review & Threaded Comments (commentStore)', () => {
  let store: CommentStore;

  beforeEach(() => {
    store = new CommentStore();
  });

  it('adds an inline comment with range and default open status', () => {
    const comment = store.addComment(
      'doc-1',
      'şüpheli hareketler',
      { startOffset: 120, endOffset: 138 },
      'Editör Jane',
      'Buradaki motivasyon biraz zayıf kalmış.',
      'yellow'
    );

    expect(comment.id).toBeDefined();
    expect(comment.docId).toBe('doc-1');
    expect(comment.status).toBe('open');
    expect(comment.replies).toHaveLength(0);
    expect(store.getCommentsByDoc('doc-1')).toHaveLength(1);
  });

  it('adds threaded replies to an existing comment', () => {
    const comment = store.addComment(
      'doc-1',
      'katil',
      { startOffset: 50, endOffset: 55 },
      'Okur',
      'Katilin kimliği çok erken belli oluyor.',
      'pink'
    );

    const reply = store.addReply(comment.id, 'Yazar', '3. bölümde ters köşe yapacağım.');
    expect(reply.id).toBeDefined();
    expect(reply.content).toBe('3. bölümde ters köşe yapacağım.');

    const updated = store.getComment(comment.id);
    expect(updated?.replies).toHaveLength(1);
    expect(updated?.replies[0].author).toBe('Yazar');
  });

  it('resolves and reopens comments', () => {
    const comment = store.addComment(
      'doc-1',
      'imla hatası',
      { startOffset: 0, endOffset: 10 },
      'Proofreader',
      'Noktalama eksik.'
    );

    expect(comment.status).toBe('open');

    store.resolveComment(comment.id);
    expect(store.getComment(comment.id)?.status).toBe('resolved');

    store.reopenComment(comment.id);
    expect(store.getComment(comment.id)?.status).toBe('open');
  });

  it('filters comments by status, color, and author', () => {
    store.addComment('doc-1', 'A', { startOffset: 10, endOffset: 15 }, 'Ali', 'Yorum 1', 'yellow');
    const c2 = store.addComment('doc-1', 'B', { startOffset: 20, endOffset: 25 }, 'Veli', 'Yorum 2', 'green');
    store.resolveComment(c2.id);

    const openOnly = store.getCommentsByDoc('doc-1', { status: 'open' });
    expect(openOnly).toHaveLength(1);
    expect(openOnly[0].author).toBe('Ali');

    const greenOnly = store.getCommentsByDoc('doc-1', { color: 'green' });
    expect(greenOnly).toHaveLength(1);
    expect(greenOnly[0].author).toBe('Veli');

    const byAuthor = store.getCommentsByDoc('doc-1', { author: 'ali' });
    expect(byAuthor).toHaveLength(1);
  });

  it('exports text with appended review comments and replies', () => {
    const originalText = 'Dedektif olay yerine vardı.';
    const comment = store.addComment(
      'doc-2',
      'olay yerine',
      { startOffset: 9, endOffset: 20 },
      'Danışman',
      'Hangi araçla geldiğini belirtelim.'
    );
    store.addReply(comment.id, 'Yazar', 'At arabasıyla geldiğini ekliyorum.');

    const exported = store.exportCommentsWithText('doc-2', originalText);
    expect(exported).toContain(originalText);
    expect(exported).toContain('--- DÜZENLEME VE İNCELEME NOTLARI ---');
    expect(exported).toContain('olay yerine');
    expect(exported).toContain('Hangi araçla geldiğini belirtelim.');
    expect(exported).toContain('At arabasıyla geldiğini ekliyorum.');
  });

  it('deletes comments cleanly', () => {
    const c = store.addComment('doc-3', 'test', { startOffset: 0, endOffset: 4 }, 'A', 'B');
    expect(store.getCommentsByDoc('doc-3')).toHaveLength(1);

    store.deleteComment(c.id);
    expect(store.getCommentsByDoc('doc-3')).toHaveLength(0);
  });
});
