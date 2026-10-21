import React, { useState, useMemo } from 'react';
import {
  computeParagraphDiff,
  computeSplitDiff,
  getDiffStats,
  rollbackParagraph,
  ParagraphDiff,
  DiffStats,
} from '../../services/diff/textDiffEngine';
import DiffToolbar from './DiffToolbar';

export interface DocumentDiffViewerProps {
  oldText: string;
  newText: string;
  documentTitle?: string;
  snapshots?: Array<{ timestamp: number; title: string; note?: string; size?: number }>;
  selectedSnapshotTimestamp?: number | null;
  onSelectSnapshot?: (timestamp: number) => void;
  onRollbackParagraph?: (restoredFullText: string, diffId: string) => void;
  onFullRollback?: () => void;
  onClose?: () => void;
}

export const DocumentDiffViewer: React.FC<DocumentDiffViewerProps> = ({
  oldText,
  newText,
  documentTitle = 'Doküman',
  snapshots = [],
  selectedSnapshotTimestamp = null,
  onSelectSnapshot = () => {},
  onRollbackParagraph,
  onFullRollback,
  onClose,
}) => {
  const [viewMode, setViewMode] = useState<'inline' | 'split'>('inline');

  // Performanslı diff hesaplamaları
  const stats: DiffStats = useMemo(() => getDiffStats(oldText, newText), [oldText, newText]);
  const paragraphDiffs: ParagraphDiff[] = useMemo(
    () => computeParagraphDiff(oldText, newText),
    [oldText, newText]
  );
  const splitRows = useMemo(() => computeSplitDiff(oldText, newText), [oldText, newText]);

  // Tekil paragraf geri alma eylemi
  const handleSelectiveRollback = (diffId: string) => {
    if (!onRollbackParagraph) return;
    const rolledBackText = rollbackParagraph(newText, paragraphDiffs, diffId);
    onRollbackParagraph(rolledBackText, diffId);
  };

  const isIdentical = oldText === newText;

  return (
    <div
      className="document-diff-viewer flex flex-col h-full w-full bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-sans"
      data-testid="document-diff-viewer"
    >
      {/* Üst Araç Çubuğu */}
      <DiffToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        stats={stats}
        snapshots={snapshots}
        selectedSnapshotTimestamp={selectedSnapshotTimestamp}
        onSelectSnapshot={onSelectSnapshot}
        onFullRollback={onFullRollback}
        onClose={onClose}
        documentTitle={documentTitle}
      />

      {/* Ana Görünüm Alanı */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {isIdentical ? (
          <div className="flex flex-col items-center justify-center h-64 text-center text-neutral-500">
            <span className="text-4xl mb-3" aria-hidden="true">
              ✨
            </span>
            <p className="font-medium text-base">İki versiyon tamamen aynı</p>
            <p className="text-xs text-neutral-400 mt-1">
              Mevcut taslak ile seçili snapshot arasında hiçbir metin farkı bulunmuyor.
            </p>
          </div>
        ) : viewMode === 'inline' ? (
          /* =========================================================================
             INLINE VIEW: Paragraf bazlı ve kelime düzeyinde zenginleştirilmiş gösterim
             ========================================================================= */
          <div className="inline-diff-container space-y-4 max-w-4xl mx-auto" data-testid="inline-diff-view">
            {paragraphDiffs.map((pDiff, idx) => {
              if (pDiff.type === 'equal') {
                return (
                  <div
                    key={pDiff.id}
                    className="diff-paragraph diff-paragraph--equal p-3 rounded bg-neutral-50 dark:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300 border border-transparent leading-relaxed"
                  >
                    <p className="whitespace-pre-wrap">{pDiff.newContent}</p>
                  </div>
                );
              }

              const isModify = pDiff.type === 'modify';
              const isDelete = pDiff.type === 'delete';
              const isInsert = pDiff.type === 'insert';

              return (
                <div
                  key={pDiff.id}
                  className={`diff-paragraph p-3 rounded border transition-colors relative group ${
                    isModify
                      ? 'border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20'
                      : isDelete
                      ? 'border-rose-300 dark:border-rose-700/60 bg-rose-50/50 dark:bg-rose-950/20'
                      : 'border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/50 dark:bg-emerald-950/20'
                  }`}
                  data-testid={`diff-block-${pDiff.type}`}
                >
                  {/* Seçmeli Geri Yükleme Aksiyon Butonu */}
                  {onRollbackParagraph && (
                    <div className="absolute top-2 right-2">
                      <button
                        type="button"
                        onClick={() => handleSelectiveRollback(pDiff.id)}
                        className="opacity-90 hover:opacity-100 flex items-center gap-1 text-xs px-2 py-1 rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 shadow-xs hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-all cursor-pointer"
                        title="Bu paragrafı eski versiyona geri döndür"
                        data-testid={`rollback-btn-${idx}`}
                      >
                        <span aria-hidden="true">↩</span>
                        <span>
                          {isInsert
                            ? 'Paragrafı Kaldır'
                            : isDelete
                            ? 'Paragrafı Geri Getir'
                            : 'Eski Paragrafı Geri Al'}
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Kelime Değişiklikleri Gösterimi */}
                  <div className="pr-36 text-sm leading-relaxed whitespace-pre-wrap font-serif">
                    {pDiff.wordChanges.map((change, wIdx) => {
                      if (change.type === 'equal') {
                        return <span key={wIdx}>{change.value}</span>;
                      }
                      if (change.type === 'delete') {
                        return (
                          <del
                            key={wIdx}
                            className="bg-rose-200 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 line-through px-0.5 rounded-xs mx-0.5 select-text"
                          >
                            {change.value}
                          </del>
                        );
                      }
                      if (change.type === 'insert') {
                        return (
                          <ins
                            key={wIdx}
                            className="bg-emerald-200 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 no-underline px-0.5 rounded-xs mx-0.5 font-medium select-text"
                          >
                            {change.value}
                          </ins>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* =========================================================================
             SPLIT VIEW: Yan Yana (Side-by-Side) Çift Panel Görünümü
             ========================================================================= */
          <div
            className="split-diff-container border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden bg-white dark:bg-neutral-800 font-mono text-xs shadow-xs"
            data-testid="split-diff-view"
          >
            {/* Sütun Başlıkları */}
            <div className="grid grid-cols-2 bg-neutral-100 dark:bg-neutral-750 border-b border-neutral-200 dark:border-neutral-700 font-semibold px-4 py-2 text-neutral-700 dark:text-neutral-300">
              <div>⏮ Eski Versiyon (Snapshot)</div>
              <div className="border-l border-neutral-200 dark:border-neutral-700 pl-4">
                ⏭ Mevcut Taslak (Güncel)
              </div>
            </div>

            {/* Satırlar */}
            <div className="divide-y divide-neutral-200/50 dark:divide-neutral-700/50">
              {splitRows.map((row, rIdx) => {
                const isEq = row.type === 'equal';
                const isMod = row.type === 'modify';
                const isDel = row.type === 'delete';
                const isIns = row.type === 'insert';

                return (
                  <div key={rIdx} className="grid grid-cols-2 hover:bg-neutral-50/50 dark:hover:bg-neutral-700/30">
                    {/* Sol Panel: Eski */}
                    <div
                      className={`flex items-start px-2 py-1 gap-2 ${
                        isDel || (isMod && row.oldText)
                          ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200'
                          : isIns
                          ? 'bg-neutral-50/50 dark:bg-neutral-850/40 text-neutral-400'
                          : ''
                      }`}
                    >
                      <span className="w-8 text-right text-neutral-400 select-none shrink-0 font-mono">
                        {row.oldLineNumber || ''}
                      </span>
                      <span className="w-4 select-none shrink-0 text-center font-bold">
                        {isDel || isMod ? '-' : ' '}
                      </span>
                      <span className="break-all whitespace-pre-wrap flex-1">{row.oldText || ''}</span>
                    </div>

                    {/* Sağ Panel: Yeni */}
                    <div
                      className={`flex items-start px-2 py-1 gap-2 border-l border-neutral-200 dark:border-neutral-700 ${
                        isIns || (isMod && row.newText)
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                          : isDel
                          ? 'bg-neutral-50/50 dark:bg-neutral-850/40 text-neutral-400'
                          : ''
                      }`}
                    >
                      <span className="w-8 text-right text-neutral-400 select-none shrink-0 font-mono">
                        {row.newLineNumber || ''}
                      </span>
                      <span className="w-4 select-none shrink-0 text-center font-bold">
                        {isIns || isMod ? '+' : ' '}
                      </span>
                      <span className="break-all whitespace-pre-wrap flex-1">{row.newText || ''}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentDiffViewer;
