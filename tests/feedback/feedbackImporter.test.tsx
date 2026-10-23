import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  parseFeedbackText,
  useFeedbackStore
} from '../../src/services/feedback/feedbackImporter';
import { BetaReaderFeedbackView } from '../../src/components/Feedback/BetaReaderFeedbackView';

describe('Phase 88: Beta Reader Feedback Importer & Store', () => {
  beforeEach(() => {
    useFeedbackStore.getState().clearAll();
    useFeedbackStore.getState().setFilter({
      status: 'all',
      documentId: 'all',
      readerName: 'all',
      searchQuery: ''
    });
  });

  describe('parseFeedbackText Parser Engine', () => {
    it('should parse single feedback item with defaults', () => {
      const raw = 'Bu sahne gayet akıcı ve gerilimi yüksek.';
      const result = parseFeedbackText(raw, 'Canan Okur');

      expect(result.length).toBe(1);
      expect(result[0].readerName).toBe('Canan Okur');
      expect(result[0].comment).toContain('akıcı ve gerilimi yüksek');
      expect(result[0].status).toBe('new');
    });

    it('should parse multiple feedback chunks separated by dividers and extract chapters and ratings', () => {
      const raw = `[Bölüm 1] Giriş paragrafı çok çarpıcı olmuş. Puan: 5/5
---
"Karanlık gölge yaklaştı" sahnesinde tempo biraz düşük. Puan: 3/5
Okur: Selim
---
Feedback: Son diyalog karakterin kişiliğine çok yakışmış.`;

      const result = parseFeedbackText(raw, 'Varsayılan Okur');

      expect(result.length).toBeGreaterThanOrEqual(3);

      // First chunk
      expect(result[0].documentTitle).toContain('Bölüm 1');
      expect(result[0].rating).toBe(5);

      // Second chunk with quote and custom reader
      expect(result[1].quoteSnippet).toBe('Karanlık gölge yaklaştı');
      expect(result[1].rating).toBe(3);
      expect(result[1].readerName).toBe('Selim');

      // Third chunk
      expect(result[2].comment).toContain('Son diyalog');
    });
  });

  describe('useFeedbackStore CRUD and Filters', () => {
    it('should add comment and update reader stats', () => {
      const { addComment, comments, readers } = useFeedbackStore.getState();

      const added = addComment({
        readerName: 'Ahmet',
        comment: 'Harika bir bölüm.',
        status: 'new'
      });

      expect(added.id).toBeDefined();
      const state = useFeedbackStore.getState();
      expect(state.comments.length).toBe(1);
      expect(state.readers.find((r) => r.name === 'Ahmet')?.totalFeedbackCount).toBe(1);

      // Add another for Ahmet
      addComment({
        readerName: 'Ahmet',
        comment: 'İkinci yorum.',
        status: 'new'
      });
      expect(useFeedbackStore.getState().readers.find((r) => r.name === 'Ahmet')?.totalFeedbackCount).toBe(2);
    });

    it('should update status and delete comments', () => {
      const { addComment } = useFeedbackStore.getState();
      const c = addComment({
        readerName: 'Zeynep',
        comment: 'Burayı düzelt.',
        status: 'new'
      });

      useFeedbackStore.getState().updateCommentStatus(c.id, 'applied');
      expect(useFeedbackStore.getState().comments[0].status).toBe('applied');

      useFeedbackStore.getState().deleteComment(c.id);
      expect(useFeedbackStore.getState().comments.length).toBe(0);
    });

    it('should export and import JSON correctly', () => {
      const { addComment } = useFeedbackStore.getState();
      addComment({
        readerName: 'Barış',
        comment: 'JSON test yorumu.',
        status: 'reviewed'
      });

      const json = useFeedbackStore.getState().exportToJson();
      expect(json).toContain('JSON test yorumu');

      useFeedbackStore.getState().clearAll();
      expect(useFeedbackStore.getState().comments.length).toBe(0);

      const importedCount = useFeedbackStore.getState().importFromJson(json);
      expect(importedCount).toBe(1);
      expect(useFeedbackStore.getState().comments[0].readerName).toBe('Barış');
    });
  });

  describe('BetaReaderFeedbackView UI Component', () => {
    it('should render empty state when no comments exist', () => {
      render(<BetaReaderFeedbackView />);
      expect(screen.getByText('Beta Okur Geri Bildirimleri')).toBeDefined();
      expect(screen.getByText('Henüz gösterilecek geri bildirim bulunmuyor.')).toBeDefined();
    });

    it('should display comments and handle status change and search', () => {
      const { addComment } = useFeedbackStore.getState();
      addComment({
        readerName: 'Merve',
        comment: 'Karakterin motivasyonu çok inandırıcı.',
        status: 'new',
        documentTitle: 'Bölüm 2'
      });

      render(<BetaReaderFeedbackView />);

      expect(screen.getAllByText('Merve').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Karakterin motivasyonu çok inandırıcı.')).toBeDefined();
      expect(screen.getAllByText('Yeni').length).toBeGreaterThanOrEqual(1);

      // Click "Uygula" button
      const applyBtn = screen.getByText('Uygula');
      fireEvent.click(applyBtn);

      expect(useFeedbackStore.getState().comments[0].status).toBe('applied');

      // Search
      const searchInput = screen.getByPlaceholderText('Yorumlarda, alıntılarda ara...');
      fireEvent.change(searchInput, { target: { value: 'bulunamayan_kelime_xyz' } });

      expect(screen.queryByText('Karakterin motivasyonu çok inandırıcı.')).toBeNull();
    });
  });
});
