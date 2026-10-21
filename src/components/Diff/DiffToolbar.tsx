import React from 'react';
import { DiffStats } from '../../services/diff/textDiffEngine';

export interface DiffToolbarProps {
  viewMode: 'inline' | 'split';
  onViewModeChange: (mode: 'inline' | 'split') => void;
  stats: DiffStats;
  snapshots: Array<{ timestamp: number; title: string; note?: string; size?: number }>;
  selectedSnapshotTimestamp: number | null;
  onSelectSnapshot: (timestamp: number) => void;
  onFullRollback?: () => void;
  onClose?: () => void;
  documentTitle?: string;
  isBusy?: boolean;
}

export const DiffToolbar: React.FC<DiffToolbarProps> = ({
  viewMode,
  onViewModeChange,
  stats,
  snapshots,
  selectedSnapshotTimestamp,
  onSelectSnapshot,
  onFullRollback,
  onClose,
  documentTitle = 'Doküman',
  isBusy = false,
}) => {
  return (
    <div
      className="diff-toolbar flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-300 dark:border-neutral-700 text-sm select-none"
      role="toolbar"
      aria-label="Metin Farkı ve Karşılaştırma Araç Çubuğu"
    >
      {/* Sol: Başlık ve Snapshot Seçimi */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-semibold text-neutral-800 dark:text-neutral-100">
          <span aria-hidden="true">🔍</span>
          <span>Versiyon Karşılaştır:</span>
          <span className="text-neutral-500 font-normal">({documentTitle})</span>
        </div>

        <div className="flex items-center gap-1.5">
          <label htmlFor="snapshot-select" className="text-xs text-neutral-600 dark:text-neutral-400">
            Hedef Sürüm:
          </label>
          <select
            id="snapshot-select"
            value={selectedSnapshotTimestamp || ''}
            onChange={(e) => onSelectSnapshot(Number(e.target.value))}
            disabled={isBusy || snapshots.length === 0}
            className="px-2 py-1 text-xs rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            aria-label="Karşılaştırılacak Snapshot Seçin"
          >
            {snapshots.length === 0 && <option value="">Snapshot bulunamadı</option>}
            {snapshots.map((snap) => (
              <option key={snap.timestamp} value={snap.timestamp}>
                {snap.title} ({new Date(snap.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orta: Diff İstatistikleri */}
      <div className="flex items-center gap-2 text-xs font-mono">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold"
          title="Eklenen kelimeler"
          data-testid="diff-stat-added"
        >
          +{stats.addedWords} kelime
        </span>
        <span
          className="inline-flex items-center px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-semibold"
          title="Silinen kelimeler"
          data-testid="diff-stat-deleted"
        >
          -{stats.deletedWords} kelime
        </span>
        <span
          className="inline-flex items-center px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
          title="Benzerlik Oranı"
          data-testid="diff-stat-similarity"
        >
          %{Math.round(stats.similarityRatio * 100)} benzerlik
        </span>
      </div>

      {/* Sağ: Görünüm Butonları & Eylemler */}
      <div className="flex items-center gap-2">
        {/* Görünüm Modu Değiştir */}
        <div className="inline-flex rounded-md shadow-xs" role="group" aria-label="Görünüm Modu">
          <button
            type="button"
            onClick={() => onViewModeChange('inline')}
            className={`px-2.5 py-1 text-xs font-medium rounded-l-md border border-neutral-300 dark:border-neutral-600 ${
              viewMode === 'inline'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-600'
            }`}
            aria-pressed={viewMode === 'inline'}
            title="Satır içi (Inline) Gösterim"
          >
            Satır İçi
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('split')}
            className={`px-2.5 py-1 text-xs font-medium rounded-r-md border border-neutral-300 dark:border-neutral-600 border-l-0 ${
              viewMode === 'split'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-600'
            }`}
            aria-pressed={viewMode === 'split'}
            title="Yan Yana (Split) Gösterim"
          >
            Yan Yana
          </button>
        </div>

        {/* Tümünü Geri Yükle */}
        {onFullRollback && (
          <button
            type="button"
            onClick={onFullRollback}
            disabled={isBusy || !selectedSnapshotTimestamp}
            className="px-2.5 py-1 text-xs font-medium rounded bg-amber-500 hover:bg-amber-600 text-white transition-colors disabled:opacity-50"
            title="Tüm dokümanı bu snapshot sürümüne geri döndürür"
          >
            ↩ Tümünü Geri Al
          </button>
        )}

        {/* Kapat */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-medium rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 transition-colors"
            title="Karşılaştırma görünümünü kapat"
          >
            ✕ Kapat
          </button>
        )}
      </div>
    </div>
  );
};

export default DiffToolbar;
