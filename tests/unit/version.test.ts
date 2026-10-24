import { describe, it, expect } from 'vitest';
import { APP_VERSION, APP_CODENAME, TOTAL_PHASES, APP_METADATA } from '../../src/version';

describe('Phase 120: Final Desktop Release & Version Seals', () => {
  it('should reflect official v2.1 Desktop Mastery release constants', () => {
    expect(APP_VERSION).toBe('2.1.0');
    expect(APP_CODENAME).toBe('Desktop Mastery');
    expect(TOTAL_PHASES).toBe(120);
    expect(APP_METADATA.offlineReady).toBe(true);
    expect(APP_METADATA.privacy).toBe('Zero-Knowledge Local-First');
  });
});
