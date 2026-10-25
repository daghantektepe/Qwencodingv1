import React, { useState, useMemo, useEffect } from 'react';
import './CompileDialog.css';

/**
 * CompileDialog — Projeyi Derle ve Dışa Aktar sihirbazı (Faz 31).
 *
 * p31-s7: Entegrasyon smoke testi `data-testid="compile-dialog"` arar; bu
 * testid DİYALOG AÇIKKEN kök node'da bulunur (kapalıyken render edilmez).
 * App.tsx'teki compile-button tıklaması open=true getirir → dialog DOM'a girer.
 *
 * props:
 *   open: boolean
 *   onClose: () => void
 *   tree: TreeNode[]                       — kapsam seçimi için
 *   onCompile: (options) => void|Promise   — derleme tetikleme
 */

const FORMATS = [
  { id: 'txt', label: 'Düz Metin (.txt)' },
  { id: 'md', label: 'Markdown (.md)' },
  { id: 'html', label: 'HTML (.html)' },
];

function collectScopeOptions(tree) {
  const options = [{ id: 'all', label: 'Tüm Proje' }];
  const walk = (nodes, depth) => {
    for (const n of nodes) {
      options.push({ id: n.id, label: `${' '.repeat(depth * 2)}${n.title}` });
      if (n.children) walk(n.children, depth + 1);
    }
  };
  walk(tree || [], 0);
  return options;
}

export default function CompileDialog({ open, onClose, tree, onCompile }) {
  const [format, setFormat] = useState('md');
  const [scopeId, setScopeId] = useState('all');
  const [busy, setBusy] = useState(false);
  // { ok: boolean, message: string } | null
  const [result, setResult] = useState(null);

  const scopeOptions = useMemo(() => collectScopeOptions(tree), [tree]);

  useEffect(() => {
    if (open) setResult(null);
  }, [open]);

  if (!open) return null;

  const handleCompile = async () => {
    setBusy(true);
    setResult(null);
    try {
      if (onCompile) {
        await onCompile({ format, scopeId });
        setResult({ ok: true, message: '✓ Derleme tamamlandı.' });
        return;
      }
      const api = typeof window !== 'undefined' ? (window.electronAPI || window.api) : null;
      if (!api?.compileRun || !api.saveCompiledFile) {
        setResult({ ok: false, message: 'Derleme yalnızca masaüstü uygulamasında kullanılabilir.' });
        return;
      }
      const mappedFormat = format === 'md' ? 'markdown' : format === 'txt' ? 'plain' : format;
      const docIds = scopeId && scopeId !== 'all' ? [scopeId] : undefined;
      const res = await api.compileRun({
        projectId: 'default',
        tree,
        docIds,
        format: mappedFormat,
        projectName: 'OpenScriv Projesi',
      });
      if (!res?.ok) throw new Error(res?.error || 'Derleme başarısız.');
      const saved = await api.saveCompiledFile({
        content: res.compiled.content,
        fileName: res.compiled.fileName,
      });
      if (saved?.canceled) return;
      if (!saved?.ok) throw new Error(saved?.error || 'Dosya kaydedilemedi.');
      setResult({ ok: true, message: `✓ ${res.compiled.docCount} doküman derlendi: ${saved.path}` });
    } catch (err) {
      setResult({ ok: false, message: err.message || 'Derleme başarısız.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="compile-overlay"
      data-testid="compile-dialog"
      role="dialog"
      aria-modal="true"
      aria-label="Proje Derle"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="compile-backdrop" onClick={onClose} aria-hidden="true" />
      <section className="compile-card">
        <header className="compile-head">
          <h2>Derle ve Dışa Aktar</h2>
          <button type="button" className="compile-close" onClick={onClose} aria-label="Kapat">
            ×
          </button>
        </header>

        <div className="compile-body">
          <label className="compile-field">
            <span>Dışa Aktarma Biçimi</span>
            <select
              value={format}
              data-testid="compile-format"
              onChange={(e) => setFormat(e.target.value)}
            >
              {FORMATS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>

          <label className="compile-field">
            <span>Kapsam</span>
            <select
              value={scopeId}
              data-testid="compile-scope"
              onChange={(e) => setScopeId(e.target.value)}
            >
              {scopeOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          {result && (
            <p
              className={result.ok ? 'compile-done' : 'compile-error'}
              role="status"
              style={result.ok ? undefined : { color: 'var(--danger, #b3261e)' }}
            >
              {result.message}
            </p>
          )}
        </div>

        <footer className="compile-foot">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Vazgeç
          </button>
          <button
            type="button"
            className="btn btn--primary"
            data-testid="compile-run"
            disabled={busy}
            onClick={handleCompile}
          >
            {busy ? 'Derleniyor…' : 'Derle'}
          </button>
        </footer>
      </section>
    </div>
  );
}
