import { useState, useEffect, useRef, useMemo } from 'react';
import {
  TimelineEvent,
  TimelineState,
  TimelineMarker,
  EVENT_CATEGORIES,
  EventCategory,
  TimeScale,
  TIME_SCALE_LABELS,
} from '../../types/timeline';
import { getTimelineStore } from '../../services/timelineStore';
import TimelineEventCard from './TimelineEventCard';
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  X,
  Clock,
  BookOpen,
  GitBranch,
  Eye,
  EyeOff,
} from 'lucide-react';

interface TimelineViewProps {
  onEditEvent?: (event: TimelineEvent) => void;
  onDeleteEvent?: (id: string) => void;
}

export function TimelineView({ onEditEvent, onDeleteEvent }: TimelineViewProps) {
  const store = getTimelineStore();
  const [state, setState] = useState<TimelineState>(store.getState());
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = store.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, [store]);

  const filteredEvents = store.getFilteredEvents();
  const range = store.getTimelineRange();
  const activePlotlines = store.getActivePlotlines();

  const timelineWidth = useMemo(() => {
    const baseWidth = 2000;
    return baseWidth * (state.zoomLevel / 5);
  }, [state.zoomLevel]);

  const getPositionStyle = (position: number) => {
    const percentage = ((position - range.min) / (range.max - range.min || 1)) * 100;
    return { left: `${percentage}%` };
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (timelineRef.current) {
      const scrollAmount = 200;
      timelineRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const newZoom = direction === 'in'
      ? Math.min(10, state.zoomLevel + 1)
      : Math.max(1, state.zoomLevel - 1);
    store.dispatch({ type: 'SET_ZOOM_LEVEL', payload: newZoom });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Toolbar */}
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">Timeline</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {filteredEvents.length} events
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* View mode buttons */}
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => store.dispatch({ type: 'SET_VIEW_MODE', payload: 'chronological' })}
                className={`p-1.5 ${state.viewMode === 'chronological' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Chronological view"
              >
                <Clock className="w-4 h-4" />
              </button>
              <button
                onClick={() => store.dispatch({ type: 'SET_VIEW_MODE', payload: 'narrative' })}
                className={`p-1.5 ${state.viewMode === 'narrative' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Narrative view"
              >
                <BookOpen className="w-4 h-4" />
              </button>
              <button
                onClick={() => store.dispatch({ type: 'SET_VIEW_MODE', payload: 'parallel' })}
                className={`p-1.5 ${state.viewMode === 'parallel' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Parallel plotlines view"
              >
                <GitBranch className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={state.searchQuery}
              onChange={(e) => store.dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value })}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            {state.searchQuery && (
              <button
                onClick={() => store.dispatch({ type: 'SET_SEARCH_QUERY', payload: '' })}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            )}
          </div>

          {/* Category filter */}
          <select
            value={state.filterCategory}
            onChange={(e) =>
              store.dispatch({ type: 'SET_FILTER_CATEGORY', payload: e.target.value as EventCategory | 'all' })
            }
            className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            <option value="all">All Categories</option>
            {EVENT_CATEGORIES && Object.entries(EVENT_CATEGORIES).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          {/* Plotline filter */}
          <select
            value={state.filterPlotlineId || ''}
            onChange={(e) =>
              store.dispatch({ type: 'SET_FILTER_PLOTLINE', payload: e.target.value || null })
            }
            className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            <option value="">All Plotlines</option>
            {activePlotlines.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Time scale */}
          <select
            value={state.timeScale}
            onChange={(e) =>
              store.dispatch({ type: 'SET_TIME_SCALE', payload: e.target.value as TimeScale })
            }
            className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            {TIME_SCALE_LABELS && Object.entries(TIME_SCALE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          {/* Drafts toggle */}
          <button
            onClick={() => store.dispatch({ type: 'TOGGLE_DRAFTS' })}
            className={`p-1.5 rounded-lg border ${state.showDrafts ? 'border-indigo-200 bg-indigo-50 text-indigo-600' : 'border-gray-200 text-gray-400'}`}
            title={state.showDrafts ? 'Hide drafts' : 'Show drafts'}
          >
            {state.showDrafts ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg">
            <button
              onClick={() => handleZoom('out')}
              className="p-1.5 text-gray-400 hover:text-gray-600"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-500 px-1">{state.zoomLevel}x</span>
            <button
              onClick={() => handleZoom('in')}
              className="p-1.5 text-gray-400 hover:text-gray-600"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Timeline visualization */}
      <div className="flex-1 overflow-hidden relative">
        {/* Scroll buttons */}
        <button
          onClick={() => handleScroll('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <button
          onClick={() => handleScroll('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>

        {/* Scrollable timeline */}
        <div
          ref={timelineRef}
          className="h-full overflow-x-auto overflow-y-hidden"
        >
          <div
            className="h-full relative min-w-full"
            style={{ width: `${timelineWidth}px` }}
          >
            {/* Timeline axis */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2" />

            {/* Markers */}
            {state.markers.map((marker) => (
              <div
                key={marker.id}
                className="absolute top-1/2 -translate-y-1/2"
                style={getPositionStyle(marker.position)}
              >
                <div
                  className="w-0.5 h-16 -translate-x-1/2"
                  style={{ backgroundColor: marker.color }}
                />
                <div
                  className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium px-2 py-0.5 rounded"
                  style={{ backgroundColor: marker.color + '20', color: marker.color }}
                >
                  {marker.label}
                </div>
              </div>
            ))}

            {/* Events on timeline */}
            {filteredEvents.map((event, index) => {
              const isTop = index % 2 === 0;
              return (
                <div
                  key={event.id}
                  className="absolute"
                  style={{
                    ...getPositionStyle(event.timelinePosition),
                    top: isTop ? '15%' : '60%',
                  }}
                >
                  {/* Connector line */}
                  <div
                    className={`absolute w-0.5 ${isTop ? 'bottom-0' : 'top-0'} left-1/2 -translate-x-1/2`}
                    style={{
                      height: isTop ? 'calc(35% - 16px)' : 'calc(25% - 16px)',
                      backgroundColor: event.color,
                      [isTop ? 'bottom' : 'top']: '0',
                    }}
                  />
                  {/* Event dot */}
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md cursor-pointer ${
                      state.selectedEventId === event.id ? 'ring-2 ring-indigo-400 scale-125' : ''
                    } ${event.isMajorEvent ? 'w-6 h-6' : ''}`}
                    style={{
                      backgroundColor: event.color,
                      [isTop ? 'bottom' : 'top']: isTop ? 'calc(35% - 8px)' : 'calc(25% - 8px)',
                    }}
                    onClick={() => store.dispatch({ type: 'SELECT_EVENT', payload: event.id })}
                  />
                  {/* Event label */}
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 w-32 ${isTop ? '-top-2' : '-bottom-2'} ${isTop ? '-translate-y-full' : 'translate-y-full'}`}
                  >
                    <TimelineEventCard
                      event={event}
                      isSelected={state.selectedEventId === event.id}
                      onSelect={(id) => {
                        store.dispatch({ type: 'SELECT_EVENT', payload: id });
                        if (onEditEvent) onEditEvent(event);
                      }}
                      position={isTop ? 'above' : 'below'}
                    />
                  </div>
                </div>
              );
            })}

            {/* Empty state */}
            {filteredEvents.length === 0 && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">
                  {state.searchQuery || state.filterCategory !== 'all'
                    ? 'No events match your filters'
                    : 'No events yet. Add your first event!'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimelineView;
