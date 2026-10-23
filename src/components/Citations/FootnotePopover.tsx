import React, { useState } from 'react';
import { citationEngine } from '../../services/citations/citationEngine';
import { DocumentFootnote, NoteType } from '../../types/citations';

interface FootnotePopoverProps {
  isOpen: boolean;
  docId: string;
  charOffset: number;
  existingFootnote?: DocumentFootnote;
  onSave?: (note: DocumentFootnote) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export const FootnotePopover: React.FC<FootnotePopoverProps> = ({
  isOpen,
  docId,
  charOffset,
  existingFootnote,
  onSave,
  onDelete,
  onClose
}) => {
  const [content, setContent] = useState(existingFootnote?.content || '');
  const [type, setType] = useState<NoteType>(existingFootnote?.type || 'footnote');
  const [selectedSourceId, setSelectedSourceId] = useState(
    existingFootnote?.citationSourceId || ''
  );

  const sources = citationEngine.getSources();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    let note: DocumentFootnote;
    if (existingFootnote) {
      citationEngine.updateFootnoteContent(docId, existingFootnote.id, content.trim());
      note = { ...existingFootnote, content: content.trim(), type };
    } else {
      note = citationEngine.addFootnote(
        docId,
        charOffset,
        content.trim(),
        type,
        selectedSourceId || undefined
      );
    }

    onSave?.(note);
    onClose();
  };

  const handleDelete = () => {
    if (existingFootnote) {
      citationEngine.removeFootnote(docId, existingFootnote.id);
      onDelete?.(existingFootnote.id);
      onClose();
    }
  };

  return (
    <div
      className="footnote-popover p-4 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl text-slate-200 text-xs w-80 flex flex-col gap-3 z-50"
      role="dialog"
      aria-label="Dipnot Düzenleyici"
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h3 className="font-semibold text-white flex items-center gap-1.5">
          <span>📝</span> {existingFootnote ? `Dipnot [${existingFootnote.indexNumber}]` : 'Yeni Dipnot Ekle'}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-0.5 text-xs"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        <div className="flex rounded bg-slate-950 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => setType('footnote')}
            className={`flex-1 py-1 rounded text-[11px] font-medium transition-colors ${
              type === 'footnote' ? 'bg-cyan-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Dipnot (Sayfa Altı)
          </button>
          <button
            type="button"
            onClick={() => setType('endnote')}
            className={`flex-1 py-1 rounded text-[11px] font-medium transition-colors ${
              type === 'endnote' ? 'bg-cyan-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sonnot (Bölüm Sonu)
          </button>
        </div>

        <div>
          <label className="block text-slate-400 mb-1">Dipnot Metni *</label>
          <textarea
            required
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Açıklama, referans veya alıntı metni..."
            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none font-serif text-xs"
          />
        </div>

        {sources.length > 0 && (
          <div>
            <label className="block text-slate-400 mb-1">Kaynak İlişkilendir (İsteğe bağlı)</label>
            <select
              value={selectedSourceId}
              onChange={(e) => setSelectedSourceId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-[11px]"
            >
              <option value="">(Serbest Metin)</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.author} ({s.year}) - {s.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          {existingFootnote ? (
            <button
              type="button"
              onClick={handleDelete}
              className="text-rose-400 hover:text-rose-300 text-[11px]"
            >
              Sil
            </button>
          ) : <div />}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 text-slate-400 hover:text-white text-[11px]"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-3.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[11px] font-medium shadow"
            >
              Kaydet
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default FootnotePopover;
