import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './Editor.css';

/**
 * Editor — Ana metin editörü (Faz 31: Sahte zamanlayıcı kaldırıldı).
 *
 * p31-s1 değişiklikleri:
 *  - Artık kendi kendine "kaydedildi" taklidi yapan setTimeout YOK. Kayıt
 *    durumu tamamen App/useAutosave'in gerçek IPC-onaylı durum makinesinden
 *    (saveState: idle|dirty|saving|saved|error) gelir.
 *  - Ctrl+S → onSaveNow ile anında flush tetikler.
 *  - Odak/dikkat çizgisi, kelime hedefi halkası ve canlı sayaç korunur.
 *
 * props:
 *   doc: { id, title, content?, synopsis?, wordTarget? } | null
 *   onChange: (docId, content) => void                 — her keystroke (App debounce eder)
 *   onSaveNow: (docId, content) => void                — Ctrl+S / buton: flush iste
 *   onRename: (docId, title) => void
 *   wordTarget: number                                 — 0 = hedef yok
 *   saveState: 'idle'|'dirty'|'saving'|'saved'|'error' — dış durum makinesi
 *   lastSavedAt: string|null                           — ISO
 */

const STATE_LABELS = {
  idle: '',
  dirty: 'Değişiklikler bekliyor…',
  saving: 'Kaydediliyor…',
  saved: 'Kaydedildi ✓',
  error: 'Kayıt hatası! Yeniden deneniyor mu?',
};

function countWords(text) {
  if (!text) return 0;
  const m = text.trim().match(/\S+/g);
  return m ? m.length : 0;
}

export default function Editor({
  doc,
  document,
  onChange,
  onSaveNow,
  onRename,
  wordTarget = 0,
  saveState = 'idle',
  lastSavedAt = null,
  ariaLabel = 'Manuscript editor',
}) {
  const actualDoc = doc || document;
  const taRef = useRef(null);
  const [titleDraft, setTitleDraft] = useState(actualDoc?.title ?? '');
  const [editingTitle, setEditingTitle] = useState(false);

  useEffect(() => {
    setTitleDraft(actualDoc?.title ?? '');
    setEditingTitle(false);
  }, [actualDoc?.id, actualDoc?.title]);

  const words = useMemo(() => countWords(actualDoc?.content ?? ''), [actualDoc?.content]);

  const ratio = wordTarget > 0 ? Math.min(1, words / wordTarget) : 0;
  const pct = Math.round(ratio * 100);

  const handleChange = useCallback(
    (e) => {
      if (actualDoc && onChange) onChange(actualDoc.id, e.target.value);
    },
    [actualDoc, onChange]
  );

  const commitRename = useCallback(() => {
    setEditingTitle(false);
    const t = titleDraft.trim();
    if (actualDoc && t && t !== actualDoc.title && onRename) onRename(actualDoc.id, t);
    else setTitleDraft(actualDoc?.title ?? '');
  }, [actualDoc, onRename, titleDraft]);

  const handleKeyDown = useCallback(
    (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        if (actualDoc && onSaveNow) onSaveNow(actualDoc.id, actualDoc.content ?? '');
      }
      // Sekme: iki boşluk olarak girsin (roman yazımı için yaygın tercih)
      if (e.key === 'Tab' && e.target === taRef.current) {
        e.preventDefault();
        const ta = taRef.current;
        const s = ta.selectionStart;
        const en = ta.selectionEnd;
        const val = ta.value;
        const next = `${val.slice(0, s)}  ${val.slice(en)}`;
        if (actualDoc && onChange) onChange(actualDoc.id, next);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = s + 2;
        });
      }
    },
    [actualDoc, onChange, onSaveNow]
  );

  if (!actualDoc) {
    return (
      <div className="editor editor--empty" data-testid="editor-empty">
        <p>Sol panelden bir doküman seç ya da <kbd>Ctrl+N</kbd> ile yenisini oluştur.</p>
      </div>
    );
  }

  return (
    <div className="editor" data-testid="editor-root">
      {/* --- Başlık satırı + kayıt durumu rozeti --- */}
      <header className="editor__head">
        {editingTitle ? (
          <input
            className="editor__title-input"
            value={titleDraft}
            autoFocus
            aria-label="Doküman başlığı"
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') {
                setTitleDraft(actualDoc.title);
                setEditingTitle(false);
              }
            }}
          />
        ) : (
          <h2
            className="editor__title"
            title="Yeniden adlandırmak için çift tık"
            onDoubleClick={() => setEditingTitle(true)}
          >
            {actualDoc.title}
          </h2>
        )}

        <div
          className={`editor__save editor__save--${saveState}`}
          data-testid="save-state"
          role="status"
          aria-live="polite"
        >
          <span className="editor__save-dot" aria-hidden="true" />
          <span className="editor__save-text">
            {STATE_LABELS[saveState] || ''}
            {saveState === 'saved' && lastSavedAt && (
              <time className="editor__save-time">
                {' '}
                {new Date(lastSavedAt).toLocaleTimeString('tr-TR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </time>
            )}
          </span>
        </div>
      </header>

      {/* --- Yazım yüzeyi --- */}
      <textarea
        ref={taRef}
        className="editor__area"
        value={actualDoc.content ?? ''}
        placeholder="Boş sayfaya ilk cümleni bırak…"
        spellCheck="true"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel || `${actualDoc.title} içeriği`}
        data-testid="editor-textarea"
      />

      {/* --- Alt şerit: kelime sayacı + hedef halkası --- */}
      <footer className="editor__foot">
        <span className="editor__count" data-testid="word-count">
          {words.toLocaleString('tr-TR')} kelime
          {wordTarget > 0 ? ` / ${wordTarget.toLocaleString('tr-TR')}` : ''}
        </span>

        {wordTarget > 0 && (
          <span
            className="editor__target"
            style={{ '--ring': `${ratio * 360}deg` }}
            title={`Hedefin %${pct}'i tamam`}
            data-testid="target-ring"
          >
            <svg viewBox="0 0 36 36" aria-hidden="true">
              <circle className="editor__ring-bg" cx="18" cy="18" r="15.9" fill="none" />
              <circle
                className="editor__ring-fg"
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                strokeDasharray={`${ratio * 100} 100`}
              />
            </svg>
            <em>%{pct}</em>
          </span>
        )}
      </footer>
    </div>
  );
}
