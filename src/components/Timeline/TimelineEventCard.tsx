import { TimelineEvent, EVENT_CATEGORIES } from '../../types/timeline';
import { getTimelineStore } from '../../services/timelineStore';
import { Clock, Tag, Users, AlertCircle } from 'lucide-react';

interface TimelineEventCardProps {
  event: TimelineEvent;
  isSelected: boolean;
  onSelect: (id: string) => void;
  position: 'above' | 'below';
}

/**
 * TimelineEventCard - Inline event card displayed on the timeline axis
 * Unlike EventCard (which is used in lists/grids), this component is designed
 * to be positioned directly on the timeline with connector lines.
 */
export default function TimelineEventCard({
  event,
  isSelected,
  onSelect,
  position,
}: TimelineEventCardProps) {
  const store = getTimelineStore();
  const plotlines = store.getState().plotlines.filter((p) =>
    event.plotlineIds.includes(p.id)
  );

  const isAbove = position === 'above';

  return (
    <div
      className={`absolute ${isAbove ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 -translate-x-1/2 w-40 z-10`}
    >
      {/* Connector line */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 w-0.5 ${
          isAbove ? 'top-full' : 'bottom-full'
        } h-2`}
        style={{ backgroundColor: event.color }}
      />

      {/* Card */}
      <div
        className={`group relative rounded-lg border-2 p-2 cursor-pointer transition-all hover:shadow-md ${
          isSelected
            ? 'border-indigo-400 shadow-md bg-white'
            : 'border-gray-200 bg-white/95 hover:border-gray-300'
        } ${event.isDraft ? 'opacity-60 border-dashed' : ''}`}
        onClick={() => onSelect(event.id)}
        data-testid="timeline-event-card"
      >
        {/* Header */}
        <div className="flex items-start gap-1.5 mb-1">
          {event.isMajorEvent && (
            <AlertCircle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-gray-800 truncate leading-tight">
              {event.title}
            </div>
            <div className="flex items-center gap-1 text-[9px] text-gray-400 mt-0.5">
              <Clock className="w-2.5 h-2.5" />
              <span className="truncate">{event.timelineLabel}</span>
            </div>
          </div>
        </div>

        {/* Category badge */}
        <div className="flex items-center gap-1 mb-1">
          <span
            className="px-1 py-0.5 rounded text-[8px] text-white font-medium"
            style={{ backgroundColor: event.color }}
          >
            {EVENT_CATEGORIES[event.category]}
          </span>
          {event.isDraft && (
            <span className="text-[8px] px-1 py-0.5 bg-gray-100 text-gray-400 rounded">
              Draft
            </span>
          )}
        </div>

        {/* Plotline indicators */}
        {plotlines.length > 0 && (
          <div className="flex items-center gap-0.5">
            {plotlines.slice(0, 3).map((p) => (
              <div
                key={p.id}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: p.color }}
                title={p.name}
              />
            ))}
            {plotlines.length > 3 && (
              <span className="text-[8px] text-gray-400">+{plotlines.length - 3}</span>
            )}
          </div>
        )}

        {/* Tags preview */}
        {event.tags.length > 0 && (
          <div className="flex items-center gap-0.5 mt-1">
            <Tag className="w-2 h-2 text-gray-300" />
            <span className="text-[8px] text-gray-400 truncate">
              {event.tags.slice(0, 2).join(', ')}
            </span>
          </div>
        )}

        {/* Character count */}
        {event.characterIds.length > 0 && (
          <div className="flex items-center gap-0.5 mt-1">
            <Users className="w-2 h-2 text-gray-300" />
            <span className="text-[8px] text-gray-400">
              {event.characterIds.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
