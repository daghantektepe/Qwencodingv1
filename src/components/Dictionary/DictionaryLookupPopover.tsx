import React, { useState, useEffect } from 'react';
import {
  offlineDictionary,
  DictionaryEntry
} from '../../services/dictionary/offlineDictionary';
import {
  BookOpen,
  Search,
  Compass,
  History,
  Sparkles,
  X,
  Quote
} from 'lucide-react';

interface DictionaryLookupPopoverProps {
  initialWord?: string;
  onClose?: () => void;
  onSelectSynonym?: (word: string) => void;
}

export const DictionaryLookupPopover: React.FC<DictionaryLookupPopoverProps> = ({
  initialWord = 'kurgu',
  onClose,
  onSelectSynonym
}) => {
  const [query, setQuery] = useState<string>(initialWord);
  const [currentEntry, setCurrentEntry] = useState<DictionaryEntry | null>(null);
  const [suggestions, setSuggestions] = useState<DictionaryEntry[]>([]);

  const handleLookup = (word: string) => {
    const entry = offlineDictionary.lookup(word);
    setCurrentEntry(entry);
    if (!entry) {
      setSuggestions(offlineDictionary.suggest(word));
    } else {
      setSuggestions([]);
    }
  };

  useEffect(() => {
    if (initialWord) {
      setQuery(initialWord);
      handleLookup(initialWord);
    }
  }, [initialWord]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      handleLookup(query.trim());
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 rounded-xl border border-stone-200 dark:border-stone-800 p-4 shadow-2xl max-w-sm w-full select-none flex flex-col gap-3">
      {/* Header and Search */}
      <div className="flex items-center justify-between border-b pb-2 border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-xs font-semibold tracking-wide">
            Çevrimdışı Sözlük ve Etimoloji
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded text-stone-400 hover:text-stone-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
        <input
          type="text"
          placeholder="Kelime ara..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length > 1) {
              setSuggestions(offlineDictionary.suggest(e.target.value.trim()));
            }
          }}
          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
        />
      </form>

      {/* Main Definition Content */}
      {currentEntry ? (
        <div className="flex flex-col gap-2.5 pt-1">
          {/* Word title, type and origin */}
          <div className="flex items-baseline justify-between gap-2 border-b pb-2 border-stone-100 dark:border-stone-800">
            <div>
              <span className="text-base font-bold text-stone-900 dark:text-stone-100 font-serif">
                {currentEntry.word}
              </span>
              <span className="ml-2 text-[11px] italic text-stone-500 dark:text-stone-400">
                {currentEntry.partOfSpeech}
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              {currentEntry.origin}
            </span>
          </div>

          {/* Meaning */}
          <div>
            <p className="text-xs leading-relaxed text-stone-800 dark:text-stone-200">
              {currentEntry.meaning}
            </p>
          </div>

          {/* Etymology details */}
          <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400 mb-1">
              <History className="w-3 h-3" />
              <span>Köken & Etimoloji:</span>
            </div>
            <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-normal">
              {currentEntry.etymologyDetails}
            </p>
            {currentEntry.firstRecordedCentury && (
              <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1">
                İlk kayıt: {currentEntry.firstRecordedCentury}
              </p>
            )}
          </div>

          {/* Example Sentence */}
          {currentEntry.examples.length > 0 && (
            <div className="text-[11px] italic text-stone-600 dark:text-stone-400 border-l-2 border-amber-500 pl-2 py-0.5">
              "{currentEntry.examples[0]}"
            </div>
          )}

          {/* Synonyms Chips */}
          {currentEntry.synonyms && currentEntry.synonyms.length > 0 && (
            <div className="pt-1">
              <span className="text-[10px] font-semibold text-stone-400 block mb-1">
                Eş Anlamlılar:
              </span>
              <div className="flex flex-wrap gap-1">
                {currentEntry.synonyms.map((syn) => (
                  <button
                    key={syn}
                    onClick={() => {
                      setQuery(syn);
                      handleLookup(syn);
                      if (onSelectSynonym) onSelectSynonym(syn);
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 hover:text-amber-800 text-stone-600 dark:text-stone-300 transition-colors"
                  >
                    {syn}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-4 text-center">
          <p className="text-xs text-stone-500">
            "{query}" için sözlük kaydı bulunamadı.
          </p>

          {suggestions.length > 0 && (
            <div className="mt-3 text-left">
              <span className="text-[11px] text-stone-400 font-semibold mb-1 block">
                Önerilen kelimeler:
              </span>
              <div className="flex flex-col gap-1">
                {suggestions.map((s) => (
                  <button
                    key={s.word}
                    onClick={() => {
                      setQuery(s.word);
                      handleLookup(s.word);
                    }}
                    className="text-xs text-left px-2 py-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-amber-600 dark:text-amber-400 font-medium"
                  >
                    {s.word} ({s.partOfSpeech}) — {s.meaning.slice(0, 35)}...
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
