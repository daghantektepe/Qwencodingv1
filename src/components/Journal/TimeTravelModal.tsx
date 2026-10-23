import React, { useState, useEffect } from 'react';
import { timeTravelReplay } from '../../services/journal/timeTravelReplay';
import { journalLogger, JournalEntry } from '../../services/journal/journalLogger';

interface TimeTravelModalProps {
  isOpen: boolean;
  docId: string;
  docTitle: string;
  onRestoreContent?: (content: string) => void;
  onClose: () => void;
}

export const TimeTravelModal: React.FC<TimeTravelModalProps> = ({
  isOpen,
  docId,
  docTitle,
  onRestoreContent,
  onClose
}) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && docId) {
      const docEntries = journalLogger.getEntriesForDoc(docId);
      setEntries(docEntries);
      timeTravelReplay.loadEntries(docEntries);
      setCurrentEntry(timeTravelReplay.getCurrentEntry());
    }
  }, [isOpen, docId]);

  useEffect(() => {
    const unsub = timeTravelReplay.subscribe(() => {
      setCurrentEntry(timeTravelReplay.getCurrentEntry());
      setIsPlaying(timeTravelReplay.isPlaying());
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const totalSteps = timeTravelReplay.getTotalSteps();
  const currentStep = timeTravelReplay.getCurrentStep();

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const step = parseInt(e.target.value, 10);
    const entry = timeTravelReplay.goToStep(step);
    setCurrentEntry(entry);
  };

  const handlePlayToggle = () => {
    if (isPlaying) {
      timeTravelReplay.pause();
    } else {
      timeTravelReplay.play(350);
    }
  };

  const handleRestore = () => {
    if (currentEntry && onRestoreContent) {
      onRestoreContent(currentEntry.textSnapshot);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="time-travel-title"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col text-slate-200 overflow-hidden">
        {/* Üst Çubuk */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">⏳</span>
            <div>
              <h2 id="time-travel-title" className="font-semibold text-white text-sm">
                Zaman Yolculuğu & Yazım Geçmişi (Time Travel Replay)
              </h2>
              <span className="text-[11px] text-slate-400">{docTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentEntry && onRestoreContent && (
              <button
                type="button"
                onClick={handleRestore}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-semibold shadow transition-colors"
              >
                Bu Ana Geri Dön ve Geri Yükle
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Gövde: Metin Önizlemesi */}
        <div className="flex-1 p-6 overflow-y-auto font-serif text-sm leading-relaxed text-slate-200 whitespace-pre-wrap select-text bg-slate-950/60">
          {currentEntry ? (
            currentEntry.textSnapshot || '(Bu adımda metin boş)'
          ) : (
            <div className="text-center py-16 text-slate-500 italic">
              Bu dokümana ait kayıtlı zaman yolculuğu adımı bulunamadı.
            </div>
          )}
        </div>

        {/* Alt Zaman Çizelgesi ve Oynatma Çubuğu */}
        <div className="p-4 bg-slate-900/95 border-t border-slate-800 flex flex-col gap-2 shrink-0">
          {/* İlerleme ve Bilgi Satırı */}
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-3">
              <span>
                Adım: <b className="text-cyan-400">{currentStep + 1}</b> / {Math.max(1, totalSteps)}
              </span>
              {currentEntry && (
                <span>
                  Kelime: <b className="text-amber-400">{currentEntry.wordCount}</b> ({currentEntry.charCount} karakter)
                </span>
              )}
            </div>

            {currentEntry && (
              <span className="text-[11px] text-slate-500">
                {new Date(currentEntry.timestamp).toLocaleTimeString()} ({currentEntry.deltaType})
              </span>
            )}
          </div>

          {/* Slider */}
          <input
            type="range"
            min="0"
            max={Math.max(0, totalSteps - 1)}
            value={currentStep}
            disabled={totalSteps <= 1}
            onChange={handleSliderChange}
            className="w-full accent-cyan-500 cursor-pointer"
          />

          {/* Kontrol Düğmeleri */}
          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              type="button"
              disabled={totalSteps <= 1}
              onClick={() => timeTravelReplay.prevStep()}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
              title="Önceki Adım"
            >
              ⏮
            </button>

            <button
              type="button"
              disabled={totalSteps <= 1}
              onClick={handlePlayToggle}
              className="px-4 py-1.5 rounded-full bg-cyan-700 hover:bg-cyan-600 text-white font-medium text-xs flex items-center gap-1.5 shadow"
            >
              {isPlaying ? '⏸ Duraklat' : '▶ Yazımı Oynat'}
            </button>

            <button
              type="button"
              disabled={totalSteps <= 1}
              onClick={() => timeTravelReplay.nextStep()}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
              title="Sonraki Adım"
            >
              ⏭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeTravelModal;
