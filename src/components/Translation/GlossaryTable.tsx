import React, { useState } from 'react';
import { GlossaryTerm } from '../../types/translation';

interface GlossaryTableProps {
  terms: GlossaryTerm[];
  onAddTerm: (sourceWord: string, targetWord: string, notes?: string) => void;
  onRemoveTerm: (id: string) => void;
}

export const GlossaryTable: React.FC<GlossaryTableProps> = ({
  terms,
  onAddTerm,
  onRemoveTerm
}) => {
  const [sourceInput, setSourceInput] = useState('');
  const [targetInput, setTargetInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceInput.trim() || !targetInput.trim()) return;

    onAddTerm(sourceInput.trim(), targetInput.trim(), notesInput.trim() || undefined);
    setSourceInput('');
    setTargetInput('');
    setNotesInput('');
  };

  return (
    <div className="glossary-table flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-cyan-400 flex items-center gap-1.5">
          <span>📖</span> Terimler Sözlüğü (Glossary)
        </h3>
        <span className="text-[11px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
          {terms.length} terim
        </span>
      </div>

      {/* Terim Ekleme Formu */}
      <form onSubmit={handleAdd} className="flex flex-col gap-2 mb-4 bg-slate-950/60 p-2.5 rounded border border-slate-800">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={sourceInput}
            onChange={(e) => setSourceInput(e.target.value)}
            placeholder="Kaynak Kelime"
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <input
            type="text"
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            placeholder="Hedef Çeviri"
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            placeholder="Not (örn. özel isim, daima büyük harf)"
            className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded shadow transition-colors"
          >
            + Ekle
          </button>
        </div>
      </form>

      {/* Terim Listesi */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5">
        {terms.length === 0 ? (
          <div className="text-xs text-slate-500 text-center py-6 italic">
            Henüz terim eklenmedi. Metinde sık geçen özel isimleri ve terimleri buraya kaydedebilirsiniz.
          </div>
        ) : (
          terms.map((term) => (
            <div
              key={term.id}
              className="flex items-center justify-between p-2 rounded bg-slate-800/50 border border-slate-800 text-xs hover:border-slate-700 transition-colors"
            >
              <div className="flex flex-col truncate pr-2">
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="text-slate-300">{term.sourceWord}</span>
                  <span className="text-cyan-400">→</span>
                  <span className="text-cyan-200">{term.targetWord}</span>
                </div>
                {term.notes && (
                  <span className="text-[10px] text-slate-400 italic truncate mt-0.5">
                    {term.notes}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => onRemoveTerm(term.id)}
                className="text-slate-500 hover:text-rose-400 p-1"
                title="Terimi Kaldır"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GlossaryTable;
