/**
 * CompileModal Component
 * Gelişmiş derleme ve dışa aktarma modal'ı
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useExport, toDocumentNodes, type CompileFormat } from '../hooks/useExport';
import { ExportProgress } from './ExportProgress';

interface Document {
  docId: string;
  title: string;
  content: string;
  folder?: string;
}

interface CompileModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: Document[];
  totalWords: number;
}

export function CompileModal({ isOpen, onClose, documents, totalWords }: CompileModalProps) {
  const {
    startExport,
    downloadLastResult,
    lastResult,
    progress,
    isExporting,
    error,
    loadSettings,
    getFormats,
  } = useExport();

  // Form state
  const [format, setFormat] = useState<CompileFormat>('pdf');
  const [title, setTitle] = useState('Projem');
  const [author, setAuthor] = useState('');
  const [includeTitlePage, setIncludeTitlePage] = useState(true);
  const [includeTOC, setIncludeTOC] = useState(true);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'a5'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [language, setLanguage] = useState('tr');
  const [publisher, setPublisher] = useState('');
  const [showProgress, setShowProgress] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const formats = getFormats();

  // Load saved settings on mount
  useEffect(() => {
    if (isOpen) {
      const saved = loadSettings();
      if (saved.format) setFormat(saved.format);
      if (saved.title) setTitle(saved.title);
      if (saved.author) setAuthor(saved.author);
      if (saved.includeTitlePage !== undefined) setIncludeTitlePage(saved.includeTitlePage);
      if (saved.includeTOC !== undefined) setIncludeTOC(saved.includeTOC);
      if (saved.pageSize) setPageSize(saved.pageSize as 'a4' | 'letter' | 'a5');
      if (saved.orientation) setOrientation(saved.orientation as 'portrait' | 'landscape');
      if (saved.language) setLanguage(saved.language);
      if (saved.publisher) setPublisher(saved.publisher);

      // Select all documents by default
      setSelectedDocIds(documents.map(d => d.docId));
    }
  }, [isOpen, documents, loadSettings]);

  const toggleDocSelection = useCallback((docId: string) => {
    setSelectedDocIds(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  }, []);

  const selectAll = useCallback(() => {
    setSelectedDocIds(documents.map(d => d.docId));
  }, [documents]);

  const deselectAll = useCallback(() => {
    setSelectedDocIds([]);
  }, []);

  const handleExport = useCallback(async () => {
    if (selectedDocIds.length === 0) return;

    setShowProgress(true);
    setExportComplete(false);

    const selectedDocs = toDocumentNodes(documents, selectedDocIds);

    const result = await startExport({
      documents: selectedDocs,
      format,
      title,
      author: author || undefined,
      includeTitlePage,
      includeTOC,
      pageSize,
      orientation,
      language,
      publisher: publisher || undefined,
    });

    if (result.success) {
      setExportComplete(true);
      // Auto-download
      downloadLastResult();
    }
  }, [
    selectedDocIds,
    documents,
    format,
    title,
    author,
    includeTitlePage,
    includeTOC,
    pageSize,
    orientation,
    language,
    publisher,
    startExport,
    downloadLastResult,
  ]);

  const handleClose = useCallback(() => {
    if (isExporting) return;
    setShowProgress(false);
    setExportComplete(false);
    onClose();
  }, [isExporting, onClose]);

  if (!isOpen) return null;

  const selectedWordCount = documents
    .filter(d => selectedDocIds.includes(d.docId))
    .reduce((sum, d) => sum + d.content.trim().split(/\s+/).filter(Boolean).length, 0);

  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" aria-label="Compile">
        <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700 shrink-0">
            <h2 className="text-lg font-semibold text-gray-100">📚 Derleme ve Dışa Aktarma</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-200 text-xl"
              aria-label="Close Compile Window"
              disabled={isExporting}
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Format Selection */}
            <div>
              <label className="text-sm text-gray-300 block mb-2 font-medium">Dışa Aktarma Formatı</label>
              <div className="grid grid-cols-5 gap-2">
                {formats.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFormat(f.value)}
                    className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                      format === f.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <span className="block text-center">{f.icon}</span>
                    <span className="block text-center mt-1">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title & Author */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-300 block mb-1">Kitap Başlığı</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                  placeholder="Proje başlığı..."
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 block mb-1">Yazar</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                  placeholder="Yazar adı..."
                />
              </div>
            </div>

            {/* Options */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTitlePage}
                  onChange={(e) => setIncludeTitlePage(e.target.checked)}
                  className="rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500"
                />
                Başlık Sayfası
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTOC}
                  onChange={(e) => setIncludeTOC(e.target.checked)}
                  className="rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500"
                />
                İçindekiler
              </label>
            </div>

            {/* PDF-specific options */}
            {format === 'pdf' && (
              <div className="grid grid-cols-2 gap-4 bg-gray-900/50 rounded-lg p-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Sayfa Boyutu</label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value as 'a4' | 'letter' | 'a5')}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="a4">A4</option>
                    <option value="letter">Letter</option>
                    <option value="a5">A5</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Yön</label>
                  <select
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape')}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="portrait">Dikey (Portrait)</option>
                    <option value="landscape">Yatay (Landscape)</option>
                  </select>
                </div>
              </div>
            )}

            {/* EPUB-specific options */}
            {format === 'epub' && (
              <div className="grid grid-cols-2 gap-4 bg-gray-900/50 rounded-lg p-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Dil</label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                    placeholder="tr"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Yayıncı</label>
                  <input
                    type="text"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                    placeholder="Yayıncı adı..."
                  />
                </div>
              </div>
            )}

            {/* Document Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-300 font-medium">Dahil Edilecek Bölümler</label>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    Tümünü Seç
                  </button>
                  <span className="text-gray-600">|</span>
                  <button
                    onClick={deselectAll}
                    className="text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    Tümünü Kaldır
                  </button>
                </div>
              </div>
              <div className="bg-gray-900 rounded p-3 max-h-48 overflow-y-auto space-y-1">
                {documents.map(doc => (
                  <label
                    key={doc.docId}
                    className="flex items-center gap-2 text-sm text-gray-300 hover:text-gray-100 cursor-pointer py-1"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDocIds.includes(doc.docId)}
                      onChange={() => toggleDocSelection(doc.docId)}
                      className="rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="flex-1 truncate">{doc.title}</span>
                    <span className="text-xs text-gray-500">
                      {doc.content.trim().split(/\s+/).filter(Boolean).length} kelime
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-gray-900 rounded p-3 text-sm text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>Seçili Bölümler</span>
                <span className="text-gray-200">{selectedDocIds.length} / {documents.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Seçili Kelimeler</span>
                <span className="text-gray-200">{selectedWordCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Tahmini Sayfa</span>
                <span className="text-gray-200">{Math.ceil(selectedWordCount / 250)}</span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/20 border border-red-700 rounded p-3 text-sm text-red-400">
                <span className="font-medium">Hata:</span> {error}
              </div>
            )}

            {/* Success Message */}
            {exportComplete && lastResult?.success && (
              <div className="bg-green-900/20 border border-green-700 rounded p-3 text-sm text-green-400 flex items-center justify-between">
                <span>✓ Dışa aktarma tamamlandı: {lastResult.filename}</span>
                <button
                  onClick={downloadLastResult}
                  className="text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded"
                >
                  Tekrar İndir
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-gray-700 shrink-0">
            <span className="text-xs text-gray-500">
              Toplam: {totalWords.toLocaleString()} kelime
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={handleClose}
                className="text-sm bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition-colors"
                disabled={isExporting}
              >
                İptal
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting || selectedDocIds.length === 0}
                className={`text-sm px-4 py-2 rounded transition-colors ${
                  isExporting || selectedDocIds.length === 0
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {isExporting ? 'Derleniyor...' : 'Derle ve İndir'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Overlay */}
      {showProgress && (
        <ExportProgress
          progress={progress}
          isExporting={isExporting}
          error={error}
          onClose={() => setShowProgress(false)}
        />
      )}
    </>
  );
}

export default CompileModal;
