import React, { useState, useCallback, useMemo } from 'react';
import './CompileDialog.css';

/**
 * CompileDialog — Faz 12: Seçili dokümanları derleyip dışa aktarma arayüzü.
 *
 * electron/compile.js'deki IPC kanallarına bağlanır:
 *   - compile:run → derlenmiş içerik üretir (Markdown/HTML/Plain)
 *   - save-compiled-file → native Save Dialog ile diska yazar
 * Electron API yoksa (tarayıcı/geliştirme modu) Blob + <a download> fallback'ı kullanılır.
 *
 * props:
 *   open: boolean — dialog açık/kapalı
 *   tree: Node[] — proje ağacı (derlenecek veri)
 *   projectId: string — main process dosya taraması için
 *   projectName?: string — çıktı dosya adı önerisi
 *   onClose: () => void
 */

const FORMATS = [
  { id: 'markdown', label: 'Markdown (.md)', ext: 'md', mime: 'text/markdown;charset=utf-8' },
  { id: 'html', label: 'HTML (.html)', ext: 'html', mime: 'text/html;charset=utf-8' },
  { id: 'plain', label: 'Düz Metin (.txt)', ext: 'txt', mime: 'text/plain;charset=utf-8' },
];

/** Ağaçtan tüm dokümanları sırasıyla düzleştirir. */
function flattenDocs(nodes, out = []) {
  for (const n of nodes || []) {
    if (n.type === 'doc') out.push(n);
    if (n.type === 'folder' && Array.isArray(n.children)) flattenDocs(n.children, out);
  }
  return out;
}

