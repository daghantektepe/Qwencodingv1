import React, { useState, useEffect } from 'react';
import {
  taxonomyStore,
  TaxonomyTag,
  TaxonomyCategory,
  ColorStripStyle
} from '../../services/taxonomy/taxonomyStore';

interface LabelManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4',
  '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#64748b'
];

export const LabelManagerModal: React.FC<LabelManagerModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeCategory, setActiveCategory] = useState<TaxonomyCategory>('pov');
  const [tags, setTags] = useState<TaxonomyTag[]>(() => taxonomyStore.getTags());
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [description, setDescription] = useState('');

  useEffect(() => {
    const unsub = taxonomyStore.subscribe(() => setTags(taxonomyStore.getTags()));
    return unsub;
  }, []);

  if (!isOpen) return null;

  const currentCategoryTags = tags.filter((t) => t.category === activeCategory);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    taxonomyStore.createTag({
      name: newTagName.trim(),
      category: activeCategory,
      color: selectedColor,
      description: description.trim() || undefined,
    });

    setNewTagName('');
    setDescription('');
  };

  const handleDelete = (id: string) => {
    taxonomyStore.deleteTag(id);
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="label-manager-title"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-xl h-[75vh] flex flex-col text-slate-200 overflow-hidden">
        {/* Üst Çubuk */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏷️</span>
            <h2 id="label-manager-title" className="font-semibold text-white text-sm">
              Gelişmiş Etiket ve Taksonomi Yöneticisi
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Kategori Sekmeleri */}
        <div className="flex gap-1.5 px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 text-xs shrink-0">
          {(
            [
              { id: 'pov', label: 'Bakış Açısı (POV)' },
              { id: 'location', label: 'Mekanlar' },
              { id: 'theme', label: 'Temalar' },
              { id: 'label', label: 'Genel Etiketler' },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1 rounded-full font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'bg-cyan-700 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Gövde */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sol: Mevcut Etiketler Listesi */}
          <div className="w-1/2 border-r border-slate-800 overflow-y-auto p-4 flex flex-col gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Kayıtlı Etiketler ({currentCategoryTags.length})
            </span>

            {currentCategoryTags.length === 0 ? (
              <div className="text-xs text-slate-500 italic py-8 text-center">
                Bu kategoride henüz etiket yok.
              </div>
            ) : (
              currentCategoryTags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: tag.color }}
                    />
                    <div className="truncate">
                      <span className="font-semibold text-white truncate block">
                        {tag.name}
                      </span>
                      {tag.description && (
                        <span className="text-[10px] text-slate-400 truncate block">
                          {tag.description}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(tag.id)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                    title="Etiketi Sil"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Sağ: Yeni Etiket Ekle Formu */}
          <div className="w-1/2 p-4 overflow-y-auto flex flex-col justify-between bg-slate-950/30">
            <form onSubmit={handleCreate} className="flex flex-col gap-3 text-xs">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Yeni Etiket Ekle
              </span>

              <div>
                <label className="block text-slate-400 mb-1">Etiket Adı *</label>
                <input
                  type="text"
                  required
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="örn. Sherlock, Sisli Gece"
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5">Renk Tonu</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`w-5 h-5 rounded-full transition-transform ${
                        selectedColor === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Açıklama</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Bu etiketin nerede kullanılacağını yazın..."
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none text-[11px]"
                />
              </div>

              <button
                type="submit"
                className="mt-2 w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded shadow transition-colors"
              >
                + Etiketi Kaydet
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabelManagerModal;
