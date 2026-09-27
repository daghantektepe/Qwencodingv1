import React, { useState, useEffect, useCallback } from 'react';
import './Inspector.css';

/**
 * Inspector — Faz 6: secili dokumanin metadata alanlarini (synopsis, label,
 * status, keywords) duzenleyen sag panel bileseni.
 *
 * props:
 *   node: { id, type, title, metadata?: { synopsis, labels, status, keywords } } | null
 *         — Binder'dan gelen aktif dugum; doc veya folder olabilir.
 *   onUpdateMetadata: (docId, patch) => void
 *         — metadata guncellemelerini state'e (ve dolayisiyla diska) yazar.
 *         patch ornegi: { synopsis: '...' } veya { keywords: ['a','b'] }
 */

const STATUSES = [
  'Taslak',
  'Ilk Taslak',
  'Ikinci Taslak',
  'Düzeltme Bekliyor',
  'Tamamlandı',
];

const LABELS = ['Kirmizi', 'Yesil', 'Mavi', 'Sari', 'Turuncu', 'Mor'];

const LABEL_COLORS = {
  Kirmizi: '#e05c5c',
  Yesil: '#4caf72',
  Mavi: '#4a90d9',
  Sari: '#e6c34a',
  Turuncu: '#e88b3f',
  Mor: '#9b59b6',
};

export default function Inspector({ node = null, onUpdateMetadata, ariaLabel = 'Inspector' }) {
  const [keywordInput, setKeywordInput] = useState('');

  // node degistiginde yerel keyword input'unu temizle
  useEffect(() => {
    setKeywordInput('');
  }, [node?.id]);

  const meta = node?.metadata || {};
  const synopsis = meta.synopsis || '';
  const status = meta.status || 'Taslak';
  const labels = Array.isArray(meta.labels) ? meta.labels : [];
  const keywords = Array.isArray(meta.keywords) ? meta.keywords : [];

  const patch = useCallback(
    (partial) => {
      if (!node || typeof onUpdateMetadata !== 'function') return;
      onUpdateMetadata(node.id, partial);
    },
    [node, onUpdateMetadata]
  );

  const handleSynopsisChange = (e) => patch({ synopsis: e.target.value });

  const handleStatusChange = (e) => patch({ status: e.target.value });

  const handleLabelToggle = (label) => {
    const next = labels.includes(label)
      ? labels.filter((l) => l !== label)
      : [...labels, label];
    patch({ labels: next });
  };

  const handleKeywordAdd = (e) => {
    e.preventDefault();
    const kw = keywordInput.trim();
    if (!kw) return;
    if (keywords.includes(kw)) {
      setKeywordInput('');
      return;
    }
    patch({ keywords: [...keywords, kw] });
    setKeywordInput('');
  };

  const handleKeywordRemove = (kw) => {
    patch({ keywords: keywords.filter((k) => k !== kw) });
  };

  // Bos durum: hicbir dugum secilmedi
  if (!node) {
    return (
      <aside className="inspector inspector--empty" aria-label="Inspector">
        <header className="inspector-header">
          <h2 className="inspector-header__title">Inspector</h2>
        </header>
        <div className="inspector-empty-state">
          <p>Düzenlemek için Binder'dan bir öğe seçin.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="inspector" aria-label={ariaLabel}>
      <header className="inspector-header">
        <h2 className="inspector-header__title">Inspector</h2>
        <span className="inspector-node-type">
          {node.type === 'folder' ? '📁 Klasör' : '📄 Doküman'}
        </span>
      </header>

      <div className="inspector-body">
        {/* Baslik bilgisi (salt okunur — yeniden adlandirma Binder'dan yapilir) */}
        <section className="inspector-section">
          <h3 className="inspector-section__title">{node.title}</h3>
        </section>

        {/* Synopsis */}
        <section className="inspector-section">
          <label className="inspector-label" htmlFor="inspector-synopsis">
            Synopsis
          </label>
          <textarea
            id="inspector-synopsis"
            className="inspector-textarea"
            rows={5}
            value={synopsis}
            onChange={handleSynopsisChange}
            placeholder="Bu bölümün kısa özeti..."
          />
        </section>

        {/* Status */}
        <section className="inspector-section">
          <label className="inspector-label" htmlFor="inspector-status">
            Durum
          </label>
          <select
            id="inspector-status"
            className="inspector-select"
            value={status}
            onChange={handleStatusChange}
          >
            {!STATUSES.includes(status) && (
              <option value={status}>{status}</option>
            )}
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </section>

        {/* Labels */}
        <section className="inspector-section">
          <span className="inspector-label">Etiketler</span>
          <div className="inspector-labels" role="group" aria-label="Etiket seçimi">
            {LABELS.map((label) => {
              const active = labels.includes(label);
              return (
                <button
                  key={label}
                  type="button"
                  className={`inspector-label-chip${active ? ' inspector-label-chip--active' : ''}`}
                  style={{ '--chip-color': LABEL_COLORS[label] }}
                  onClick={() => handleLabelToggle(label)}
                  aria-pressed={active}
                  title={active ? 'Etiketi kaldır' : 'Etiket ekle'}
                >
                  <span className="inspector-label-dot" aria-hidden="true" />
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Keywords */}
        <section className="inspector-section">
          <label className="inspector-label" htmlFor="inspector-keyword-input">
            Anahtar Kelimeler
          </label>
          <form className="inspector-keyword-form" onSubmit={handleKeywordAdd}>
            <input
              id="inspector-keyword-input"
              type="text"
              className="inspector-keyword-input"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="Kelime yazıp Enter'a basın"
            />
            <button type="submit" className="inspector-keyword-add" disabled={!keywordInput.trim()}>
              Ekle
            </button>
          </form>
          <ul className="inspector-keywords" aria-label="Ekli anahtar kelimeler">
            {keywords.map((kw) => (
              <li key={kw} className="inspector-keyword-tag">
                {kw}
                <button
                  type="button"
                  className="inspector-keyword-remove"
                  onClick={() => handleKeywordRemove(kw)}
                  aria-label={`${kw} anahtar kelimesini kaldır`}
                >
                  ×
                </button>
              </li>
            ))}
            {keywords.length === 0 && (
              <li className="inspector-keywords-empty">Henüz anahtar kelime yok.</li>
            )}
          </ul>
        </section>
      </div>
    </aside>
  );
}
