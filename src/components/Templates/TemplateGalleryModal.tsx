import React, { useState, useMemo } from 'react';
import { ProjectTemplate, TemplateCategory, TemplateFolderNode } from '../../types/templates';
import { templateManager } from '../../services/templateManager';

export interface TemplateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: ProjectTemplate, initialNodes: TemplateFolderNode[]) => void;
}

export const TemplateGalleryModal: React.FC<TemplateGalleryModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('preset-novel-three-act');
  const [importError, setImportError] = useState<string | null>(null);

  const templates = useMemo(() => templateManager.getAllTemplates(), [isOpen]);

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === 'all') return templates;
    return templates.filter((t) => t.category === selectedCategory);
  }, [templates, selectedCategory]);

  const selectedTemplate = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId) || templates[0];
  }, [templates, selectedTemplateId]);

  if (!isOpen) return null;

  const handleStartWithTemplate = () => {
    if (!selectedTemplate) return;
    const initialNodes = templateManager.instantiateTemplate(selectedTemplate.id);
    onSelectTemplate(selectedTemplate, initialNodes);
    onClose();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const imported = templateManager.importTemplateFromJson(text);
        if (imported) {
          setSelectedTemplateId(imported.id);
        } else {
          setImportError('Şablon dosyası geçersiz veya bozuk formatta.');
        }
      } catch {
        setImportError('Dosya okunurken bir hata oluştu.');
      }
    };
    reader.readAsText(file);
  };

  const renderTreePreview = (nodes: TemplateFolderNode[]) => {
    return (
      <ul className="space-y-1 pl-2 text-xs">
        {nodes.map((node) => (
          <li key={node.id} className="py-0.5">
            <span className="font-medium flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200">
              <span>{node.type === 'folder' ? '📁' : '📄'}</span>
              <span>{node.title}</span>
            </span>
            {node.synopsis && (
              <p className="text-[11px] text-neutral-500 pl-5 line-clamp-1 italic">
                {node.synopsis}
              </p>
            )}
            {node.children && node.children.length > 0 && (
              <div className="pl-3 border-l border-neutral-300 dark:border-neutral-700 mt-1">
                {renderTreePreview(node.children)}
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      role="dialog"
      aria-label="Proje Şablon Galerisi ve Yazım Sihirbazı"
      data-testid="template-gallery-modal"
    >
      <div className="bg-white dark:bg-neutral-850 rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden border border-neutral-300 dark:border-neutral-750 text-neutral-900 dark:text-neutral-100">
        {/* Modal Başlığı */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-750 bg-neutral-50 dark:bg-neutral-800">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
              <span>✨</span>
              <span>Proje Şablon Galerisi & Sihirbazı</span>
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Yazım türünüze en uygun hiyerarşik yapıyı seçin veya kendi özel şablonunuzu yükleyin.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 text-sm cursor-pointer"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        {/* Kategori Filtre Çubuğu */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-neutral-200 dark:border-neutral-750 bg-white dark:bg-neutral-850 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'Tümü' },
              { id: 'fiction', label: 'Roman & Kurgu' },
              { id: 'academic', label: 'Akademik' },
              { id: 'scriptwriting', label: 'Senaryo' },
              { id: 'custom', label: 'Özel Şablonlar' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline cursor-pointer">
            <span>📥</span>
            <span>Şablon İçe Aktar</span>
            <input
              type="file"
              accept=".json,.osctmpl"
              onChange={handleImportJson}
              className="hidden"
              data-testid="import-template-input"
            />
          </label>
        </div>

        {importError && (
          <div className="mx-6 mt-3 p-2 bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 rounded text-xs">
            {importError}
          </div>
        )}

        {/* Ana İçerik: Sol Şablon Kartları, Sağ Önizleme */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-200 dark:divide-neutral-750 overflow-hidden">
          {/* Sol: Şablon Kartları */}
          <div className="overflow-y-auto p-4 space-y-3">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12 text-neutral-400 text-xs">
                Bu kategoride şablon bulunamadı.
              </div>
            ) : (
              filteredTemplates.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTemplateId(t.id)}
                  className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                    selectedTemplateId === t.id
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 ring-1 ring-amber-500 shadow-xs'
                      : 'border-neutral-200 dark:border-neutral-750 hover:border-neutral-300 dark:hover:border-neutral-600 bg-white dark:bg-neutral-800'
                  }`}
                  data-testid={`template-card-${t.id}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xl shrink-0">{t.icon}</span>
                      <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                        {t.name}
                      </span>
                    </div>
                    {t.targets?.totalWords && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                        ~{t.targets.totalWords.toLocaleString('tr-TR')} kelime
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed line-clamp-2">
                    {t.description}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Sağ: Seçili Şablonun Ağaç Yapısı Önizlemesi */}
          <div className="overflow-y-auto p-5 bg-neutral-50/50 dark:bg-neutral-900 flex flex-col">
            {selectedTemplate ? (
              <>
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-base font-bold">
                    <span>{selectedTemplate.icon}</span>
                    <span>{selectedTemplate.name}</span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    {selectedTemplate.description}
                  </p>
                </div>

                <div className="flex-1 bg-white dark:bg-neutral-800 p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-750 overflow-y-auto shadow-xs">
                  <h4 className="text-xs font-semibold uppercase text-neutral-400 mb-2.5">
                    Varsayılan Klasör ve Doküman Ağacı
                  </h4>
                  {renderTreePreview(selectedTemplate.rootNodes)}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-neutral-400">
                Lütfen önizlemek için bir şablon seçin.
              </div>
            )}
          </div>
        </div>

        {/* Alt Eylemler */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-200 dark:border-neutral-750 bg-neutral-50 dark:bg-neutral-800">
          <div className="text-xs text-neutral-500">
            {selectedTemplate && (
              <span>Seçili: <strong>{selectedTemplate.name}</strong></span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs rounded border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleStartWithTemplate}
              disabled={!selectedTemplate}
              className="px-5 py-2 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              data-testid="start-template-button"
            >
              🚀 Bu Şablonla Projeyi Başlat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateGalleryModal;
