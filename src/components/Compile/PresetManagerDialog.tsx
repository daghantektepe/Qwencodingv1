import React, { useState, useEffect } from 'react';
import {
  compilePresetsStore,
  CompilePreset,
} from '../../services/compile/compilePresetsStore';
import { ExportFormat, PageSize, PageOrientation } from '../../types/compile';

interface PresetManagerDialogProps {
  isOpen: boolean;
  activePresetId?: string;
  onSelectPreset?: (preset: CompilePreset) => void;
  onClose: () => void;
}

export const PresetManagerDialog: React.FC<PresetManagerDialogProps> = ({
  isOpen,
  activePresetId,
  onSelectPreset,
  onClose,
}) => {
  const [presets, setPresets] = useState<CompilePreset[]>(compilePresetsStore.getPresets());
  const [isCreating, setIsCreating] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Yeni Profil State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [fontFamily, setFontFamily] = useState('Times New Roman, serif');
  const [fontSizePt, setFontSizePt] = useState(12);
  const [lineSpacing, setLineSpacing] = useState(2.0);
  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [orientation, setOrientation] = useState<PageOrientation>('portrait');
  const [marginsMm, setMarginsMm] = useState({ top: 25, right: 25, bottom: 25, left: 25 });

  const refresh = () => setPresets(compilePresetsStore.getPresets());

  useEffect(() => {
    refresh();
    const unsub = compilePresetsStore.subscribe(refresh);
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const created = compilePresetsStore.createPreset({
      name: name.trim(),
      description: description.trim() || 'Özel yazar derleme profili',
      format,
      fontFamily,
      fontSizePt: Number(fontSizePt),
      lineSpacing: Number(lineSpacing),
      pageSize,
      orientation,
      marginsMm,
      firstLineIndentMm: 8,
      includeTOC: true,
      includeTitlePage: true,
      chapterBreak: 'page',
    });

    setName('');
    setDescription('');
    setIsCreating(false);
    setToastMsg(`'${created.name}' profili başarıyla kaydedildi!`);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleDelete = (id: string) => {
    compilePresetsStore.deletePreset(id);
    setToastMsg('Profil silindi.');
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleExportJson = () => {
    const json = compilePresetsStore.exportPresetsJson();
    navigator.clipboard?.writeText(json);
    setToastMsg('Profiller panoya JSON olarak kopyalandı!');
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleImportJson = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const count = compilePresetsStore.importPresetsJson(jsonInput);
      setToastMsg(`${count} profil başarıyla içe aktarıldı!`);
      setShowJsonModal(false);
      setJsonInput('');
      setTimeout(() => setToastMsg(''), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-label="Derleme Profilleri Yöneticisi"
      data-testid="preset-manager-dialog"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl text-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🖨️</span>
            <div>
              <h2 className="text-base font-semibold text-white">
                Derleme Format Profilleri Stüdyosu
              </h2>
              <p className="text-xs text-slate-400">
                KDP, Shunn, Yarışma ve yayınevi standartları tek tıkla elinizin altında
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

        {/* Toolbar */}
        <div className="px-6 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCreating(!isCreating)}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-colors"
            >
              {isCreating ? 'Vazgeç' : '+ Yeni Özel Profil'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportJson}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700"
              title="Özel profilleri JSON olarak panoya kopyala"
            >
              📋 JSON Dışa Aktar
            </button>
            <button
              type="button"
              onClick={() => setShowJsonModal(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700"
            >
              📥 JSON İçe Aktar
            </button>
          </div>
        </div>

        {/* Feedback message */}
        {toastMsg && (
          <div className="px-6 py-2 bg-emerald-950/80 border-b border-emerald-800 text-emerald-300 text-xs font-medium animate-pulse">
            ✓ {toastMsg}
          </div>
        )}

        {/* New Preset Drawer */}
        {isCreating && (
          <form
            onSubmit={handleCreateSubmit}
            className="p-5 bg-slate-950 border-b border-slate-800 grid grid-cols-3 gap-3 text-xs"
          >
            <div className="col-span-2">
              <label className="block text-slate-400 mb-0.5">Profil Adı *</label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Edebiyat Yarışması 2026..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-0.5">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as ExportFormat)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
              >
                <option value="pdf">PDF (Baskı Hazır)</option>
                <option value="epub">EPUB (E-Kitap)</option>
                <option value="html">HTML</option>
                <option value="md">Markdown</option>
                <option value="txt">Düz Metin</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-0.5">Yazı Tipi</label>
              <input
                type="text"
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-0.5">Punto (pt)</label>
              <input
                type="number"
                value={fontSizePt}
                onChange={(e) => setFontSizePt(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-0.5">Satır Aralığı</label>
              <select
                value={lineSpacing}
                onChange={(e) => setLineSpacing(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
              >
                <option value={1.0}>1.0 (Tek Satır)</option>
                <option value={1.25}>1.25 (Kitap Standart)</option>
                <option value={1.5}>1.5 (Geniş)</option>
                <option value={2.0}>2.0 (Çift - Shunn/Yarışma)</option>
              </select>
            </div>
            <div className="col-span-3 flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 text-slate-400 hover:text-white"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium"
              >
                Profili Kaydet
              </button>
            </div>
          </form>
        )}

        {/* JSON Import Modal overlay */}
        {showJsonModal && (
          <form
            onSubmit={handleImportJson}
            className="p-5 bg-slate-950 border-b border-slate-800 space-y-2 text-xs"
          >
            <label className="block text-cyan-400 font-medium">JSON Profil Kodunu Yapıştırın</label>
            <textarea
              rows={4}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="[ { name: 'Özel Profil', format: 'pdf', ... } ]"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowJsonModal(false)}
                className="px-3 py-1.5 text-slate-400 hover:text-white"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium"
              >
                İçe Aktar
              </button>
            </div>
          </form>
        )}

        {/* Presets List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {presets.map((preset) => {
            const isSelected = activePresetId === preset.id;

            return (
              <div
                key={preset.id}
                className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-md ring-1 ring-cyan-500/50'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
                data-testid={`preset-card-${preset.id}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white text-xs">{preset.name}</span>
                    <span className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-[10px] font-mono uppercase text-cyan-400">
                      {preset.format}
                    </span>
                    {preset.isBuiltIn ? (
                      <span className="px-1.5 py-0.2 bg-slate-800 rounded text-[10px] text-slate-400">
                        Yerleşik
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 bg-purple-950 border border-purple-800 rounded text-[10px] text-purple-300">
                        Özel
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 mb-2">{preset.description}</p>

                  <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono flex-wrap">
                    <span>Font: {preset.fontFamily.split(',')[0]} ({preset.fontSizePt}pt)</span>
                    <span>•</span>
                    <span>Satır Aralığı: {preset.lineSpacing}x</span>
                    <span>•</span>
                    <span>Sayfa: {preset.pageSize.toUpperCase()}</span>
                    <span>•</span>
                    <span>Kenar: {preset.marginsMm.left}mm sol</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!preset.isBuiltIn && (
                    <button
                      type="button"
                      onClick={() => handleDelete(preset.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors"
                      title="Profili Sil"
                    >
                      🗑️
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      onSelectPreset?.(preset);
                      setToastMsg(`'${preset.name}' profili seçildi.`);
                      setTimeout(() => setToastMsg(''), 2000);
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isSelected
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white'
                    }`}
                  >
                    {isSelected ? '✓ Seçili' : 'Profili Uygula'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Toplam {presets.length} derleme profili hazır</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

export default PresetManagerDialog;
