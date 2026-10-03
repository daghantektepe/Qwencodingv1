import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './Editor.css';
import { soundEngine } from '../utils/sound.js';

/**
 * Editor — Faz 19: Ana editör ve tipografi cilası (odak modu & daktilo deneyimi).
 *
 * Özellikler:
 *  - Ferah, okuma dostu "kâğıt" yüzeyi; serif gövde tipi, ideal satır yüksekliği.
 *  - Şık başlık alanı (doküman adı) + inline yeniden adlandırma.
 *  - Canlı kelime/karakter sayaç rozeti (editör sağ altta yüzen pill).
 *  - Otomatik kayıt durum rozeti: idle → typing → saving → saved yumuşak geçişli.
 *  - Odak (distraction-free) desteği: data-focus-mode attribute'ünde paneller
 *    Layout tarafından gizlenir; burada yalnızca kâğıt genişliği/ortalama değişir.
 *  - Sekme tuşu ile girinti (2 boşluk), Ctrl+S anında kaydet tetikleme.
 *
 * props:
 *   doc: { id, title, content } | null — aktif doküman
 *   onChange?: (docId, content) => void — içerik değişiminde (debounce üstte)
 *   onRename?: (docId, newTitle) => void
 *   onSaveNow?: (docId, content) => Promise<void> | void — Ctrl+S / hemen kaydet
 *   wordTarget?: number — hedef kelime sayısı (ilerleme için)
 *   focusMode?: boolean — dağıtım-disi mod ipucu (CSS'e data-attribute olarak geçer)
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

function fmt(n) {
  return Number(n || 0).toLocaleString('tr-TR');
}

/**
 * @param {object} props
 * @param {any} [props.doc]
 * @param {any} [props.document]
 * @param {((docId: string, content: string) => void)} [props.onChange]
 * @param {((docId: string, title: string) => void)} [props.onRename]
 * @param {((docId: string, content: string) => any)} [props.onSaveNow]
 * @param {number} [props.wordTarget]
 * @param {boolean} [props.focusMode]
 * @param {string} [props.ariaLabel]
 */
