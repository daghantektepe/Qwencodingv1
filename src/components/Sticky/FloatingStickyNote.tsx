import React, { useState, useRef, useEffect } from 'react';
import {
  useStickyNotesStore,
  StickyNoteItem,
  StickyColor
} from '../../services/sticky/stickyNotesStore';
import {
  Pin,
  Trash2,
  Sliders,
  FileDown,
  X,
  Palette
} from 'lucide-react';

interface FloatingStickyNoteProps {
  note: StickyNoteItem;
  onInsertIntoDraft?: (text: string) => void;
}

export const FloatingStickyNote: React.FC<FloatingStickyNoteProps> = ({
  note,
  onInsertIntoDraft
}) => {
  const { updateNote, deleteNote, bringToFront } = useStickyNotesStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isControlsOpen, setIsControlsOpen] = useState(false);

  const noteRef = useRef<HTMLDivElement>(null);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return;
    bringToFront(note.id);
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - note.x,
      y: e.clientY - note.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newX = Math.max(0, e.clientX - dragOffset.x);
      const newY = Math.max(0, e.clientY - dragOffset.y);
      updateNote(note.id, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, note.id, updateNote]);

  const getColorClasses = (color: StickyColor) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 border-blue-300 text-blue-900 dark:bg-blue-950/80 dark:border-blue-700 dark:text-blue-100';
      case 'green':
        return 'bg-emerald-100 border-emerald-300 text-emerald-900 dark:bg-emerald-950/80 dark:border-emerald-700 dark:text-emerald-100';
      case 'pink':
        return 'bg-pink-100 border-pink-300 text-pink-900 dark:bg-pink-950/80 dark:border-pink-700 dark:text-pink-100';
      case 'purple':
        return 'bg-purple-100 border-purple-300 text-purple-900 dark:bg-purple-950/80 dark:border-purple-700 dark:text-purple-100';
      case 'amber':
        return 'bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-950/80 dark:border-amber-700 dark:text-amber-100';
      case 'yellow':
      default:
        return 'bg-yellow-100 border-yellow-300 text-yellow-950 dark:bg-yellow-950/80 dark:border-yellow-700 dark:text-yellow-100';
    }
  };

  const colors: StickyColor[] = ['yellow', 'amber', 'pink', 'purple', 'blue', 'green'];

  return (
    <div
      ref={noteRef}
      style={{
        left: `${note.x}px`,
        top: `${note.y}px`,
        width: `${note.width}px`,
        height: `${note.height}px`,
        opacity: note.opacity / 100,
        zIndex: note.zIndex
      }}
      onMouseDown={() => bringToFront(note.id)}
      className={`fixed rounded-xl border shadow-xl flex flex-col transition-opacity overflow-hidden select-none ${getColorClasses(
        note.color
      )}`}
    >
      {/* Header bar (Drag Handle) */}
      <div
        onMouseDown={handleMouseDown}
        className="px-2.5 py-1.5 flex items-center justify-between cursor-move border-b border-black/10 dark:border-white/10"
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <button
            onClick={() => updateNote(note.id, { isPinned: !note.isPinned })}
            className={`p-1 rounded no-drag ${
              note.isPinned ? 'text-amber-600 dark:text-amber-400 font-bold' : 'opacity-40 hover:opacity-100'
            }`}
            title={note.isPinned ? 'İğneyi kaldır' : 'En üste iğnele'}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
          <input
            type="text"
            value={note.title}
            onChange={(e) => updateNote(note.id, { title: e.target.value })}
            className="bg-transparent text-xs font-bold focus:outline-none w-full truncate no-drag"
          />
        </div>

        {/* Right action icons */}
        <div className="flex items-center gap-1 no-drag">
          <button
            onClick={() => setIsControlsOpen(!isControlsOpen)}
            title="Görünüm Ayarları"
            className="p-1 rounded opacity-60 hover:opacity-100 transition-opacity"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => deleteNote(note.id)}
            title="Notu Kapat / Sil"
            className="p-1 rounded opacity-60 hover:opacity-100 hover:text-red-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Optional Settings Drawer (Opacity & Color) */}
      {isControlsOpen && (
        <div className="p-2 border-b border-black/10 dark:border-white/10 flex flex-col gap-1.5 bg-black/5 dark:bg-white/5 no-drag text-[11px]">
          {/* Opacity slider */}
          <div className="flex items-center justify-between">
            <span>Opaklık: %{note.opacity}</span>
            <input
              type="range"
              min="30"
              max="100"
              value={note.opacity}
              onChange={(e) => updateNote(note.id, { opacity: parseInt(e.target.value, 10) })}
              className="w-24 h-1 accent-amber-600"
            />
          </div>

          {/* Color palette */}
          <div className="flex items-center justify-between pt-1">
            <span>Renk:</span>
            <div className="flex items-center gap-1">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => updateNote(note.id, { color: c })}
                  className={`w-3.5 h-3.5 rounded-full border border-black/20 ${
                    c === 'yellow'
                      ? 'bg-yellow-400'
                      : c === 'amber'
                      ? 'bg-amber-400'
                      : c === 'pink'
                      ? 'bg-pink-400'
                      : c === 'purple'
                      ? 'bg-purple-400'
                      : c === 'blue'
                      ? 'bg-blue-400'
                      : 'bg-emerald-400'
                  } ${note.color === c ? 'ring-2 ring-black dark:ring-white' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Note Content Area */}
      <div className="flex-1 p-2.5 overflow-hidden flex flex-col no-drag">
        <textarea
          value={note.content}
          onChange={(e) => updateNote(note.id, { content: e.target.value })}
          placeholder="Düşüncelerinizi buraya not edin..."
          className="w-full flex-1 bg-transparent resize-none focus:outline-none text-xs leading-relaxed font-sans placeholder:opacity-50 select-text"
        />
      </div>

      {/* Bottom Footer Actions */}
      <div className="px-2.5 py-1.5 border-t border-black/10 dark:border-white/10 flex items-center justify-between no-drag">
        <span className="text-[10px] opacity-60">
          {note.content.split(/\s+/).filter(Boolean).length} kelime
        </span>

        {onInsertIntoDraft && (
          <button
            onClick={() => onInsertIntoDraft(note.content)}
            disabled={!note.content.trim()}
            title="İmlecin olduğu yere ekle"
            className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 disabled:opacity-40 transition-colors"
          >
            <FileDown className="w-3 h-3" />
            <span>Taslağa Ekle</span>
          </button>
        )}
      </div>
    </div>
  );
};
