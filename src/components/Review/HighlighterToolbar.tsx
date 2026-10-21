import React from 'react';
import { HighlightColor } from '../../types/comments';

interface HighlighterToolbarProps {
  onSelectColor: (color: HighlightColor) => void;
  onAddComment: () => void;
  onRemoveHighlight?: () => void;
}

const COLORS: Array<{ id: HighlightColor; label: string; bg: string }> = [
  { id: 'yellow', label: 'Sarı Kalem', bg: 'bg-amber-400' },
  { id: 'green', label: 'Yeşil Kalem', bg: 'bg-emerald-400' },
  { id: 'pink', label: 'Pembe Kalem', bg: 'bg-pink-400' },
  { id: 'blue', label: 'Mavi Kalem', bg: 'bg-cyan-400' },
  { id: 'purple', label: 'Mor Kalem', bg: 'bg-purple-400' },
];

export const HighlighterToolbar: React.FC<HighlighterToolbarProps> = ({
  onSelectColor,
  onAddComment,
  onRemoveHighlight
}) => {
  return (
    <div
      className="highlighter-toolbar flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-700 rounded-full shadow-xl text-slate-200 select-none"
      role="toolbar"
      aria-label="Metin Vurgulayıcı ve Yorum Araç Çubuğu"
    >
      {COLORS.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onSelectColor(c.id)}
          className={`w-5 h-5 rounded-full ${c.bg} hover:scale-125 transition-transform border border-black/20 shadow-sm`}
          title={c.label}
        />
      ))}

      <div className="w-px h-4 bg-slate-700 mx-1" />

      <button
        type="button"
        onClick={onAddComment}
        className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-xs text-white font-medium flex items-center gap-1 transition-colors"
        title="Yorum Ekle"
      >
        <span>💬</span> Yorum
      </button>

      {onRemoveHighlight && (
        <button
          type="button"
          onClick={onRemoveHighlight}
          className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white text-xs"
          title="Vurguyu Temizle"
        >
          🧹
        </button>
      )}
    </div>
  );
};

export default HighlighterToolbar;
