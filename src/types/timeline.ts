// Timeline Module Type Definitions
// Interactive Timeline & Plot Visualizer system types

export type EventCategory = 'plot' | 'character' | 'world' | 'mystery' | 'custom';

export type PlotlineType = 'main' | 'subplot' | 'character-arc' | 'thematic' | 'custom';

export type TimelineViewMode = 'chronological' | 'narrative' | 'parallel';

export type TimeScale = 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years' | 'eras';

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  // Chronological position (story world time)
  timelinePosition: number; // Numeric position on timeline
  timelineLabel: string; // Human-readable label (e.g., "Year 3, Spring")
  // Narrative position (chapter/scene order)
  narrativeOrder: number;
  chapterId?: string;
  sceneId?: string;
  // Categorization
  category: EventCategory;
  tags: string[];
  // Plotline associations
  plotlineIds: string[];
  // Character involvement
  characterIds: string[];
  // Visual properties
  color: string;
  icon?: string;
  // Status
  isMajorEvent: boolean;
  isDraft: boolean;
  // Links
  binderDocId?: string;
  notes: string;
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface Plotline {
  id: string;
  name: string;
  type: PlotlineType;
  description: string;
  color: string;
  characterIds: string[];
  eventIds: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineMarker {
  id: string;
  label: string;
  position: number;
  type: 'era' | 'chapter' | 'milestone' | 'custom';
  color: string;
}

export interface TimelineState {
  events: TimelineEvent[];
  plotlines: Plotline[];
  markers: TimelineMarker[];
  selectedEventId: string | null;
  selectedPlotlineId: string | null;
  viewMode: TimelineViewMode;
  timeScale: TimeScale;
  zoomLevel: number; // 1-10
  scrollPosition: number;
  filterCategory: EventCategory | 'all';
  filterPlotlineId: string | null;
  filterCharacterId: string | null;
  searchQuery: string;
  showDrafts: boolean;
}

export interface TimelineAction {
  type:
    | 'ADD_EVENT'
    | 'UPDATE_EVENT'
    | 'DELETE_EVENT'
    | 'ADD_PLOTLINE'
    | 'UPDATE_PLOTLINE'
    | 'DELETE_PLOTLINE'
    | 'ADD_MARKER'
    | 'UPDATE_MARKER'
    | 'DELETE_MARKER'
    | 'SELECT_EVENT'
    | 'SELECT_PLOTLINE'
    | 'SET_VIEW_MODE'
    | 'SET_TIME_SCALE'
    | 'SET_ZOOM_LEVEL'
    | 'SET_SCROLL_POSITION'
    | 'SET_FILTER_CATEGORY'
    | 'SET_FILTER_PLOTLINE'
    | 'SET_FILTER_CHARACTER'
    | 'SET_SEARCH_QUERY'
    | 'TOGGLE_DRAFTS'
    | 'LOAD_STATE';
  payload?: unknown;
}

export const EVENT_CATEGORIES: Record<EventCategory, string> = {
  plot: 'Plot Event',
  character: 'Character Moment',
  world: 'World Building',
  mystery: 'Mystery/Reveal',
  custom: 'Custom',
};

export const PLOTLINE_TYPES: Record<PlotlineType, string> = {
  main: 'Main Plot',
  subplot: 'Subplot',
  'character-arc': 'Character Arc',
  thematic: 'Thematic',
  custom: 'Custom',
};

export const TIME_SCALE_LABELS: Record<TimeScale, string> = {
  seconds: 'Seconds',
  minutes: 'Minutes',
  hours: 'Hours',
  days: 'Days',
  weeks: 'Weeks',
  months: 'Months',
  years: 'Years',
  eras: 'Eras',
};

export const CATEGORY_COLORS: Record<EventCategory, string> = {
  plot: '#3B82F6',
  character: '#8B5CF6',
  world: '#10B981',
  mystery: '#F59E0B',
  custom: '#6B7280',
};

export const PLOTLINE_COLORS: string[] = [
  '#3B82F6',
  '#EF4444',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
  '#84CC16',
  '#6366F1',
];
