import React, { useState } from 'react';
import {
  documentSplitter,
  SplitChunk,
  SplitPatternType
} from '../../services/binder/documentSplitter';

interface SplitDocumentDialogProps {
  isOpen: boolean;
  documentTitle: string;
  documentContent: string;
  cursorOffset?: number;
  onConfirmSplit: (chunks: SplitChunk[]) => void;
  onClose: () => void;
}

export const SplitDocumentDialog: React.FC<SplitDocumentDialogProps> = ({
  isOpen,
  documentTitle,
  documentContent,
  cursorOffset = 0,
  onConfirmSplit,
  onClose
}) => {
  const [mode, setMode] = useState<'cursor' | 'pattern'>('pattern');
  const [patternType, setPatternType] = useState<SplitPatternType>('chapters');
  const [customRegex, setCustomRegex] = useState<string>('');
  const [secondTitle, setSecondTitle] = useState<string>(`${documentTitle} (Kısım 2)`);

  if (!isOpen) return null;

  let previewChunks: SplitChunk[] = [];
  if (mode === 'cursor') {
    previewChunks = documentSplitter.splitAtCursor(
      documentContent,
      cursorOffset,
      documentTitle,
      secondTitle
    );
  } else {
    previewChunks = documentSplitter.splitByPattern(
      documentContent,
      patternType,
      customRegex,
      documentTitle
    );
  }

  const handleApply = () => {
    onConfirmSplit(previewChunks);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="split-dialog-title"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col text-slate-200">
        {/* Başlık */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <span className="text-xl">✂️</span>
            <h2 id="split-dialog-title" className="font-semibold text-white text-sm">
              Doküman Bölme ve Parçalama Sihirbazı
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-base p-1"
          >
            ✕
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Bölme Modu Seçimi */}
          <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setMode('pattern')}
              className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                mode === 'pattern'
                  ? 'bg-cyan-700 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Otomatik Kalıpla Böl (Çoklu)
            </button>
            <button
              type="button"
              onClick={() => setMode('cursor')}
              className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                mode === 'cursor'
                  ? 'bg-cyan-700 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              İmleçten İkiye Böl (Ctrl+Shift+K)
            </button>
          </div>

          {/* Kalıp Ayarları */}
          {mode === 'pattern' ? (
            <div className="flex flex-col gap-2 bg-slate-950/60 p-3 rounded border border-slate-800 text-xs">
              <label className="text-slate-400 font-medium">Bölme Ayracı Kalıbı:</label>
              <select
                value={patternType}
                onChange={(e) => setPatternType(e.target.value as SplitPatternType)}
                className="bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
              >
                <option value="chapters">Bölüm Başlıkları (Bölüm 1, Chapter II, Kısım X)</option>
                <option value="scenes">Sahne Ayraçları (***, ###, ---)</option>
                <option value="custom">Özel Düzenli İfade (Custom Regex)</option>
              </select>

              {patternType === 'custom' && (
                <input
                  type="text"
                  value={customRegex}
                  onChange={(e) => setCustomRegex(e.target.value)}
                  placeholder="Regex örn: ^Sahne\\s+\\d+"
                  className="bg-slate-900 border border-slate-700 rounded p-1.5 text-white mt-1"
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2 bg-slate-950/60 p-3 rounded border border-slate-800 text-xs">
              <label className="text-slate-400 font-medium">İkinci Belge Başlığı:</label>
              <input
                type="text"
                value={secondTitle}
                onChange={(e) => setSecondTitle(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
              />
              <span className="text-[11px] text-slate-500">
                İmleç Karakter Konumu: {cursorOffset}
              </span>
            </div>
          )}

          {/* Önizleme Listesi */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-semibold uppercase tracking-wider">
                Oluşacak Belgeler ({previewChunks.length})
              </span>
              <span>
                Toplam: {previewChunks.reduce((acc, c) => acc + c.wordCount, 0)} kelime
              </span>
            </div>

            <div className="max-h-44 overflow-y-auto flex flex-col gap-1.5 pr-1">
              {previewChunks.map((chunk, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded bg-slate-800/60 border border-slate-800 text-xs"
                >
                  <span className="font-medium text-slate-200 truncate pr-2">
                    {idx + 1}. {chunk.title}
                  </span>
                  <span className="text-[11px] font-mono text-cyan-400 shrink-0">
                    {chunk.wordCount} kelime
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Aksiyon Butonları */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={previewChunks.length === 0}
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded shadow transition-colors"
            >
              Böl ve Binder'a Ekle ({previewChunks.length} Belge)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplitDocumentDialog;