export default function Editor({
  doc = null,
  document = null,
  onChange = undefined,
  onRename = undefined,
  onSaveNow = undefined,
  wordTarget = 0,
  focusMode = false,
  ariaLabel = 'Manuscript editor',
}) {
  const activeDoc = doc || document;
  const [localContent, setLocalContent] = useState(activeDoc?.content ?? '');
  const [titleEditing, setTitleEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(activeDoc?.title ?? '');
  const [saveState, setSaveState] = useState(SAVE_IDLE);

  const textareaRef = useRef(null);
  const typeTimerRef = useRef(null);   // typing → (durursa) saving'e gecis
  const saveTimerRef = useRef(null);   // debounce'lu ust bildirim
  const savedFlashRef = useRef(null);  // 'saved' rozetinin geri donus timer'i

  // Doküman degistiginde yerel state'i senkronla
  useEffect(() => {
    setLocalContent(activeDoc?.content ?? '');
    setTitleDraft(activeDoc?.title ?? '');
    setSaveState(SAVE_IDLE);
  }, [activeDoc?.id]);

  // Temizlik
  useEffect(
    () => () => {
      clearTimeout(typeTimerRef.current);
      clearTimeout(saveTimerRef.current);
      clearTimeout(savedFlashRef.current);
    },
    []
  );

  const words = useMemo(() => countWords(localContent), [localContent]);
  const chars = localContent.length;
  const pct = wordTarget > 0 ? Math.min(100, Math.round((words / wordTarget) * 100)) : null;

  /** Üst bileşene içerik bildirimi + kayıt durum makinesi */
  const handleChange = useCallback(
    (e) => {
      const value = e.target.value;
      setLocalContent(value);
      setSaveState(SAVE_TYPING);

      if (activeDoc && typeof onChange === 'function') {
        onChange(activeDoc.id, value);
      }

      clearTimeout(typeTimerRef.current);
      clearTimeout(saveTimerRef.current);

      // 400ms sonra yumusak 'saving' ve 'saved' rozet animasyonu
      typeTimerRef.current = setTimeout(() => {
        setSaveState(SAVE_SAVING);
        saveTimerRef.current = setTimeout(() => {
          setSaveState(SAVE_SAVED);
          clearTimeout(savedFlashRef.current);
          savedFlashRef.current = setTimeout(() => setSaveState(SAVE_IDLE), 1800);
        }, 300);
      }, 400);
    },
    [activeDoc, onChange]
  );

  /** Ctrl/Cmd+S: bekleyen debounce'u iptal edip hemen kaydet */
  const handleKeyDown = useCallback(
    (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        clearTimeout(typeTimerRef.current);
        clearTimeout(saveTimerRef.current);
        setSaveState(SAVE_SAVING);
        const run = async () => {
          try {
            if (typeof onSaveNow === 'function') await onSaveNow(doc?.id, localContent);
            else if (typeof onChange === 'function') await onChange(doc?.id, localContent);
            setSaveState(SAVE_SAVED);
            clearTimeout(savedFlashRef.current);
            savedFlashRef.current = setTimeout(() => setSaveState(SAVE_IDLE), 1800);
          } catch {
            setSaveState(SAVE_IDLE);
          }
        };
        run();
        return;
      }

      // Ses Efektleri (Web Audio Daktilo Motoru)
      if (e.key === 'Enter') {
        soundEngine.playReturn();
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        soundEngine.playDelete();
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        soundEngine.playKey();
      }

      // Tab → 2 bosluk girinti (odak kaybetmeden)
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        const ta = textareaRef.current;
        if (!ta) return;
        const { selectionStart, selectionEnd } = ta;
        const next =
          localContent.slice(0, selectionStart) + '  ' + localContent.slice(selectionEnd);
        setLocalContent(next);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = selectionStart + 2;
          ta.focus();
        });
        if (activeDoc && typeof onChange === 'function') onChange(activeDoc.id, next);
      }
    },
    [activeDoc, localContent, onChange, onSaveNow]
  );

  const commitTitle = useCallback(() => {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== activeDoc?.title && typeof onRename === 'function') {
      onRename(activeDoc?.id, trimmed);
    }
    setTitleEditing(false);
  }, [activeDoc?.id, activeDoc?.title, onRename, titleDraft]);

  if (!activeDoc) {
    return (
      <section className="editor editor--empty" data-focus-mode={focusMode ? 'true' : undefined}>
        <div className="editor__placeholder">
          <span className="editor__placeholder-icon" aria-hidden="true">✍️</span>
          <h2>Yazmaya hazır</h2>
          <p>Binder'dan bir doküman seçin ya da yeni bir doküman oluşturun.</p>
        </div>
      </section>
    );
  }

  const badgeText =
    saveState === SAVE_TYPING
      ? 'Yazılıyor…'
      : saveState === SAVE_SAVING
        ? 'Kaydediliyor…'
        : saveState === SAVE_SAVED
          ? 'Kaydedildi ✓'
          : `Son kayıt otomatik`;

  return (
    <section
      className={`editor editor--${saveState}`}
      data-focus-mode={focusMode ? 'true' : undefined}
      aria-label="Doküman editörü"
    >
      <div className="editor__paper">
        {/* Başlık alanı */}
        <header className="editor__head">
          {titleEditing ? (
            <input
              className="editor__title-input"
              value={titleDraft}
              autoFocus
              aria-label="Doküman başlığı"
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitTitle();
                if (e.key === 'Escape') {
                  setTitleDraft(activeDoc.title);
                  setTitleEditing(false);
                }
              }}
            />
          ) : (
            <h1
              className="editor__title"
              tabIndex={0}
              role="button"
              title="Yeniden adlandırmak için çift tıklayın"
              onDoubleClick={() => setTitleEditing(true)}
              onKeyDown={(e) => {
                if (e.key === 'F2') setTitleEditing(true);
              }}
            >
              {activeDoc.title}
            </h1>
          )}

          {wordTarget > 0 && (
            <div className="editor__target" aria-label="Kelime hedefi ilerlemesi">
              <div
                className={`editor__target-bar${pct >= 100 ? ' is-done' : ''}`}
                style={{ width: `${pct}%` }}
              />
              <span className="editor__target-label">%{pct}</span>
            </div>
          )}
        </header>

        {/* Daktilo yüzeyi */}
        <textarea
          ref={textareaRef}
          className="editor__surface"
          value={localContent}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          spellCheck={true}
          placeholder="Yazmaya başlayın…"
          aria-label={ariaLabel || `${activeDoc.title} içeriği`}
        />

        {/* Yüzen durum + sayac rozetleri */}
        <footer className="editor__badges" aria-live="polite">
          <span className={`save-badge save-badge--${saveState}`}>
            <span className="save-badge__dot" aria-hidden="true" />
            {badgeText}
          </span>
          <span className="count-badge">
            <strong>{fmt(words)}</strong> kelime · {fmt(chars)} karakter
          </span>
        </footer>
      </div>
    </section>
  );
}
