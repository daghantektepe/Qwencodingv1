import { TimelineEvent, Plotline, TimelineMarker } from '../types/timeline';

/**
 * Mock data for Timeline module tests
 * Provides sample events, plotlines, and markers for testing
 */

export const mockEvents: TimelineEvent[] = [
  {
    id: 'event-1',
    title: 'The Beginning',
    description: 'Story starts here',
    timelinePosition: 0,
    timelineLabel: 'Chapter 1',
    narrativeOrder: 1,
    category: 'plot',
    tags: ['introduction', 'setup'],
    plotlineIds: ['plotline-1'],
    characterIds: ['char-1'],
    color: '#3B82F6',
    isMajorEvent: true,
    isDraft: false,
    notes: 'Opening scene',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'event-2',
    title: 'Rising Action',
    description: 'Conflict begins',
    timelinePosition: 10,
    timelineLabel: 'Chapter 2',
    narrativeOrder: 2,
    category: 'plot',
    tags: ['conflict', 'tension'],
    plotlineIds: ['plotline-1', 'plotline-2'],
    characterIds: ['char-1', 'char-2'],
    color: '#EF4444',
    isMajorEvent: false,
    isDraft: false,
    notes: '',
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
  {
    id: 'event-3',
    title: 'Climax',
    description: 'Peak of the story',
    timelinePosition: 20,
    timelineLabel: 'Chapter 3',
    narrativeOrder: 3,
    category: 'plot',
    tags: ['climax', 'turning point'],
    plotlineIds: ['plotline-1'],
    characterIds: ['char-1', 'char-2', 'char-3'],
    color: '#10B981',
    isMajorEvent: true,
    isDraft: false,
    notes: 'Major turning point',
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z',
  },
  {
    id: 'event-4',
    title: 'Resolution',
    description: 'Story concludes',
    timelinePosition: 30,
    timelineLabel: 'Chapter 4',
    narrativeOrder: 4,
    category: 'plot',
    tags: ['resolution', 'ending'],
    plotlineIds: ['plotline-1'],
    characterIds: ['char-1'],
    color: '#F59E0B',
    isMajorEvent: false,
    isDraft: false,
    notes: '',
    createdAt: '2024-01-04T00:00:00.000Z',
    updatedAt: '2024-01-04T00:00:00.000Z',
  },
  {
    id: 'event-5',
    title: 'Draft Event',
    description: 'This is a draft',
    timelinePosition: 15,
    timelineLabel: 'Chapter 2.5',
    narrativeOrder: 5,
    category: 'character',
    tags: ['draft'],
    plotlineIds: ['plotline-2'],
    characterIds: ['char-2'],
    color: '#8B5CF6',
    isMajorEvent: false,
    isDraft: true,
    notes: 'Work in progress',
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2024-01-05T00:00:00.000Z',
  },
];

export const mockPlotlines: Plotline[] = [
  {
    id: 'plotline-1',
    name: 'Main Story Arc',
    type: 'main',
    description: 'The primary narrative thread',
    color: '#3B82F6',
    characterIds: ['char-1', 'char-2', 'char-3'],
    eventIds: ['event-1', 'event-2', 'event-3', 'event-4'],
    isActive: true,
    sortOrder: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'plotline-2',
    name: 'Character Development',
    type: 'character-arc',
    description: 'Character growth subplot',
    color: '#EF4444',
    characterIds: ['char-2'],
    eventIds: ['event-2', 'event-5'],
    isActive: true,
    sortOrder: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'plotline-3',
    name: 'Inactive Plotline',
    type: 'subplot',
    description: 'This plotline is inactive',
    color: '#6B7280',
    characterIds: [],
    eventIds: [],
    isActive: false,
    sortOrder: 2,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

export const mockMarkers: TimelineMarker[] = [
  {
    id: 'marker-1',
    label: 'Act 1',
    position: 0,
    type: 'era',
    color: '#3B82F6',
  },
  {
    id: 'marker-2',
    label: 'Midpoint',
    position: 15,
    type: 'milestone',
    color: '#F59E0B',
  },
  {
    id: 'marker-3',
    label: 'Act 2',
    position: 30,
    type: 'era',
    color: '#10B981',
  },
];

/**
 * Helper function to create a minimal valid event
 */
export function createMockEvent(overrides: Partial<TimelineEvent> = {}): TimelineEvent {
  const now = new Date().toISOString();
  return {
    id: `event-${Date.now()}-${Math.random()}`,
    title: 'Mock Event',
    description: 'Mock description',
    timelinePosition: 0,
    timelineLabel: 'Mock Label',
    narrativeOrder: 1,
    category: 'plot',
    tags: [],
    plotlineIds: [],
    characterIds: [],
    color: '#3B82F6',
    isMajorEvent: false,
    isDraft: false,
    notes: '',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Helper function to create a minimal valid plotline
 */
export function createMockPlotline(overrides: Partial<Plotline> = {}): Plotline {
  const now = new Date().toISOString();
  return {
    id: `plotline-${Date.now()}-${Math.random()}`,
    name: 'Mock Plotline',
    type: 'subplot',
    description: 'Mock description',
    color: '#3B82F6',
    characterIds: [],
    eventIds: [],
    isActive: true,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Helper function to create a minimal valid marker
 */
export function createMockMarker(overrides: Partial<TimelineMarker> = {}): TimelineMarker {
  return {
    id: `marker-${Date.now()}-${Math.random()}`,
    label: 'Mock Marker',
    position: 0,
    type: 'custom',
    color: '#6B7280',
    ...overrides,
  };
}
