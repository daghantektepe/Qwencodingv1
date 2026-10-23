import { describe, it, expect } from 'vitest';
import { APP_VERSION, APP_CODENAME, TOTAL_PHASES, APP_METADATA } from '../../src/version';

describe('Phase 100: Final Release & Version Seals', () => {
  it('should reflect official v2.0 Masterpiece release constants', () => {
    expect(APP_VERSION).toBe('2.0.0');
    expect(APP_CODENAME).toBe('Masterpiece');
    expect(TOTAL_PHASES).toBe(100);
    expect(APP_METADATA.offlineReady).toBe(true);
    expect(APP_METADATA.privacy).toBe('Zero-Knowledge Local-First');
  });
});
