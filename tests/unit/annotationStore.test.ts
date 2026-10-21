import { describe, it, expect, beforeEach } from 'vitest';
import { annotationStore } from '../../src/services/annotationStore';

describe('annotationStore', () => {
  const docId = 'test-doc-1';

  beforeEach(() => {
    annotationStore.clearAll();
  });

  describe('Comments', () => {
    it('should add a comment and retrieve it', () => {
      const comment = annotationStore.addComment({
        docId,
        author: 'Editör Ali',
        content: 'Bu paragraf daha akıcı olabilir.',
        selectedText: 'akıcı olmayan cümle',
        fromPos: 10,
        toPos: 29,
      });

      expect(comment.id).toBeDefined();
      expect(comment.resolved).toBe(false);
      expect(comment.author).toBe('Editör Ali');

      const all = annotationStore.getComments(docId);
      expect(all).toHaveLength(1);
      expect(all[0].content).toBe('Bu paragraf daha akıcı olabilir.');
    });

    it('should update a comment', () => {
      const comment = annotationStore.addComment({
        docId,
        author: 'Yazar',
        content: 'İlk versiyon',
      });

      const updated = annotationStore.updateComment(comment.id, 'Güncellenmiş versiyon');
      expect(updated).toBe(true);

      const all = annotationStore.getComments(docId);
      expect(all[0].content).toBe('Güncellenmiş versiyon');
      expect(all[0].updatedAt).toBeDefined();
    });

    it('should toggle comment resolved status', () => {
      const comment = annotationStore.addComment({
        docId,
        author: 'Yazar',
        content: 'Kontrol edilecek',
      });

      expect(comment.resolved).toBe(false);

      annotationStore.toggleResolveComment(comment.id);
      expect(annotationStore.getComments(docId)[0].resolved).toBe(true);

      // Filtering un-resolved
      expect(annotationStore.getComments(docId, { showResolved: false })).toHaveLength(0);

      annotationStore.toggleResolveComment(comment.id);
      expect(annotationStore.getComments(docId)[0].resolved).toBe(false);
    });

    it('should delete a comment', () => {
      const comment = annotationStore.addComment({
        docId,
        author: 'Yazar',
        content: 'Silinecek',
      });

      expect(annotationStore.getComments(docId)).toHaveLength(1);
      const deleted = annotationStore.deleteComment(comment.id);
      expect(deleted).toBe(true);
      expect(annotationStore.getComments(docId)).toHaveLength(0);
    });

    it('should add and delete replies to a comment', () => {
      const comment = annotationStore.addComment({
        docId,
        author: 'Editör',
        content: 'Buraya kaynak ekle.',
      });

      const reply = annotationStore.addReply(comment.id, 'Yazar', 'Kaynak eklendi.');
      expect(reply).not.toBeNull();
      expect(reply?.content).toBe('Kaynak eklendi.');

      let fetched = annotationStore.getComments(docId)[0];
      expect(fetched.replies).toHaveLength(1);

      const deleted = annotationStore.deleteReply(comment.id, reply!.id);
      expect(deleted).toBe(true);

      fetched = annotationStore.getComments(docId)[0];
      expect(fetched.replies).toHaveLength(0);
    });
  });

  describe('Footnotes & Endnotes', () => {
    it('should add footnotes and format numeric markers', () => {
      const fn1 = annotationStore.addFootnote({
        docId,
        content: 'İlk referans kaynağı.',
        format: 'numeric',
      });
      const fn2 = annotationStore.addFootnote({
        docId,
        content: 'İkinci referans kaynağı.',
        format: 'numeric',
      });

      expect(fn1.index).toBe(1);
      expect(fn1.marker).toBe('1');
      expect(fn2.index).toBe(2);
      expect(fn2.marker).toBe('2');

      const all = annotationStore.getFootnotes(docId);
      expect(all).toHaveLength(2);
    });

    it('should format roman and asterisk markers correctly', () => {
      const romanFn = annotationStore.addFootnote({
        docId,
        content: 'Roma rakamlı dipnot',
        format: 'roman',
      });
      expect(romanFn.marker).toBe('i');

      const asteriskFn = annotationStore.addFootnote({
        docId,
        content: 'Yıldızlı dipnot',
        format: 'asterisk',
      });
      expect(asteriskFn.marker).toBe('**'); // 2nd footnote -> **
    });

    it('should renumber footnotes when one is deleted', () => {
      const fn1 = annotationStore.addFootnote({ docId, content: 'Dipnot 1' });
      const fn2 = annotationStore.addFootnote({ docId, content: 'Dipnot 2' });
      const fn3 = annotationStore.addFootnote({ docId, content: 'Dipnot 3' });

      expect(annotationStore.getFootnotes(docId)).toHaveLength(3);

      // Delete fn2
      annotationStore.deleteFootnote(fn2.id);

      const remaining = annotationStore.getFootnotes(docId);
      expect(remaining).toHaveLength(2);
      expect(remaining[0].content).toBe('Dipnot 1');
      expect(remaining[0].index).toBe(1);
      expect(remaining[1].content).toBe('Dipnot 3');
      expect(remaining[1].index).toBe(2);
      expect(remaining[1].marker).toBe('2');
    });

    it('should separate footnotes and endnotes', () => {
      annotationStore.addFootnote({ docId, content: 'Dipnot', isEndnote: false });
      annotationStore.addFootnote({ docId, content: 'Bölüm Sonu Notu', isEndnote: true });

      expect(annotationStore.getFootnotes(docId, false)).toHaveLength(1);
      expect(annotationStore.getFootnotes(docId, true)).toHaveLength(1);
    });
  });

  describe('Subscription', () => {
    it('should notify subscriber when state changes', () => {
      let callCount = 0;
      const unsubscribe = annotationStore.subscribe(() => {
        callCount++;
      });

      annotationStore.addComment({ docId, author: 'A', content: 'C' });
      expect(callCount).toBe(1);

      annotationStore.addFootnote({ docId, content: 'F' });
      expect(callCount).toBe(2);

      unsubscribe();
      annotationStore.addComment({ docId, author: 'B', content: 'D' });
      expect(callCount).toBe(2);
    });
  });
});
