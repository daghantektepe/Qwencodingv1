import React from 'react';
import { vi, describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimelineManager } from '../../src/components/Timeline/TimelineManager';
import { timelineStore } from '../../src/services/timelineStore';

const { mockTimelineStore } = vi.hoisted(() => {
  const store = {
    getState: vi.fn(() => ({
      events: [],
      plotlines: [],
      markers: [],
      viewMode: 'timeline',
      zoomLevel: 5,
      selectedEventId: null,
      searchQuery: '',
      filterCategory: 'all',
      filterPlotlineId: null,
      filterCharacterId: null,
      showDrafts: true,
      timeScale: 'years',
    })),
    subscribe: vi.fn(() => vi.fn()),
    dispatch: vi.fn(),
    getFilteredEvents: vi.fn(() => []),
    getTimelineRange: vi.fn(() => ({ min: 0, max: 100 })),
    getActivePlotlines: vi.fn(() => []),
    getSortedEvents: vi.fn(() => []),
    getEventById: vi.fn(),
    getPlotlineById: vi.fn(),
    getPlotlineEvents: vi.fn(() => []),
  };
  return { mockTimelineStore: store };
});

// Mocking the store subscription for simplicity in unit test context
vi.mock('../../src/services/timelineStore', () => ({
  timelineStore: mockTimelineStore,
  getTimelineStore: () => mockTimelineStore,
  resetTimelineStore: vi.fn(),
}));

describe('TimelineManager Component', () => {
  it('renders the header and add button', () => {
    render(<TimelineManager />);
    expect(screen.getByText('Interactive Timeline & Plot Visualizer')).toBeInTheDocument();
    expect(screen.getByText('+ Add Event')).toBeInTheDocument();
  });

  it('opens editor modal when add button is clicked', () => {
    render(<TimelineManager />);
    const addButton = screen.getByText('+ Add Event');
    fireEvent.click(addButton);
    expect(screen.getByText('Add New Event')).toBeInTheDocument();
  });
});
