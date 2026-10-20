import { useState } from 'react';
import { Plotline, TimelineEvent, PLOTLINE_TYPES } from '../../types/timeline';
import { getTimelineStore } from '../../services/timelineStore';
import { ChevronDown, ChevronUp, Eye, EyeOff, Edit3, Trash2 } from 'lucide-react';

interface PlotlineLaneProps {
  plotline: Plotline;
  events: TimelineEvent[];
  range: { min: number; max: number };
  isCollapsed: boolean;
  onToggleCollapse: (plotlineId: string) => void;
  onEventSelect?: (eventId: string) => void;
}

/**
 * PlotlineLane - Renders a single plotline as a horizontal lane/track
 * Shows the plotline header and a visual track of associated events
 */
export default function PlotlineLane({
  plotline,
  events,
  range,
  isCollapsed,
  onToggleCollapse,
  onEventSelect,
}: PlotlineLaneProps) {
  const store = getTimelineStore();
  const state = store.getState();
  const [showActions, setShowActions] = useState(false);

  const getEventPosition = (position: number): string => {
    const percentage = ((position - range.min) / (range.max - range.min || 1)) * 100;
    return `${Math.max(0, Math.min(100, percentage))}%`;
  };

  const togglePlotlineActive = () => {
    store.dispatch({
      type: 'UPDATE_PLOTLINE',
      payload: { id: plotline.id, updates: { isActive: !plotline.isActive } },
    });
  };

  const handleDeletePlotline = () => {
    if (confirm(`Delete plotline "${plotline.name}"?`)) {
      store.dispatch({ type: 'DELETE_PLOTLINE', payload: plotline.id });
    }
  };

  return (
    <div
      className="border border-gray-200 rounded-xl overflow-hidden"
      data-testid="plotline-lane"
    >
      {/* Plotline header */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
        style={{ backgroundColor: plotline.color + '10' }}
        onClick={() => onToggleCollapse(plotline.id)}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Color indicator */}
        <div
          className="w-4 h-4 rounded-full flex-shrink-0"
          style={{ backgroundColor: plotline.color }}
        />

        {/* Plotline info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-800 truncate">
              {plotline.name}
            </h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
              {PLOTLINE_TYPES[plotline.type]}
            </span>
            <span className="text-[10px] text-gray-400">
              {events.length} event{events.length !== 1 ? 's' : ''}
            </span>
          </div>
          {plotline.description && (
            <p className="text-[10px] text-gray-500 truncate mt-0.5">
              {plotline.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {showActions && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlotlineActive();
                }}
                className="p-1 rounded hover:bg-gray-200 text-gray-400"
                title="Toggle visibility"
              >
                {plotline.isActive ? (
                  <Eye className="w-3.5 h-3.5" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePlotline();
                }}
                className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                title="Delete plotline"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {isCollapsed ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Event track */}
      {!isCollapsed && (
        <div className="px-4 pb-3">
          {/* Track bar */}
          <div className="relative h-10 bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
            {/* Track line */}
            <div className="absolute top-1/2 left-2 right-2 h-0.5 -translate-y-1/2 bg-gray-200" />

            {/* Events on track */}
            {events.map((event) => (
              <div
                key={event.id}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer group"
                style={{ left: getEventPosition(event.timelinePosition) }}
                onClick={() => {
                  store.dispatch({ type: 'SELECT_EVENT', payload: event.id });
                  onEventSelect?.(event.id);
                }}
                data-testid="plotline-event-dot"
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-150 ${
                    event.isMajorEvent ? 'w-5 h-5' : ''
                  } ${
                    state.selectedEventId === event.id
                      ? 'ring-2 ring-indigo-400 scale-125'
                      : ''
                  }`}
                  style={{ backgroundColor: event.color }}
                  title={event.title}
                />
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                  <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap shadow-lg">
                    <div className="font-medium">{event.title}</div>
                    <div className="text-gray-400">{event.timelineLabel}</div>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty state */}
            {events.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] text-gray-400">No events</span>
              </div>
            )}
          </div>

          {/* Event labels */}
          {events.length > 0 && (
            <div className="relative h-6 mt-1">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="absolute -translate-x-1/2 text-[9px] text-gray-500 truncate max-w-[80px]"
                  style={{ left: getEventPosition(event.timelinePosition) }}
                >
                  {event.timelineLabel}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
