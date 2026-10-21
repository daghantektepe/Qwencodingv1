import React, { useState } from 'react';
import {
  templatePackager,
  ProjectTemplate,
  TemplateCategory
} from '../../services/templates/templatePackager';

interface TemplateGalleryModalProps {
  isOpen: boolean;
  onSelectTemplate: (template: ProjectTemplate, nodes: any[]) => void;
  onClose: () => void;
}

export const TemplateGalleryModal: React.FC<TemplateGalleryModalProps> = ({
  isOpen,
  onSelectTemplate,
  onClose
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [templates, setTemplates] = useState<ProjectTemplate[]>(() =>
    templatePackager.getAllTemplates()
  );
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate>(
    templates[0] || null
  );

  if (!isOpen) return null;

  const filtered = templates.filter((t) =>
    selectedCategory === 'all' ? true : t.category === selectedCategory
  );

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.osctemplate,.json';
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const imported = templatePackager.importTemplateFile(text);
        const updated = templatePackager.getAllTemplates();
        setTemplates(updated);
        setSelectedTemplate(imported);
      } catch (err: any) {
        alert(err.message);
      }
    };
    input.click();
  };

  const handleExport = (templateId: string) => {
    try {
      const json = templatePackager.exportTemplateFile(templateId);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTemplate.name.toLowerCase().replace(/\s+/g, '-')}.osctemplate`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleConfirm = () => {
    if (selectedTemplate) {
      const nodes = templatePackager.instantiateTemplate(selectedTemplate.id);
      onSelectTemplate(selectedTemplate, nodes);
      onClose();
    }
  };

  return (
    <div
      data-testid="template-gallery-modal"
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-gallery-title"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl h-[75vh] flex flex-col text-slate-200 overflow-hidden">
        {/* Üst Çubuk */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏛️</span>
            <h2 id="template-gallery-title" className="font-semibold text-white text-sm">
              Proje Şablon Galerisi & Sihirbazı (Templates Studio)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleImport}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 font-medium border border-slate-700 transition-colors"
            >
              📥 .osctemplate İçe Aktar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 text-sm ml-2"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Kategori Filtresi */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 shrink-0 text-xs">
          {(
            [
              { id: 'all', label: 'Tüm Şablonlar' },
              { id: 'novel', label: 'Roman' },
              { id: 'academic', label: 'Akademik' },
              { id: 'screenplay', label: 'Senaryo' },
              { id: 'custom', label: 'Özel' },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-full font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-cyan-700 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Gövde: Sol Kartlar, Sağ Detay & İskelet Önizleme */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sol: Şablon Kartları */}
          <div className="w-1/2 border-r border-slate-800 overflow-y-auto p-4 flex flex-col gap-2.5">
            {filtered.map((tpl) => {
              const isSelected = selectedTemplate?.id === tpl.id;
              return (
                <div
                  key={tpl.id}
                  data-testid={`template-card-${tpl.id}`}
                  onClick={() => setSelectedTemplate(tpl)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-colors flex items-start gap-3 ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-500 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-2xl select-none">{tpl.icon}</span>
                  <div className="flex-1 truncate">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-xs truncate">
                        {tpl.name}
                      </span>
                      {tpl.isBuiltIn && (
                        <span className="text-[10px] bg-slate-950 text-slate-400 px-1.5 py-0.2 rounded border border-slate-800">
                          Resmi
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {tpl.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sağ: Şablon Önizleme */}
          <div className="w-1/2 p-5 overflow-y-auto flex flex-col justify-between bg-slate-950/40">
            {selectedTemplate && (
              <div className="flex flex-col gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-white text-sm flex items-center gap-1.5">
                      <span>{selectedTemplate.icon}</span> {selectedTemplate.name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleExport(selectedTemplate.id)}
                      className="text-xs text-cyan-400 hover:underline"
                    >
                      Dışa Aktar (.osctemplate)
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {selectedTemplate.description}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono mt-2">
                    <span>Yazar: {selectedTemplate.author}</span>
                    <span>Hedef: {selectedTemplate.sampleTargetWords?.toLocaleString()} kelime</span>
                  </div>
                </div>

                {/* Hiyerarşik Yapı Ağacı */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs flex flex-col gap-1.5 max-h-56 overflow-y-auto">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Dosya & Klasör Hiyerarşisi
                  </span>
                  {selectedTemplate.structure.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-1 pl-1">
                      <div className="font-medium text-slate-200 flex items-center gap-1.5">
                        <span>{item.type === 'folder' ? '📁' : '📄'}</span>
                        <span>{item.title}</span>
                      </div>
                      {item.children?.map((child, cIdx) => (
                        <div key={cIdx} className="pl-5 text-slate-400 flex items-center gap-1.5 text-[11px]">
                          <span>{child.type === 'folder' ? '📁' : '📄'}</span>
                          <span>{child.title}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                data-testid="start-template-button"
                onClick={handleConfirm}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-cyan-900/30 transition-all"
              >
                Bu Şablonla Projeyi Başlat ➔
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateGalleryModal;
