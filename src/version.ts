/**
 * version.ts — OpenScriv v2.1 Desktop Edition Release Metadata
 * Phase 120: Desktop Mastery & Multi-Platform Sealed
 */

export const APP_VERSION = '2.1.0';
export const APP_CODENAME = 'Desktop Mastery';
export const RELEASE_DATE = '2026-10-24';
export const TOTAL_PHASES = 120;

export interface AppMetadata {
  name: string;
  version: string;
  phase: number;
  codename: string;
  releaseDate: string;
  totalPhases: number;
  engine: string;
  license: string;
  offlineReady: boolean;
  privacy: string;
}

export const APP_METADATA: AppMetadata = {
  name: 'OpenScriv',
  version: APP_VERSION,
  phase: TOTAL_PHASES,
  codename: APP_CODENAME,
  releaseDate: RELEASE_DATE,
  totalPhases: TOTAL_PHASES,
  engine: 'TipTap ProseMirror + Electron + TypeScript + SQLite FTS5',
  license: 'MIT',
  offlineReady: true,
  privacy: 'Zero-Knowledge Local-First'
};

export const OPEN_SCRIV_VERSION = {
  version: '2.1.0',
  phase: 120,
  codename: 'Desktop Mastery'
};

export default OPEN_SCRIV_VERSION;
