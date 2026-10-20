import React, { useState, useEffect, useRef } from 'react';
import { findSynonyms, ThesaurusResult, Language } from '../../services/linguistics/thesaurusEngine';
import { X, Search, RefreshCw, BookOpen } from 'lucide-react';

interface ThesaurusPopoverProps {
  selectedWord: string | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onReplaceWord?: (oldWord: string, newWord: string) => void;
  language?: Language;
}

export const ThesaurusPopover: React.FC<ThesaurusPopoverProps> = ({
  selectedWord,
  position,
  onClose,
  onReplaceWord,
  language = 'tr',
}) => {
  const [results, setResults] = useState<ThesaurusResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedWord) {
      setSearchTerm(selectedWord);
      loadSynonyms(selectedWord);
    }
  }, [selectedWord]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const loadSynonyms = (word: string) => {
    setLoading(true);
    try {
      const synonyms = findSynonyms(word, language);
      setResults(synonyms);
    } catch (error) {
      console.error('Error loading synonyms:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      loadSynonyms(searchTerm.trim());
    }
  };

  const handleSynonymClick = (synonym: string) => {
    if (onReplaceWord && selectedWord) {
      onReplaceWord(selectedWord, synonym);
    }
  };

  if (!position || !selectedWord) {
    return null;
  }

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200 w-80 max-h-96 overflow-hidden"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-semibold text-gray-800">Eşanlamlılar</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/50 rounded transition-colors"
          aria-label="Kapat"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="p-3 border-b border-gray-100">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Kelime ara..."
            className="w-full px-3 py-2 pl-9 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </form>

      {/* Results */}
      <div className="overflow-y-auto max-h-64 p-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
            <span className="ml-2 text-sm text-gray-600">Yükleniyor...</span>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-3">
            {results.map((result, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">
                    {result.word}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                    {result.category}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.synonyms.map((synonym, synIndex) => (
                    <button
                      key={synIndex}
                      onClick={() => handleSynonymClick(synonym)}
                      className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-indigo-100 hover:text-indigo-700 rounded-md transition-colors"
                      title={`${synonym} ile değiştir`}
                    >
                      {synonym}
                    </button>
                  ))}
                </div>
                {result.antonyms.length > 0 && (
                  <div className="pt-1 border-t border-gray-100">
                    <span className="text-xs text-gray-500">Zıt anlamlılar: </span>
                    <span className="text-xs text-red-600">
                      {result.antonyms.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              {searchTerm ? 'Sonuç bulunamadı' : 'Kelime seçin veya arayın'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
