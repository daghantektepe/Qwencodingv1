import React, { useState } from 'react';
import {
  tensionCurveEngine,
  SceneTensionPoint,
  StoryArcShape
} from '../../services/analysis/tensionCurveEngine';

interface TensionCurveVisualizerProps {
  onSelectScene?: (sceneId: string) => void;
  width?: number;
  height?: number;
}

const ARC_NAMES: Record<StoryArcShape, string> = {
  man_in_a_hole: 'Çukurdaki Adam (Man in a Hole)',
  cinderella: 'Külkedisi Yükselişi (Cinderella Arc)',
  icarus: 'İkarus Trajedisi (Icarus Fall)',
  oedipus: 'Oedipus Çöküşü (Oedipus)',
  custom: 'Özel / Dinamik Eğri (Custom Arc)',
};

export const TensionCurveVisualizer: React.FC<TensionCurveVisualizerProps> = ({
  onSelectScene,
  width = 640,
  height = 220
}) => {
  const [points, setPoints] = useState<SceneTensionPoint[]>(() =>
    tensionCurveEngine.getPoints()
  );
  const [hoveredPoint, setHoveredPoint] = useState<SceneTensionPoint | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<SceneTensionPoint | null>(null);

  const { pathData, coordinates } = tensionCurveEngine.generateSvgPath(width, height, 30);
  const arcShape = tensionCurveEngine.detectArcShape();
  const climax = tensionCurveEngine.findClimaxScene();
  const avgTension = tensionCurveEngine.calculateAverageTension();

  const handleScoreChange = (sceneId: string, newScore: number) => {
    const pt = points.find((p) => p.sceneId === sceneId);
    if (!pt) return;
    const updated = { ...pt, tensionScore: newScore };
    tensionCurveEngine.setScenePoint(updated);
    setPoints(tensionCurveEngine.getPoints());
    if (selectedPoint?.sceneId === sceneId) {
      setSelectedPoint(updated);
    }
  };

  return (
    <div
      className="tension-curve-visualizer flex flex-col gap-4 p-5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200"
      role="region"
      aria-label="Hikaye Duygu Durum ve Gerilim Eğrisi Görselleştiricisi"
    >
      {/* Üst Bilgi Başlığı */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white text-sm flex items-center gap-2">
            <span>📈</span> Hikaye Gerilim Eğrisi (Narrative Tension Curve)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Ark Modeli: <span className="text-cyan-400 font-medium">{ARC_NAMES[arcShape]}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="bg-slate-800 px-2 py-0.5 rounded text-amber-300 border border-slate-700">
            Ort. Gerilim: {avgTension}/10
          </span>
          {climax && (
            <span className="bg-rose-950/80 px-2 py-0.5 rounded text-rose-300 border border-rose-800">
              ⚡ Zirve (Climax): {climax.title} ({climax.tensionScore}/10)
            </span>
          )}
        </div>
      </div>

      {/* SVG Grafiği */}
      <div className="relative bg-slate-950/80 border border-slate-800 rounded-lg p-2 overflow-hidden flex items-center justify-center">
        {points.length === 0 ? (
          <div className="text-xs text-slate-500 py-12 italic">
            Grafiğin çizilmesi için sahnelere gerilim puanı ekleyin.
          </div>
        ) : (
          <svg
            width="100%"
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="overflow-visible"
          >
            <defs>
              <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Yatay Kılavuz Çizgileri */}
            {[2, 5, 8].map((lvl) => {
              const y = 30 + (height - 60) - ((lvl - 1) / 9) * (height - 60);
              return (
                <line
                  key={lvl}
                  x1={30}
                  y1={y}
                  x2={width - 30}
                  y2={y}
                  stroke="#334155"
                  strokeDasharray="4,4"
                  strokeWidth="1"
                />
              );
            })}

            {/* Gerilim Alanı Doldurma */}
            {coordinates.length > 1 && (
              <path
                d={`${pathData} L ${coordinates[coordinates.length - 1].x} ${height - 30} L ${coordinates[0].x} ${height - 30} Z`}
                fill="url(#curveGradient)"
              />
            )}

            {/* Ana Bezier Çizgisi */}
            <path
              d={pathData}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Sahne Noktaları */}
            {coordinates.map((coord) => {
              const isSelected = selectedPoint?.sceneId === coord.sceneId;
              const isClimax = climax?.sceneId === coord.sceneId;

              return (
                <g key={coord.sceneId}>
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r={isSelected ? 7 : isClimax ? 6 : 5}
                    fill={isClimax ? '#ef4444' : isSelected ? '#38bdf8' : '#fbbf24'}
                    stroke="#0f172a"
                    strokeWidth="2"
                    className="cursor-pointer transition-transform hover:scale-125"
                    onClick={() => {
                      setSelectedPoint(coord.point);
                      onSelectScene?.(coord.sceneId);
                    }}
                    onMouseEnter={() => setHoveredPoint(coord.point)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {/* Başlık Etiketi */}
                  <text
                    x={coord.x}
                    y={height - 12}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    §{coord.point.orderIndex + 1}
                  </text>
                </g>
              );
            })}
          </svg>
        )}

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-3 left-4 bg-slate-800/90 border border-slate-700 px-2.5 py-1.5 rounded shadow-lg text-xs pointer-events-none">
            <div className="font-semibold text-white">{hoveredPoint.title}</div>
            <div className="flex gap-2 text-[11px] text-slate-300 mt-0.5">
              <span>Gerilim: <b className="text-amber-400">{hoveredPoint.tensionScore}/10</b></span>
              <span>Tempo: <b className="text-cyan-400">{hoveredPoint.pacingScore}/10</b></span>
            </div>
          </div>
        )}
      </div>

      {/* Seçili Sahne Ayar Barı */}
      {selectedPoint && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-medium text-white">{selectedPoint.title}</span>
            <span className="text-slate-400">Gerilim Puanı Ayarla:</span>
            <input
              type="range"
              min="1"
              max="10"
              value={selectedPoint.tensionScore}
              onChange={(e) =>
                handleScoreChange(selectedPoint.sceneId, parseInt(e.target.value, 10))
              }
              className="accent-amber-500 cursor-pointer"
            />
            <span className="font-mono font-bold text-amber-400">
              {selectedPoint.tensionScore}/10
            </span>
          </div>

          <button
            type="button"
            onClick={() => onSelectScene?.(selectedPoint.sceneId)}
            className="px-2.5 py-1 bg-cyan-700 hover:bg-cyan-600 text-white rounded text-[11px]"
          >
            Editörde Aç ➔
          </button>
        </div>
      )}
    </div>
  );
};

export default TensionCurveVisualizer;
