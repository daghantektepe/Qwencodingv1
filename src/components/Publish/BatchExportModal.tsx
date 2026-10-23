import React, { useState } from 'react';
import {
  batchExporterService,
  BatchFormat,
  ALL_BATCH_FORMATS,
  BatchExportResult
} from '../../services/publish/batchExporter';
import {
  PackageCheck,
  FileText,
  CheckSquare,
  Square,
  Download,
  Loader2,
  Sparkles,
  X,
  FolderArchive
} from 'lucide-react';

interface BatchExportModalProps {
  onClose?: () => void;
  documents: { id: string; title: string; content?: string }[];
  projectName?: string;
  authorName?: string;
}

export const BatchExportModal: React.FC<BatchExportModalProps> = ({
  onClose,
  documents,
  projectName = 'Eldoria Günlükleri',
  authorName = 'Daghan'
}) => {
  const [selectedFormats, setSelectedFormats] = useState<BatchFormat[]>([
    'pdf',
    'epub',
    'docx',
    'markdown',
    'html',
    'txt'
  ]);
  const [splitByChapter, setSplitByChapter] = useState<boolean>(false);
  const [includeTOC, setIncludeTOC] = useState<boolean>(true);
  const [projName, setProjName] = useState<string>(projectName);
  const [authName, setAuthName] = useState<string>(authorName);

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentFormat, setCurrentFormat] = useState<string>('');
  const [exportResult, setExportResult] = useState<BatchExportResult | null>(null);

  const toggleFormat = (fmt: BatchFormat) => {
    setSelectedFormats((prev) =>
      prev.includes(fmt) ? prev.filter((f) => f !== fmt) : [...prev, fmt]
    );
  };

  const handleStartExport = async () => {
    if (selectedFormats.length === 0) return;

    setIsExporting(true);
    setProgress(0);
    setExportResult(null);

    try {
      const result = await batchExporterService.exportAll(
        documents,
        {
          formats: selectedFormats,
          splitByChapter,
          includeCoverPage: true,
          includeTableOfContents: includeTOC,
          projectName: projName,
          authorName: authName
        },
        (pct, fmt) => {
          setProgress(pct);
          setCurrentFormat(fmt.toUpperCase());
        }
      );

      setExportResult(result);
    } catch {
      // Ignore
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadKit = () => {
    if (!exportResult) return;
    // Create combined package text representation or download
    const blob = new Blob(
      [
        `OPENSCRIV DISTRIBUTION KIT\nPackage: ${exportResult.zipFilename}\nTotal Files: ${exportResult.totalFiles}\nDate: ${exportResult.timestamp}\n\nFiles in Kit:\n` +
          exportResult.files.map((f) => `- ${f.filename} (${(f.sizeBytes / 1024).toFixed(1)} KB)`).join('\n')
      ],
      { type: 'text/plain;charset=utf-8' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportResult.zipFilename;
    a.click();
  };

  return (
    <div className="bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 rounded-xl border border-stone-200 dark:border-stone-800 p-5 shadow-2xl max-w-xl w-full flex flex-col max-h-[90vh] select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <PackageCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <h2 className="text-base font-semibold tracking-wide">
            Toplu Dışa Aktarma ve Dağıtım Kiti Sihirbazı
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded text-stone-400 hover:text-stone-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Settings Body */}
      <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1 text-xs">
        {/* Project & Author details */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-stone-600 dark:text-stone-300 mb-1">
              Kitap / Proje Başlığı:
            </label>
            <input
              type="text"
              value={projName}
              onChange={(e) => setProjName(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-medium"
            />
          </div>
          <div>
            <label className="block font-medium text-stone-600 dark:text-stone-300 mb-1">
              Yazar Adı:
            </label>
            <input
              type="text"
              value={authName}
              onChange={(e) => setAuthName(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-medium"
            />
          </div>
        </div>

        {/* Formats Grid Selection */}
        <div>
          <label className="block font-semibold text-stone-700 dark:text-stone-200 mb-2">
            Dışa Aktarılacak Formatlar ({selectedFormats.length} seçili):
          </label>
          <div className="grid grid-cols-2 gap-2">
            {ALL_BATCH_FORMATS.map((f) => {
              const isChecked = selectedFormats.includes(f.id);

              return (
                <div
                  key={f.id}
                  onClick={() => toggleFormat(f.id)}
                  className={`p-2.5 rounded-lg border cursor-pointer flex items-start gap-2.5 transition-all ${
                    isChecked
                      ? 'border-amber-500 bg-amber-500/10 text-amber-950 dark:text-amber-200'
                      : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 text-stone-500'
                  }`}
                >
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <span className="font-semibold block">{f.label}</span>
                    <span className="text-[11px] opacity-75">{f.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Options */}
        <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={splitByChapter}
              onChange={(e) => setSplitByChapter(e.target.checked)}
              className="w-4 h-4 accent-amber-600 rounded"
            />
            <span>Bölüm bölüm ayrı dosyalar olarak arşivle (Tek dosya yerine)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeTOC}
              onChange={(e) => setIncludeTOC(e.target.checked)}
              className="w-4 h-4 accent-amber-600 rounded"
            />
            <span>İçindekiler tablosunu (TOC) dahil et</span>
          </label>
        </div>

        {/* Progress or Result Card */}
        {isExporting && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-800 dark:text-amber-300">
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                Derleniyor: {currentFormat}
              </span>
              <span>%{progress}</span>
            </div>
            <div className="w-full bg-stone-200 dark:bg-stone-700 h-2 rounded-full overflow-hidden">
              <div
                style={{ width: `${progress}%` }}
                className="bg-amber-600 h-full transition-all duration-200"
              />
            </div>
          </div>
        )}

        {exportResult && (
          <div className="p-3.5 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <FolderArchive className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-900 dark:text-green-200">
                  Dağıtım Kiti Hazır! ({exportResult.totalFiles} dosya)
                </p>
                <p className="text-[11px] text-green-700 dark:text-green-300/80">
                  {exportResult.zipFilename} • {(exportResult.totalSizeBytes / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadKit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors flex-shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>İndir</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
        <span className="text-xs text-stone-500">
          {documents.length} doküman / sahne derlenecek
        </span>
        <button
          onClick={handleStartExport}
          disabled={isExporting || selectedFormats.length === 0}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 transition-colors shadow-md"
        >
          <Sparkles className="w-4 h-4" />
          <span>Tüm Formatlarda Dışa Aktar</span>
        </button>
      </div>
    </div>
  );
};
