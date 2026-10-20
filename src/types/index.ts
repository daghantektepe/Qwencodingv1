// Central type exports for the application
// This file re-exports all types from individual type modules

// Codex types
export type {
  CharacterRole,
  RelationshipType,
  CharacterAttributes,
  Character,
  Relationship,
  CodexMention,
  CodexState,
  CodexAction,
  CodexStore,
  GraphNode,
  GraphEdge,
  GraphData,
} from './codex';

export {
  CHARACTER_COLORS,
  ROLE_LABELS,
  RELATIONSHIP_LABELS,
  RELATIONSHIP_COLORS,
} from './codex';

// Timeline types
export type {
  EventCategory,
  PlotlineType,
  TimelineViewMode,
  TimeScale,
  TimelineEvent,
  Plotline,
  TimelineMarker,
  TimelineState,
  TimelineAction,
} from './timeline';

export {
  EVENT_CATEGORIES,
  PLOTLINE_TYPES,
  TIME_SCALE_LABELS,
  CATEGORY_COLORS,
  PLOTLINE_COLORS,
} from './timeline';
