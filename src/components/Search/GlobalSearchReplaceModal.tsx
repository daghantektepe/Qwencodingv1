import React, { useState, useEffect, useMemo } from 'react';
import {
  globalSearchEngine,
  SearchDocument,
  SearchMatch,
  SearchOptions,
  DEFAULT_SEARCH_OPTIONS,
} from '../../services/search/globalSearchEngine';

interface GlobalSearchReplaceModalProps {
  isOpen: boolean;
  documents: SearchDocument[];
  onSaveDocuments: (updatedDocs: SearchDocument[]) => void;
  onClose: () => void;
}

export const GlobalSearchReplaceModal: React.FC<GlobalSearchReplaceModalProps> = ({
  isOpen,
  documents,
  onSaveDocuments,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [options, setOptions] = useState<SearchOptions>(DEFAULT_SEARCH_OPTIONS);
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [statusMessage, setStatusMessage] = useState('');

  // Arama sonuçları
  const searchResult = useMemo(() => {
    if (!isOpen || !query.trim()) {
      return { matches: [], totalMatches: 0, documentsWithMatchesCount: 0, durationMs: 0 };
    }
    return globalSearchEngine.search(documents, query, options);
  }, [isOpen, documents, query, options]);

  useEffect(() => {
    setMatches(searchResult.matches);
  }, [searchResult]);

  if (!isOpen) return null;

  const handleToggleOption = (key: keyof SearchOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleMatch = (id: string) => {
    setMatches((prev) =>
      prev.map((m) => (m.id === id ? { ...m, selected: !m.selected } : m))
    );
  };

  const handleSelectAll = (select: boolean) => {
    setMatches((prev) => prev.map((m) => ({ ...m, selected: select })));
  };

  const handleApply = (onlySelected = true) => {
    const toApply = onlySelected ? matches.filter((m) => m.selected) : matches;
    if (toApply.length === 0) return;

    const { updatedDocs, replacementsCount } = globalSearchEngine.applyReplacements(
      documents,
      toApply,
      replacement
    );

    onSaveDocuments(updatedDocs);
    setStatusMessage(`${replacementsCount} adet eşleşme başarıyla güncellendi!`);
    setTimeout(() => {
      setStatusMessage('');
      onClose();
    }, 1500);
  };

  const selectedCount = matches.filter((m) => m.selected).length;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-label="Çoklu Dosyada Bul ve Değiştir"
      data-testid="global-search-replace-modal"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl text-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🔍</span>
            <div>
              <h2 className="text-base font-semibold text-white">
                Çoklu Dosyada Bul ve Değiştir
              </h2>
              <p className="text-xs text-slate-400">
                Proje genelinde Regex, tam kelime ve alan filtreli toplu düzenleme
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

        {/* Search Inputs & Options */}
        <div className="p-6 border-b border-slate-800 space-y-3 bg-slate-950/60">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Aranacak İfade
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Metin veya Regex yazın..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Yerine Geçecek Metin
              </label>
              <input
                type="text"
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
                placeholder="Yeni metin..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Option Pills */}
          <div className="flex items-center justify-between gap-2 flex-wrap pt-1 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleToggleOption('caseSensitive')}
                className={`px-2.5 py-1 rounded-lg border font-mono transition-colors ${
                  options.caseSensitive
                    ? 'border-cyan-500 bg-cyan-950/60 text-cyan-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                }`}
                title="Büyük / Küçük Harf Duyarlı"
              >
                Aa
              </button>
              <button
                type="button"
                onClick={() => handleToggleOption('matchWholeWord')}
                className={`px-2.5 py-1 rounded-lg border font-mono transition-colors ${
                  options.matchWholeWord
                    ? 'border-cyan-500 bg-cyan-950/60 text-cyan-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                }`}
                title="Tam Kelime Eşleme"
              >
                \b
              </button>
              <button
                type="button"
                onClick={() => handleToggleOption('useRegex')}
                className={`px-2.5 py-1 rounded-lg border font-mono transition-colors ${
                  options.useRegex
                    ? 'border-cyan-500 bg-cyan-950/60 text-cyan-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                }`}
                title="Düzenli İfade (Regex)"
              >
                .*
              </button>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.inDocumentContent}
                  onChange={() => handleToggleOption('inDocumentContent')}
                  className="rounded border-slate-700 text-cyan-600 focus:ring-0"
                />
                İçerik
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.inDocumentTitle}
                  onChange={() => handleToggleOption('inDocumentTitle')}
                  className="rounded border-slate-700 text-cyan-600 focus:ring-0"
                />
                Başlıklar
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.inNotes}
                  onChange={() => handleToggleOption('inNotes')}
                  className="rounded border-slate-700 text-cyan-600 focus:ring-0"
                />
                Notlar
              </label>
            </div>
          </div>
        </div>

        {/* Results Bar */}
        <div className="px-6 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            {searchResult.regexError ? (
              <span className="text-rose-400 font-medium">⚠️ {searchResult.regexError}</span>
            ) : query.trim() ? (
              <span>
                Toplam <strong className="text-white">{matches.length}</strong> eşleşme,{' '}
                <strong className="text-white">{searchResult.documentsWithMatchesCount}</strong> belgede bulundu ({searchResult.durationMs} ms)
              </span>
            ) : (
              <span>Aramak istediğiniz ifadeyi yukarıya yazın.</span>
            )}
          </div>

          {matches.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSelectAll(true)}
                className="text-[11px] text-cyan-400 hover:underline"
              >
                Tümünü Seç
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => handleSelectAll(false)}
                className="text-[11px] text-slate-400 hover:text-white"
              >
                Kaldır
              </button>
            </div>
          )}
        </div>

        {/* Match List with Diff Previews */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {matches.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              {query.trim() ? 'Eşleşen sonuç bulunamadı.' : 'Arama yapmak için yukarıya bir ifade yazın.'}
            </div>
          ) : (
            matches.map((m) => (
              <div
                key={m.id}
                onClick={() => handleToggleMatch(m.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  m.selected
                    ? 'bg-slate-800/80 border-cyan-800/70 shadow-sm'
                    : 'bg-slate-950 border-slate-800 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1 text-[11px]">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={m.selected}
                      onChange={() => handleToggleMatch(m.id)}
                      className="rounded border-slate-700 text-cyan-600 focus:ring-0"
                    />
                    <span className="font-semibold text-white">{m.docTitle}</span>
                    <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-[10px] text-slate-400">
                      {m.field} • Satır {m.line}
                    </span>
                  </div>
                </div>

                {/* Diff Preview */}
                <div className="text-xs font-mono bg-slate-900/90 p-2 rounded-lg border border-slate-800/80 text-slate-300 overflow-x-auto">
                  <span className="text-slate-500">{m.contextBefore}</span>
                  <span className="bg-rose-950/80 text-rose-300 line-through px-1 rounded border border-rose-800/50">
                    {m.matchText}
                  </span>
                  {replacement && (
                    <span className="bg-emerald-950/80 text-emerald-300 font-bold px-1 rounded border border-emerald-800/50 mx-0.5">
                      {replacement}
                    </span>
                  )}
                  <span className="text-slate-500">{m.contextAfter}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div>
            {statusMessage && (
              <span className="text-xs text-emerald-400 font-medium animate-pulse">
                ✓ {statusMessage}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Vazgeç
            </button>
            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={() => handleApply(true)}
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-xs font-semibold shadow-lg shadow-cyan-900/30 transition-colors"
            >
              Seçilenleri Değiştir ({selectedCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchReplaceModal;
