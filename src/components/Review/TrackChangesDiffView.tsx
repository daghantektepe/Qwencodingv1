import React, { useState } from 'react';
import {
  trackChangesEngine,
  ChangeSuggestion
} from '../../services/review/trackChangesEngine';
import { SuggestionCard } from './SuggestionCard';

interface TrackChangesDiffViewProps {
  docId: string;
  docTitle: string;
  baseText: string;
  onTextUpdate?: (newText: string) => void;
  onClose?: () => void;
}

export const TrackChangesDiffView: React.FC<TrackChangesDiffViewProps> = ({
  docId,
  docTitle,
  baseText: initialBaseText,
  onTextUpdate,
  onClose
}) => {
  const [currentText, setCurrentText] = useState<string>(initialBaseText);
  const [suggestions, setSuggestions] = useState<ChangeSuggestion[]>(() =>
    trackChangesEngine.getSuggestions(docId)
  );

  const pendingCount = suggestions.filter((s) => s.status === 'pending').length;
  const segments = trackChangesEngine.renderMarkupSegments(docId, currentText);

  const handleAccept = (id: string) => {
    const updated = trackChangesEngine.acceptSuggestion(docId, id, currentText);
    setCurrentText(updated);
    setSuggestions([...trackChangesEngine.getSuggestions(docId)]);
    onTextUpdate?.(updated);
  };

  const handleReject = (id: string) => {
    const updated = trackChangesEngine.rejectSuggestion(docId, id, currentText);
    setCurrentText(updated);
    setSuggestions([...trackChangesEngine.getSuggestions(docId)]);
    onTextUpdate?.(updated);
  };

  const handleAcceptAll = () => {
    const updated = trackChangesEngine.acceptAll(docId, currentText);
    setCurrentText(updated);
    setSuggestions([...trackChangesEngine.getSuggestions(docId)]);
    onTextUpdate?.(updated);
  };

  const handleRejectAll = () => {
    const updated = trackChangesEngine.rejectAll(docId, currentText);
    setCurrentText(updated);
    setSuggestions([...trackChangesEngine.getSuggestions(docId)]);
    onTextUpdate?.(updated);
  };

  return (
    <div
      className="track-changes-view flex flex-col h-full w-full bg-slate-950 text-slate-100 overflow-hidden"
      role="region"
      aria-label="Değişiklikleri İzle ve Öneri İnceleme Görünümü"
    >
      {/* Üst Çubuk */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl">✍️</span>
          <div>
            <h2 className="text-sm font-semibold text-white">
              {docTitle} — Değişiklikleri İzle (Track Changes)
            </h2>
            <div className="text-xs text-slate-400">
              Bekleyen Öneri: <b className="text-amber-400">{pendingCount}</b>
            </div>
          </div>
        </div>

        {/* Toplu Aksiyonlar */}
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium rounded shadow transition-colors"
              >
                ✓ Tümünü Kabul Et
              </button>
              <button
                type="button"
                onClick={handleRejectAll}
                className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-xs font-medium rounded border border-rose-800 transition-colors"
              >
                ✕ Tümünü Reddet
              </button>
            </>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 text-sm ml-2"
              title="Kapat"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Ana Gövde: Sol Canlı Markup Metin, Sağ Öneri Kartları */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sol: Renkli Düzenleme Önizlemesi */}
        <div className="flex-1 overflow-y-auto p-6 font-serif text-sm leading-relaxed select-text bg-slate-900/30">
          <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-sm min-h-full">
            {segments.map((seg, idx) => {
              if (seg.type === 'inserted') {
                return (
                  <span
                    key={idx}
                    className="underline text-emerald-400 bg-emerald-950/40 px-0.5 rounded cursor-pointer font-medium"
                    title={`Ekleme: ${seg.author || 'Öneri'}`}
                  >
                    {seg.text}
                  </span>
                );
              }
              if (seg.type === 'deleted') {
                return (
                  <span
                    key={idx}
                    className="line-through text-rose-400 bg-rose-950/40 px-0.5 rounded cursor-pointer opacity-80"
                    title={`Silme: ${seg.author || 'Öneri'}`}
                  >
                    {seg.text}
                  </span>
                );
              }
              return <span key={idx} className="text-slate-200">{seg.text}</span>;
            })}
          </div>
        </div>

        {/* Sağ: Kenar Çubuğu Öneri Listesi */}
        <div className="w-80 border-l border-slate-800 bg-slate-900/80 p-4 overflow-y-auto flex flex-col gap-3 shrink-0">
          <h3 className="font-semibold text-xs text-slate-400 uppercase tracking-wider">
            Düzenleme Önerileri ({suggestions.length})
          </h3>

          {suggestions.length === 0 ? (
            <div className="text-xs text-slate-500 italic py-8 text-center">
              Bu dokümanda henüz kayıtlı öneri bulunmuyor.
            </div>
          ) : (
            suggestions.map((sug) => (
              <SuggestionCard
                key={sug.id}
                suggestion={sug}
                onAccept={handleAccept}
                onReject={handleReject}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackChangesDiffView;
