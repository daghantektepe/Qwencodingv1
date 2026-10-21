import React from 'react';
import { DocumentDialogueAnalysis, CharacterDialogueMetrics } from '../../services/analysis/dialogueAnalyzer';

interface DialogueDistinctivenessChartProps {
  analysis: DocumentDialogueAnalysis;
  onCharacterClick?: (characterName: string) => void;
}

const TONE_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  angry: { label: 'Öfkeli', bg: 'bg-rose-950/80', text: 'text-rose-400 border-rose-800' },
  joyful: { label: 'Neşeli', bg: 'bg-emerald-950/80', text: 'text-emerald-400 border-emerald-800' },
  formal: { label: 'Resmi', bg: 'bg-blue-950/80', text: 'text-blue-400 border-blue-800' },
  sarcastic: { label: 'Alaycı', bg: 'bg-purple-950/80', text: 'text-purple-400 border-purple-800' },
  neutral: { label: 'Nötr', bg: 'bg-slate-800', text: 'text-slate-300 border-slate-700' },
};

export const DialogueDistinctivenessChart: React.FC<DialogueDistinctivenessChartProps> = ({
  analysis,
  onCharacterClick
}) => {
  const dialoguePercent = Math.round(analysis.dialogueRatio * 100);
  const narrativePercent = 100 - dialoguePercent;

  return (
    <div
      className="dialogue-distinctiveness-chart flex flex-col gap-6 p-5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200"
      role="region"
      aria-label="Karakter Diyalog ve Ses Tonu Analiz Grafiği"
    >
      {/* Üst Kısım: Diyalog vs Anlatım Oranı */}
      <div>
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-slate-300">
            Diyalog vs. Anlatım Oranı (Dialogue vs. Narrative)
          </span>
          <div className="flex gap-4 font-mono text-[11px]">
            <span className="text-amber-400">💬 Diyalog: %{dialoguePercent} ({analysis.dialogueWords} kelime)</span>
            <span className="text-cyan-400">📖 Anlatım: %{narrativePercent} ({analysis.narrativeWords} kelime)</span>
          </div>
        </div>

        <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden flex shadow-inner">
          <div
            className="bg-amber-500 h-full transition-all duration-300"
            style={{ width: `${dialoguePercent}%` }}
            title={`Diyalog: %${dialoguePercent}`}
          />
          <div
            className="bg-cyan-600 h-full transition-all duration-300"
            style={{ width: `${narrativePercent}%` }}
            title={`Anlatım: %${narrativePercent}`}
          />
        </div>
      </div>

      {/* Karakter Kartları */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Karakter Konuşma Profilleri & Ses Tonları
        </h3>

        {analysis.characterMetrics.length === 0 ? (
          <div className="text-xs text-slate-500 italic py-4 text-center">
            Metinde henüz tırnak içine alınmış diyalog tespit edilemedi.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {analysis.characterMetrics.map((char) => {
              const toneBadge = TONE_BADGES[char.dominantTone] || TONE_BADGES.neutral;

              return (
                <div
                  key={char.characterName}
                  onClick={() => onCharacterClick?.(char.characterName)}
                  className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 hover:border-slate-700 transition-colors flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white text-sm">
                      {char.characterName}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${toneBadge.bg} ${toneBadge.text}`}>
                      {toneBadge.label}
                    </span>
                  </div>

                  {/* İstatistikler */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/80 my-2 text-center text-xs">
                    <div>
                      <div className="text-slate-400 text-[10px]">Replik Sayısı</div>
                      <div className="font-mono font-bold text-white">{char.totalLines}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px]">Ort. Cümle Boyu</div>
                      <div className="font-mono font-bold text-cyan-400">{char.avgSentenceLength} kelime</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px]">Sözcük Zenginliği</div>
                      <div className="font-mono font-bold text-emerald-400">%{Math.round(char.lexicalRichness * 100)}</div>
                    </div>
                  </div>

                  {/* En Çok Kullanılan Kelimeler */}
                  {char.topWords.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] text-slate-400">Sık kullanılan:</span>
                      {char.topWords.slice(0, 4).map((w) => (
                        <span
                          key={w.word}
                          className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded text-slate-300 font-mono"
                        >
                          {w.word} ({w.count})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Karakterler Arası Konuşma Benzerliği / Özgünlük */}
      {analysis.similarityPairs.length > 0 && (
        <div className="border-t border-slate-800 pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Karakterler Arası Ses Benzerliği (Düşük = Daha Özgün Karakter Sesi)
          </h4>
          <div className="flex flex-col gap-2">
            {analysis.similarityPairs.map((pair, idx) => {
              const simPercent = Math.round(pair.similarityScore * 100);
              const isDistinct = simPercent < 25;

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded bg-slate-950/40 border border-slate-800 text-xs"
                >
                  <span className="text-slate-300">
                    <span className="font-medium text-white">{pair.charA}</span> &lt;---&gt;{' '}
                    <span className="font-medium text-white">{pair.charB}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-mono font-semibold ${
                        isDistinct ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      %{simPercent} benzerlik
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ({isDistinct ? '✓ Çok Özgün' : '⚠ Benzer Kelime Havuzu'})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DialogueDistinctivenessChart;
