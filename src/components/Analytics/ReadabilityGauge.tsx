import { useMemo } from 'react';
import { calculateReadabilityMetrics, getReadabilityLevel } from '../../utils/readability';

interface ReadabilityGaugeProps {
  text: string;
  size?: 'small' | 'medium' | 'large';
}

export default function ReadabilityGauge({ text, size = 'medium' }: ReadabilityGaugeProps) {
  const metrics = useMemo(() => {
    return calculateReadabilityMetrics(text);
  }, [text]);

  const level = useMemo(() => {
    return getReadabilityLevel(metrics.fleschKincaid);
  }, [metrics.fleschKincaid]);

  // Calculate gauge position (0-100 scale maps to -90 to 90 degrees)
  const gaugeAngle = useMemo(() => {
    const normalizedScore = Math.min(100, Math.max(0, metrics.fleschKincaid));
    return (normalizedScore / 100) * 180 - 90;
  }, [metrics.fleschKincaid]);

  // Determine color based on score
  const getColor = (score: number): string => {
    if (score >= 70) return '#10B981'; // Green - Easy
    if (score >= 50) return '#F59E0B'; // Yellow - Moderate
    return '#EF4444'; // Red - Difficult
  };

  const color = getColor(metrics.fleschKincaid);

  // Size configurations
  const sizeConfig = {
    small: { width: 120, height: 80, fontSize: 24, labelSize: 10 },
    medium: { width: 200, height: 120, fontSize: 36, labelSize: 12 },
    large: { width: 280, height: 160, fontSize: 48, labelSize: 14 },
  };

  const config = sizeConfig[size];

  if (!text || text.trim().length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Readability Score</h3>
        <div className="text-center py-8 text-gray-400 text-sm">
          No text to analyze
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">Readability Score</h3>
      
      {/* Gauge visualization */}
      <div className="flex flex-col items-center">
        <svg
          width={config.width}
          height={config.height}
          viewBox={`0 0 ${config.width} ${config.height}`}
          className="mb-4"
        >
          {/* Background arc */}
          <path
            d={`M 20 ${config.height - 20} A ${config.width / 2 - 20} ${config.height - 40} 0 0 1 ${config.width - 20} ${config.height - 20}`}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="12"
            strokeLinecap="round"
          />
          
          {/* Colored arc based on score */}
          <path
            d={`M 20 ${config.height - 20} A ${config.width / 2 - 20} ${config.height - 40} 0 0 1 ${config.width - 20} ${config.height - 20}`}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${(metrics.fleschKincaid / 100) * 280} 280`}
          />
          
          {/* Needle */}
          <g transform={`rotate(${gaugeAngle} ${config.width / 2} ${config.height - 20})`}>
            <line
              x1={config.width / 2}
              y1={config.height - 20}
              x2={config.width / 2}
              y2={40}
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle
              cx={config.width / 2}
              cy={config.height - 20}
              r="6"
              fill={color}
            />
          </g>
          
          {/* Score text */}
          <text
            x={config.width / 2}
            y={config.height - 30}
            textAnchor="middle"
            fontSize={config.fontSize}
            fontWeight="bold"
            fill={color}
          >
            {Math.round(metrics.fleschKincaid)}
          </text>
        </svg>

        {/* Level label */}
        <div className="text-center">
          <div className="text-sm font-medium text-gray-700">{level}</div>
          <div className="text-xs text-gray-500 mt-1">
            Grade Level: {metrics.fleschKincaidGrade}
          </div>
        </div>
      </div>

      {/* Additional metrics */}
      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-800">{metrics.gunningFog}</div>
          <div className="text-[10px] text-gray-500">Gunning Fog</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-800">{metrics.complexWordPercentage}%</div>
          <div className="text-[10px] text-gray-500">Complex Words</div>
        </div>
      </div>
    </div>
  );
}
