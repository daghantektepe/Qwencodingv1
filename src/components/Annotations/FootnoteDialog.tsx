import React, { useState } from 'react';
import { FootnoteItem } from '../../types/annotations';

export interface FootnoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    content: string;
    format: 'numeric' | 'roman' | 'asterisk';
    isEndnote: boolean;
  }) => void;
  initialData?: FootnoteItem | null;
}

export const FootnoteDialog: React.FC<FootnoteDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [content, setContent] = useState(initialData?.content || '');
  const [format, setFormat] = useState<'numeric' | 'roman' | 'asterisk'>(
    initialData?.format || 'numeric'
  );
  const [isEndnote, setIsEndnote] = useState(initialData?.isEndnote || false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSave({
        content: content.trim(),
        format,
        isEndnote,
      });
      setContent('');
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      role="dialog"
      aria-label="Dipnot / Not Ekleme İletişim Kutusu"
    >
      <div className="bg-white dark:bg-neutral-850 rounded-lg shadow-xl w-full max-w-md p-5 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100">
        <div className="flex items-center justify-between mb-4 border-b border-neutral-200 dark:border-neutral-700 pb-2">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <span>🔖</span>
            <span>{initialData ? 'Dipnotu Düzenle' : 'Yeni Dipnot / Son Not Ekle'}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tür Seçimi */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Not Türü:
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsEndnote(false)}
                className={`flex-1 py-1.5 text-xs font-medium rounded border ${
                  !isEndnote
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200'
                }`}
              >
                Dipnot (Sayfa Altı)
              </button>
              <button
                type="button"
                onClick={() => setIsEndnote(true)}
                className={`flex-1 py-1.5 text-xs font-medium rounded border ${
                  isEndnote
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200'
                }`}
              >
                Son Not (Bölüm Sonu)
              </button>
            </div>
          </div>

          {/* İşaretçi / Numaralandırma Formatı */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              İşaretçi Formatı:
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
              className="w-full text-xs p-2 rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="numeric">Sayısal (1, 2, 3...)</option>
              <option value="roman">Roma Rakamı (i, ii, iii...)</option>
              <option value="asterisk">Yıldız (*, **, ***...)</option>
            </select>
          </div>

          {/* Not Metni */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Not İçeriği / Kaynakça:
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Kaynak, açıklama veya bibliyografik bilgi yazın..."
              rows={4}
              required
              className="w-full text-xs p-2.5 rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              aria-label="Dipnot içeriği"
            />
          </div>

          {/* Eylemler */}
          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs rounded border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-4 py-1.5 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-700 text-white"
            >
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FootnoteDialog;
