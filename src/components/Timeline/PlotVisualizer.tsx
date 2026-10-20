import React, { useState, useEffect } from 'react';
import { timelineStore } from '../../services/timelineStore';
import { Plotline, TimelineEvent } from '../../types/timeline';

export const PlotVisualizer: React.FC = () => {
  const [plotlines, setPlotlines] = useState<Plotline[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsubscribe = timelineStore.subscribe(() => {
      const state = timelineStore.getState();
      setPlotlines(state.plotlines);
      setEvents(state.events);
    });
    return unsubscribe;
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="plot-visualizer">
      {plotlines.map((plotline) => {
        const plotEvents = events.filter((e) => e.plotlineIds.includes(plotline.id));
        const isExpanded = expanded[plotline.id] ?? true;

        return (
          <div key={plotline.id} className="plotline-lane" style={{ marginBottom: '20px' }}>
            <div
              className="lane-header"
              style={{ backgroundColor: plotline.color, color: 'white', padding: '5px', cursor: 'pointer' }}
              onClick={() => toggleExpand(plotline.id)}
            >
              {isExpanded ? '▼' : '▶'} {plotline.name} ({plotEvents.length} events)
            </div>
            {isExpanded && (
              <div className="lane-content" style={{ display: 'flex', gap: '10px', padding: '10px', flexWrap: 'wrap' }}>
                {plotEvents.map((event) => (
                  <div
                    key={event.id}
                    className="event-dot"
                    title={event.title}
                    style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#333' }}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
