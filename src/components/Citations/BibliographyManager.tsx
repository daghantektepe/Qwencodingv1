import React, { useState, useEffect } from 'react';
import { citationEngine } from '../../services/citations/citationEngine';
import { CitationSource } from '../../types/citations';

interface BibliographyManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertCitation?: (source: CitationSource) => void;
}

export const BibliographyManager: React.FC<BibliographyManagerProps> = ({
  isOpen,
  onClose,
  onInsertCitation,
}) => {
  const [sources, setSources] = useState<CitationSource[]>([]);
  const [search, setSearch] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [bibtexInput, setBibtexInput] = useState('');
  const [showBibtexImport, setShowBibtexImport] = useState(false);

  // Yeni kaynak formu
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newYear, setNewYear] = useState<number>(new Date().getFullYear());
  const [newKey, setNewKey] = useState('');
  const [newPublisher, setNewPublisher] = useState('');

  useEffect(() => {
    const update = () => setSources(citationEngine.getSources());
    update();
    const unsub = citationEngine.subscribe(update);
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAuthor.trim()) return;

    citationEngine.addCitationSource({
      key: newKey.trim() || `ref_${Date.now()}`,
      title: newTitle.trim(),
      author: newAuthor.trim(),
      year: Number(newYear) || new Date().getFullYear(),
      publisher: newPublisher.trim() || undefined,
    });

    setNewTitle('');
    setNewAuthor('');
    setNewKey('');
    setNewPublisher('');
    setIsAddingNew(false);
  };

  const handleImportBibtex = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bibtexInput.trim()) return;
    citationEngine.importBibtex(bibtexInput);
    setBibtexInput('');
    setShowBibtexImport(false);
  };

  const filteredSources = sources.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.author.toLowerCase().includes(search.toLowerCase()) ||
      s.key.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-label="Kaynakça ve Alıntı Yöneticisi"
      data-testid="bibliography-manager-modal"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl text-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📚</span>
            <div>
              <h2 className="text-base font-semibold text-white">
                Kaynakça & Alıntı Yöneticisi
              </h2>
              <p className="text-xs text-slate-400">
                BibTeX kaynakları, akademik referanslar ve kaynakça listesi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between gap-3 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Yazar, başlık veya anahtar kelime ara..."
            className="flex-1 min-w-[200px] bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowBibtexImport(!showBibtexImport);
                setIsAddingNew(false);
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700"
            >
              📥 BibTeX İçe Aktar
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingNew(!isAddingNew);
                setShowBibtexImport(false);
              }}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium"
            >
              + Yeni Kaynak
            </button>
          </div>
        </div>

        {/* BibTeX Import Panel */}
        {showBibtexImport && (
          <form
            onSubmit={handleImportBibtex}
            className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col gap-2"
          >
            <label className="text-xs font-medium text-cyan-400">
              BibTeX Kodunu Yapıştırın (@article, @book vb.)
            </label>
            <textarea
              rows={4}
              value={bibtexInput}
              onChange={(e) => setBibtexInput(e.target.value)}
              placeholder={`@article{einstein1905,\n  title={Zur Elektrodynamik...},\n  author={Albert Einstein},\n  year={1905}\n}`}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <div className="flex justify-end gap-2 mt-1">
              <button
                type="button"
                onClick={() => setShowBibtexImport(false)}
                className="px-3 py-1 text-xs text-slate-400 hover:text-white"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-3.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-medium"
              >
                Ayrıştır ve Kaydet
              </button>
            </div>
          </form>
        )}

        {/* Manual Add Panel */}
        {isAddingNew && (
          <form
            onSubmit={handleManualAdd}
            className="p-4 bg-slate-950 border-b border-slate-800 grid grid-cols-2 gap-3"
          >
            <div className="col-span-2">
              <label className="block text-[11px] text-slate-400 mb-0.5">Eser / Makale Başlığı *</label>
              <input
                required
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
                placeholder="Örn: Görünmez Kentler"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-0.5">Yazar(lar) *</label>
              <input
                required
                type="text"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
                placeholder="Örn: Italo Calvino"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-0.5">Yıl</label>
              <input
                type="number"
                value={newYear}
                onChange={(e) => setNewYear(parseInt(e.target.value, 10))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-0.5">Yayıncı / Dergi</label>
              <input
                type="text"
                value={newPublisher}
                onChange={(e) => setNewPublisher(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
                placeholder="Örn: YKY"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-0.5">Alıntı Anahtarı (Key)</label>
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
                placeholder="Örn: calvino1972"
              />
            </div>
            <div className="col-span-2 flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-3 py-1 text-xs text-slate-400 hover:text-white"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                className="px-3.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-medium"
              >
                Kaynağı Ekle
              </button>
            </div>
          </form>
        )}

        {/* List of sources */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[220px]">
          {filteredSources.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Henüz kayıtlı kaynakça referansı bulunmuyor.
              <br />
              Yukarıdaki butonlarla yeni kaynak ekleyebilir veya BibTeX içe aktarabilirsiniz.
            </div>
          ) : (
            filteredSources.map((source) => (
              <div
                key={source.id}
                className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl flex items-center justify-between gap-3 group transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-white text-xs truncate">
                      {source.title}
                    </span>
                    <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-[10px] font-mono text-cyan-400">
                      @{source.key}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span>{source.author}</span>
                    <span>•</span>
                    <span>{source.year}</span>
                    {source.publisher && (
                      <>
                        <span>•</span>
                        <span className="truncate">{source.publisher}</span>
                      </>
                    )}
                  </div>
                </div>

                {onInsertCitation && (
                  <button
                    type="button"
                    onClick={() => onInsertCitation(source)}
                    className="px-3 py-1 bg-slate-700 hover:bg-cyan-600 text-slate-200 hover:text-white rounded text-xs transition-colors shrink-0"
                  >
                    Metne Ekle
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Toplam {filteredSources.length} kaynak</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

export default BibliographyManager;
