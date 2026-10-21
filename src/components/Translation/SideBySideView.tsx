import React, { useState } from 'react';
import {
  TranslationSession,
  TranslationParagraph,
  TranslationStatus
} from '../../types/translation';
import { translationManager } from '../../services/translation/translationManager';
import { GlossaryTable } from './GlossaryTable';

interface SideBySideViewProps {
  session: TranslationSession;
  onSessionUpdate?: (updatedSession: TranslationSession) => void;
  onExportTarget?: (exportedText: string) => void;
  onClose?: () => void;
}

export const SideBySideView: React.FC<SideBySideViewProps> = ({
  session: initialSession,
  onSessionUpdate,
  onExportTarget,
  onClose
}) => {
  const [session, setSession] = useState<TranslationSession>(initialSession);
  const [showGlossary, setShowGlossary] = useState<boolean>(true);
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(null);

  const progress = translationManager.getProgress(session.id);

  const handleTargetChange = (paragraphId: string, newText: string) => {
    translationManager.updateTargetParagraph(session.id, paragraphId, newText);
    const updated = translationManager.getSession(session.id);
    if (updated) {
      setSession({ ...updated });
      onSessionUpdate?.(updated);
    }
  };

  const handleApprove = (paragraphId: string) => {
    translationManager.approveParagraph(session.id, paragraphId);
    const updated = translationManager.getSession(session.id);
    if (updated) {
      setSession({ ...updated });
      onSessionUpdate?.(updated);
    }
  };

  const handleAddTerm = (source: string, target: string, notes?: string) => {
    translationManager.addGlossaryTerm(session.id, source, target, notes);
    const updated = translationManager.getSession(session.id);
    if (updated) {
      setSession({ ...updated });
      onSessionUpdate?.(updated);
    }
  };

  const handleRemoveTerm = (id: string) => {
    translationManager.removeGlossaryTerm(session.id, id);
    const updated = translationManager.getSession(session.id);
    if (updated) {
      setSession({ ...updated });
      onSessionUpdate?.(updated);
    }
  };

  const handleExport = () => {
    const text = translationManager.exportTargetDocument(session.id);
    if (onExportTarget) {
      onExportTarget(text);
    } else {
      // Panoya kopyala
      navigator.clipboard?.writeText(text);
      alert('Hedef dil çeviri metni panoya kopyalandı!');
    }
  };

  return (
    <div
      className="side-by-side-translation flex flex-col h-full w-full bg-slate-950 text-slate-100 overflow-hidden"
      role="region"
      aria-label="Yan Yana Çeviri ve Yerelleştirme Stüdyosu"
    >
      {/* Üst Çubuk */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/90 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl">🌐</span>
          <div>
            <h2 className="text-sm font-semibold text-white">
              {session.sourceDocTitle} — Çeviri Stüdyosu
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="uppercase font-mono bg-slate-800 px-1.5 py-0.5 rounded text-cyan-400">
                {session.sourceLang}
              </span>
              <span>➔</span>
              <span className="uppercase font-mono bg-slate-800 px-1.5 py-0.5 rounded text-emerald-400">
                {session.targetLang}
              </span>
            </div>
          </div>
        </div>

        {/* İlerleme ve Aksiyonlar */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-32 bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <span className="text-xs font-mono font-medium text-emerald-400">
              %{progress.percentage}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowGlossary(!showGlossary)}
            className={`px-3 py-1.5 text-xs rounded border transition-colors ${
              showGlossary
                ? 'bg-cyan-950 border-cyan-600 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            📖 Sözlük ({session.glossary.length})
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded shadow transition-colors"
          >
            Dışa Aktar
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 text-sm"
              title="Kapat"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Ana Çalışma Alanı: Sol Kaynak, Sağ Hedef, En Sağ Sözlük */}
      <div className="flex-1 flex overflow-hidden">
        {/* Paragraf Listesi (Hizalı Yan Yana) */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {session.paragraphs.map((p, idx) => {
            const matches = translationManager.findGlossaryMatches(session.id, p.sourceText);
            const isApproved = p.status === 'approved';
            const isDraft = p.status === 'draft';

            return (
              <div
                key={p.id}
                onFocus={() => setActiveParagraphId(p.id)}
                className={`grid grid-cols-2 gap-4 p-3.5 rounded-lg border transition-colors ${
                  activeParagraphId === p.id
                    ? 'border-cyan-500/50 bg-slate-900/60 shadow-md'
                    : 'border-slate-800/80 bg-slate-900/30 hover:border-slate-700'
                }`}
              >
                {/* Sol: Kaynak Paragraf */}
                <div className="flex flex-col justify-between pr-2 border-r border-slate-800/60">
                  <div>
                    <div className="flex items-center justify-between mb-1.5 text-[11px] text-slate-500 font-mono">
                      <span>§ {idx + 1}</span>
                      {matches.length > 0 && (
                        <span className="text-amber-400 bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-900/40">
                          {matches.length} terim eşleşmesi
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed select-text font-serif">
                      {p.sourceText}
                    </p>
                  </div>

                  {matches.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {matches.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            const newText = p.targetText
                              ? `${p.targetText} ${m.targetWord}`
                              : m.targetWord;
                            handleTargetChange(p.id, newText);
                          }}
                          className="text-[11px] bg-slate-800 hover:bg-cyan-900/40 text-cyan-300 px-2 py-0.5 rounded border border-slate-700 hover:border-cyan-600 transition-colors"
                          title="Tıkla ve çeviriye ekle"
                        >
                          {m.sourceWord} ➔ <b>{m.targetWord}</b>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sağ: Hedef Paragraf Düzenleyici */}
                <div className="flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-mono text-slate-400">Hedef Metin</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${
                        isApproved
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : isDraft
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  <textarea
                    value={p.targetText}
                    onChange={(e) => handleTargetChange(p.id, e.target.value)}
                    placeholder="Bu paragrafın çevirisini buraya yazın..."
                    rows={Math.max(3, Math.ceil(p.sourceText.length / 70))}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-serif resize-none"
                  />

                  <div className="mt-2 flex items-center justify-end gap-2">
                    {p.targetText.trim().length > 0 && !isApproved && (
                      <button
                        type="button"
                        onClick={() => handleApprove(p.id)}
                        className="px-2.5 py-1 bg-emerald-700/80 hover:bg-emerald-600 text-white text-[11px] font-medium rounded transition-colors flex items-center gap-1"
                      >
                        ✓ Onayla
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sağ Sütun: Terimler Sözlüğü Tablosu */}
        {showGlossary && (
          <div className="w-80 shrink-0">
            <GlossaryTable
              terms={session.glossary}
              onAddTerm={handleAddTerm}
              onRemoveTerm={handleRemoveTerm}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SideBySideView;
