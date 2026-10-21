import React, { useState } from 'react';
import { templatePackager, OscTemplateItem } from '../../services/templates/templatePackager';

interface SaveTemplateDialogProps {
  isOpen: boolean;
  currentStructure: OscTemplateItem[];
  onSaved?: (templateId: string) => void;
  onClose: () => void;
}

export const SaveTemplateDialog: React.FC<SaveTemplateDialogProps> = ({
  isOpen,
  currentStructure,
  onSaved,
  onClose
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [targetWords, setTargetWords] = useState(50000);
  const [icon, setIcon] = useState('📚');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const tpl = templatePackager.saveCustomTemplate({
      name: name.trim(),
      category: 'custom',
      description: description.trim() || 'Kullanıcı tanımlı özel proje şablonu',
      icon,
      author: author.trim() || 'Anonim Yazar',
      version: '1.0.0',
      structure: currentStructure,
      sampleTargetWords: Number(targetWords) || 50000,
    });

    onSaved?.(tpl.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-template-title"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col text-slate-200">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <h2 id="save-template-title" className="font-semibold text-white text-sm flex items-center gap-2">
            <span>💾</span> Projeyi Şablon Olarak Kaydet
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 text-sm"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Şablon Adı *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="örn. Polisiye Roman İskeleti"
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Açıklama</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Şablonun içeriğini ve amacını açıklayın..."
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Yazar / İmza</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Adınız"
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Hedef Kelime</label>
              <input
                type="number"
                value={targetWords}
                onChange={(e) => setTargetWords(parseInt(e.target.value, 10))}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-slate-400 hover:text-white"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded shadow transition-colors"
            >
              Şablonu Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaveTemplateDialog;
