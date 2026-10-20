import {
  TimelineEvent,
  Plotline,
  TimelineMarker,
  TimelineState,
  TimelineAction,
  EventCategory,
  PlotlineType,
  PLOTLINE_COLORS,
} from '../types/timeline';

const STORAGE_KEY = 'scrivener-timeline-state';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function getRandomColor(colors: string[]): string {
  // Fallback colors in case colors parameter is undefined or empty
  const fallbackColors = [
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
  
  const safeColors = colors && colors.length > 0 ? colors : fallbackColors;
  return safeColors[Math.floor(Math.random() * safeColors.length)];
}

function getCategoryColor(category: EventCategory): string {
  const colors: Record<EventCategory, string> = {
    plot: '#3B82F6',
    character: '#8B5CF6',
    world: '#10B981',
    mystery: '#F59E0B',
    custom: '#6B7280',
  };
  return colors[category] || '#6B7280';
}

const initialState: TimelineState = {
  events: [],
  plotlines: [],
  markers: [],
  selectedEventId: null,
  selectedPlotlineId: null,
  viewMode: 'chronological',
  timeScale: 'years',
  zoomLevel: 5,
  scrollPosition: 0,
  filterCategory: 'all',
  filterPlotlineId: null,
  filterCharacterId: null,
  searchQuery: '',
  showDrafts: true,
};

function loadFromStorage(): TimelineState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...initialState, ...parsed };
    }
  } catch {
    // Ignore storage errors
  }
  return initialState;
}

function saveToStorage(state: TimelineState): void {
  try {
    const toSave = {
      events: state.events,
      plotlines: state.plotlines,
      markers: state.markers,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // Ignore storage errors
  }
}

function timelineReducer(state: TimelineState, action: TimelineAction): TimelineState {
  switch (action.type) {
    case 'ADD_EVENT': {
      const payload = action.payload as Partial<TimelineEvent> & {
        title: string;
        description: string;
        timelinePosition: number;
        timelineLabel: string;
        narrativeOrder: number;
        category: EventCategory;
      };
      const now = new Date().toISOString();
      const newEvent: TimelineEvent = {
        id: payload.id || generateId(),
        title: payload.title,
        description: payload.description,
        timelinePosition: payload.timelinePosition,
        timelineLabel: payload.timelineLabel,
        narrativeOrder: payload.narrativeOrder,
        category: payload.category,
        tags: payload.tags || [],
        plotlineIds: payload.plotlineIds || [],
        characterIds: payload.characterIds || [],
        color: payload.color || getCategoryColor(payload.category),
        isMajorEvent: payload.isMajorEvent || false,
        isDraft: payload.isDraft !== undefined ? payload.isDraft : false,
        binderDocId: payload.binderDocId,
        notes: payload.notes || '',
        createdAt: payload.createdAt || now,
        updatedAt: payload.updatedAt || now,
      };
      
      const updatedPlotlines = state.plotlines.map((p) => {
        if (newEvent.plotlineIds.includes(p.id)) {
          return { ...p, eventIds: p.eventIds.includes(newEvent.id) ? p.eventIds : [...p.eventIds, newEvent.id] };
        }
        return p;
      });

      return {
        ...state,
        events: [...state.events, newEvent],
        plotlines: updatedPlotlines,
        selectedEventId: newEvent.id,
      };
    }

    case 'UPDATE_EVENT': {
      const payload = action.payload as { id: string; updates: Partial<TimelineEvent> };
      return {
        ...state,
        events: state.events.map((e) =>
          e.id === payload.id
            ? { ...e, ...payload.updates, updatedAt: new Date().toISOString() }
            : e
        ),
      };
    }

    case 'DELETE_EVENT': {
      const eventId = action.payload as string;
      const updatedPlotlines = state.plotlines.map((p) => ({
        ...p,
        eventIds: p.eventIds.filter((id) => id !== eventId),
      }));

      return {
        ...state,
        events: state.events.filter((e) => e.id !== eventId),
        plotlines: updatedPlotlines,
        selectedEventId: state.selectedEventId === eventId ? null : state.selectedEventId,
      };
    }

    case 'ADD_PLOTLINE': {
      const payload = action.payload as Partial<Plotline> & {
        name: string;
        type: PlotlineType;
        description: string;
      };
      const now = new Date().toISOString();
      const newPlotline: Plotline = {
        id: payload.id || generateId(),
        name: payload.name,
        type: payload.type,
        description: payload.description,
        color: payload.color || getRandomColor(PLOTLINE_COLORS),
        characterIds: payload.characterIds || [],
        eventIds: payload.eventIds || [],
        isActive: payload.isActive !== undefined ? payload.isActive : true,
        sortOrder: payload.sortOrder !== undefined ? payload.sortOrder : state.plotlines.length,
        createdAt: payload.createdAt || now,
        updatedAt: payload.updatedAt || now,
      };
      return {
        ...state,
        plotlines: [...state.plotlines, newPlotline],
        selectedPlotlineId: newPlotline.id,
      };
    }

    case 'UPDATE_PLOTLINE': {
      const payload = action.payload as { id: string; updates: Partial<Plotline> };
      return {
        ...state,
        plotlines: state.plotlines.map((p) =>
          p.id === payload.id
            ? { ...p, ...payload.updates, updatedAt: new Date().toISOString() }
            : p
        ),
      };
    }

    case 'DELETE_PLOTLINE': {
      const plotlineId = action.payload as string;
      const updatedEvents = state.events.map((e) => ({
        ...e,
        plotlineIds: e.plotlineIds.filter((id) => id !== plotlineId),
      }));
      return {
        ...state,
        plotlines: state.plotlines.filter((p) => p.id !== plotlineId),
        events: updatedEvents,
        selectedPlotlineId: state.selectedPlotlineId === plotlineId ? null : state.selectedPlotlineId,
      };
    }

    case 'ADD_MARKER': {
      const payload = action.payload as Partial<TimelineMarker> & {
        label: string;
        position: number;
        type: 'era' | 'chapter' | 'milestone' | 'custom';
      };
      const newMarker: TimelineMarker = {
        id: payload.id || generateId(),
        label: payload.label,
        position: payload.position,
        type: payload.type,
        color: payload.color || '#6B7280',
      };
      return {
        ...state,
        markers: [...state.markers, newMarker],
      };
    }

    case 'UPDATE_MARKER': {
      const payload = action.payload as { id: string; updates: Partial<TimelineMarker> };
      return {
        ...state,
        markers: state.markers.map((m) =>
          m.id === payload.id ? { ...m, ...payload.updates } : m
        ),
      };
    }

    case 'DELETE_MARKER': {
      const markerId = action.payload as string;
      return {
        ...state,
        markers: state.markers.filter((m) => m.id !== markerId),
      };
    }

    case 'SELECT_EVENT':
      return { ...state, selectedEventId: action.payload as string | null };

    case 'SELECT_PLOTLINE':
      return { ...state, selectedPlotlineId: action.payload as string | null };

    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload as TimelineState['viewMode'] };

    case 'SET_TIME_SCALE':
      return { ...state, timeScale: action.payload as TimelineState['timeScale'] };

    case 'SET_ZOOM_LEVEL':
      return { ...state, zoomLevel: action.payload as number };

    case 'SET_SCROLL_POSITION':
      return { ...state, scrollPosition: action.payload as number };

    case 'SET_FILTER_CATEGORY':
      return { ...state, filterCategory: action.payload as EventCategory | 'all' };

    case 'SET_FILTER_PLOTLINE':
      return { ...state, filterPlotlineId: action.payload as string | null };

    case 'SET_FILTER_CHARACTER':
      return { ...state, filterCharacterId: action.payload as string | null };

    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload as string };

    case 'TOGGLE_DRAFTS':
      return { ...state, showDrafts: !state.showDrafts };

    case 'LOAD_STATE':
      return { ...initialState, ...(action.payload as Partial<TimelineState>) };

    default:
      return state;
  }
}

