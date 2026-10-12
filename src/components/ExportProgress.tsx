/**
 * ExportProgress Component
 * Dışa aktarma ilerleme durumunu gösteren bileşen
 */

import React from 'react';
import type { CompileProgress } from '../services/compile/CompileEngine';

interface ExportProgressProps {
  progress: CompileProgress | null;
  isExporting: boolean;
  error?: string | null;
  onClose?: () => void;
}

export function ExportProgress({ progress, isExporting, error, onClose }: ExportProgressProps) {
  if (!isExporting && !progress && !error) {
    return null;
  }

  const percent = progress?.percent ?? 0;
  const stage = progress?.stage ?? 'Hazırlanıyor...';
  const currentDoc = progress?.currentDoc;
  const totalDocs = progress?.totalDocs;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-gray-800 border border-gray-600 rounded-lg shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-700 border-b border-gray-600">
        <span className="text-sm font-medium text-gray-200">
          {isExporting ? 'Dışa Aktarılıyor...' : error ? 'Hata Oluştu' : 'Tamamlandı'}
        </span>
        {!isExporting && onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-lg leading-none"
            aria-label="Kapat"
          >
            ✕
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-3">
        {error ? (
          <div className="text-sm text-red-400">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-red-500">⚠</span>
              <span className="font-medium">Hata</span>
            </div>
            <p className="text-xs text-gray-400">{error}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">{stage}</span>
              <span className="text-xs text-gray-400">{Math.round(percent)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  percent >= 100 ? 'bg-green-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
            {currentDoc && totalDocs && (
              <div className="mt-2 text-xs text-gray-500">
                Belge {currentDoc} / {totalDocs}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      {!isExporting && !error && (
        <div className="px-4 py-2 bg-gray-700/50 border-t border-gray-600">
          <span className="text-xs text-green-400">✓ Dışa aktarma tamamlandı</span>
        </div>
      )}
    </div>
  );
}

export default ExportProgress;
