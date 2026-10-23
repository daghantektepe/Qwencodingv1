/**
 * version.ts — OpenScriv v2.0 Masterpiece Release Metadata
 */

export const APP_VERSION = '2.0.0';
export const APP_CODENAME = 'Masterpiece';
export const RELEASE_DATE = '2026-10-24';
export const TOTAL_PHASES = 100;

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
  engine: 'TipTap ProseMirror + Electron + TypeScript',
  license: 'MIT',
  offlineReady: true,
  privacy: 'Zero-Knowledge Local-First'
};

export const OPEN_SCRIV_VERSION = {
  version: '2.0.0',
  phase: 100,
  codename: 'Masterpiece'
};

export default OPEN_SCRIV_VERSION;
