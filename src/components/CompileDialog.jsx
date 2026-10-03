import React, { useState, useCallback, useMemo } from 'react';
import './CompileDialog.css';

/**
 * CompileDialog — Faz 21: Derleme (Compile) modalı.
 *
 * Scrivener tarzı: biçim + kapsam seçimi, önizleme özeti, "Derle" aksiyonu.
 * Modern diyalog cilası: section kartları, radyo kartlar, yumuşak geçişler.
 *
 * props:
 *   open: boolean
 *   onClose: () => void
 *   tree: Node[] — proje ağacı (kapsam listesi için düzleştirilir)
 *   onCompile?: (options) => Promise<void> | void
 *       options: { format, scopeId, includeSynopsis, titlePage, separator }
 */

const FORMATS = [
  { id: 'md', label: 'Markdown (.md)', desc: 'Düz metin, taşınabilir' },
  { id: 'html', label: 'HTML (.html)', desc: 'Tarayıcıda okuma, stilli' },
  { id: 'txt', label: 'Düz Metin (.txt)', desc: 'En sade biçim' },
  { id: 'epub', label: 'ePUB (.epub)', desc: 'E-kitap (planlandı)' },
];

function flatten(nodes, depth = 0, out = []) {
  for (const n of nodes || []) {
    out.push({ id: n.id, title: n.title, type: n.type || 'doc', depth });
    if (n.type === 'folder' && Array.isArray(n.children)) {
      flatten(n.children, depth + 1, out);
    }
  }
  return out;
}

export default function CompileDialog({
  open,
  onClose,
  tree = [],
  onCompile = null,
  projectId = 'default',
  projectName = 'OpenScriv Projesi',
}) {
  const [format, setFormat] = useState('md');
  const [scopeId, setScopeId] = useState('all');
  const [includeSynopsis, setIncludeSynopsis] = useState(false);
  const [titlePage, setTitlePage] = useState(true);
  const [separator, setSeparator] = useState('---');
  const [busy, setBusy] = useState(false);

  const flat = useMemo(() => flatten(tree), [tree]);
  const scopes = useMemo(
    () => [{ id: 'all', title: 'Tüm proje', type: 'root', depth: 0 }, ...flat],
    [flat]
  );

  const compile = useCallback(async () => {
    if (typeof onCompile !== 'function') {
      onClose();
      return;
    }
    setBusy(true);
    try {
      await onCompile({ format, scopeId, includeSynopsis, titlePage, separator });
      onClose();
    } finally {
      setBusy(false);
    }
  }, [format, includeSynopsis, onClose, onCompile, scopeId, separator, titlePage]);

  React.useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="compile-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="compile-dialog" role="dialog" aria-modal="true" aria-label="Proje Derle">
        <header className="compile-dialog__head">
          <h2>Derle ve Dışa Aktar</h2>
          <button type="button" className="compile-dialog__close" aria-label="Kapat" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="compile-dialog__body">
          <section className="compile-section">
            <h3 className="compile-section__title">Çıktı biçimi</h3>
            <div className="format-cards">
              {FORMATS.map((f) => (
                <label
                  key={f.id}
                  className={`format-card${format === f.id ? ' is-active' : ''}`}
                >
                  <input
                    type="radio"
                    name="compile-format"
                    value={f.id}
                    checked={format === f.id}
                    onChange={() => setFormat(f.id)}
                  />
                  <span className="format-card__label">{f.label}</span>
                  <span className="format-card__desc">{f.desc}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="compile-section">
            <h3 className="compile-section__title">Kapsam</h3>
            <select
              className="compile-select"
              value={scopeId}
              onChange={(e) => setScopeId(e.target.value)}
              aria-label="Derleme kapsamı"
            >
              {scopes.map((s) => (
                <option key={s.id} value={s.id}>
                  {'\u00A0\u00A0'.repeat(s.depth)}
                  {s.type === 'folder' ? '🗀 ' : s.type === 'root' ? '✦ ' : '📄 '}
                  {s.title}
                </option>
              ))}
            </select>
          </section>

          <section className="compile-section">
            <h3 className="compile-section__title">Seçenekler</h3>
            <label className="compile-check">
              <input
                type="checkbox"
                checked={titlePage}
                onChange={(e) => setTitlePage(e.target.checked)}
              />
              Kapak / başlık sayfası ekle
            </label>
            <label className="compile-check">
              <input
                type="checkbox"
                checked={includeSynopsis}
                onChange={(e) => setIncludeSynopsis(e.target.checked)}
              />
              Bölüm özetlerini dahil et
            </label>
            <label className="compile-field">
              <span>Bölüm ayracı</span>
              <input
                type="text"
                className="compile-separator"
                value={separator}
                onChange={(e) => setSeparator(e.target.value)}
                aria-label="Bölümler arası ayraç"
              />
            </label>
          </section>
        </div>

        <footer className="compile-dialog__foot">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Vazgeç
          </button>
          <button type="button" className="btn btn--primary" onClick={compile} disabled={busy}>
            {busy ? 'Derleniyor…' : 'Derle'}
          </button>
        </footer>
      </div>
    </div>
  );
}
