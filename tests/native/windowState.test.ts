/**
 * Tests for WindowState Keeper & Multi-Monitor Resilience
 * Phase 104: Pencere Konumu, Boyutu ve Çoklu Monitör Durum Hafızası
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WindowStateService } from '../../src/services/native/windowStateService';

// Import pure utility function logic from windowState.cjs
const { isInsideDisplays } = require('../../electron/windowState.cjs');

describe('Phase 104: WindowState Keeper & Multi-Monitor Resilience', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockDisplays = [
    { bounds: { x: 0, y: 0, width: 1920, height: 1080 } }, // Primary screen
    { bounds: { x: 1920, y: 0, width: 2560, height: 1440 } }, // Secondary 2K monitor
  ];

  it('detects when saved window bounds fall safely within primary screen', () => {
    const insidePrimary = isInsideDisplays({ x: 200, y: 150, width: 1280, height: 800 }, mockDisplays);
    expect(insidePrimary).toBe(true);
  });

  it('detects when saved window bounds fall inside secondary monitor', () => {
    const insideSecondary = isInsideDisplays({ x: 2100, y: 100, width: 1400, height: 900 }, mockDisplays);
    expect(insideSecondary).toBe(true);
  });

  it('detects off-screen windows when external monitor was disconnected', () => {
    const singleDisplay = [mockDisplays[0]]; // Secondary unplugged
    const offScreenBounds = { x: 2100, y: 100, width: 1280, height: 800 };

    const isValid = isInsideDisplays(offScreenBounds, singleDisplay);
    expect(isValid).toBe(false);
  });

  it('handles invalid or undefined bounds safely', () => {
    expect(isInsideDisplays(null, mockDisplays)).toBe(false);
    expect(isInsideDisplays(undefined, mockDisplays)).toBe(false);
    expect(isInsideDisplays({ x: 'invalid', y: 0 } as any, mockDisplays)).toBe(false);
  });

  it('gets default window state when no state is saved', async () => {
    const state = await WindowStateService.getWindowState();

    expect(state).toBeDefined();
    expect(state.width).toBe(1280);
    expect(state.height).toBe(820);
    expect(state.isMaximized).toBe(false);
  });

  it('resets window state to center with default bounds', async () => {
    const reset = await WindowStateService.resetToCenter();

    expect(reset.width).toBe(1280);
    expect(reset.height).toBe(820);
    expect(reset.x).toBe(100);
    expect(reset.y).toBe(100);
  });

  it('saves and reloads custom window state accurately', async () => {
    WindowStateService.saveState({
      x: 350,
      y: 200,
      width: 1440,
      height: 900,
      isMaximized: true,
    });

    const loaded = await WindowStateService.getWindowState();
    expect(loaded.x).toBe(350);
    expect(loaded.y).toBe(200);
    expect(loaded.width).toBe(1440);
    expect(loaded.height).toBe(900);
    expect(loaded.isMaximized).toBe(true);
  });
});
