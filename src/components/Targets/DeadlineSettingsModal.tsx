import React, { useState } from 'react';
import { deadlineCalculator } from '../../services/targets/deadlineCalculator';
import { DeadlineConfig } from '../../types/targets';

interface DeadlineSettingsModalProps {
  isOpen: boolean;
  currentWordCount: number;
  initialConfig?: Partial<DeadlineConfig>;
  onSaveConfig: (config: DeadlineConfig) => void;
  onClose: () => void;
}

export const DeadlineSettingsModal: React.FC<DeadlineSettingsModalProps> = ({
  isOpen,
  currentWordCount,
  initialConfig,
  onSaveConfig,
  onClose
}) => {
  const [targetWords, setTargetWords] = useState<number>(initialConfig?.targetWordCount || 50000);
  const [deadlineDate, setDeadlineDate] = useState<string>(
    initialConfig?.deadlineDate ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [daysPerWeek, setDaysPerWeek] = useState<number>(initialConfig?.writingDaysPerWeek || 7);

  if (!isOpen) return null;

  const config: DeadlineConfig = {
    targetWordCount: targetWords,
    deadlineDate,
    writingDaysPerWeek: daysPerWeek,
    startDate: initialConfig?.startDate || new Date().toISOString().split('T')[0],
  };

  const progress = deadlineCalculator.calculateProgress(config, currentWordCount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(config);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deadline-settings-title"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col text-slate-200">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <h2 id="deadline-settings-title" className="font-semibold text-white text-sm flex items-center gap-2">
            <span>🎯</span> Hedef & Deadline Planlayıcısı
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 text-sm"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">
              Toplam Hedef Kelime Sayısı
            </label>
            <input
              type="number"
              min="100"
              value={targetWords}
              onChange={(e) => setTargetWords(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Bitiş Tarihi (Deadline)</label>
              <input
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Haftalık Yazma Günü</label>
              <select
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(parseInt(e.target.value, 10))}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value={7}>Her Gün (Haftada 7 gün)</option>
                <option value={6}>Haftada 6 gün</option>
                <option value={5}>Hafta İçi (Haftada 5 gün)</option>
                <option value={4}>Haftada 4 gün</option>
                <option value={2}>Hafta Sonu (Haftada 2 gün)</option>
              </select>
            </div>
          </div>

          {/* Canlı Hesaplanan İstatistikler Kartı */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 flex flex-col gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Canlı Kota & İlerleme Özeti
            </span>

            <div className="grid grid-cols-2 gap-2 text-center pt-1">
              <div className="bg-slate-900 p-2 rounded border border-slate-800/80">
                <div className="text-[10px] text-slate-400">Kalan Süre</div>
                <div className="font-mono font-bold text-cyan-400 text-sm">
                  {progress.daysRemaining} gün
                </div>
              </div>

              <div className="bg-slate-900 p-2 rounded border border-slate-800/80">
                <div className="text-[10px] text-slate-400">Günlük Kota</div>
                <div className="font-mono font-bold text-amber-400 text-sm">
                  {progress.requiredWordsPerDay} kelime/gün
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-slate-400">Mevcut Durum:</span>
              <span
                className={`font-semibold ${
                  progress.isOnTrack ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {progress.isOnTrack ? '✓ Zamanında İlerliyor' : '⚠ Temponun Artması Gerek'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-slate-400 hover:text-white"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded shadow transition-colors"
            >
              Hedefi Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeadlineSettingsModal;
