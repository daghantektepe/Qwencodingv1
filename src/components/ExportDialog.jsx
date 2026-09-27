import React, { useState, useCallback, useMemo } from 'react';
import './ExportDialog.css';

/**
 * ExportDialog — Faz 8: Synthesis & Compile arayuzu.
 *
 * Kullanicinin derleme seceneklerini (basliklar, siralama, ayraclar) ve
 * formati (PDF/DOCX/HTML/MD/TXT/EPUB) secip tek bir dosya olarak disa
 * aktarmasini saglar. Gercek uretim src/utils/exporters.js icindedir.
 *
 * props:
 *   open: boolean                     — dialog acik/kapali
 *   tree: Node[]                      — proje agaci (derlenecek veri)
 *   projectName?: string              — cikti dosyasi adi onerisi
 *   onClose: () => void               — kapatma callback'i
 */

const FORMATS = [
  { id: 'md', label: 'Markdown (.md)' },
  { id: 'txt', label: 'Düz Metin (.txt)' },
  { id: 'html', label: 'HTML (.html)' },
  { id: 'pdf', label: 'PDF (.pdf)' },
  { id: 'docx', label: 'Word (.docx)' },
  { id: 'epub', label: 'ePUB (.epub)' },
];

export default function ExportDialog({ open, tree = [], projectName = 'OpenScriv Projesi', onClose }) {
  const [formatId, setFormatId] = useState('md');
  const [includeTitles, setIncludeTitles] = useState(true);
  const [separatorMode, setSeparatorMode] = useState('pagebreak'); // none | hr | pagebreak
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { ok, path?, error? }

  const docCount = useMemo(() => countDocs(tree), [tree]);

  const handleCompile = useCallback(async () => {
    if (!open || busy) return;
    setBusy(true);
    setResult(null);
    try {
      // exporters.js dinamik yuklenir — paket bagimliliklari yalnizca gerektiginde
      const { exportProject } = await import('../utils/exporters.js');
      const separator =
        separatorMode === 'none'
          ? '\n\n'
          : separatorMode === 'hr'
            ? '\n\n---\n\n'
            : '\n\n\\pagebreak\n\n';
      const res = await exportProject(tree, {
        formatId,
        projectName,
        options: { includeTitle: includeTitles, separator },
      });
      setResult(res);
    } catch (err) {
      setResult({ ok: false, error: err?.message || String(err) });
    } finally {
      setBusy(false);
    }
  }, [open, busy, tree, formatId, projectName, includeTitles, separatorMode]);

  // ESC ile kapatma
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && !busy) onClose?.();
  };

  if (!open) return null;

  return (
    <div
      className="export-dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Proje Derle / Dışa Aktar"
      onKeyDown={handleKeyDown}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose?.();
      }}
    >
      <div className="export-dialog">
        <header className="export-dialog__header">
          <h2>Derle ve Dışa Aktar</h2>
          <button
            type="button"
            className="export-dialog__close"
            onClick={onClose}
            disabled={busy}
            aria-label="Kapat"
          >
            ×
          </button>
        </header>

        <div className="export-dialog__body">
          {/* Format secimi */}
          <section className="export-field">
            <span className="export-field__label">Çıktı Formatı</span>
            <div className="export-formats" role="radiogroup" aria-label="Format seçimi">
              {FORMATS.map((f) => (
                <label
                  key={f.id}
                  className={`export-format-option${formatId === f.id ? ' export-format-option--active' : ''}`}
                >
                  <input
                    type="radio"
                    name="export-format"
                    value={f.id}
                    checked={formatId === f.id}
                    onChange={() => setFormatId(f.id)}
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </section>

          {/* Secenekler */}
          <section className="export-field">
            <span className="export-field__label">Seçenekler</span>
            <label className="export-checkbox">
              <input
                type="checkbox"
                checked={includeTitles}
                onChange={(e) => setIncludeTitles(e.target.checked)}
              />
              Doküman başlıklarını dahil et
            </label>
            <label className="export-subfield" htmlFor="export-separator">
              Doküman ayracı
            </label>
            <select
              id="export-separator"
              className="export-select"
              value={separatorMode}
              onChange={(e) => setSeparatorMode(e.target.value)}
            >
              <option value="none">Yok</option>
              <option value="hr">Çizgi (—)</option>
              <option value="pagebreak">Sayfa sonu (PDF/DOCX'te anlamlı)</option>
            </select>
          </section>

          {/* Ozet */}
          <section className="export-summary">
            Toplam <strong>{docCount}</strong> doküman · “{projectName}” adıyla derlenecek.
          </section>

          {/* Sonuc mesaji */}
          {result && (
            <div
              className={`export-result${result.ok ? ' export-result--ok' : ' export-result--error'}`}
              role="status"
            >
              {result.ok
                ? `✓ Kaydedildi: ${result.path}${result.method === 'browser' ? ' (indirildi)' : ''}`
                : result.canceled
                  ? 'İşlem iptal edildi.'
                  : `✗ Hata: ${result.error}`}
            </div>
          )}
        </div>

        <footer className="export-dialog__footer">
          <button type="button" className="export-btn export-btn--secondary" onClick={onClose} disabled={busy}>
            Vazgeç
          </button>
          <button
            type="button"
            className="export-btn export-btn--primary"
            onClick={handleCompile}
            disabled={busy || docCount === 0}
          >
            {busy ? 'Derleniyor…' : 'Derle'}
          </button>
        </footer>
      </div>
    </div>
  );
}

function countDocs(nodes) {
  let n = 0;
  const walk = (list) => {
    for (const node of list || []) {
      if (node.type === 'doc') n += 1;
      if (node.type === 'folder' && Array.isArray(node.children)) walk(node.children);
    }
  };
  walk(nodes);
  return n;
}
