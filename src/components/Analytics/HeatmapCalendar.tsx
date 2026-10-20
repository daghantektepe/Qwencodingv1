import { useMemo } from 'react';
import { HeatmapCell } from '../../types/analytics';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeatmapCalendarProps {
  cells: HeatmapCell[];
  year?: number;
  month?: number;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const LEVEL_COLORS = [
  'bg-gray-100',    // level 0 - no activity
  'bg-green-200',   // level 1 - light activity
  'bg-green-400',   // level 2 - moderate activity
  'bg-green-600',   // level 3 - heavy activity
  'bg-green-800',   // level 4 - very heavy activity
];

export default function HeatmapCalendar({ 
  cells, 
  year = new Date().getFullYear(), 
  month = new Date().getMonth() 
}: HeatmapCalendarProps) {
  const calendarData = useMemo(() => {
    // Create a map of date -> cell for quick lookup
    const cellMap = new Map<string, HeatmapCell>();
    cells.forEach(cell => {
      cellMap.set(cell.date, cell);
    });

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Create calendar grid
    const weeks: (HeatmapCell | null)[][] = [];
    let currentWeek: (HeatmapCell | null)[] = [];

    // Fill empty cells before first day
    for (let i = 0; i < startingDayOfWeek; i++) {
      currentWeek.push(null);
    }

    // Fill in days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const cell = cellMap.get(dateStr) || {
        date: dateStr,
        count: 0,
        level: 0 as const,
      };
      
      currentWeek.push(cell);

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Fill remaining cells in last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [cells, year, month]);

  const totalWords = useMemo(() => {
    return cells.reduce((sum, cell) => sum + cell.count, 0);
  }, [cells]);

  const activeDays = useMemo(() => {
    return cells.filter(cell => cell.count > 0).length;
  }, [cells]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">
          {MONTH_NAMES[month]} {year}
        </h3>
        <div className="text-xs text-gray-500">
          {activeDays} active days · {totalWords.toLocaleString()} words
        </div>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_NAMES.map(day => (
          <div key={day} className="text-center text-[10px] text-gray-400 font-medium">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="space-y-1">
        {calendarData.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((cell, dayIndex) => {
              if (!cell) {
                return <div key={dayIndex} className="aspect-square" />;
              }

              return (
                <div
                  key={dayIndex}
                  className={`aspect-square rounded-sm ${LEVEL_COLORS[cell.level]} cursor-pointer hover:ring-2 hover:ring-gray-400 transition-all relative group`}
                  title={`${cell.date}: ${cell.count} words`}
                >
                  {/* Day number */}
                  <div className="absolute inset-0 flex items-center justify-center text-[9px] text-gray-600 font-medium opacity-50">
                    {new Date(cell.date).getDate()}
                  </div>
                  
                  {/* Tooltip */}
                  {cell.count > 0 && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                      <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                        <div className="font-medium">{cell.count} words</div>
                        <div className="text-gray-400">{cell.date}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Less</span>
          {LEVEL_COLORS.map((color, index) => (
            <div key={index} className={`w-3 h-3 rounded-sm ${color}`} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
