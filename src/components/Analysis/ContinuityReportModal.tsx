import React, { useState } from 'react';
import { ContinuityConflict } from '../../services/analysis/continuityChecker';

interface ContinuityReportModalProps {
  isOpen: boolean;
  conflicts: ContinuityConflict[];
  onResolveConflict?: (id: string, action: 'resolved' | 'ignored') => void;
  onJumpToSnippet?: (docId: string, snippet: string) => void;
  onClose: () => void;
}

export const ContinuityReportModal: React.FC<ContinuityReportModalProps> = ({
  isOpen,
  conflicts,
  onResolveConflict,
  onJumpToSnippet,
  onClose,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved' | 'ignored'>('all');

  if (!isOpen) return null;

  const filteredConflicts = conflicts.filter((c) => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  const highSeverityCount = conflicts.filter((c) => c.severity === 'high' && c.status === 'pending').length;
  const pendingCount = conflicts.filter((c) => c.status === 'pending').length;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-label="Kurgu Mantık Denetleyicisi"
      data-testid="continuity-report-modal"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl text-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🕵️</span>
            <div>
              <h2 className="text-base font-semibold text-white">
                Kurgu Mantık & Çelişki Avcısı
              </h2>
              <p className="text-xs text-slate-400">
                Karakter özellikleri, zaman ve yaşam-ölüm tutarsızlıkları
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Stats and Filter Bar */}
        <div className="px-6 py-3 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-300">
              Bekleyen: <strong className="text-white">{pendingCount}</strong>
            </span>
            {highSeverityCount > 0 && (
              <span className="px-2 py-0.5 bg-rose-950 border border-rose-800 rounded-full text-rose-300 font-semibold text-[11px]">
                🚨 {highSeverityCount} Kritik Çelişki
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2.5 py-0.5 rounded text-xs transition-colors ${
                filter === 'all' ? 'bg-cyan-700 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tümü ({conflicts.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('pending')}
              className={`px-2.5 py-0.5 rounded text-xs transition-colors ${
                filter === 'pending' ? 'bg-cyan-700 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Bekleyenler
            </button>
            <button
              type="button"
              onClick={() => setFilter('resolved')}
              className={`px-2.5 py-0.5 rounded text-xs transition-colors ${
                filter === 'resolved' ? 'bg-cyan-700 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Çözülenler
            </button>
            <button
              type="button"
              onClick={() => setFilter('ignored')}
              className={`px-2.5 py-0.5 rounded text-xs transition-colors ${
                filter === 'ignored' ? 'bg-cyan-700 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Yoksayılanlar
            </button>
          </div>
        </div>

        {/* Conflict List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredConflicts.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              {conflicts.length === 0
                ? 'Harika! Romanda herhangi bir karakter veya olay örgüsü çelişkisi tespit edilmedi.'
                : 'Seçili filtrede çelişki bulunmuyor.'}
            </div>
          ) : (
            filteredConflicts.map((c) => (
              <div
                key={c.id}
                className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3"
                data-testid={`conflict-card-${c.id}`}
              >
                {/* Top Badge Info */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-xs">{c.characterName}</span>
                    <span className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded-full text-[10px] text-cyan-400">
                      {c.traitKey}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        c.severity === 'high'
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                          : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {c.severity === 'high' ? 'Kritik Risk' : 'Orta Risk'}
                    </span>
                  </div>

                  {c.status !== 'pending' && (
                    <span
                      className={`text-[11px] font-medium ${
                        c.status === 'resolved' ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {c.status === 'resolved' ? '✓ Çözüldü' : '👁️ Yoksayıldı'}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300">{c.description}</p>

                {/* Side-by-side Snippet Comparison */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Left Side (Doc A) */}
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-medium text-slate-300">{c.docA.docTitle}</span>
                      <span className="font-mono text-cyan-400 font-bold">{c.docA.value}</span>
                    </div>
                    <p className="text-slate-300 font-serif italic text-[11px] bg-slate-950 p-2 rounded border border-slate-800">
                      "{c.docA.snippet}"
                    </p>
                    {onJumpToSnippet && (
                      <button
                        type="button"
                        onClick={() => onJumpToSnippet(c.docA.docId, c.docA.snippet)}
                        className="text-[10px] text-cyan-400 hover:underline pt-1 inline-block"
                      >
                        Bölümde Göster →
                      </button>
                    )}
                  </div>

                  {/* Right Side (Doc B) */}
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-medium text-slate-300">{c.docB.docTitle}</span>
                      <span className="font-mono text-rose-400 font-bold">{c.docB.value}</span>
                    </div>
                    <p className="text-slate-300 font-serif italic text-[11px] bg-slate-950 p-2 rounded border border-slate-800">
                      "{c.docB.snippet}"
                    </p>
                    {onJumpToSnippet && (
                      <button
                        type="button"
                        onClick={() => onJumpToSnippet(c.docB.docId, c.docB.snippet)}
                        className="text-[10px] text-cyan-400 hover:underline pt-1 inline-block"
                      >
                        Bölümde Göster →
                      </button>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {c.status === 'pending' && onResolveConflict && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => onResolveConflict(c.id, 'ignored')}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs"
                    >
                      👁️ Yoksay
                    </button>
                    <button
                      type="button"
                      onClick={() => onResolveConflict(c.id, 'resolved')}
                      className="px-3.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium shadow"
                    >
                      ✓ Çözüldü Olarak İşaretle
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContinuityReportModal;
