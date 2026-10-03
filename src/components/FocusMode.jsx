import React, { useState, useEffect, useRef, useCallback } from 'react';
import './FocusMode.css';

/**
 * FocusMode — Faz 24: Dikkat Dağıtmayan Odak Modu (Zen) + Daktilo Kaydırma.
 *
 * Tam ekran katman olarak açılır; sol/sağ paneller Layout tarafından
 * gizlenir (data-focus-mode), burada yalnızca lüks kağıt ve tipografi kalır.
 *
 * Özellikler:
 *  - Yumuşak fade+scale geçişli tam ekran Zen katmanı.
 *  - Typewriter Scrolling: imleç satırı daima dikey merkezde sabitlenir
 *    (textarea'da gizli bir ölçüm div'i ile caret satırı pozisyonu bulunur).
 *  - Esc ile çıkış + sağ üstte yüzen çıkış düğmesi (imleç kenara gelince belirir).
 *  - Altta mini durum şeridi: kelime sayısı + kayıt rozeti (Editörle tutarlı).
 *  - prefers-reduced-motion: animasyonsuz yumuşak davranış.
 *
 * props:
 *   open: boolean
 *   onClose: () => void
 *   doc: { id, title, content } | null
 *   onChange?: (docId, content) => void
 *   onSaveNow?: (docId, content) => Promise<void> | void
 */

const SAVE_IDLE = 'idle';
const SAVE_TYPING = 'typing';
const SAVE_SAVING = 'saving';
const SAVE_SAVED = 'saved';

function countWords(text) {
  const t = String(text || '').trim();
  if (!t) return 0;
  return t.split(/\s+/).filter((tok) => /[\p{L}\p{N}]/u.test(tok)).length;
}

export default function FocusMode({ open, onClose, doc, onChange, onSaveNow }) {
  const [localContent, setLocalContent] = useState(doc?.content ?? '');
  const [saveState, setSaveState] = useState(SAVE_IDLE);
  const [typewriter, setTypewriter] = useState(true);

  const textareaRef = useRef(null);
  const mirrorRef = useRef(null);
  const typeTimerRef = useRef(null);
  const saveTimerRef = useRef(null);
  const savedFlashRef = useRef(null);

  // Doküman değişince senkronla; açılınca odakla
  useEffect(() => {
    if (open) {
      setLocalContent(doc?.content ?? '');
      setSaveState(SAVE_IDLE);
      const id = requestAnimationFrame(() => textareaRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [open, doc?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(
    () => () => {
      clearTimeout(typeTimerRef.current);
      clearTimeout(saveTimerRef.current);
      clearTimeout(savedFlashRef.current);
    },
    []
  );

  /**
   * Daktilo kaydırma: caret'ın bulunduğu satırın üstünü hesaplayıp
   * textarea scrollTop'u öyle ayarla ki satır dikey merkezde kalsın.
   * Gizli "mirror" div aynı font/boyut/padding ile metnin kopyasını tutar.
   */
  const syncTypewriterScroll = useCallback(() => {
    const ta = textareaRef.current;
    const mirror = mirrorRef.current;
    if (!ta || !mirror || !typewriter) return;

    const cs = window.getComputedStyle(ta);
    const styles = [
      'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing',
      'wordSpacing', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'borderTopWidth', 'borderBottomWidth', 'boxSizing', 'tabSize',
    ];
    styles.forEach((k) => {
      mirror.style[k] = cs[k];
    });
    mirror.style.width = `${ta.clientWidth}px`;
    mirror.textContent = ta.value.slice(0, ta.selectionStart ?? ta.value.length);

    const marker = mirror.querySelector('.fm-mirror-caret');
    const caretLineTop = marker ? marker.offsetTop : ta.scrollHeight;
    const target = Math.max(0, caretLineTop - (ta.clientHeight / 2 - parseFloat(cs.lineHeight || '24') / 2));
    ta.scrollTop = target;
  }, [typewriter]);

  /** Her yazma/kaydırma/selection sonrası merkezlemeyi tazele. */
  const keepCaretCentered = useCallback(() => {
    requestAnimationFrame(syncTypewriterScroll);
  }, [syncTypewriterScroll]);

  const handleChange = useCallback(
    (e) => {
      const value = e.target.value;
      setLocalContent(value);
      setSaveState(SAVE_TYPING);
      keepCaretCentered();

      clearTimeout(typeTimerRef.current);
      clearTimeout(saveTimerRef.current);

      typeTimerRef.current = setTimeout(() => {
        setSaveState(SAVE_SAVING);
        saveTimerRef.current = setTimeout(async () => {
          try {
            if (typeof onChange === 'function') await onChange(doc?.id, value);
          } finally {
            setSaveState(SAVE_SAVED);
            clearTimeout(savedFlashRef.current);
            savedFlashRef.current = setTimeout(() => setSaveState(SAVE_IDLE), 1800);
          }
        }, 150);
      }, 450);
    },
    [doc?.id, keepCaretCentered, onChange]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        clearTimeout(typeTimerRef.current);
        clearTimeout(saveTimerRef.current);
        setSaveState(SAVE_SAVING);
        (async () => {
          try {
            if (typeof onSaveNow === 'function') await onSaveNow(doc?.id, localContent);
            else if (typeof onChange === 'function') await onChange(doc?.id, localContent);
            setSaveState(SAVE_SAVED);
            clearTimeout(savedFlashRef.current);
            savedFlashRef.current = setTimeout(() => setSaveState(SAVE_IDLE), 1800);
          } catch {
            setSaveState(SAVE_IDLE);
          }
        })();
        return;
      }
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        const ta = textareaRef.current;
        if (!ta) return;
        const s = ta.selectionStart ?? 0;
        const en = ta.selectionEnd ?? 0;
        const next = localContent.slice(0, s) + '  ' + localContent.slice(en);
        setLocalContent(next);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = s + 2;
          ta.focus();
          keepCaretCentered();
        });
        if (typeof onChange === 'function') onChange(doc?.id, next);
      }
    },
    [doc?.id, keepCaretCentered, localContent, onClose, onChange, onSaveNow]
  );

  const words = countWords(localContent);

  const badgeText =
    saveState === SAVE_TYPING
      ? 'Yazılıyor…'
      : saveState === SAVE_SAVING
        ? 'Kaydediliyor…'
        : saveState === SAVE_SAVED
          ? 'Kaydedildi ✓'
          : 'Odak modu';

  if (!open) return null;

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
            onClick={() => {
              setTypewriter((v) => {
                const nv = !v;
                if (nv) requestAnimationFrame(syncTypewriterScroll);
                return nv;
              });
            }}
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
          <textarea
            ref={textareaRef}
            className="focusmode__surface"
            value={localContent}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onKeyUp={keepCaretCentered}
            onClick={keepCaretCentered}
            onSelect={keepCaretCentered}
            spellcheck="true"
            placeholder="Yalnızca siz ve metniniz…"
            aria-label={`${doc?.title ?? 'Doküman'} içeriği`}
          />
          {/* Ölçüm aynası: caret satırını hesaplamak için (erişilemez) */}
          <div ref={mirrorRef} className="focusmode__mirror" aria-hidden="true">
            <span className="fm-mirror-caret" />
          </div>
        </div>
      </main>

      {/* Alt mini durum şeridi */}
      <footer className="focusmode__statusbar">
        <span className={`fm-badge fm-badge--${saveState}`}>
          <span className="fm-badge__dot" aria-hidden="true" />
          {badgeText}
        </span>
        <span className="fm-count">
          <strong>{words.toLocaleString('tr-TR')}</strong> kelime
        </span>
      </footer>
    </div>
  );
}
