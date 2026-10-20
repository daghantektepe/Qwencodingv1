import { useMemo } from 'react';
import { WritingSession } from '../../types/analytics';

interface WpmChartProps {
  sessions: WritingSession[];
}

export default function WpmChart({ sessions }: WpmChartProps) {
  const chartData = useMemo(() => {
    if (sessions.length === 0) return [];
    
    // Sort by start time
    const sorted = [...sessions].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    
    // Get last 20 sessions for chart
    return sorted.slice(-20).map(session => ({
      date: new Date(session.startTime).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      wpm: session.wpm,
      words: session.netWords,
    }));
  }, [sessions]);

  const maxWpm = Math.max(...chartData.map(d => d.wpm), 1);
  const avgWpm = chartData.length > 0
    ? Math.round(chartData.reduce((sum, d) => sum + d.wpm, 0) / chartData.length)
    : 0;

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Writing Speed (WPM)</h3>
        <div className="text-center py-8 text-gray-400 text-sm">
          No writing sessions yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Writing Speed (WPM)</h3>
        <div className="text-xs text-gray-500">
          Avg: <span className="font-semibold text-indigo-600">{avgWpm}</span> WPM
        </div>
      </div>

      {/* Chart */}
      <div className="h-40 flex items-end gap-1">
        {chartData.map((point, index) => {
          const height = (point.wpm / maxWpm) * 100;
          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center gap-1 group"
            >
              {/* Bar */}
              <div className="w-full flex items-end h-32">
                <div
                  className="w-full bg-indigo-500 rounded-t hover:bg-indigo-600 transition-colors cursor-pointer relative"
                  style={{ height: `${height}%` }}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                      <div>{point.wpm} WPM</div>
                      <div className="text-gray-400">{point.words} words</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Label */}
              <div className="text-[9px] text-gray-400 truncate w-full text-center">
                {point.date}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-800">
            {Math.max(...chartData.map(d => d.wpm))}
          </div>
          <div className="text-[10px] text-gray-500">Best WPM</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-800">{avgWpm}</div>
          <div className="text-[10px] text-gray-500">Average</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-800">
            {chartData.reduce((sum, d) => sum + d.words, 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-500">Total Words</div>
        </div>
      </div>
    </div>
  );
}
