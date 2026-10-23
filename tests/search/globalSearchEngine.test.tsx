import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  globalSearchEngine,
  SearchDocument,
} from '../../src/services/search/globalSearchEngine';
import { GlobalSearchReplaceModal } from '../../src/components/Search/GlobalSearchReplaceModal';

describe('GlobalSearchEngine (Faz 79)', () => {
  const sampleDocs: SearchDocument[] = [
    {
      id: 'doc-1',
      title: 'Bölüm 1: Tanışma',
      content: 'Ahmet sabah erkenden kalktı. Ahmet kahvesini yudumladı.',
      notes: 'Ahmet karakteri önemli.',
    },
    {
      id: 'doc-2',
      title: 'Bölüm 2: Macera Başlıyor',
      content: 'Bu bölümde ahmet yoktu. Yalnızca Mehmet ve orman vardı.',
      notes: 'Mehmet yeni kahraman.',
    },
  ];

  it('düz metin aramasını büyük/küçük harf duyarsız ve duyarlı olarak yürütür', () => {
    // Duyarsız
    const resInsensitive = globalSearchEngine.search(sampleDocs, 'ahmet', {
      caseSensitive: false,
    });
    // doc-1 content'te 2 + notes'ta 0 (varsayılan inNotes false), doc-2 content'te 1 = toplam 3
    expect(resInsensitive.totalMatches).toBe(3);
    expect(resInsensitive.documentsWithMatchesCount).toBe(2);

    // Duyarlı (Sadece "Ahmet")
    const resSensitive = globalSearchEngine.search(sampleDocs, 'Ahmet', {
      caseSensitive: true,
    });
    expect(resSensitive.totalMatches).toBe(2);
    expect(resSensitive.documentsWithMatchesCount).toBe(1);
  });

  it('tam kelime eşleme (\\b) seçeneğini uygular', () => {
    const docs = [
      { id: 'd1', title: 'Test', content: 'Yaz günü güzeldir. Yazar kitabını yazıyor.' },
    ];

    const resWholeWord = globalSearchEngine.search(docs, 'yaz', {
      caseSensitive: false,
      matchWholeWord: true,
    });
    // Yalnızca "Yaz" eşleşmeli, "Yazar" veya "yazıyor" eşleşmemeli
    expect(resWholeWord.totalMatches).toBe(1);
  });

  it('Regex desenini başarıyla arar', () => {
    const resRegex = globalSearchEngine.search(sampleDocs, 'Bölüm\\s+\\d+', {
      useRegex: true,
    });
    expect(resRegex.totalMatches).toBe(2);
    expect(resRegex.matches[0].matchText).toBe('Bölüm 1');
    expect(resRegex.matches[1].matchText).toBe('Bölüm 2');
  });

  it('hatalı regex girildiğinde çökmez, regexError döner', () => {
    const resError = globalSearchEngine.search(sampleDocs, '[a-z', {
      useRegex: true,
    });
    expect(resError.regexError).toBeDefined();
    expect(resError.totalMatches).toBe(0);
  });

  it('seçili eşleşmeleri atomik olarak değiştirir ve dizin kaymasını önler', () => {
    const docs: SearchDocument[] = [
      {
        id: 'doc-multi',
        title: 'Çoklu Test',
        content: 'kedi süt içti, kedi uyudu, kedi uyandı.',
      },
    ];

    const searchRes = globalSearchEngine.search(docs, 'kedi');
    expect(searchRes.totalMatches).toBe(3);

    // Yalnızca 1. ve 3. eşleşmeyi seç
    searchRes.matches[1].selected = false;

    const { updatedDocs, replacementsCount } = globalSearchEngine.applyReplacements(
      docs,
      searchRes.matches,
      'köpek'
    );

    expect(replacementsCount).toBe(2);
    expect(updatedDocs[0].content).toBe('köpek süt içti, kedi uyudu, köpek uyandı.');
  });
});

describe('GlobalSearchReplaceModal Component', () => {
  const testDocs: SearchDocument[] = [
    {
      id: 'd1',
      title: 'İlk Sahne',
      content: 'Dedektif gizemi çözdü.',
    },
  ];

  it('isOpen false olduğunda render etmez', () => {
    const { container } = render(
      <GlobalSearchReplaceModal
        isOpen={false}
        documents={testDocs}
        onSaveDocuments={() => {}}
        onClose={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('arama yapılır, eşleşme listelenir ve değiştirme tetiklenir', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(
      <GlobalSearchReplaceModal
        isOpen={true}
        documents={testDocs}
        onSaveDocuments={onSave}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Çoklu Dosyada Bul ve Değiştir')).toBeDefined();

    // Arama kutusuna yaz
    const searchInput = screen.getByPlaceholderText(/Metin veya Regex yazın/i);
    fireEvent.change(searchInput, { target: { value: 'Dedektif' } });

    // Yeni metin kutusuna yaz
    const replaceInput = screen.getByPlaceholderText(/Yeni metin/i);
    fireEvent.change(replaceInput, { target: { value: 'Ajan' } });

    // Eşleşme bulundu mu
    expect(screen.getByText('İlk Sahne')).toBeDefined();

    // Seçilenleri Değiştir butonuna tıkla
    const replaceBtn = screen.getByRole('button', { name: /Seçilenleri Değiştir/i });
    fireEvent.click(replaceBtn);

    expect(onSave).toHaveBeenCalled();
    const updated = onSave.mock.calls[0][0];
    expect(updated[0].content).toBe('Ajan gizemi çözdü.');
  });
});
