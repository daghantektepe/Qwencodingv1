import { useMemo } from 'react';
import { HeatmapCell } from '../../types/analytics';
import { getAnalyticsStore } from '../../services/analyticsStore';

interface WritingHeatmapProps {
  cells: HeatmapCell[];
}

const LEVEL_COLORS = [
  'bg-gray-100',    // level 0
  'bg-green-200',   // level 1
  'bg-green-400',   // level 2
  'bg-green-600',   // level 3
  'bg-green-800',   // level 4
];

export default function WritingHeatmap({ cells }: WritingHeatmapProps) {
  const store = getAnalyticsStore();
  const state = store.getState();

  // Group cells by week for grid layout
  const weeks = useMemo(() => {
    const result: HeatmapCell[][] = [];
    let currentWeek: HeatmapCell[] = [];
    
    cells.forEach((cell, index) => {
      currentWeek.push(cell);
      if (currentWeek.length === 7 || index === cells.length - 1) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });
    
    return result;
  }, [cells]);

  const totalWords = cells.reduce((sum, cell) => sum + cell.count, 0);
  const activeDays = cells.filter(cell => cell.count > 0).length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Writing Activity</h3>
        <div className="text-xs text-gray-500">
          {activeDays} active days · {totalWords.toLocaleString()} words
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="overflow-x-auto">
        <div className="flex gap-0.5 min-w-fit">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-0.5">
              {week.map((cell, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`w-3 h-3 rounded-sm ${LEVEL_COLORS[cell.level]} cursor-pointer hover:ring-2 hover:ring-gray-400 transition-all`}
                  title={`${cell.date}: ${cell.count} words`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
        <span>Less</span>
        {LEVEL_COLORS.map((color, index) => (
          <div key={index} className={`w-3 h-3 rounded-sm ${color}`} />
        ))}
        <span>More</span>
      </div>

      {/* Date range */}
      <div className="flex justify-between mt-2 text-[10px] text-gray-400">
        <span>{state.startDate}</span>
        <span>{state.endDate}</span>
      </div>
    </div>
  );
}
