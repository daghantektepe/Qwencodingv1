import React, { useState } from 'react';
import {
  EnhancedIndexCard,
  IndexCardData,
  CardColor,
  CardPinStyle,
  CARD_COLORS,
} from './EnhancedIndexCard';

interface PinboardGridProps {
  cards: IndexCardData[];
  onCardsChange?: (updated: IndexCardData[]) => void;
  onCardClick?: (card: IndexCardData) => void;
}

export const PinboardGrid: React.FC<PinboardGridProps> = ({
  cards,
  onCardsChange,
  onCardClick,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [colorFilter, setColorFilter] = useState<CardColor | 'all'>('all');
  const [pinFilter, setPinFilter] = useState<CardPinStyle | 'all'>('all');

  const filteredCards = cards.filter((c) => {
    if (colorFilter !== 'all' && c.color !== colorFilter) return false;
    if (pinFilter !== 'all' && c.pinStyle !== pinFilter) return false;
    return true;
  });

  const handleUpdateCard = (updated: IndexCardData) => {
    const next = cards.map((c) => (c.id === updated.id ? updated : c));
    onCardsChange?.(next);
  };

  const handleAddCard = () => {
    const newCard: IndexCardData = {
      id: `card-${Date.now()}`,
      title: `Yeni Kart ${cards.length + 1}`,
      synopsis: 'Yeni sahne taslağı...',
      color: 'yellow',
      pinStyle: 'pushpin-red',
      wordCount: 0,
      order: cards.length + 1,
    };
    onCardsChange?.([...cards, newCard]);
  };

  return (
    <div
      className="pinboard-grid-wrapper flex flex-col w-full h-full bg-stone-900 rounded-2xl overflow-hidden border border-stone-800 shadow-2xl"
      data-testid="pinboard-grid"
    >
      {/* Pinboard Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 bg-stone-950 border-b border-stone-800 text-xs gap-3 flex-wrap">
        {/* Color Filters */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-stone-400 font-medium">Renk:</span>
          <button
            type="button"
            onClick={() => setColorFilter('all')}
            className={`px-2 py-0.5 rounded-lg border text-[11px] ${
              colorFilter === 'all'
                ? 'bg-cyan-900/60 border-cyan-600 text-white'
                : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-white'
            }`}
          >
            Tümü
          </button>
          {(Object.keys(CARD_COLORS) as CardColor[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColorFilter(c)}
              className={`w-4 h-4 rounded-full border transition-transform ${
                colorFilter === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110 opacity-70 hover:opacity-100'
              } ${CARD_COLORS[c].bg}`}
              title={`${CARD_COLORS[c].label} Filtresi`}
            />
          ))}
        </div>

        {/* Pin Style Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-stone-400 font-medium">İşaret:</span>
          <button
            type="button"
            onClick={() => setPinFilter('all')}
            className={`px-2 py-0.5 rounded-lg border text-[11px] ${
              pinFilter === 'all'
                ? 'bg-cyan-900/60 border-cyan-600 text-white'
                : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-white'
            }`}
          >
            Tümü
          </button>
          <button
            type="button"
            onClick={() => setPinFilter('star')}
            className={`px-2 py-0.5 rounded-lg border text-[11px] ${
              pinFilter === 'star'
                ? 'bg-amber-950 border-amber-500 text-amber-300'
                : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-white'
            }`}
          >
            ⭐ Yıldızlılar
          </button>
          <button
            type="button"
            onClick={() => setPinFilter('warning')}
            className={`px-2 py-0.5 rounded-lg border text-[11px] ${
              pinFilter === 'warning'
                ? 'bg-rose-950 border-rose-500 text-rose-300'
                : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-white'
            }`}
          >
            ⚠️ Revizyon
          </button>
        </div>

        {/* Add Card Button */}
        <button
          type="button"
          onClick={handleAddCard}
          className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium text-xs shadow transition-colors ml-auto flex items-center gap-1"
        >
          <span>+</span> Yeni İndeks Kartı
        </button>
      </div>

      {/* Corkboard Workspace Surface */}
      <div
        className="flex-1 p-6 overflow-y-auto min-h-[400px] flex flex-wrap gap-6 items-start content-start"
        style={{
          backgroundColor: '#272018',
          backgroundImage:
            'radial-gradient(#3a2e22 15%, transparent 16%), radial-gradient(#3a2e22 15%, transparent 16%)',
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 12px 12px',
        }}
        data-testid="corkboard-canvas"
      >
        {filteredCards.length === 0 ? (
          <div className="w-full text-center py-20 text-stone-400 text-xs">
            Filtreye uygun indeks kartı bulunmuyor.
          </div>
        ) : (
          filteredCards.map((card) => (
            <EnhancedIndexCard
              key={card.id}
              card={card}
              isSelected={selectedCardId === card.id}
              onSelect={(c) => {
                setSelectedCardId(c.id);
                onCardClick?.(c);
              }}
              onCardChange={handleUpdateCard}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default PinboardGrid;
