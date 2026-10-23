import { describe, it, expect, beforeEach, vi } from 'vitest';
import { citationEngine } from '../../src/services/citations/citationEngine';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FootnotePopover } from '../../src/components/Citations/FootnotePopover';

describe('CitationEngine (Faz 74)', () => {
  beforeEach(() => {
    citationEngine.clear();
  });

  it('dipnot ekler ve charOffset sırasına göre otomatik yeniden indeksler', () => {
    // Farklı sırada ekle
    const fn2 = citationEngine.addFootnote('doc-1', 100, 'İkinci not');
    const fn1 = citationEngine.addFootnote('doc-1', 20, 'İlk not');
    const fn3 = citationEngine.addFootnote('doc-1', 150, 'Üçüncü not');

    const notes = citationEngine.getFootnotes('doc-1');
    expect(notes.length).toBe(3);
    expect(notes[0].id).toBe(fn1.id);
    expect(notes[0].indexNumber).toBe(1);
    expect(notes[0].charOffset).toBe(20);

    expect(notes[1].id).toBe(fn2.id);
    expect(notes[1].indexNumber).toBe(2);
    expect(notes[1].charOffset).toBe(100);

    expect(notes[2].id).toBe(fn3.id);
    expect(notes[2].indexNumber).toBe(3);
    expect(notes[2].charOffset).toBe(150);
  });

  it('dipnot silindiğinde kalan dipnotları otomatik 1-N yeniden indeksler', () => {
    const fn1 = citationEngine.addFootnote('doc-1', 20, 'Not 1');
    const fn2 = citationEngine.addFootnote('doc-1', 50, 'Not 2');
    const fn3 = citationEngine.addFootnote('doc-1', 80, 'Not 3');

    // Ortadaki notu sil
    citationEngine.removeFootnote('doc-1', fn2.id);

    const remaining = citationEngine.getFootnotes('doc-1');
    expect(remaining.length).toBe(2);
    expect(remaining[0].id).toBe(fn1.id);
    expect(remaining[0].indexNumber).toBe(1);

    expect(remaining[1].id).toBe(fn3.id);
    expect(remaining[1].indexNumber).toBe(2); // Yeniden 2 oldu!
  });

  it('dipnot içeriğini günceller ve dinleyicileri uyarır', () => {
    const listener = vi.fn();
    const unsub = citationEngine.subscribe(listener);

    const fn = citationEngine.addFootnote('doc-1', 10, 'Eski içerik');
    expect(listener).toHaveBeenCalledTimes(1);

    citationEngine.updateFootnoteContent('doc-1', fn.id, 'Yeni güncellenmiş içerik');
    expect(listener).toHaveBeenCalledTimes(2);

    const notes = citationEngine.getFootnotes('doc-1');
    expect(notes[0].content).toBe('Yeni güncellenmiş içerik');

    unsub();
  });

  it('BibTeX kaynaklarını başarıyla ayrıştırır ve ekler', () => {
    const bibtex = `
      @article{einstein1905,
        title={Zur Elektrodynamik bewegter Körper},
        author={Albert Einstein},
        year={1905},
        publisher={Annalen der Physik}
      }
      @book{turing1936,
        title={On Computable Numbers},
        author={Alan Turing},
        year={1936}
      }
    `;

    const imported = citationEngine.importBibtex(bibtex);
    expect(imported.length).toBe(2);
    expect(imported[0].key).toBe('einstein1905');
    expect(imported[0].title).toBe('Zur Elektrodynamik bewegter Körper');
    expect(imported[0].author).toBe('Albert Einstein');
    expect(imported[0].year).toBe(1905);
    expect(imported[0].publisher).toBe('Annalen der Physik');

    expect(imported[1].key).toBe('turing1936');
    expect(imported[1].title).toBe('On Computable Numbers');
    expect(imported[1].author).toBe('Alan Turing');
    expect(imported[1].year).toBe(1936);

    const allSources = citationEngine.getSources();
    expect(allSources.length).toBe(2);
  });

  it('renderToMarkdown çıktısı dipnot markerlarını ve dipnot listesini doğru üretir', () => {
    const baseText = 'Bu bir bilimsel cümledir. Bu da ikinci önemli paragraftır.';
    citationEngine.addFootnote('doc-md', 25, 'Birinci cümle açıklaması');
    citationEngine.addFootnote('doc-md', baseText.length, 'İkinci paragraf kaynakçası');

    const result = citationEngine.renderToMarkdown('doc-md', baseText);

    expect(result.bodyTextWithMarkers).toContain('Bu bir bilimsel cümledir.[^1]');
    expect(result.notesSection).toContain('[^1]: Birinci cümle açıklaması');
    expect(result.notesSection).toContain('[^2]: İkinci paragraf kaynakçası');
    expect(result.fullRendered).toContain('[^1]: Birinci cümle açıklaması');
  });

  it('renderToHtml çıktısı HTML <sup> etiketlerini ve <section class="footnotes"> alanını üretir', () => {
    const baseText = 'Metin içeriği';
    citationEngine.addFootnote('doc-html', 5, 'Dipnot detay');

    const result = citationEngine.renderToHtml('doc-html', baseText);

    expect(result.bodyTextWithMarkers).toContain('<sup><a href="#fn-');
    expect(result.bodyTextWithMarkers).toContain('[1]</a></sup>');
    expect(result.notesSection).toContain('<section class="footnotes">');
    expect(result.notesSection).toContain('Dipnot detay <a href="#ref-');
  });
});

describe('FootnotePopover Component', () => {
  beforeEach(() => {
    citationEngine.clear();
  });

  it('isOpen false olduğunda render etmez', () => {
    const { container } = render(
      <FootnotePopover
        isOpen={false}
        docId="doc-1"
        charOffset={10}
        onClose={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('yeni dipnot ekleme formunu doldurup kaydeder', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(
      <FootnotePopover
        isOpen={true}
        docId="doc-1"
        charOffset={15}
        onSave={onSave}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Yeni Dipnot Ekle')).toBeDefined();

    const textarea = screen.getByPlaceholderText(/Açıklama, referans veya alıntı metni/i);
    fireEvent.change(textarea, { target: { value: 'Yeni dipnot metni açıklaması' } });

    const submitBtn = screen.getByRole('button', { name: /Kaydet/i });
    fireEvent.click(submitBtn);

    expect(onSave).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
    expect(citationEngine.getFootnotes('doc-1').length).toBe(1);
    expect(citationEngine.getFootnotes('doc-1')[0].content).toBe('Yeni dipnot metni açıklaması');
  });

  it('mevcut dipnotu düzenler ve sil butonunu gösterir', () => {
    const note = citationEngine.addFootnote('doc-1', 20, 'Varolan not', 'footnote');
    const onDelete = vi.fn();
    const onClose = vi.fn();

    render(
      <FootnotePopover
        isOpen={true}
        docId="doc-1"
        charOffset={20}
        existingFootnote={note}
        onDelete={onDelete}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Dipnot [1]')).toBeDefined();

    const deleteBtn = screen.getByRole('button', { name: /Sil/i });
    fireEvent.click(deleteBtn);

    expect(onDelete).toHaveBeenCalledWith(note.id);
    expect(onClose).toHaveBeenCalled();
    expect(citationEngine.getFootnotes('doc-1').length).toBe(0);
  });
});
