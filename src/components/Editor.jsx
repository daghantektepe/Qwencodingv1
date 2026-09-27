import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import useAutosave from '../hooks/useAutosave.js';
import './Editor.css';

/**
 * Kelime ve karakter sayimi yapan yardimci fonksiyon.
 */
function countStats(text) {
  const trimmed = (text || '').trim();
  const words = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
  const chars = (text || '').length;
  return { words, chars };
}

/**
 * Otomatik kaydetme durumunu kullaniciya gosteren metin.
 */
function statusLabel(status, savedCount) {
  switch (status) {
    case 'dirty':
      return 'Değişiklikler…';
    case 'saving':
      return 'Kaydediliyor…';
    case 'saved':
      return `Kaydedildi ✓ (${savedCount})`;
    case 'error':
      return 'Kayıt hatası!';
    default:
      return '';
  }
}

/**
 * Editor — secili dokumanin icerigini gosteren/dizenleyen ana bilesen.
 * Faz 4: useAutosave ile otomatik disk kaydi + Ctrl+S elle kayit + durum rozeti.
 *
 * props:
 *   document: { id, title, content } | null — Binder'dan gelen aktif dokuman
 *   onChange?: (docId, newContent) => void — icerik degisikligi bildirimi (App state)
 */
export default function Editor({ document = null, onChange, ariaLabel = 'Manuscript editor' }) {
  const [content, setContent] = useState('');
  const textareaRef = useRef(null);
  const currentDocIdRef = useRef(null);

  // --- Otomatik kaydetme (Faz 4 tamamlanma kriteri: yazilan metin diske kaydolur) ---
  const { status, lastSavedAt, savedCount, flush, retry } = useAutosave({
    docId: document ? document.id : null,
    value: content,
    intervalMs: 2000,
  });

  // Dokuman degistiginde editor icerigini yukle (Binder secimi -> editor kriteri)
  useEffect(() => {
    if (!document) {
      currentDocIdRef.current = null;
      setContent('');
      return;
    }
    if (currentDocIdRef.current !== document.id) {
      currentDocIdRef.current = document.id;
      setContent(document.content || '');
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [document]);

  const handleChange = useCallback(
    (e) => {
      const value = e.target.value;
      setContent(value);
      if (document && typeof onChange === 'function') {
        onChange(document.id, value);
      }
    },
    [document, onChange]
  );

  // Ctrl+S / Cmd+S -> bekleyen debounce'u iptal edip hemen kaydet
  const handleKeyDown = useCallback(
    (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        flush();
      }
    },
    [flush]
  );

  // Bilesen sayfadan ayrilirken / dokuman kapanirken bekleyen kaydi flush et
  useEffect(() => {
    const beforeUnload = () => {
      flush();
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      flush();
    };
  }, [flush]);

  const stats = useMemo(() => countStats(content), [content]);

  const saveStatusText = statusLabel(status, savedCount);
  const lastSavedText = lastSavedAt
    ? new Date(lastSavedAt).toLocaleTimeString()
    : '';

  if (!document) {
    return (
      <section className="editor editor--empty" aria-label="Editor">
        <div className="editor-empty-state">
          <span className="editor-empty-icon" aria-hidden="true">✍️</span>
          <h2>Doküman seçilmedi</h2>
          <p>Binder'dan bir doküman seçtiğinizde içeriği burada açılır.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="editor" aria-label={`Editor - ${document.title}`}>
      <header className="editor-header">
        <div className="editor-title-wrap">
          <h2 className="editor-title">{document.title}</h2>
          <span
            className={`editor-save-badge editor-save-badge--${status}`}
            role="status"
            aria-live="polite"
          >
            {saveStatusText}
            {status === 'error' && (
              <button
                type="button"
                className="editor-retry-btn"
                onClick={retry}
                title="Kaydı tekrar dene"
              >
                Tekrar dene
              </button>
            )}
          </span>
        </div>
        <div className="editor-stats" role="status">
          <span>{stats.words} kelime</span>
          <span className="editor-stats-sep" aria-hidden="true">·</span>
          <span>{stats.chars} karakter</span>
          {lastSavedText && (
            <>
              <span className="editor-stats-sep" aria-hidden="true">·</span>
              <span>Son kayıt: {lastSavedText}</span>
            </>
          )}
        </div>
      </header>

      <textarea
        ref={textareaRef}
        className="editor-textarea"
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Yazmaya başlayın... (Ctrl+S ile hemen kaydedebilirsiniz)"
        spellCheck="true"
        aria-label={ariaLabel}
      />

      <footer className="editor-footer">
        <span className="editor-hint">
          İpucu: Değişiklikler her ~2 saniyede bir otomatik olarak yerel dosyaya kaydedilir · Tamamen yerel, bulut yok
        </span>
      </footer>
    </section>
  );
}
