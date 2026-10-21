import React, { useState, useEffect } from 'react';
import { trashManager, TrashItem } from '../../services/trash/trashManager';

interface TrashBinViewProps {
  onRestoreItem?: (item: TrashItem) => void;
  onClose?: () => void;
}

export const TrashBinView: React.FC<TrashBinViewProps> = ({
  onRestoreItem,
  onClose
}) => {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<TrashItem[]>(() => trashManager.getTrashItems());
  const [selectedItem, setSelectedItem] = useState<TrashItem | null>(null);

  useEffect(() => {
    const unsub = trashManager.subscribe(() => {
      setItems(trashManager.getTrashItems(search));
    });
    return unsub;
  }, [search]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setItems(trashManager.getTrashItems(val));
  };

  const handleRestore = (id: string) => {
    const restored = trashManager.restoreItem(id);
    if (selectedItem?.id === id) setSelectedItem(null);
    onRestoreItem?.(restored);
  };

  const handlePermanentDelete = (id: string) => {
    trashManager.permanentDelete(id);
    if (selectedItem?.id === id) setSelectedItem(null);
  };

  const handleEmptyTrash = () => {
    if (window.confirm('Çöp kutusundaki tüm öğeler kalıcı olarak silinecektir. Emin misiniz?')) {
      trashManager.emptyTrash();
      setSelectedItem(null);
    }
  };

  return (
    <div
      className="trash-bin-view flex flex-col h-full w-full bg-slate-950 text-slate-100 overflow-hidden"
      role="region"
      aria-label="Çöp Kutusu ve Veri Kurtarma Kasası"
    >
      {/* Üst Çubuk */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl">🗑️</span>
          <div>
            <h2 className="text-sm font-semibold text-white">
              Çöp Kutusu & Veri Kurtarma (Trash Vault)
            </h2>
            <div className="text-xs text-slate-400">
              Silinmiş Öğe Sayısı: <b className="text-cyan-400">{items.length}</b>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              type="button"
              onClick={handleEmptyTrash}
              className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-xs font-medium rounded border border-rose-800 transition-colors"
            >
              Çöpü Boşalt
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 text-sm ml-2"
              title="Kapat"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Arama Barı */}
      <div className="px-5 py-2.5 bg-slate-900/60 border-b border-slate-800 shrink-0">
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Silinen dokümanlarda veya notlarda ara..."
          className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Gövde: Sol Liste, Sağ Önizleme */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sol Sütun: Silinen Öğeler */}
        <div className="w-1/2 border-r border-slate-800 overflow-y-auto p-4 flex flex-col gap-2">
          {items.length === 0 ? (
            <div className="text-xs text-slate-500 italic py-12 text-center">
              Çöp kutusu boş. Silinen herhangi bir öğe bulunmuyor.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-center justify-between text-xs ${
                  selectedItem?.id === item.id
                    ? 'bg-slate-800 border-cyan-500'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col truncate pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-200 truncate">
                      {item.title}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                      {item.itemType}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">
                    Silinme: {new Date(item.deletedAt).toLocaleString()} • {item.wordCount} kelime
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestore(item.id);
                    }}
                    className="px-2.5 py-1 bg-cyan-700 hover:bg-cyan-600 text-white rounded text-[11px] font-medium"
                    title="Eski konumuna geri yükle"
                  >
                    Geri Yükle
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePermanentDelete(item.id);
                    }}
                    className="p-1 text-slate-500 hover:text-rose-400"
                    title="Kalıcı olarak sil"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sağ Sütun: Belge Önizlemesi */}
        <div className="w-1/2 p-5 overflow-y-auto bg-slate-950/40">
          {selectedItem ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-semibold text-white text-sm">{selectedItem.title}</h3>
                <button
                  type="button"
                  onClick={() => handleRestore(selectedItem.id)}
                  className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded font-medium shadow"
                >
                  Belgeyi Geri Yükle
                </button>
              </div>

              <div className="font-serif text-xs leading-relaxed text-slate-300 whitespace-pre-wrap select-text">
                {selectedItem.content || '(İçerik boş)'}
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic py-16 text-center">
              İçeriğini önizlemek için soldan bir öğe seçin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrashBinView;
