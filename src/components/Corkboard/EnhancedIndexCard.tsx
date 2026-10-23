import React, { useState } from 'react';

export type CardColor = 'yellow' | 'blue' | 'pink' | 'green' | 'amber' | 'purple' | 'slate';
export type CardPinStyle = 'pushpin-red' | 'pushpin-blue' | 'clip' | 'star' | 'lock' | 'warning' | 'none';

export interface IndexCardData {
  id: string;
  title: string;
  synopsis: string;
  wordCount?: number;
  color: CardColor;
  pinStyle: CardPinStyle;
  statusLabel?: string;
  tags?: string[];
  order: number;
}

export const CARD_COLORS: Record<CardColor, { bg: string; border: string; text: string; label: string }> = {
  yellow: { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-950', label: 'Sarı' },
  blue: { bg: 'bg-sky-100', border: 'border-sky-300', text: 'text-sky-950', label: 'Mavi' },
  pink: { bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-950', label: 'Pembe' },
  green: { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-950', label: 'Yeşil' },
  amber: { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-950', label: 'Turuncu' },
  purple: { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-950', label: 'Mor' },
  slate: { bg: 'bg-slate-200', border: 'border-slate-300', text: 'text-slate-900', label: 'Gri' },
};

export const PIN_ICONS: Record<CardPinStyle, { icon: string; label: string }> = {
  'pushpin-red': { icon: '📌', label: 'Kırmızı Raptiye' },
  'pushpin-blue': { icon: '📍', label: 'Mavi İğne' },
  clip: { icon: '📎', label: 'Ataş' },
  star: { icon: '⭐', label: 'Önemli / Yıldız' },
  lock: { icon: '🔒', label: 'Kilitli / Sabit' },
  warning: { icon: '⚠️', label: 'Revizyon Gerekli' },
  none: { icon: '', label: 'Pin Yok' },
};

interface EnhancedIndexCardProps {
  card: IndexCardData;
  onCardChange?: (updated: IndexCardData) => void;
  onSelect?: (card: IndexCardData) => void;
  isSelected?: boolean;
}

export const EnhancedIndexCard: React.FC<EnhancedIndexCardProps> = ({
  card,
  onCardChange,
  onSelect,
  isSelected = false,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorDef = CARD_COLORS[card.color] || CARD_COLORS.yellow;
  const pinDef = PIN_ICONS[card.pinStyle] || PIN_ICONS['pushpin-red'];

  const handleTitleChange = (val: string) => {
    onCardChange?.({ ...card, title: val });
  };

  const handleSynopsisChange = (val: string) => {
    onCardChange?.({ ...card, synopsis: val });
  };

  const handleColorSelect = (color: CardColor) => {
    onCardChange?.({ ...card, color });
    setShowColorPicker(false);
  };

  const handlePinSelect = (pinStyle: CardPinStyle) => {
    onCardChange?.({ ...card, pinStyle });
    setShowColorPicker(false);
  };

  return (
    <div
      onClick={() => onSelect?.(card)}
      className={`enhanced-index-card relative w-64 h-52 p-4 rounded-xl border shadow-xl flex flex-col justify-between transition-all select-none cursor-pointer group ${
        colorDef.bg
      } ${colorDef.border} ${colorDef.text} ${
        isSelected ? 'ring-2 ring-cyan-500 scale-[1.02] shadow-2xl' : 'hover:scale-[1.01]'
      }`}
      data-testid={`index-card-${card.id}`}
      data-color={card.color}
      data-pin={card.pinStyle}
    >
      {/* Top Pin Decoration */}
      {card.pinStyle !== 'none' && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg drop-shadow cursor-pointer z-10"
          title={pinDef.label}
          onClick={(e) => {
            e.stopPropagation();
            setShowColorPicker(!showColorPicker);
          }}
        >
          {pinDef.icon}
        </div>
      )}

      {/* Card Header */}
      <div className="flex items-start justify-between gap-2 pt-1 border-b border-black/10 pb-1.5">
        <input
          type="text"
          value={card.title}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Kart Başlığı..."
          className="font-bold text-xs bg-transparent border-none focus:outline-none w-full font-serif"
        />

        {/* Quick Style Picker Trigger */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowColorPicker(!showColorPicker);
          }}
          className="text-xs opacity-40 group-hover:opacity-100 hover:scale-110 p-0.5 rounded transition-all"
          title="Kart Rengi ve Pin Değiştir"
        >
          🎨
        </button>
      </div>

      {/* Style Popover */}
      {showColorPicker && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-10 right-2 p-2.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 flex flex-col gap-2 text-xs text-white"
        >
          <div className="text-[10px] font-semibold text-slate-400">Kart Rengi</div>
          <div className="flex gap-1.5">
            {(Object.keys(CARD_COLORS) as CardColor[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => handleColorSelect(c)}
                className={`w-5 h-5 rounded-full border border-black/20 ${CARD_COLORS[c].bg}`}
                title={CARD_COLORS[c].label}
              />
            ))}
          </div>

          <div className="text-[10px] font-semibold text-slate-400 pt-1 border-t border-slate-800">
            Pin İkonu
          </div>
          <div className="flex gap-1 flex-wrap w-40">
            {(Object.keys(PIN_ICONS) as CardPinStyle[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePinSelect(p)}
                className="p-1 hover:bg-slate-800 rounded text-sm"
                title={PIN_ICONS[p].label}
              >
                {PIN_ICONS[p].icon || '∅'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Card Body / Synopsis */}
      <textarea
        value={card.synopsis}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => handleSynopsisChange(e.target.value)}
        placeholder="Bölüm özeti, olay örgüsü veya notlar..."
        rows={4}
        className="flex-1 my-2 bg-transparent border-none resize-none text-[11px] font-serif leading-relaxed focus:outline-none placeholder-black/40 overflow-hidden"
      />

      {/* Card Footer */}
      <div className="flex items-center justify-between text-[10px] opacity-60 font-sans border-t border-black/10 pt-1">
        <span>{card.wordCount !== undefined ? `${card.wordCount} kelime` : ''}</span>
        {card.statusLabel && (
          <span className="px-1.5 py-0.5 bg-black/10 rounded font-medium">
            {card.statusLabel}
          </span>
        )}
      </div>
    </div>
  );
};

export default EnhancedIndexCard;
