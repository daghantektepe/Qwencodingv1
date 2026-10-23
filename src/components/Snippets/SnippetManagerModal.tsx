import React, { useState, useMemo } from 'react';
import {
  useSnippetStore,
  SnippetItem
} from '../../services/snippets/textExpander';
import {
  Zap,
  Plus,
  Trash2,
  Search,
  Download,
  Upload,
  Sparkles,
  Tag
} from 'lucide-react';

interface SnippetManagerModalProps {
  onClose?: () => void;
  currentDocTitle?: string;
}

export const SnippetManagerModal: React.FC<SnippetManagerModalProps> = ({
  onClose,
  currentDocTitle = 'Örnek Bölüm 1'
}) => {
  const {
    snippets,
    addSnippet,
    deleteSnippet,
    expandText,
    exportToJson,
    importFromJson
  } = useSnippetStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);

  // New snippet form state
  const [triggerInput, setTriggerInput] = useState('');
  const [expansionInput, setExpansionInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<SnippetItem['category']>('general');
  const [formError, setFormError] = useState<string | null>(null);

  // Live test input state
  const [testInput, setTestInput] = useState('Merhaba ;tarih bugün hikayeye başladım.');

  const filteredSnippets = useMemo(() => {
    return snippets.filter((s) => {
      if (selectedCategory !== 'all' && s.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.trigger.toLowerCase().includes(q) ||
          s.expansion.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [snippets, selectedCategory, searchQuery]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      addSnippet({
        trigger: triggerInput,
        expansion: expansionInput,
        description: descInput,
        category: categoryInput
      });

      setTriggerInput('');
      setExpansionInput('');
      setDescInput('');
      setIsAdding(false);
    } catch (err: any) {
      setFormError(err.message || 'Snippet eklenemedi.');
    }
  };

  const insertMacro = (macroTag: string) => {
    setExpansionInput((prev) => prev + macroTag);
  };

  return (
    <div className="bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 rounded-xl border border-stone-200 dark:border-stone-800 p-5 shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-semibold tracking-wide">
            Hızlı Metin Genişletici ve Makro Snippet'lar
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const data = exportToJson();
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `openscriv-snippets-${Date.now()}.json`;
              a.click();
            }}
            title="Dışa Aktar"
            className="p-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500"
          >
            <Download className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-2 py-1 text-xs rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Top Filter and Actions */}
      <div className="flex items-center gap-2 py-3 border-b border-stone-200 dark:border-stone-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-stone-400" />
          <input
            type="text"
            placeholder="Kısayol veya metin ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="text-xs px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none"
        >
          <option value="all">Tüm Kategoriler</option>
          <option value="character">Karakter</option>
          <option value="world">Evren & Mekan</option>
          <option value="macro">Makro / Dinamik</option>
          <option value="general">Genel</option>
        </select>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Yeni Snippet</span>
        </button>
      </div>

      {/* New Snippet Drawer Form */}
      {isAdding && (
        <form
          onSubmit={handleAddSubmit}
          className="p-3.5 my-2 rounded-xl bg-amber-500/5 border border-amber-500/30 flex flex-col gap-2.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Yeni Metin Genişletici Ekle
            </span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-stone-400 hover:text-stone-600"
            >
              Vazgeç
            </button>
          </div>

          {formError && (
            <p className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/40 p-2 rounded">
              {formError}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-stone-600 dark:text-stone-300 mb-1">
                Kısayol Tetikleyici (Örn: ;eren veya /kurt):
              </label>
              <input
                type="text"
                required
                placeholder=";kısayol"
                value={triggerInput}
                onChange={(e) => setTriggerInput(e.target.value)}
                className="w-full text-xs font-mono px-2.5 py-1.5 rounded bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-stone-600 dark:text-stone-300 mb-1">
                Kategori:
              </label>
              <select
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value as SnippetItem['category'])}
                className="w-full text-xs px-2.5 py-1.5 rounded bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none"
              >
                <option value="general">Genel</option>
                <option value="character">Karakter</option>
                <option value="world">Evren</option>
                <option value="macro">Makro</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-medium text-stone-600 dark:text-stone-300">
                Genişletilecek Metin:
              </label>
              {/* Macro insertion chips */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-stone-400">Makro Ekle:</span>
                <button
                  type="button"
                  onClick={() => insertMacro('{date}')}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-700 font-mono hover:bg-amber-500 hover:text-white"
                >
                  {'{date}'}
                </button>
                <button
                  type="button"
                  onClick={() => insertMacro('{time}')}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-700 font-mono hover:bg-amber-500 hover:text-white"
                >
                  {'{time}'}
                </button>
                <button
                  type="button"
                  onClick={() => insertMacro('{doc_title}')}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-700 font-mono hover:bg-amber-500 hover:text-white"
                >
                  {'{doc_title}'}
                </button>
              </div>
            </div>
            <textarea
              rows={3}
              required
              placeholder="Kısayol yazıldığında bu metin belirecek..."
              value={expansionInput}
              onChange={(e) => setExpansionInput(e.target.value)}
              className="w-full text-xs p-2.5 rounded bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-stone-600 dark:text-stone-300 mb-1">
              Açıklama (İsteğe bağlı):
            </label>
            <input
              type="text"
              placeholder="Örn: Baş karakterin künye betimlemesi"
              value={descInput}
              onChange={(e) => setDescInput(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-700 text-white"
            >
              Kaydet
            </button>
          </div>
        </form>
      )}

      {/* Snippet List */}
      <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1">
        {filteredSnippets.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center text-stone-400 text-xs">
            Eşleşen snippet bulunamadı.
          </div>
        ) : (
          filteredSnippets.map((s) => (
            <div
              key={s.id}
              className="p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 flex items-start justify-between gap-3 hover:border-stone-300 dark:hover:border-stone-700"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {s.trigger}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-stone-200 dark:bg-stone-700 font-medium text-stone-600 dark:text-stone-300">
                    {s.category}
                  </span>
                  {s.isBuiltIn && (
                    <span className="text-[10px] text-stone-400 italic">Sistem Dahili</span>
                  )}
                </div>
                <p className="text-xs font-mono text-stone-800 dark:text-stone-200 mt-1.5 bg-white dark:bg-stone-900/60 p-2 rounded border border-stone-200 dark:border-stone-800 select-text whitespace-pre-wrap">
                  {s.expansion}
                </p>
                {s.description && (
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                    {s.description}
                  </p>
                )}
              </div>

              {!s.isBuiltIn && (
                <button
                  onClick={() => deleteSnippet(s.id)}
                  title="Sil"
                  className="p-1.5 text-stone-400 hover:text-red-600 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Live Interactive Test Playground */}
      <div className="pt-3 border-t border-stone-200 dark:border-stone-800 mt-2">
        <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-300 mb-1">
          🎯 Canlı Snippet Test Alanı (Kısayol yazıp genişlemeyi görün):
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-mono"
            placeholder="Örn: Bölümün adı ;bolum"
          />
          <button
            type="button"
            onClick={() => {
              const res = expandText(testInput, { docTitle: currentDocTitle });
              setTestInput(res);
            }}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-200 dark:bg-stone-700 hover:bg-amber-600 hover:text-white transition-colors"
          >
            Genişlet (Simüle Et)
          </button>
        </div>
      </div>
    </div>
  );
};
