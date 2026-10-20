import React from 'react';
import { TimelineEvent, Plotline } from '../../types/timeline';

interface EventCardProps {
  event: TimelineEvent;
  plotlines: Plotline[];
  mode: 'compact' | 'full';
  onClick: (id: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, plotlines, mode, onClick }) => {
  const relatedPlotlines = plotlines.filter((p) => event.plotlineIds.includes(p.id));

  return (
    <div
      className={`event-card ${mode}`}
      onClick={() => onClick(event.id)}
      style={{ cursor: 'pointer', border: '1px solid #ccc', padding: '8px', margin: '4px 0' }}
    >
      <h4>{event.title}</h4>
      {mode === 'full' && event.description && <p>{event.description}</p>}
      <div className="meta">
        {event.date && <span>Date: {event.date}</span>}
        {event.time && <span>Time: {event.time}</span>}
        {event.tags.map((tag) => (
          <span key={tag} style={{ marginLeft: '5px', fontSize: '0.8em' }}>#{tag}</span>
        ))}
      </div>
      <div className="plotlines" style={{ marginTop: '5px' }}>
        {relatedPlotlines.map((pl) => (
          <span
            key={pl.id}
            style={{ backgroundColor: pl.color, color: 'white', padding: '2px 6px', borderRadius: '4px', marginRight: '4px', fontSize: '0.8em' }}
          >
            {pl.name}
          </span>
        ))}
      </div>
    </div>
  );
};

export default EventCard;
