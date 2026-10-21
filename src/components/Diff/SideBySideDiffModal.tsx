import React, { useState } from 'react';
import { wordDiffEngine } from '../../services/diff/wordDiffEngine';

interface SideBySideDiffModalProps {
  isOpen: boolean;
  leftTitle?: string;
  rightTitle?: string;
  leftContent: string;
  rightContent: string;
  onRestoreSnippet?: (restoredText: string) => void;
  onClose: () => void;
}

export const SideBySideDiffModal: React.FC<SideBySideDiffModalProps> = ({
  isOpen,
  leftTitle = 'Önceki Sürüm (Snapshot)',
  rightTitle = 'Güncel Taslak',
  leftContent,
  rightContent,
  onRestoreSnippet,
  onClose
}) => {
  if (!isOpen) return null;

  const comparisons = wordDiffEngine.computeLineByLineDiff(leftContent, rightContent);
  const summary = wordDiffEngine.getDiffSummary(leftContent, rightContent);

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="diff-modal-title"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col text-slate-200 overflow-hidden">
        {/* Üst Başlık ve İstatistikler */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔍</span>
            <div>
              <h2 id="diff-modal-title" className="font-semibold text-white text-sm">
                Görsel Sürüm Karşılaştırıcı (Side-by-Side Diff)
              </h2>
              <div className="flex items-center gap-3 text-xs font-mono text-slate-400 mt-0.5">
                <span className="text-emerald-400">+{summary.additions} eklendi</span>
                <span className="text-rose-400">-{summary.deletions} silindi</span>
                <span>Benzerlik: %{Math.round(summary.similarityRatio * 100)}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-base p-1"
            title="Kapat"
          >
            ✕
          </button>
        </div>

        {/* Sütun Başlıkları */}
        <div className="grid grid-cols-2 border-b border-slate-800 bg-slate-950/60 text-xs font-semibold uppercase tracking-wider px-4 py-2 shrink-0">
          <div className="text-slate-400 flex items-center justify-between pr-4">
            <span>{leftTitle}</span>
            <span className="text-[10px] text-slate-500 font-mono">Eski</span>
          </div>
          <div className="text-cyan-400 flex items-center justify-between pl-4">
            <span>{rightTitle}</span>
            <span className="text-[10px] text-cyan-600 font-mono">Yeni</span>
          </div>
        </div>

        {/* Diff Satırları Gövdesi */}
        <div className="flex-1 overflow-y-auto font-mono text-xs p-2 flex flex-col gap-0.5">
          {comparisons.map((row) => (
            <div
              key={row.lineIndex}
              className={`grid grid-cols-2 rounded transition-colors ${
                row.status === 'modified'
                  ? 'bg-amber-950/20'
                  : row.status === 'added'
                  ? 'bg-emerald-950/20'
                  : row.status === 'removed'
                  ? 'bg-rose-950/20'
                  : 'hover:bg-slate-800/30'
              }`}
            >
              {/* Sol Taraf */}
              <div className="flex items-start gap-2 p-1.5 border-r border-slate-800/80 pr-3">
                <span className="w-8 shrink-0 text-slate-600 text-right select-none text-[10px]">
                  {row.status !== 'added' ? row.lineIndex : ''}
                </span>

                <div className="flex-1 whitespace-pre-wrap break-words">
                  {row.leftTokens.map((t, idx) => (
                    <span
                      key={idx}
                      className={
                        t.type === 'removed'
                          ? 'bg-rose-900/50 text-rose-300 line-through rounded px-0.5'
                          : 'text-slate-300'
                      }
                    >
                      {t.value}
                    </span>
                  ))}
                </div>

                {/* Geri Kopyalama Butonu */}
                {row.leftText && onRestoreSnippet && (
                  <button
                    type="button"
                    onClick={() => onRestoreSnippet(row.leftText)}
                    className="shrink-0 text-[10px] bg-slate-800 hover:bg-cyan-800 text-slate-400 hover:text-white px-1.5 py-0.2 rounded transition-colors"
                    title="Bu satırı güncel metne kopyala"
                  >
                    Kopyala ➔
                  </button>
                )}
              </div>

              {/* Sağ Taraf */}
              <div className="flex items-start gap-2 p-1.5 pl-3">
                <span className="w-8 shrink-0 text-slate-600 text-right select-none text-[10px]">
                  {row.status !== 'removed' ? row.lineIndex : ''}
                </span>

                <div className="flex-1 whitespace-pre-wrap break-words">
                  {row.rightTokens.map((t, idx) => (
                    <span
                      key={idx}
                      className={
                        t.type === 'added'
                          ? 'bg-emerald-900/50 text-emerald-300 underline rounded px-0.5 font-medium'
                          : 'text-slate-200'
                      }
                    >
                      {t.value}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SideBySideDiffModal;
