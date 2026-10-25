import React, { useState, useEffect } from 'react';
import RichText from './RichText.jsx';
import './FocusMode.css';

/**
 * FocusMode — Faz 24: Dikkat Dağıtmayan Odak Modu (Zen) + Daktilo Kaydırma.
 *
 * Tam ekran katman olarak açılır; burada yalnızca kağıt ve tipografi kalır.
 *
 * Özellikler:
 *  - Editörle aynı zengin metin yüzeyi (RichText); biçimlendirme korunur.
 *  - Typewriter Scrolling: imleç satırı daima dikey merkezde sabitlenir.
 *  - Esc ile çıkış + sağ üstte yüzen çıkış düğmesi.
 *  - Altta mini durum şeridi: kelime sayısı + App'in gerçek kayıt durumu.
 *
 * props:
 *   open: boolean
 *   onClose: () => void
 *   doc: { id, title, content, contentHtml? } | null
 *   onChange?: (docId, plainText, html) => void
 *   saveState?: 'idle'|'dirty'|'saving'|'saved'|'error'
 */

const BADGE_TEXT = {
  idle: 'Odak modu',
  dirty: 'Değişiklikler bekliyor…',
  saving: 'Kaydediliyor…',
  saved: 'Kaydedildi ✓',
  error: 'Kayıt hatası!',
};

function countWords(text) {
  const t = String(text || '').trim();
  if (!t) return 0;
  return t.split(/\s+/).filter((tok) => /[\p{L}\p{N}]/u.test(tok)).length;
}

export default function FocusMode({ open, onClose, doc, onChange, saveState = 'idle' }) {
  const [typewriter, setTypewriter] = useState(true);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const words = countWords(doc?.content);

  return (
    <div className="focusmode" role="dialog" aria-modal="true" aria-label="Odak modu">
      {/* Üst yüzen kontroller — fare üzerine gelince parlar */}
      <header className="focusmode__chrome">
        <span className="focusmode__title">{doc?.title ?? 'Odak modu'}</span>
        <div className="focusmode__controls">
          <button
            type="button"
            className={`fm-toggle${typewriter ? ' is-on' : ''}`}
            aria-pressed={typewriter}
            title="Daktilo kaydırma (imleci dikey ortada sabitler)"
            onClick={() => setTypewriter((v) => !v)}
          >
            ⌶ Daktilo
          </button>
          <button
            type="button"
            className="fm-exit"
            onClick={onClose}
            aria-label="Odak modundan çık (Esc)"
            title="Çık — Esc"
          >
            ✕ <span>Çık</span>
          </button>
        </div>
      </header>

      {/* Kağıt yüzeyi */}
      <main className="focusmode__stage">
        <div className="focusmode__paper">
          {doc && (
            <RichText
              key={doc.id}
              doc={doc}
              onChange={onChange}
              className="focusmode__surface"
              ariaLabel={`${doc.title ?? 'Doküman'} içeriği`}
              placeholder="Yalnızca siz ve metniniz…"
              toolbar={false}
              typewriter={typewriter}
              autoFocus
            />
          )}
        </div>
      </main>

      {/* Alt mini durum şeridi */}
      <footer className="focusmode__statusbar">
        <span className={`fm-badge fm-badge--${saveState}`}>
          <span className="fm-badge__dot" aria-hidden="true" />
          {BADGE_TEXT[saveState] || BADGE_TEXT.idle}
        </span>
        <span className="fm-count">
          <strong>{words.toLocaleString('tr-TR')}</strong> kelime
        </span>
      </footer>
    </div>
  );
}
