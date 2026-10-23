import React, { useState } from 'react';
import { multiSelectManager } from '../../services/binder/multiSelectManager';

interface BulkActionToolbarProps {
  selectedCount: number;
  availableFolders?: Array<{ id: string; title: string }>;
  onApplyStatus?: (status: string) => void;
  onApplyLabel?: (label: string) => void;
  onApplyMove?: (targetFolderId: string | null) => void;
  onBulkTrash?: () => void;
  onClearSelection?: () => void;
}

export const BulkActionToolbar: React.FC<BulkActionToolbarProps> = ({
  selectedCount,
  availableFolders = [],
  onApplyStatus,
  onApplyLabel,
  onApplyMove,
  onBulkTrash,
  onClearSelection
}) => {
  const [selectedStatus, setSelectedStatus] = useState('İncelemede');
  const [selectedLabel, setSelectedLabel] = useState('Bölüm');
  const [targetFolder, setTargetFolder] = useState('');

  if (selectedCount <= 1) return null;

  return (
    <div
      className="bulk-action-toolbar fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-cyan-500/60 shadow-2xl rounded-2xl px-5 py-3 text-slate-200 text-xs flex items-center gap-4 backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200"
      role="toolbar"
      aria-label="Toplu İşlem Araç Çubuğu"
    >
      {/* Seçim Sayısı */}
      <div className="flex items-center gap-2 border-r border-slate-700 pr-3">
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
        <span className="font-semibold text-white">
          {selectedCount} Belge Seçili
        </span>
      </div>

      {/* Toplu Durum */}
      {onApplyStatus && (
        <div className="flex items-center gap-1.5">
          <label className="text-slate-400">Durum:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
          >
            <option value="Taslak">Taslak</option>
            <option value="İncelemede">İncelemede</option>
            <option value="Revize">Revize</option>
            <option value="Tamamlandı">Tamamlandı</option>
          </select>
          <button
            type="button"
            onClick={() => onApplyStatus(selectedStatus)}
            className="px-2 py-1 bg-cyan-700 hover:bg-cyan-600 text-white rounded font-medium transition-colors"
          >
            Uygula
          </button>
        </div>
      )}

      {/* Toplu Etiket */}
      {onApplyLabel && (
        <div className="flex items-center gap-1.5">
          <label className="text-slate-400">Etiket:</label>
          <input
            type="text"
            value={selectedLabel}
            onChange={(e) => setSelectedLabel(e.target.value)}
            placeholder="örn. Climax"
            className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
          />
          <button
            type="button"
            onClick={() => onApplyLabel(selectedLabel)}
            className="px-2 py-1 bg-cyan-700 hover:bg-cyan-600 text-white rounded font-medium transition-colors"
          >
            Uygula
          </button>
        </div>
      )}

      {/* Toplu Taşıma */}
      {onApplyMove && availableFolders.length > 0 && (
        <div className="flex items-center gap-1.5">
          <label className="text-slate-400">Taşı:</label>
          <select
            value={targetFolder}
            onChange={(e) => setTargetFolder(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white max-w-[100px] truncate"
          >
            <option value="">Kök Klasör</option>
            {availableFolders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onApplyMove(targetFolder || null)}
            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded font-medium transition-colors"
          >
            Taşı
          </button>
        </div>
      )}

      {/* Toplu Çöpe Gönder */}
      {onBulkTrash && (
        <button
          type="button"
          onClick={onBulkTrash}
          className="px-2.5 py-1 bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/80 rounded font-medium transition-colors flex items-center gap-1"
        >
          <span>🗑</span> Çöpe Gönder
        </button>
      )}

      {/* Seçimi Temizle */}
      <button
        type="button"
        onClick={() => {
          multiSelectManager.clearSelection();
          onClearSelection?.();
        }}
        className="text-slate-400 hover:text-white border-l border-slate-700 pl-3 text-xs"
        title="Seçimi İptal Et"
      >
        ✕
      </button>
    </div>
  );
};

export default BulkActionToolbar;
