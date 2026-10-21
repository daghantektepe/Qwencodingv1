import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CommentSidebar from '../../src/components/Annotations/CommentSidebar';
import { annotationStore } from '../../src/services/annotationStore';

describe('CommentSidebar Component', () => {
  const docId = 'test-doc-annotations';

  beforeEach(() => {
    annotationStore.clearAll();
  });

  it('renders sidebar with tabs and add comment form', () => {
    render(<CommentSidebar docId={docId} currentUser="Ali Yazar" />);

    expect(screen.getByTestId('comment-sidebar')).toBeInTheDocument();
    expect(screen.getByText(/Kenar Notları/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Yorumlar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dipnotlar/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Yorum ekleyin.../i)).toBeInTheDocument();
  });

  it('adds a new comment and renders it in the list', () => {
    render(<CommentSidebar docId={docId} currentUser="Ali Yazar" selectedText="Önemli cümle" />);

    const textarea = screen.getByPlaceholderText(/Yorum ekleyin.../i);
    fireEvent.change(textarea, { target: { value: 'Bu cümle tekrar gözden geçirilmeli.' } });

    const submitBtn = screen.getByRole('button', { name: /Yorum Yap/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Bu cümle tekrar gözden geçirilmeli.')).toBeInTheDocument();
    expect(screen.getAllByText(/"Önemli cümle"/i).length).toBeGreaterThanOrEqual(1);
  });

  it('toggles comment resolve status', () => {
    render(<CommentSidebar docId={docId} currentUser="Ali Yazar" />);

    // Add comment first
    const textarea = screen.getByPlaceholderText(/Yorum ekleyin.../i);
    fireEvent.change(textarea, { target: { value: 'Düzeltilecek madde' } });
    fireEvent.click(screen.getByRole('button', { name: /Yorum Yap/i }));

    const resolveBtn = screen.getByLabelText(/Çözüldü olarak işaretle/i);
    fireEvent.click(resolveBtn);

    expect(screen.getByText(/✓ Çözüldü/i)).toBeInTheDocument();
  });

  it('adds a reply to a comment', () => {
    render(<CommentSidebar docId={docId} currentUser="Ali Yazar" />);

    // Add comment
    const textarea = screen.getByPlaceholderText(/Yorum ekleyin.../i);
    fireEvent.change(textarea, { target: { value: 'Soru var mı?' } });
    fireEvent.click(screen.getByRole('button', { name: /Yorum Yap/i }));

    // Click + Yanıtla
    const replyOpenBtn = screen.getByRole('button', { name: /\+ Yanıtla/i });
    fireEvent.click(replyOpenBtn);

    // Type reply
    const replyInput = screen.getByPlaceholderText(/Yanıt yazın.../i);
    fireEvent.change(replyInput, { target: { value: 'Hayır, her şey net.' } });

    const sendBtn = screen.getByRole('button', { name: /Gönder/i });
    fireEvent.click(sendBtn);

    expect(screen.getByText('Hayır, her şey net.')).toBeInTheDocument();
  });

  it('deletes a comment when delete button is clicked', () => {
    render(<CommentSidebar docId={docId} currentUser="Ali Yazar" />);

    const textarea = screen.getByPlaceholderText(/Yorum ekleyin.../i);
    fireEvent.change(textarea, { target: { value: 'Silinecek yorum' } });
    fireEvent.click(screen.getByRole('button', { name: /Yorum Yap/i }));

    expect(screen.getByText('Silinecek yorum')).toBeInTheDocument();

    const deleteBtn = screen.getByLabelText(/Yorumu sil/i);
    fireEvent.click(deleteBtn);

    expect(screen.queryByText('Silinecek yorum')).not.toBeInTheDocument();
  });

  it('switches to Footnotes tab and adds a footnote', () => {
    render(<CommentSidebar docId={docId} currentUser="Ali Yazar" />);

    // Switch to Footnotes
    const fnTabBtn = screen.getByRole('button', { name: /Dipnotlar/i });
    fireEvent.click(fnTabBtn);

    expect(screen.getByText(/Henüz dipnot veya son not eklenmedi/i)).toBeInTheDocument();

    // Click + Dipnot Ekle
    const addFnBtn = screen.getByRole('button', { name: /\+ Dipnot Ekle/i });
    fireEvent.click(addFnBtn);

    // Dialog should open
    expect(screen.getByRole('dialog', { name: /Dipnot \/ Not Ekleme İletişim Kutusu/i })).toBeInTheDocument();

    const fnContentInput = screen.getByLabelText(/Dipnot içeriği/i);
    fireEvent.change(fnContentInput, { target: { value: 'Kitap Kaynakçası, s. 42' } });

    const saveBtn = screen.getByRole('button', { name: /Kaydet/i });
    fireEvent.click(saveBtn);

    // Should appear in list
    expect(screen.getByText('Kitap Kaynakçası, s. 42')).toBeInTheDocument();
    expect(screen.getByText('[1]')).toBeInTheDocument();
  });

  it('calls onClose when panel close button is clicked', () => {
    const onClose = vi.fn();
    render(<CommentSidebar docId={docId} onClose={onClose} />);

    const closeBtn = screen.getByTitle(/Paneli Kapat/i);
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
