import React, { useState } from 'react';

interface TableControlsMenuProps {
  onAddRow?: (position: 'above' | 'below') => void;
  onDeleteRow?: () => void;
  onAddColumn?: (position: 'left' | 'right') => void;
  onDeleteColumn?: () => void;
  onSetAlignment?: (align: 'left' | 'center' | 'right') => void;
  onSetBackground?: (color: string) => void;
  onInsertFormula?: (formulaType: 'SUM' | 'AVG') => void;
  onCopyMarkdown?: () => void;
}

export const TableControlsMenu: React.FC<TableControlsMenuProps> = ({
  onAddRow,
  onDeleteRow,
  onAddColumn,
  onDeleteColumn,
  onSetAlignment,
  onSetBackground,
  onInsertFormula,
  onCopyMarkdown,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const colors = [
    { label: 'Varsayılan', value: '' },
    { label: 'Koyu Mavi', value: 'rgba(6, 182, 212, 0.2)' },
    { label: 'Zümrüt', value: 'rgba(16, 185, 129, 0.2)' },
    { label: 'Gül', value: 'rgba(244, 63, 94, 0.2)' },
    { label: 'Kehribar', value: 'rgba(245, 158, 11, 0.2)' },
    { label: 'Mor', value: 'rgba(139, 92, 246, 0.2)' },
  ];

  return (
    <div
      className="table-controls-menu flex items-center gap-1.5 p-1.5 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl text-slate-200 text-xs flex-wrap z-30"
      role="toolbar"
      aria-label="Tablo Düzenleme Araç Çubuğu"
      data-testid="table-controls-menu"
    >
      {/* Satır İşlemleri */}
      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
        <button
          type="button"
          onClick={() => onAddRow?.('above')}
          className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
          title="Üste Satır Ekle"
        >
          ⬆️+
        </button>
        <button
          type="button"
          onClick={() => onAddRow?.('below')}
          className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
          title="Alta Satır Ekle"
        >
          ⬇️+
        </button>
        <button
          type="button"
          onClick={onDeleteRow}
          className="p-1 hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 rounded"
          title="Satırı Sil"
        >
          🗑️Satır
        </button>
      </div>

      {/* Sütun İşlemleri */}
      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
        <button
          type="button"
          onClick={() => onAddColumn?.('left')}
          className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
          title="Sola Sütun Ekle"
        >
          ⬅️+
        </button>
        <button
          type="button"
          onClick={() => onAddColumn?.('right')}
          className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
          title="Sağa Sütun Ekle"
        >
          ➡️+
        </button>
        <button
          type="button"
          onClick={onDeleteColumn}
          className="p-1 hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 rounded"
          title="Sütunu Sil"
        >
          🗑️Sütun
        </button>
      </div>

      {/* Hizalama */}
      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
        <button
          type="button"
          onClick={() => onSetAlignment?.('left')}
          className="px-2 py-0.5 hover:bg-slate-800 rounded text-[11px] text-slate-300"
          title="Sola Hizala"
        >
          ◀
        </button>
        <button
          type="button"
          onClick={() => onSetAlignment?.('center')}
          className="px-2 py-0.5 hover:bg-slate-800 rounded text-[11px] text-slate-300"
          title="Ortala"
        >
          ■
        </button>
        <button
          type="button"
          onClick={() => onSetAlignment?.('right')}
          className="px-2 py-0.5 hover:bg-slate-800 rounded text-[11px] text-slate-300"
          title="Sağa Hizala"
        >
          ▶
        </button>
      </div>

      {/* Renk Seçici */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs text-slate-300 flex items-center gap-1"
        >
          <span>🎨</span> Renk
        </button>
        {showColorPicker && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl shadow-xl flex gap-1.5 z-40">
            {colors.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onSetBackground?.(c.value);
                  setShowColorPicker(false);
                }}
                className="w-5 h-5 rounded-full border border-slate-600 hover:scale-110 transition-transform"
                style={{ backgroundColor: c.value || '#1e293b' }}
                title={c.label}
              />
            ))}
          </div>
        )}
      </div>

      {/* Formül */}
      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
        <button
          type="button"
          onClick={() => onInsertFormula?.('SUM')}
          className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 rounded text-[11px] font-mono"
          title="Sütun Toplamı"
        >
          ∑ Toplam
        </button>
        <button
          type="button"
          onClick={() => onInsertFormula?.('AVG')}
          className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 rounded text-[11px] font-mono"
          title="Sütun Ortalaması"
        >
          x̄ Ortalama
        </button>
      </div>

      {/* Kopyala */}
      {onCopyMarkdown && (
        <button
          type="button"
          onClick={onCopyMarkdown}
          className="px-2.5 py-1 bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white rounded-lg text-xs transition-colors ml-auto"
        >
          📋 Markdown Kopyala
        </button>
      )}
    </div>
  );
};

export default TableControlsMenu;
