/**
 * Component tests for TimelineView
 * 
 * Run: npx vitest run tests/components/TimelineView.test.tsx
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimelineView from '../../src/components/Timeline/TimelineView';
import * as timelineStoreModule from '../../src/services/timelineStore';
import { mockEvents, mockPlotlines, mockMarkers } from '../../src/mocks/timelineMocks';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Mock confirm dialog
globalThis.confirm = vi.fn(() => true);

describe('TimelineView Component', () => {
  beforeEach(() => {
    if (typeof timelineStoreModule.resetTimelineStore === 'function') {
      timelineStoreModule.resetTimelineStore();
    }
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the timeline header', () => {
      render(<TimelineView />);
      expect(screen.getByText('Timeline')).toBeInTheDocument();
    });

    it('should render view mode buttons', () => {
      render(<TimelineView />);
      expect(screen.getByTitle('Chronological view')).toBeInTheDocument();
      expect(screen.getByTitle('Narrative view')).toBeInTheDocument();
      expect(screen.getByTitle('Parallel plotlines view')).toBeInTheDocument();
    });

    it('should render search input', () => {
      render(<TimelineView />);
      expect(screen.getByPlaceholderText('Search events...')).toBeInTheDocument();
    });

    it('should render category filter', () => {
      render(<TimelineView />);
      expect(screen.getByDisplayValue('All Categories')).toBeInTheDocument();
    });

    it('should render zoom controls', () => {
      render(<TimelineView />);
      expect(screen.getByTitle('Zoom in')).toBeInTheDocument();
      expect(screen.getByTitle('Zoom out')).toBeInTheDocument();
    });

    it('should show empty state when no events', () => {
      render(<TimelineView />);
      expect(screen.getByText(/No events yet/)).toBeInTheDocument();
    });
  });

  describe('Event Display', () => {
    beforeEach(() => {
      const store = timelineStoreModule.getTimelineStore();
      mockEvents.forEach((event) => {
        store.dispatch({ type: 'ADD_EVENT', payload: event });
      });
    });

    it('should display events on timeline', () => {
      render(<TimelineView />);
      expect(screen.getByText('The Beginning')).toBeInTheDocument();
      expect(screen.getByText('Rising Action')).toBeInTheDocument();
      expect(screen.getByText('Climax')).toBeInTheDocument();
    });

    it('should select event when clicked', async () => {
      render(<TimelineView />);
      
      const eventCards = screen.getAllByTestId('timeline-event-card');
      fireEvent.click(eventCards[0]);
      
      const store = timelineStoreModule.getTimelineStore();
      expect(store.getState().selectedEventId).toBeTruthy();
    });

    it('should filter events by search', async () => {
      const user = userEvent.setup();
      render(<TimelineView />);
      
      const searchInput = screen.getByPlaceholderText('Search events...');
      await user.type(searchInput, 'Beginning');
      
      await waitFor(() => {
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
        expect(screen.queryByText('Rising Action')).not.toBeInTheDocument();
      });
    });

    it('should filter events by category', async () => {
      render(<TimelineView />);
      
      const categorySelect = screen.getByDisplayValue('All Categories');
      fireEvent.change(categorySelect, { target: { value: 'character' } });
      
      await waitFor(() => {
        expect(screen.getByText('Draft Event')).toBeInTheDocument();
        expect(screen.queryByText('The Beginning')).not.toBeInTheDocument();
      });
    });
  });

  describe('View Mode Switching', () => {
    beforeEach(() => {
      const store = timelineStoreModule.getTimelineStore();
      store.dispatch({ type: 'ADD_EVENT', payload: mockEvents[0] });
    });

    it('should switch to narrative view', () => {
      render(<TimelineView />);
      
      fireEvent.click(screen.getByTitle('Narrative view'));
      
      const store = timelineStoreModule.getTimelineStore();
      expect(store.getState().viewMode).toBe('narrative');
    });

    it('should switch to parallel view', () => {
      render(<TimelineView />);
      
      fireEvent.click(screen.getByTitle('Parallel plotlines view'));
      
      const store = timelineStoreModule.getTimelineStore();
      expect(store.getState().viewMode).toBe('parallel');
    });
  });

  describe('Zoom Controls', () => {
    it('should increase zoom level', () => {
      render(<TimelineView />);
      
      const initialZoom = screen.getByText('5x');
      expect(initialZoom).toBeInTheDocument();
      
      fireEvent.click(screen.getByTitle('Zoom in'));
      
      expect(screen.getByText('6x')).toBeInTheDocument();
    });

    it('should decrease zoom level', () => {
      render(<TimelineView />);
      
      fireEvent.click(screen.getByTitle('Zoom out'));
      
      expect(screen.getByText('4x')).toBeInTheDocument();
    });

    it('should not exceed max zoom', () => {
      const store = timelineStoreModule.getTimelineStore();
      store.dispatch({ type: 'SET_ZOOM_LEVEL', payload: 10 });
      
      render(<TimelineView />);
      
      fireEvent.click(screen.getByTitle('Zoom in'));
      
      expect(screen.getByText('10x')).toBeInTheDocument();
    });

    it('should not go below min zoom', () => {
      const store = timelineStoreModule.getTimelineStore();
      store.dispatch({ type: 'SET_ZOOM_LEVEL', payload: 1 });
      
      render(<TimelineView />);
      
      fireEvent.click(screen.getByTitle('Zoom out'));
      
      expect(screen.getByText('1x')).toBeInTheDocument();
    });
  });

  describe('Draft Events', () => {
    beforeEach(() => {
      const store = timelineStoreModule.getTimelineStore();
      mockEvents.forEach((event) => {
        store.dispatch({ type: 'ADD_EVENT', payload: event });
      });
    });

    it('should show drafts by default', () => {
      render(<TimelineView />);
      
      expect(screen.getByText('The Beginning')).toBeInTheDocument();
      expect(screen.getByText('Draft Event')).toBeInTheDocument();
    });

    it('should hide drafts when toggle is clicked', async () => {
      render(<TimelineView />);
      
      const draftsButton = screen.getByTitle('Hide drafts');
      fireEvent.click(draftsButton);
      
      await waitFor(() => {
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
        expect(screen.queryByText('Draft Event')).not.toBeInTheDocument();
      });
    });
  });

  describe('Markers', () => {
    beforeEach(() => {
      const store = timelineStoreModule.getTimelineStore();
      mockMarkers.forEach((marker) => {
        store.dispatch({ type: 'ADD_MARKER', payload: marker });
      });
    });

    it('should display markers on timeline', () => {
      render(<TimelineView />);
      
      expect(screen.getByText('Act 1')).toBeInTheDocument();
      expect(screen.getByText('Midpoint')).toBeInTheDocument();
      expect(screen.getByText('Act 2')).toBeInTheDocument();
    });
  });

  describe('Plotline Filter', () => {
    beforeEach(() => {
      const store = timelineStoreModule.getTimelineStore();
      mockPlotlines.forEach((plotline) => {
        store.dispatch({ type: 'ADD_PLOTLINE', payload: plotline });
      });
      mockEvents.forEach((event) => {
        store.dispatch({ type: 'ADD_EVENT', payload: event });
      });
    });

    it('should filter events by plotline', async () => {
      render(<TimelineView />);
      
      const plotlineSelect = screen.getByDisplayValue('All Plotlines');
      const options = screen.getAllByRole('option');
      const subplotOption = options.find(opt => opt.textContent === 'Character Development');
      
      if (subplotOption) {
        fireEvent.change(plotlineSelect, { target: { value: subplotOption.getAttribute('value') } });
        
        await waitFor(() => {
          expect(screen.getByText('Draft Event')).toBeInTheDocument();
          expect(screen.queryByText('The Beginning')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Callbacks', () => {
    it('should call onEditEvent when edit is triggered', async () => {
      const onEditEvent = vi.fn();
      const store = timelineStoreModule.getTimelineStore();
      
      store.dispatch({ type: 'ADD_EVENT', payload: mockEvents[0] });
      
      render(<TimelineView onEditEvent={onEditEvent} />);
      
      const eventCards = screen.getAllByTestId('timeline-event-card');
      fireEvent.click(eventCards[0]);
      
      expect(onEditEvent).toBeDefined();
    });

    it('should call onDeleteEvent when delete is triggered', async () => {
      const onDeleteEvent = vi.fn();
      const store = timelineStoreModule.getTimelineStore();
      
      store.dispatch({ type: 'ADD_EVENT', payload: mockEvents[0] });
      
      render(<TimelineView onDeleteEvent={onDeleteEvent} />);
      
      expect(onDeleteEvent).toBeDefined();
    });
  });
});
