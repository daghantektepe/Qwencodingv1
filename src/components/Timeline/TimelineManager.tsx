import React, { useState } from 'react';
import { timelineStore } from '../../services/timelineStore';
import { TimelineView } from './TimelineView';
import { PlotVisualizer } from './PlotVisualizer';
import { TimelineEditor } from './TimelineEditor';
import { TimelineState } from '../../types/timeline';

export const TimelineManager: React.FC = () => {
  const [showEditor, setShowEditor] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TimelineState['events'][number] | null>(null);

  const handleSelectEvent = (id: string) => {
    const event = timelineStore.getState().events.find((e) => e.id === id);
    setSelectedEvent(event || null);
  };

  return (
    <div className="timeline-manager">
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee' }}>
        <h2>Interactive Timeline & Plot Visualizer</h2>
        <button onClick={() => setShowEditor(true)}>+ Add Event</button>
      </header>

      <nav style={{ display: 'flex', gap: '10px', padding: '10px' }}>
        <button onClick={() => timelineStore.dispatch({ type: 'SET_VIEW_MODE', payload: 'timeline' })}>Timeline</button>
        <button onClick={() => timelineStore.dispatch({ type: 'SET_VIEW_MODE', payload: 'plotlines' })}>Plotlines</button>
        <button onClick={() => timelineStore.dispatch({ type: 'SET_VIEW_MODE', payload: 'events' })}>Events List</button>
      </nav>

      <main style={{ padding: '20px' }}>
        {/* Simple conditional rendering based on store state would be better, 
            but for brevity in this single file example, we'll just show one view. 
            In a real app, you'd subscribe to viewMode changes here. */}
        <TimelineView />
      </main>

      {showEditor && (
        <TimelineEditor
          onClose={() => setShowEditor(false)}
          existingEvent={selectedEvent || undefined}
        />
      )}
    </div>
  );
};
