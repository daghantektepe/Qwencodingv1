/**
 * version.ts — OpenScriv v1.0.0 Release Candidate 1
 */

export interface VersionInfo {
  version: string;
  codename: string;
  releaseDate: string;
  phase: number;
  buildNumber: number;
  features: string[];
}

export const OPEN_SCRIV_VERSION: VersionInfo = {
  version: '1.0.0-rc1',
  codename: 'Golden Sovereign Milestone',
  releaseDate: '2026-10-22',
  phase: 50,
  buildNumber: 1050,
  features: [
    'Distraction-free typewriter editor',
    'Interactive Corkboard & Outliner',
    'Full Compile & Multi-Format Export Engine',
    'Local-first CRDT synchronization',
    'Codex character & location worldbuilding',
    'Timeline plotting & multiple story arcs',
    'In-depth writing analytics & readability metrics',
    'Research vault & multi-asset binder',
    'Fountain screenplay & scriptwriting mode',
    'Smart collections & saved dynamic searches',
    'Visual document snapshot diff & rollback',
    'Marginalia comments & footnote system',
    'Project template engine & novel/academic wizards',
    'Virtual binder tree & DOM virtualization',
    'WCAG 2.1 AAA full accessibility & screen reader announcer',
    'AES-256-GCM zero-knowledge encrypted vault',
    'Plugin API host & custom themes SDK',
  ],
};

export default OPEN_SCRIV_VERSION;
