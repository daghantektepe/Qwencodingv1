import React, { useState } from 'react';
import {
  PresenceMatrixResult,
  CharacterPresenceReport,
} from '../../services/analysis/characterArcTracker';

interface CharacterPresenceMatrixProps {
  result: PresenceMatrixResult;
  onSelectScene?: (sceneId: string) => void;
  onSelectCharacter?: (charName: string) => void;
}

export const CharacterPresenceMatrix: React.FC<CharacterPresenceMatrixProps> = ({
  result,
  onSelectScene,
  onSelectCharacter,
}) => {
  const [selectedChar, setSelectedChar] = useState<string | null>(null);

  const warnings = result.characters
    .map((c) => c.forgottenWarning)
    .filter(Boolean);

  return (
    <div
      className="character-presence-matrix bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-200 flex flex-col gap-5 text-xs overflow-hidden"
      data-testid="character-presence-matrix"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🎭</span>
          <div>
            <h2 className="text-base font-semibold text-white">
              Karakter Varlık Matrisi ve Sahne Çizelgesi
            </h2>
            <p className="text-xs text-slate-400">
              Karakterlerin bölümlere dağılımı, diyalog ağırlığı ve unutulma uyarıları
            </p>
          </div>
        </div>
      </div>

      {/* Forgotten Character Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2" data-testid="forgotten-warnings-container">
          {warnings.map((w, idx) => (
            <div
              key={idx}
              className="p-3 bg-amber-950/60 border border-amber-800/80 rounded-xl text-amber-200 text-xs flex items-center gap-2.5"
            >
              <span className="text-base">⚠️</span>
              <div className="flex-1">
                <span className="font-semibold">Karakter Uyarısı: </span>
                {w?.warning}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Matrix Table */}
      <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/80">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80">
              <th className="p-3 font-semibold text-slate-300 min-w-[150px] sticky left-0 bg-slate-900 z-10">
                Karakter
              </th>
              {result.allScenes.map((scene) => (
                <th
                  key={scene.id}
                  onClick={() => onSelectScene?.(scene.id)}
                  className="p-3 text-center font-mono text-[11px] text-slate-400 hover:text-cyan-400 cursor-pointer min-w-[70px] border-l border-slate-800/60"
                  title={`${scene.title} (${scene.totalWords} kelime)`}
                >
                  <div className="truncate max-w-[80px] mx-auto">{scene.title}</div>
                </th>
              ))}
              <th className="p-3 text-center text-[11px] text-slate-400 border-l border-slate-800">
                Varlık %
              </th>
            </tr>
          </thead>
          <tbody>
            {result.characters.map((char) => {
              const isSelected = selectedChar === char.characterName;

              return (
                <tr
                  key={char.characterName}
                  onClick={() => {
                    setSelectedChar(char.characterName);
                    onSelectCharacter?.(char.characterName);
                  }}
                  className={`border-b border-slate-800/60 transition-colors cursor-pointer ${
                    isSelected ? 'bg-cyan-950/30' : 'hover:bg-slate-900/50'
                  }`}
                >
                  {/* Character Name Cell */}
                  <td className="p-3 font-medium text-white sticky left-0 bg-slate-950 z-10 flex items-center justify-between gap-2">
                    <span className="font-serif">{char.characterName}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-sans ${
                        char.role === 'protagonist'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {char.role === 'protagonist' ? 'Başrol' : 'Yan'}
                    </span>
                  </td>

                  {/* Presence Cells across scenes */}
                  {char.scenes.map((presence) => {
                    const hasPresence = presence.mentionCount > 0;
                    const sizePx = Math.min(26, Math.max(10, presence.mentionCount * 4));

                    return (
                      <td
                        key={presence.sceneId}
                        className="p-2 text-center border-l border-slate-800/40 align-middle"
                        title={`${char.characterName} - ${presence.sceneTitle}\nBahsedilme: ${presence.mentionCount}\nDiyalog: ${presence.dialogueWordCount} kelime\nEvre: ${presence.arcStage}`}
                      >
                        {hasPresence ? (
                          <div
                            className="rounded-full mx-auto flex items-center justify-center font-mono text-[9px] font-bold shadow transition-transform hover:scale-125"
                            style={{
                              width: `${sizePx}px`,
                              height: `${sizePx}px`,
                              backgroundColor:
                                char.role === 'protagonist'
                                  ? 'rgba(245, 158, 11, 0.85)'
                                  : 'rgba(6, 182, 212, 0.85)',
                              color: '#ffffff',
                            }}
                          >
                            {presence.mentionCount}
                          </div>
                        ) : (
                          <span className="text-slate-800 select-none">•</span>
                        )}
                      </td>
                    );
                  })}

                  {/* Total Presence Percentage */}
                  <td className="p-3 text-center font-mono text-[11px] text-cyan-400 font-bold border-l border-slate-800">
                    %{char.presencePercentage}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Co-occurrence Insights */}
      {result.coOccurrences.length > 0 && (
        <div className="pt-2 border-t border-slate-800">
          <h3 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
            <span>🤝</span> En Çok Birlikte Sahne Alan Karakter Çiftleri
          </h3>
          <div className="flex gap-2 flex-wrap">
            {result.coOccurrences.slice(0, 5).map((co, idx) => (
              <div
                key={idx}
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px] flex items-center gap-2 text-slate-300"
              >
                <span className="text-white font-medium">
                  {co.charA} & {co.charB}
                </span>
                <span className="px-1.5 py-0.5 bg-slate-900 rounded text-cyan-400 font-mono text-[10px]">
                  {co.sharedScenesCount} sahne
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterPresenceMatrix;
