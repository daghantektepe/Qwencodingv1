import React, { useState, useMemo } from 'react';
import {
  generateCharacterSceneMatrix,
  analyzeCharacterLines,
} from '../../services/screenplay/stagePlayLayout';

export interface CharacterSceneMatrixProps {
  scriptText: string;
  title?: string;
}

export const CharacterSceneMatrix: React.FC<CharacterSceneMatrixProps> = ({
  scriptText,
  title = 'Karakter-Sahne Varlık Çizelgesi (Character Scene Matrix)',
}) => {
  const [search, setSearch] = useState('');

  const matrixData = useMemo(() => {
    return generateCharacterSceneMatrix(scriptText);
  }, [scriptText]);

  const stats = useMemo(() => {
    return analyzeCharacterLines(scriptText);
  }, [scriptText]);

  const statsMap = useMemo(() => {
    const map = new Map<string, { lineCount: number; wordCount: number }>();
    stats.forEach((s) => map.set(s.character, { lineCount: s.lineCount, wordCount: s.wordCount }));
    return map;
  }, [stats]);

  const filteredCharacters = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return matrixData.characters;
    return matrixData.characters.filter((c) => c.toLowerCase().includes(q));
  }, [matrixData.characters, search]);

  return (
    <div
      style={{
        backgroundColor: '#1e293b',
        color: '#f8fafc',
        borderRadius: '10px',
        padding: '20px',
        border: '1px solid #334155',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🎭</span> {title}
        </h3>
        <input
          type="text"
          placeholder="Karakter Ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Karakter Ara"
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            backgroundColor: '#0f172a',
            color: '#fff',
            border: '1px solid #475569',
            fontSize: '0.85rem',
          }}
        />
      </div>

      {matrixData.scenes.length === 0 || matrixData.characters.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '0.9rem' }}>
          Metinde sahne veya konuşan karakter bulunamadı. Lütfen "SAHNE 1" ve "KARAKTER:" biçiminde metin ekleyin.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.88rem',
              textAlign: 'center',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#0f172a' }}>
                <th
                  style={{
                    padding: '10px 14px',
                    textAlign: 'left',
                    borderBottom: '2px solid #475569',
                    position: 'sticky',
                    left: 0,
                    backgroundColor: '#0f172a',
                    zIndex: 2,
                  }}
                >
                  Karakter ({filteredCharacters.length})
                </th>
                <th style={{ padding: '10px', borderBottom: '2px solid #475569', color: '#93c5fd' }}>
                  Replik
                </th>
                <th style={{ padding: '10px', borderBottom: '2px solid #475569', color: '#93c5fd' }}>
                  Kelime
                </th>
                {matrixData.scenes.map((scene) => (
                  <th
                    key={scene.sceneNumber}
                    style={{
                      padding: '10px 12px',
                      borderBottom: '2px solid #475569',
                      minWidth: '70px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {scene.title.length > 15 ? `S.${scene.sceneNumber}` : scene.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCharacters.map((character) => {
                const charStats = statsMap.get(character) || { lineCount: 0, wordCount: 0 };
                return (
                  <tr
                    key={character}
                    style={{
                      borderBottom: '1px solid #334155',
                      backgroundColor: 'transparent',
                    }}
                  >
                    <td
                      style={{
                        padding: '10px 14px',
                        textAlign: 'left',
                        fontWeight: 600,
                        position: 'sticky',
                        left: 0,
                        backgroundColor: '#1e293b',
                        zIndex: 1,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {character}
                    </td>
                    <td style={{ padding: '8px', color: '#cbd5e1' }}>{charStats.lineCount}</td>
                    <td style={{ padding: '8px', color: '#cbd5e1' }}>{charStats.wordCount}</td>
                    {matrixData.scenes.map((scene) => {
                      const isPresent = scene.charactersPresent.includes(character);
                      return (
                        <td
                          key={scene.sceneNumber}
                          style={{
                            padding: '8px',
                            backgroundColor: isPresent ? 'rgba(34, 197, 94, 0.12)' : 'transparent',
                            color: isPresent ? '#4ade80' : '#475569',
                            fontWeight: isPresent ? 700 : 'normal',
                          }}
                        >
                          {isPresent ? '✓' : '—'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CharacterSceneMatrix;
