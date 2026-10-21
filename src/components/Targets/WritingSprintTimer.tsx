import React, { useState, useEffect } from 'react';
import { deadlineCalculator } from '../../services/targets/deadlineCalculator';
import { WritingSprintSession } from '../../types/targets';

interface WritingSprintTimerProps {
  currentWordCount: number;
  onFinish?: (sprint: WritingSprintSession) => void;
}

export const WritingSprintTimer: React.FC<WritingSprintTimerProps> = ({
  currentWordCount,
  onFinish
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(15);
  const [sprint, setSprint] = useState<WritingSprintSession>(() =>
    deadlineCalculator.createSprint(15, currentWordCount)
  );
  const [elapsed, setElapsed] = useState<number>(0);

  useEffect(() => {
    let interval: any = null;
    if (sprint.status === 'running') {
      interval = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          const updated = deadlineCalculator.updateSprintProgress(sprint, currentWordCount, next);
          setSprint(updated);

          if (updated.status === 'completed') {
            onFinish?.(updated);
          }
          return next;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sprint.status, currentWordCount, sprint.durationMinutes, onFinish]);

  const handleStart = () => {
    const fresh = deadlineCalculator.createSprint(selectedMinutes, currentWordCount);
    setSprint({ ...fresh, status: 'running' });
    setElapsed(0);
  };

  const handlePause = () => {
    setSprint({ ...sprint, status: 'paused' });
  };

  const handleResume = () => {
    setSprint({ ...sprint, status: 'running' });
  };

  const handleReset = () => {
    setSprint(deadlineCalculator.createSprint(selectedMinutes, currentWordCount));
    setElapsed(0);
  };

  const mins = Math.floor(sprint.remainingSeconds / 60);
  const secs = sprint.remainingSeconds % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <div
      className="writing-sprint-timer p-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 flex flex-col gap-3 shadow-md"
      role="region"
      aria-label="Yazma Koşusu Zamanlayıcısı"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white text-xs flex items-center gap-1.5">
          <span>⚡</span> Yazma Koşusu (Writing Sprint)
        </h3>

        {sprint.status === 'idle' && (
          <div className="flex gap-1 text-[11px]">
            {[10, 15, 20, 30].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setSelectedMinutes(m);
                  setSprint(deadlineCalculator.createSprint(m, currentWordCount));
                }}
                className={`px-2 py-0.5 rounded font-mono ${
                  selectedMinutes === m
                    ? 'bg-cyan-700 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {m} dk
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sayaç ve İlerleme */}
      <div className="flex items-center justify-between bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
        <div className="flex flex-col">
          <span className="text-2xl font-mono font-bold text-cyan-400 tracking-wider">
            {timeFormatted}
          </span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Kalan Süre</span>
        </div>

        <div className="flex items-center gap-4 text-center">
          <div>
            <div className="text-base font-bold font-mono text-emerald-400">
              +{sprint.wordsGained}
            </div>
            <div className="text-[10px] text-slate-400">Kazanılan Kelime</div>
          </div>

          <div>
            <div className="text-base font-bold font-mono text-amber-400">
              {sprint.wpm}
            </div>
            <div className="text-[10px] text-slate-400">Hız (WPM)</div>
          </div>
        </div>
      </div>

      {/* Kontrol Butonları */}
      <div className="flex items-center justify-end gap-2 pt-1">
        {sprint.status === 'idle' && (
          <button
            type="button"
            onClick={handleStart}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded shadow transition-colors"
          >
            ▶ Koşuyu Başlat ({selectedMinutes} dk)
          </button>
        )}

        {sprint.status === 'running' && (
          <button
            type="button"
            onClick={handlePause}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded shadow"
          >
            ⏸ Duraklat
          </button>
        )}

        {sprint.status === 'paused' && (
          <button
            type="button"
            onClick={handleResume}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded shadow"
          >
            ▶ Devam Et
          </button>
        )}

        {(sprint.status === 'running' || sprint.status === 'paused' || sprint.status === 'completed') && (
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700"
          >
            Sıfırla
          </button>
        )}
      </div>

      {sprint.status === 'completed' && (
        <div className="p-2 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded text-center font-medium">
          🎉 Tebrikler! Seansı tamamladınız ve toplam +{sprint.wordsGained} yeni kelime ürettiniz!
        </div>
      )}
    </div>
  );
};

export default WritingSprintTimer;
