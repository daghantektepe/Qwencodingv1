import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './CommandPalette.css';

/**
 * CommandPalette — Faz 25: Hızlı Komut Paleti (Ctrl+Shift+P / F1).
 *
 * Klavye dostu komut paleti: ↑/↓ gezinme, Enter çalıştır, Esc kapat.
 * Eylemleri anında tetikler; fuzzy benzeri alt-dize eşleşmesi + skorlama.
 *
 * props:
 *   open: boolean
 *   onClose: () => void
 *   commands: Command[] — { id, title, hint?, group?, shortcut?, run: () => void|Promise }
 */

function score(text, query) {
  if (!query) return 1;
  const t = text.toLocaleLowerCase('tr-TR');
  const q = query.toLocaleLowerCase('tr-TR');
  if (t.startsWith(q)) return 100 - t.length * 0.1;
  const idx = t.indexOf(q);
  if (idx >= 0) return 60 - idx * 0.5;
  // karakter sıralı süzülmüş eşleşme (subsequence)
  let ti = 0;
  let hits = 0;
  for (const ch of q) {
    const found = t.indexOf(ch, ti);
    if (found < 0) return -1;
    hits += 1;
    ti = found + 1;
  }
  return 20 + hits;
}

export default function CommandPalette({ open, onClose, commands = [] }) {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return commands;
    const scored = commands
      .map((c) => ({ c, s: Math.max(score(c.title, q), score(c.group || '', q) - 30) }))
      .filter(({ s }) => s > 0);
    scored.sort((a, b) => b.s - a.s);
    return scored.map(({ c }) => c);
  }, [commands, query]);

  // Açılınca sıfırla + odakla
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [open]);

  // Esc global
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  const runAt = useCallback(
    async (idx) => {
      const cmd = filtered[idx];
      if (!cmd) return;
      onClose();
      try {
        await cmd.run?.();
      } catch {
        /* sessiz */
      }
    },
    [filtered, onClose]
  );

  const handleInputKey = useCallback(
    (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => (filtered.length ? (i + 1) % filtered.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => (filtered.length ? (i - 1 + filtered.length) % filtered.length : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        runAt(activeIdx);
      }
    },
    [activeIdx, filtered.length, runAt]
  );

  // Seçili satırı görünürde tut
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector('[data-active="true"]');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [activeIdx, filtered]);

  if (!open) return null;

  return (
    <div
      className="cmd-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="cmd-palette" role="dialog" aria-modal="true" aria-label="Komut paleti">
        <div className="cmd-palette__field">
          <span className="cmd-palette__icon" aria-hidden="true">⌘</span>
          <input
            ref={inputRef}
            type="text"
            className="cmd-palette__input"
            placeholder="Komut ara veya yaz…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIdx(0);
            }}
            onKeyDown={handleInputKey}
            role="combobox"
            aria-expanded={filtered.length > 0}
            aria-controls="cmd-list"
            aria-autocomplete="list"
          />
          <kbd className="cmd-palette__kbd">Esc</kbd>
        </div>

        <ul id="cmd-list" ref={listRef} className="cmd-palette__list" role="listbox">
          {filtered.length === 0 && (
            <li className="cmd-palette__empty">Eşleşen komut yok.</li>
          )}
          {filtered.map((c, i) => (
            <li
              key={c.id}
              role="option"
              aria-selected={i === activeIdx}
              data-active={i === activeIdx ? 'true' : 'false'}
              className={`cmd-item${i === activeIdx ? ' is-active' : ''}`}
              onMouseEnter={() => setActiveIdx(i)}
              onClick={() => runAt(i)}
            >
              {c.group && <span className="cmd-item__group">{c.group}</span>}
              <span className="cmd-item__title">{c.title}</span>
              {c.hint && <span className="cmd-item__hint">{c.hint}</span>}
              {c.shortcut && (
                <span className="cmd-item__shortcut">
                  {c.shortcut.split('+').map((k) => (
                    <kbd key={k}>{k}</kbd>
                  ))}
                </span>
              )}
            </li>
          ))}
        </ul>

        <footer className="cmd-palette__foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> gezin</span>
          <span><kbd>↵</kbd> çalıştır</span>
          <span><kbd>esc</kbd> kapat</span>
        </footer>
      </div>
    </div>
  );
}
