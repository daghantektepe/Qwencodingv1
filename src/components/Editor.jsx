import React, { useState, useEffect, useCallback, useMemo } from 'react';
import RichText from './RichText.jsx';
import './Editor.css';

/**
 * Editor — Ana metin editörü (Faz 31: Sahte zamanlayıcı kaldırıldı).
 *
 * p31-s1 değişiklikleri:
 *  - Artık kendi kendine "kaydedildi" taklidi yapan setTimeout YOK. Kayıt
 *    durumu tamamen App/useAutosave'in gerçek IPC-onaylı durum makinesinden
 *    (saveState: idle|dirty|saving|saved|error) gelir.
 *  - Yazım yüzeyi TipTap zengin metin (RichText); Ctrl+S App'te global.
 *  - Odak/dikkat çizgisi, kelime hedefi halkası ve canlı sayaç korunur.
 *
 * props:
 *   doc: { id, title, content?, contentHtml?, synopsis?, wordTarget? } | null
 *   onChange: (docId, plainText, html) => void         — her değişiklik (App debounce eder)
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
  onRename,
  wordTarget = 0,
  saveState = 'idle',
  lastSavedAt = null,
  ariaLabel = 'Metin editörü',
}) {
  const actualDoc = doc || document;
  const [titleDraft, setTitleDraft] = useState(actualDoc?.title ?? '');
  const [editingTitle, setEditingTitle] = useState(false);

  useEffect(() => {
    setTitleDraft(actualDoc?.title ?? '');
    setEditingTitle(false);
  }, [actualDoc?.id, actualDoc?.title]);

  const words = useMemo(() => countWords(actualDoc?.content ?? ''), [actualDoc?.content]);

  const ratio = wordTarget > 0 ? Math.min(1, words / wordTarget) : 0;
  const pct = Math.round(ratio * 100);

  const commitRename = useCallback(() => {
    setEditingTitle(false);
    const t = titleDraft.trim();
    if (actualDoc && t && t !== actualDoc.title && onRename) onRename(actualDoc.id, t);
    else setTitleDraft(actualDoc?.title ?? '');
  }, [actualDoc, onRename, titleDraft]);

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

      {/* --- Yazım yüzeyi (doküman başına yeniden kurulur: geri al geçmişi karışmaz) --- */}
      <RichText
        key={actualDoc.id}
        doc={actualDoc}
        onChange={onChange}
        className="editor__area"
        ariaLabel={ariaLabel || `${actualDoc.title} içeriği`}
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
