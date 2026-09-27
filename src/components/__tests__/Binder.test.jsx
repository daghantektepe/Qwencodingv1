import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Binder from '../Binder.jsx';

/**
 * Ornek hiyerarsik agac verisi:
 *  - Manuskript (folder)
 *    - Bölüm 1 (doc)
 *    - Bölüm 2 (doc)
 *  - Notlar (folder)
 *    - Fikirler (doc)
 */
const sampleTree = [
  {
    id: 'f-manuskript',
    type: 'folder',
    title: 'Manuskript',
    children: [
      {
        id: 'd-bolum-1',
        type: 'doc',
        title: 'Bölüm 1',
        content: 'Birinci bölümün taslak metni burada başlar.',
      },
      {
        id: 'd-bolum-2',
        type: 'doc',
        title: 'Bölüm 2',
        content: 'İkinci bölüm içeriği: olaylar derinleşir.',
      },
    ],
  },
  {
    id: 'f-notlar',
    type: 'folder',
    title: 'Notlar',
    children: [
      {
        id: 'd-fikirler',
        type: 'doc',
        title: 'Fikirler',
        content: 'Karakter notları ve fikir listesi.',
      },
    ],
  },
];

/**
 * Tamamlanma kriterini dogrulayan gercek entegrasyon sarmalayicisi:
 * Binder'dan secilen dokumanin content'i bir <textarea> (editor) icinde gosterilir.
 */
function AppHarness({ tree = sampleTree }) {
  const [selectedDoc, setSelectedDoc] = useState(null);
  return (
    <div style={{ display: 'flex' }}>
      <Binder tree={tree} selectedId={selectedDoc ? selectedDoc.id : null} onSelectDoc={setSelectedDoc} />
      <main>
        <h3>{selectedDoc ? selectedDoc.title : 'Doküman seçilmedi'}</h3>
        <textarea data-testid="editor" aria-label="Editor" readOnly value={selectedDoc ? selectedDoc.content || '' : ''} />
      </main>
    </div>
  );
}

describe('Binder bileşeni — Faz 3 tamamlanma kriteri', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hiyerarşik ağacı render eder: klasör ve doküman başlıkları görünür', () => {
    render(<AppHarness />);
    expect(screen.getByText('Manuskript')).toBeInTheDocument();
    expect(screen.getByText('Notlar')).toBeInTheDocument();
    // Kök klasörler varsayılan açık olduğu için çocuklar da görünür
    expect(screen.getByText('Bölüm 1')).toBeInTheDocument();
    expect(screen.getByText('Bölüm 2')).toBeInTheDocument();
    expect(screen.getByText('Fikirler')).toBeInTheDocument();
  });

  it('doküman seçildiğinde onSelectDoc doğru düğümü çağırır', () => {
    const onSelectDoc = vi.fn();
    render(<Binder tree={sampleTree} selectedId={null} onSelectDoc={onSelectDoc} />);

    fireEvent.click(screen.getByText('Bölüm 1'));
    expect(onSelectDoc).toHaveBeenCalledTimes(1);
    expect(onSelectDoc).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'd-bolum-1', type: 'doc', title: 'Bölüm 1' })
    );
  });

  it('seçilen dokümanın içeriği editörde (textarea) gösterilir — ana kabul kriteri', () => {
    render(<AppHarness />);
    const editor = screen.getByTestId('editor');
    expect(editor.value).toBe('');

    fireEvent.click(screen.getByText('Bölüm 2'));
    expect(editor.value).toBe('İkinci bölüm içeriği: olaylar derinleşir.');

    fireEvent.click(screen.getByText('Fikirler'));
    expect(editor.value).toBe('Karakter notları ve fikir listesi.');
  });

  it('klasöre tıklamak seçim yapmaz, yalnızca aç/kapa yapar', () => {
    const onSelectDoc = vi.fn();
    render(<Binder tree={sampleTree} selectedId={null} onSelectDoc={onSelectDoc} />);

    const folderRow = screen.getByText('Manuskript').closest('.binder-row');
    fireEvent.click(folderRow);
    expect(onSelectDoc).not.toHaveBeenCalled();

    // Kapandı -> çocuklar gizlenir; tekrar açıldı -> görünür
    expect(screen.queryByText('Bölüm 1')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Manuskript').closest('.binder-row'));
    expect(screen.getByText('Bölüm 1')).toBeInTheDocument();
  });

  it('seçim vurgusu (aria-selected) yalnızca tek dokümanda olur', () => {
    render(<AppHarness />);
    // "Bölüm 1" başlığı hem ağaç satırında hem de editör üst başlığında geçtiği için
    // getAllByText ile hepsini alıp .binder-node kapsayıcısı olanları filtreleriz.
    const binderNodesOf = (title) =>
      screen.getAllByText(title).map((el) => el.closest('.binder-node')).filter(Boolean);

    fireEvent.click(screen.getByText('Bölüm 1'));
    expect(binderNodesOf('Bölüm 1')[0]).toHaveAttribute('aria-selected', 'true');
    expect(binderNodesOf('Bölüm 2')[0]).toHaveAttribute('aria-selected', 'false');

    fireEvent.click(screen.getByText('Bölüm 2'));
    expect(binderNodesOf('Bölüm 1')[0]).toHaveAttribute('aria-selected', 'false');
    expect(binderNodesOf('Bölüm 2')[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('kenar durumu: boş ağaç "boş proje" mesajı gösterir', () => {
    render(<Binder tree={[]} selectedId={null} onSelectDoc={() => {}} />);
    const msg = screen.queryByText(/Bos proje/i) || screen.queryByText(/boş proje/i);
    expect(msg).toBeInTheDocument();
  });

  it('kenar durumu: content alanı olmayan doküman seçilirse editör boş kalır, hata fırlatılmaz', () => {
    const treeNoContent = [{ id: 'd-empty', type: 'doc', title: 'Boş Doküman' }];
    render(<AppHarness tree={treeNoContent} />);
    fireEvent.click(screen.getByText('Boş Doküman'));
    expect(screen.getByTestId('editor').value).toBe('');
  });

  it('kenar durumu: onSelectDoc tanımsız iken tıklama çökmez', () => {
    render(<Binder tree={sampleTree} selectedId={null} />);
    expect(() => {
      fireEvent.click(screen.getByText('Bölüm 1'));
    }).not.toThrow();
  });

  it('erişilebilirlik: klavye ile Enter tuşu seçimi tetikler', () => {
    const onSelectDoc = vi.fn();
    render(<Binder tree={sampleTree} selectedId={null} onSelectDoc={onSelectDoc} />);
    const docRow = screen.getByText('Bölüm 1').closest('.binder-row');
    fireEvent.keyDown(docRow, { key: 'Enter' });
    expect(onSelectDoc).toHaveBeenCalledWith(expect.objectContaining({ id: 'd-bolum-1' }));
  });

  it('derin doküman seçilebilir ve editöre içeriği yüklenir', () => {
    const deepTree = [
      {
        id: 'f-root',
        type: 'folder',
        title: 'Kitap',
        children: [
          {
            id: 'f-part1',
            type: 'folder',
            title: 'Kısım 1',
            children: [
              { id: 'd-deep', type: 'doc', title: 'Derin Sahne', content: 'Derin içerik.' },
            ],
          },
        ],
      },
    ];
    render(<AppHarness tree={deepTree} />);
    fireEvent.click(screen.getByText('Derin Sahne'));
    expect(screen.getByTestId('editor').value).toBe('Derin içerik.');
  });
});
