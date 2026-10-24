/**
 * Quick Note Popup Component
 * Phase 106: Sistem Tepsisi (System Tray) ve Global Hızlı Not Alma Kısayolu
 */

import React, { useState, useEffect } from 'react';
import { Feather, X, Check, Tag } from 'lucide-react';
import { WindowBridge } from '../../services/native/windowBridge';

export interface QuickNoteData {
  text: string;
  category: string;
  createdAt: string;
}

export interface QuickNotePopupProps {
  onSave?: (note: QuickNoteData) => void;
  onClose?: () => void;
}

export const QuickNotePopup: React.FC<QuickNotePopupProps> = ({ onSave, onClose }) => {
  const [text, setText] = useState('');
  const [category, setCategory] = useState('Fikir');

  const categories = ['Fikir', 'Diyalog', 'Karakter', 'Gözlem', 'Araştırma'];

  const handleSave = () => {
    if (!text.trim()) return;

    const note: QuickNoteData = {
      text: text.trim(),
      category,
      createdAt: new Date().toISOString(),
    };

    if (onSave) {
      onSave(note);
    }

    // Pencereler arası bildirim yayınla
    WindowBridge.broadcast('quick-note:created', note);

    if (window.electronAPI?.invoke) {
      window.electronAPI.invoke('tray:hide-quick-note').catch(() => {});
    }

    if (onClose) {
      onClose();
    }
  };

  const handleCancel = () => {
    if (window.electronAPI?.invoke) {
      window.electronAPI.invoke('tray:hide-quick-note').catch(() => {});
    }
    if (onClose) {
      onClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [text, category]);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#faf8f5',
        border: '1px solid #dcd6cd',
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
      data-testid="quick-note-popup"
    >
      {/* Başlık ve Kapatma */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          backgroundColor: '#efe9df',
          borderBottom: '1px solid #dcd6cd',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#4a3b32' }}>
          <Feather size={15} color="#8a5a36" />
          <span>Hızlı Not (Ctrl+Alt+S)</span>
        </div>
        <button
          onClick={handleCancel}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#7a6a5d', padding: '2px' }}
          aria-label="Kapat"
          data-testid="quick-note-close"
        >
          <X size={16} />
        </button>
      </div>

      {/* Kategori Seçici */}
      <div style={{ display: 'flex', gap: '6px', padding: '6px 12px', borderBottom: '1px solid #ede7dc', backgroundColor: '#fcfbf9' }}>
        <Tag size={13} style={{ alignSelf: 'center', color: '#8c7b6d' }} />
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            style={{
              border: 'none',
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '11px',
              cursor: 'pointer',
              backgroundColor: category === cat ? '#7a5c3e' : '#ede7dc',
              color: category === cat ? '#ffffff' : '#5a483a',
              fontWeight: category === cat ? 600 : 400,
              transition: 'background 0.15s ease',
            }}
            data-testid={`quick-note-cat-${cat}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Metin Giriş Alanı */}
      <div style={{ flex: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column' }}>
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Aklınıza gelen fikri veya sahne notunu hemen yazın..."
          style={{
            flex: 1,
            width: '100%',
            border: 'none',
            outline: 'none',
            resize: 'none',
            backgroundColor: 'transparent',
            fontSize: '13px',
            lineHeight: 1.5,
            color: '#2d251e',
            fontFamily: 'inherit',
          }}
          data-testid="quick-note-textarea"
        />
      </div>

      {/* Alt Kontroller ve Sayaç */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderTop: '1px solid #ede7dc',
          backgroundColor: '#f5f0e6',
          fontSize: '11px',
          color: '#7a6a5d',
        }}
      >
        <span data-testid="quick-note-wordcount">
          {wordCount} kelime · {text.length} karakter
        </span>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={handleCancel}
            style={{
              background: '#e8e0d5',
              border: '1px solid #d0c4b5',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '11px',
              cursor: 'pointer',
              color: '#554538',
            }}
            data-testid="quick-note-cancel-btn"
          >
            Vazgeç (Esc)
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!text.trim()}
            style={{
              background: text.trim() ? '#6b4c30' : '#b8a695',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: text.trim() ? 'pointer' : 'not-allowed',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            data-testid="quick-note-save-btn"
          >
            <Check size={12} /> Kaydet (Ctrl+Enter)
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickNotePopup;
