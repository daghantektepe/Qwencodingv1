import React from 'react';
import { ChangeSuggestion } from '../../services/review/trackChangesEngine';

interface SuggestionCardProps {
  suggestion: ChangeSuggestion;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onAccept,
  onReject
}) => {
  const isPending = suggestion.status === 'pending';

  return (
    <div
      className={`suggestion-card p-3 rounded-lg border text-xs flex flex-col gap-2 transition-all ${
        suggestion.status === 'accepted'
          ? 'bg-emerald-950/30 border-emerald-800/60 opacity-80'
          : suggestion.status === 'rejected'
          ? 'bg-rose-950/20 border-rose-900/40 opacity-60'
          : 'bg-slate-900 border-slate-700 shadow-md'
      }`}
    >
      {/* Üst Kısım: Yazar ve Tür Rozeti */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-medium text-slate-300">
          <span className="font-semibold text-white">{suggestion.author}</span>
          <span className="text-[10px] text-slate-500 font-normal">
            {new Date(suggestion.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <span
          className={`text-[10px] uppercase font-mono px-1.5 py-0.2 rounded font-semibold border ${
            suggestion.type === 'insert'
              ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
              : suggestion.type === 'delete'
              ? 'bg-rose-950 text-rose-400 border-rose-800'
              : 'bg-amber-950 text-amber-300 border-amber-800'
          }`}
        >
          {suggestion.type === 'insert' ? 'Ekleme' : suggestion.type === 'delete' ? 'Silme' : 'Değiştirme'}
        </span>
      </div>

      {/* Metin Karşılaştırması */}
      <div className="flex flex-col gap-1 font-serif text-[12px] bg-slate-950/70 p-2 rounded border border-slate-800/80">
        {suggestion.originalText && (
          <div className="line-through text-rose-400/90 bg-rose-950/30 px-1 py-0.5 rounded">
            {suggestion.originalText}
          </div>
        )}
        {suggestion.suggestedText && (
          <div className="underline text-emerald-300 bg-emerald-950/30 px-1 py-0.5 rounded font-medium">
            {suggestion.suggestedText}
          </div>
        )}
      </div>

      {/* Aksiyon Butonları */}
      {isPending ? (
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800">
          <button
            type="button"
            onClick={() => onReject(suggestion.id)}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 text-[11px] font-medium border border-slate-700 transition-colors"
          >
            ✕ Reddet
          </button>
          <button
            type="button"
            onClick={() => onAccept(suggestion.id)}
            className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-medium transition-colors shadow"
          >
            ✓ Kabul Et
          </button>
        </div>
      ) : (
        <div className="text-[10px] text-right font-mono italic text-slate-400">
          {suggestion.status === 'accepted' ? '✓ Kabul Edildi' : '✕ Reddedildi'}
        </div>
      )}
    </div>
  );
};

export default SuggestionCard;
