import React, { useState, useEffect, useMemo, useRef } from 'react';
import './Scratchpad.css';

/**
 * Scratchpad — Faz 28: Yüzen Karalama Alanı & Hızlı Not Defteri.
 *
 * Yazarın ana taslaktan kopmadan anlık fikirler, replikler ve araştırma
 * kırıntıları için sağ altta açılan kayar çekmece. Sarı/fildişi post-it
 * estetiği; her not bağımsız otomatik kayıt (localStorage); aktif dokümana
 * "Taslağa Gönder" ile tek tıkla aktarım.
 *
 * props:
 *   open: boolean
 *   onClose: () => void
 *   notes: Array<{ id, text, color, updated }>      — App'den gelen kalıcı notlar
 *   onChangeNotes: (next) => void                    — not listesi güncelleyici
 *   activeDocId: string | null
 *   activeDocTitle: string | null
 *   onSendToDraft: (noteId: string, text: string) => void
 */

const COLORS = ['yellow', 'ivory', 'mint', 'rose'];

function makeNoteId() {
  return `n-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export default function Scratchpad({
  open,
  onClose,
  notes = [],
  onChangeNotes,
  activeDocId = null,
  activeDocTitle = null,
  onSendToDraft,
}) {
  const [filter, setFilter] = useState('');
  const [flashId, setFlashId] = useState(null); // "gönderildi" animasyonu
  const firstNewRef = useRef(null);

  // Esc ile kapat
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

  // Yeni not eklendiğinde başlığı odakla
  useEffect(() => {
    if (firstNewRef.current) {
      const el = document.getElementById(firstNewRef.current);
      if (el) el.focus();
      firstNewRef.current = null;
    }
  });

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => (n.text || '').toLowerCase().includes(q));
  }, [notes, filter]);

  const addNote = () => {
    const note = {
      id: makeNoteId(),
      text: '',
      color: COLORS[notes.length % COLORS.length],
      updated: new Date().toISOString(),
    };
    firstNewRef.current = `sticky-text-${note.id}`;
    onChangeNotes([note, ...notes]);
  };

  const updateNoteText = (id, text) => {
    onChangeNotes(
      notes.map((n) => (n.id === id ? { ...n, text, updated: new Date().toISOString() } : n))
    );
  };

  const cycleColor = (id) => {
    onChangeNotes(
      notes.map((n) => {
        if (n.id !== id) return n;
        const idx = COLORS.indexOf(n.color);
        return { ...n, color: COLORS[(idx + 1) % COLORS.length] };
      })
    );
  };

  const removeNote = (id) => {
    onChangeNotes(notes.filter((n) => n.id !== id));
  };

  const sendToDraft = (note) => {
    if (!activeDocId || !note.text.trim()) return;
    onSendToDraft(note.id, note.text.trim());
    setFlashId(note.id);
    setTimeout(() => setFlashId((cur) => (cur === note.id ? null : cur)), 900);
  };

  if (!open) return null;

  return (
    <div className="scratch" role="complementary" aria-label="Hızlı not defteri">
      <header className="scratch__head">
        <h3>🗒️ Karalama</h3>
        <input
          type="search"
          className="scratch__search"
          placeholder="Notlarda ara…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Notlarda ara"
        />
        <button type="button" className="btn btn--primary" onClick={addNote}>
          + Yeni Not
        </button>
        <button
          type="button"
          className="scratch__close"
          onClick={onClose}
          aria-label="Kapat (Ctrl+Shift+N)"
        >
          ×
        </button>
      </header>

      <div className="scratch__body">
        {filtered.length === 0 && (
          <div className="scratch__empty">
            Henüz not yok — aklına geleni buraya bırak, taslağa sonra gönderirsin.
          </div>
        )}
        <ul className="sticky-wall">
          {filtered.map((n) => (
            <li
              key={n.id}
              className={`sticky sticky--${n.color}${flashId === n.id ? ' is-sent' : ''}`}
            >
              <textarea
                id={`sticky-text-${n.id}`}
                className="sticky__text"
                value={n.text}
                placeholder="Bir fikir, bir replik, bir kırpıntı…"
                onChange={(e) => updateNoteText(n.id, e.target.value)}
                aria-label="Not metni"
              />
              <footer className="sticky__foot">
                <button
                  type="button"
                  className="sticky__color"
                  onClick={() => cycleColor(n.id)}
                  title="Rengi değiştir"
                  aria-label="Rengi değiştir"
                >
                  ◐
                </button>
                <span className="sticky__time">
                  {new Date(n.updated).toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="sticky__actions">
                  <button
                    type="button"
                    className="btn btn--tiny"
                    disabled={!activeDocId || !n.text.trim()}
                    onClick={() => sendToDraft(n)}
                    title={
                      activeDocTitle
                        ? `"${activeDocTitle}" dokümanının sonuna ekle`
                        : 'Önce bir doküman açın'
                    }
                  >
                    Taslağa Gönder ↓
                  </button>
                  <button
                    type="button"
                    className="sticky__del"
                    onClick={() => removeNote(n.id)}
                    aria-label="Notu sil"
                    title="Sil"
                  >
                    🗑
                  </button>
                </span>
              </footer>
            </li>
          ))}
        </ul>
      </div>

      <footer className="scratch__foot">
        <span>{notes.length} not · otomatik kaydedildi</span>
        <kbd>Ctrl+⇧+N</kbd>
      </footer>
    </div>
  );
}