export default function CompileDialog({ open, tree = [], projectId = 'default', projectName = 'OpenScriv Projesi', onClose }) {
  const [formatId, setFormatId] = useState('markdown');
  const [includeTitles, setIncludeTitles] = useState(true);
  const [selectedIds, setSelectedIds] = useState(null); // null => hepsi
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { ok, path?, error? } | { canceled }

  const allDocs = useMemo(() => flattenDocs(tree), [tree]);
  const activeIds = selectedIds ?? allDocs.map((d) => d.id);
  const selectedCount = activeIds.length;

  const toggleDoc = useCallback(
    (id) => {
      setSelectedIds((prev) => {
        const base = prev ?? allDocs.map((d) => d.id);
        return base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
      });
    },
    [allDocs]
  );

  const selectAll = useCallback(() => setSelectedIds(allDocs.map((d) => d.id)), [allDocs]);
  const selectNone = useCallback(() => setSelectedIds([]), []);

  // --- Renderer-tarafı fallback derleme (Electron yoksa, örn. tarayıcı modu) ---
  const localCompile = useCallback(
    (fmt) => {
      const docs = allDocs.filter((d) => activeIds.includes(d.id));
      const esc = (s) =>
        String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const wrapParas = (t) =>
        String(t ?? '')
          .split(/\n\s*\n/)
          .map((b) => {
            const x = b.trim();
            if (!x) return '';
            return `<p>${esc(x).replace(/\n/g, '<br />')}</p>`;
          })
          .filter(Boolean)
          .join('\n');

      if (fmt.id === 'html') {
        let html = `<!DOCTYPE html>\n<html lang="tr">\n<head>\n<meta charset="UTF-8" />\n<title>${esc(projectName)}</title>\n<style>body{font-family:Georgia,serif;max-width:720px;margin:40px auto;padding:0 20px;line-height:1.6}</style>\n</head>\n<body>\n<h1>${esc(projectName)}</h1>\n`;
        html += docs
          .map((d) => `${includeTitles ? `<h2>${esc(d.title)}</h2>\n` : ''}${wrapParas(d.content || '')}`)
          .join('\n<hr />\n');
        html += '\n</body>\n</html>';
        return html;
      }
      if (fmt.id === 'plain') {
        return (
          `${projectName}\n${'='.repeat(projectName.length)}\n\n` +
          docs
            .map(
              (d) =>
                `${includeTitles ? `${d.title}\n${'-'.repeat(d.title.length)}\n\n` : ''}${d.content || ''}`
            )
            .join('\n\n====================\n\n')
        );
      }
      // markdown
      return (
        `# ${projectName}\n\n` +
        docs
          .map((d) => `${includeTitles ? `## ${d.title}\n\n` : ''}${d.content || ''}`)
          .join('\n\n---\n\n')
      );
    },
    [allDocs, activeIds, includeTitles, projectName]
  );

  const browserDownload = useCallback((content, fileName, mime) => {
    try {
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      return { ok: true, path: fileName };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, []);

  const handleCompile = useCallback(async () => {
    if (busy || selectedCount === 0) return;
    setBusy(true);
    setResult(null);
    const fmt = FORMATS.find((f) => f.id === formatId) || FORMATS[0];
    try {
      // API çözümleme: window.api önce, sonra window.electronAPI
      const api = typeof window !== 'undefined' ? (window.api || window.electronAPI) : null;

      if (api?.invoke) {
        // 1) Derle (electron/compile.js: 'compile:run')
        const compiled = await api.invoke('compile:run', {
          projectId,
          tree,
          docIds: activeIds,
          format: fmt.id,
          projectName,
          options: { includeTitle: includeTitles },
        });
        if (!compiled?.ok) {
          setResult({ ok: false, error: compiled?.error || 'Derleme başarısız.' });
          setBusy(false);
          return;
        }

        // 2) Kaydet (native Save Dialog)
        const saveRes = await api.invoke('save-compiled-file', {
          content: compiled.compiled.content,
          fileName: compiled.compiled.fileName,
          filterName: fmt.label,
          extensions: [fmt.ext],
        });
        if (saveRes?.ok) {
          setResult({ ok: true, path: saveRes.path });
        } else if (saveRes?.canceled) {
          setResult({ canceled: true });
        } else {
          setResult({ ok: false, error: saveRes?.error || 'Dosya kaydedilemedi.' });
        }
      } else {
        // Tarayıcı/geliştirme modu: yerel derleme + indirme
        const content = localCompile(fmt);
        const dl = browserDownload(content, `${projectName.replace(/[\\/:*?"<>|]/g, '_')}.${fmt.ext}`, fmt.mime);
        setResult(dl);
      }
    } catch (err) {
      setResult({ ok: false, error: err.message || 'Beklenmeyen hata.' });
    } finally {
      setBusy(false);
    }
  }, [busy, selectedCount, formatId, projectId, tree, activeIds, projectName, includeTitles, localCompile, browserDownload]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && !busy) onClose?.();
  };

  if (!open) return null;

  return (
    <div
      className="compile-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Proje Derle"
      onKeyDown={handleKeyDown}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose?.();
      }}
    >
      <div className="compile-dialog">
        <header className="compile-dialog__header">
          <h2>Derle ve Dışa Aktar</h2>
          <button type="button" className="compile-close" onClick={onClose} disabled={busy} aria-label="Kapat">
            ×
          </button>
        </header>

        <div className="compile-dialog__body">
          {/* Format seçimi */}
          <section className="compile-field">
            <span className="compile-field__label">Çıktı Formatı</span>
            <div className="compile-formats" role="radiogroup" aria-label="Format seçimi">
              {FORMATS.map((f) => (
                <label key={f.id} className={`compile-format${formatId === f.id ? ' compile-format--active' : ''}`}>
                  <input
                    type="radio"
                    name="compile-format"
                    value={f.id}
                    checked={formatId === f.id}
                    onChange={() => setFormatId(f.id)}
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </section>

          {/* Seçenekler */}
          <section className="compile-field">
            <label className="compile-checkbox">
              <input type="checkbox" checked={includeTitles} onChange={(e) => setIncludeTitles(e.target.checked)} />
              Doküman başlıklarını dahil et
            </label>
          </section>

          {/* Doküman seçimi */}
          <section className="compile-field">
            <div className="compile-docs-head">
              <span className="compile-field__label">Dokümanlar ({selectedCount}/{allDocs.length})</span>
              <span className="compile-docs-actions">
                <button type="button" className="compile-link-btn" onClick={selectAll}>
                  Tümü
                </button>
                <button type="button" className="compile-link-btn" onClick={selectNone}>
                  Hiçbiri
                </button>
              </span>
            </div>
            <ul className="compile-docs" aria-label="Derlenecek dokümanlar">
              {allDocs.length === 0 && <li className="compile-docs-empty">Henüz doküman yok.</li>}
              {allDocs.map((d) => (
                <li key={d.id}>
                  <label className="compile-doc-item">
                    <input
                      type="checkbox"
                      checked={activeIds.includes(d.id)}
                      onChange={() => toggleDoc(d.id)}
                    />
                    📄 {d.title}
                  </label>
                </li>
              ))}
            </ul>
          </section>

          {/* Sonuç mesajı */}
          {result && (
            <div
              className={`compile-result${result.ok ? ' compile-result--ok' : result.canceled ? ' compile-result--info' : ' compile-result--error'}`}
              role="status"
            >
              {result.ok
                ? `✓ Dosya kaydedildi: ${result.path}`
                : result.canceled
                  ? 'İşlem iptal edildi.'
                  : `✗ Hata: ${result.error}`}
            </div>
          )}
        </div>

        <footer className="compile-dialog__footer">
          <button type="button" className="compile-btn compile-btn--secondary" onClick={onClose} disabled={busy}>
            Vazgeç
          </button>
          <button
            type="button"
            className="compile-btn compile-btn--primary"
            onClick={handleCompile}
            disabled={busy || selectedCount === 0}
          >
            {busy ? 'Derleniyor…' : 'Derle'}
          </button>
        </footer>
      </div>
    </div>
  );
}