type Listener = (state: TimelineState) => void;

class TimelineStoreImpl {
  private state: TimelineState;
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.state = loadFromStorage();
  }

  getState(): TimelineState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  dispatch(action: TimelineAction): void {
    this.state = timelineReducer(this.state, action);
    saveToStorage(this.state);
    this.listeners.forEach((listener) => listener(this.state));
  }

  getFilteredEvents(): TimelineEvent[] {
    const { events, filterCategory, filterPlotlineId, filterCharacterId, searchQuery, showDrafts } = this.state;
    
    return events.filter((e) => {
      const matchesCategory = filterCategory === 'all' || e.category === filterCategory;
      const matchesPlotline = !filterPlotlineId || e.plotlineIds.includes(filterPlotlineId);
      const matchesCharacter = !filterCharacterId || e.characterIds.includes(filterCharacterId);
      const matchesSearch =
        searchQuery === '' ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesDraft = showDrafts || !e.isDraft;
      
      return matchesCategory && matchesPlotline && matchesCharacter && matchesSearch && matchesDraft;
    }).sort((a, b) => {
      if (this.state.viewMode === 'narrative') {
        return a.narrativeOrder - b.narrativeOrder;
      }
      return a.timelinePosition - b.timelinePosition;
    });
  }

  getEventById(id: string): TimelineEvent | undefined {
    return this.state.events.find((e) => e.id === id);
  }

  getPlotlineById(id: string): Plotline | undefined {
    return this.state.plotlines.find((p) => p.id === id);
  }

  getPlotlineEvents(plotlineId: string): TimelineEvent[] {
    const plotline = this.getPlotlineById(plotlineId);
    if (!plotline) return [];
    return this.state.events
      .filter((e) => plotline.eventIds.includes(e.id))
      .sort((a, b) => a.timelinePosition - b.timelinePosition);
  }

  getTimelineRange(): { min: number; max: number } {
    if (this.state.events.length === 0) {
      return { min: 0, max: 100 };
    }
    const positions = this.state.events.map((e) => e.timelinePosition);
    const markerPositions = this.state.markers.map((m) => m.position);
    const allPositions = [...positions, ...markerPositions];
    return {
      min: Math.min(...allPositions),
      max: Math.max(...allPositions),
    };
  }

  getActivePlotlines(): Plotline[] {
    return this.state.plotlines
      .filter((p) => p.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }
}

let storeInstance: TimelineStoreImpl | null = null;

export function getTimelineStore(): TimelineStoreImpl {
  if (!storeInstance) {
    storeInstance = new TimelineStoreImpl();
  }
  return storeInstance;
}

export function resetTimelineStore(): void {
  storeInstance = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export const timelineStore = {
  getState: () => getTimelineStore().getState(),
  subscribe: (listener: Listener) => getTimelineStore().subscribe(listener),
  dispatch: (action: TimelineAction) => getTimelineStore().dispatch(action),
  getFilteredEvents: () => getTimelineStore().getFilteredEvents(),
  getEventById: (id: string) => getTimelineStore().getEventById(id),
  getPlotlineById: (id: string) => getTimelineStore().getPlotlineById(id),
  getPlotlineEvents: (plotlineId: string) => getTimelineStore().getPlotlineEvents(plotlineId),
  getTimelineRange: () => getTimelineStore().getTimelineRange(),
  getActivePlotlines: () => getTimelineStore().getActivePlotlines(),
};

export type { TimelineStoreImpl };
