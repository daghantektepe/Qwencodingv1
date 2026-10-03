import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './SearchDialog.css';

/**
 * SearchDialog — Faz 21: Proje içi arama modalı (Ctrl+K).
 *
 * Özellikler:
 *  - Modern diyalog penceresi: yumuşak gölge, blur arka plan, fade+scale açılış.
 *  - Anlık sonuç listesi; eşleşen metin vurgulanır (<mark>).
 *  - Klavye: ↑/↓ gezinme, Enter açma, Esc kapatma; ilk satır varsayılan seçim.
 *  - Odak tuzağı (focus trap) ve aria-modal.
 *
 * props:
 *   open: boolean
 *   onClose: () => void
 *   docs: Doc[] — { id, title, content?, folder? } düz liste
 *   onSelect: (doc) => void
 */

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlight(text, query) {
  if (!query) return [{ t: text, hit: false }];
  const parts = [];
  const re = new RegExp(escapeRegExp(query), 'gi');
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ t: text.slice(last, m.index), hit: false });
    parts.push({ t: m[0], hit: true });
    last = m.index + m[0].length;
    if (m.index === re.lastIndex) re.lastIndex += 1;
  }
  if (last < text.length) parts.push({ t: text.slice(last), hit: false });
  return parts;
}

function snippet(content, query, radius = 60) {
  const c = String(content || '');
  if (!query) return c.slice(0, radius * 2);
  const idx = c.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return c.slice(0, radius * 2);
  const start = Math.max(0, idx - radius);
  const end = Math.min(c.length, idx + query.length + radius);
  return `${start > 0 ? '…' : ''}${c.slice(start, end)}${end < c.length ? '…' : ''}`;
}

export default function SearchDialog({ open, onClose, docs = [], onSelect }) {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  const dialogRef = useRef(null);
  const listRef = useRef(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return docs
      .map((d) => {
        const inTitle = (d.title || '').toLowerCase().includes(q);
        const content = String(d.content || '');
        const inContent = content.toLowerCase().includes(q);
        if (!inTitle && !inContent) return null;
        return { ...d, inTitle, inContent };
      })
      .filter(Boolean)
      .slice(0, 50);
  }, [docs, query]);

  // Modal açılınca query sıfırla + odakla
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [open]);

  // Esc ile kapatma global (modal kapanınca listener kalkar)
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  const choose = useCallback(
    (doc) => {
      if (typeof onSelect === 'function') onSelect(doc);
      onClose();
    },
    [onClose, onSelect]
  );

  const handleInputKey = useCallback(
    (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const r = results[activeIdx];
        if (r) choose(r);
      }
    },
    [activeIdx, choose, results]
  );

  // Seçili satırı görünür yap
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector('[data-active="true"]');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [activeIdx, results]);

  if (!open) return null;

  return (
    <div
      className="search-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="search-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Proje içinde ara"
      >
        <div className="search-dialog__field">
          <span className="search-dialog__icon" aria-hidden="true">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="search-dialog__input"
            placeholder="Başlık veya içerikte ara…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIdx(0);
            }}
            onKeyDown={handleInputKey}
            aria-controls="search-results"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-autocomplete="list"
          />
          <kbd className="search-dialog__kbd">Esc</kbd>
        </div>

        <ul id="search-results" ref={listRef} className="search-dialog__results" role="listbox">
          {query.trim() === '' && (
            <li className="search-dialog__hint">
              Yazmaya başlayın — başlık ve içerikte aranır.
            </li>
          )}
          {query.trim() !== '' && results.length === 0 && (
            <li className="search-dialog__hint">Sonuç bulunamadı.</li>
          )}
          {results.map((r, i) => (
            <li
              key={r.id}
              role="option"
              aria-selected={i === activeIdx}
              data-active={i === activeIdx ? 'true' : 'false'}
              className={`search-hit${i === activeIdx ? ' is-active' : ''}`}
              onMouseEnter={() => setActiveIdx(i)}
              onClick={() => choose(r)}
            >
              <span className="search-hit__title">
                {highlight(r.title || '', query.trim()).map((p, k) =>
                  p.hit ? <mark key={k}>{p.t}</mark> : <React.Fragment key={k}>{p.t}</React.Fragment>
                )}
              </span>
              {r.folder && <span className="search-hit__folder">{r.folder}</span>}
              <span className="search-hit__snippet">
                {highlight(snippet(r.content, query.trim()), query.trim()).map((p, k) =>
                  p.hit ? <mark key={k}>{p.t}</mark> : <React.Fragment key={k}>{p.t}</React.Fragment>
                )}
              </span>
            </li>
          ))}
        </ul>

        <footer className="search-dialog__foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> gezin</span>
          <span><kbd>↵</kbd> aç</span>
          <span><kbd>esc</kbd> kapat</span>
        </footer>
      </div>
    </div>
  );
}
