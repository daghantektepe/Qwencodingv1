export interface CodexEntry {
  id: string;
  name: string;
  description: string;
  traits: string[];
  relationships: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  timestamp: number;
  location?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface MapData {
  id: string;
  name: string;
  description: string;
  imageData: string; // base64
  annotations: MapAnnotation[];
  createdAt: number;
  updatedAt: number;
}

export interface MapAnnotation {
  id: string;
  x: number;
  y: number;
  label: string;
  color: string;
}

export interface ScratchpadEntry {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Snapshot {
  id: string;
  name: string;
  description: string;
  data: Record<string, unknown>;
  createdAt: number;
}

export interface ProjectPackageData {
  codex: CodexEntry[];
  timeline: TimelineEvent[];
  maps: MapData[];
  scratchpad: ScratchpadEntry[];
  snapshots: Snapshot[];
  metadata: {
    lastMigratedAt?: number;
    version: number;
  };
}

export interface MigrationResult {
  success: boolean;
  migratedItems: {
    codex: number;
    timeline: number;
    maps: number;
    scratchpad: number;
    snapshots: number;
  };
  errors: string[];
  backupCreated: boolean;
}
