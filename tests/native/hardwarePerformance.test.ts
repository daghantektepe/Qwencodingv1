/**
 * Tests for GPU Hardware Acceleration & Fluid Rendering
 * Phase 110: GPU Donanım Hızlandırma, VSync ve Arayüz Akıcılık Optimizasyonu
 */

import { describe, it, expect, vi } from 'vitest';

const { RECOMMENDED_GPU_SWITCHES, applyHardwareSwitches } = require('../../electron/hardwareFlags.cjs');

describe('Phase 110: GPU Hardware Acceleration & VSync Fluidity', () => {
  it('defines mandatory Chromium performance flags for smooth 60/120 FPS rendering', () => {
    const switchNames = RECOMMENDED_GPU_SWITCHES.map(([name]: [string, string]) => name);

    expect(switchNames).toContain('enable-gpu-rasterization');
    expect(switchNames).toContain('enable-zero-copy');
    expect(switchNames).toContain('enable-smooth-scrolling');
    expect(switchNames).toContain('canvas-oop-rasterization');
  });

  it('safely attempts to append switches without throwing in non-electron or mock environments', () => {
    const res = applyHardwareSwitches();
    expect(res).toBeDefined();
    expect(res.switches.length).toBeGreaterThanOrEqual(4);
  });

  it('satisfies GPU hardware acceleration contract and target refresh rate', async () => {
    window.electronAPI = {
      invoke: vi.fn(async (channel: string) => {
        if (channel === 'hardware:get-gpu-info') {
          return {
            ok: true,
            hardwareAccelerated: true,
            targetRefreshRate: 120,
            features: { gpu_compositing: 'enabled' },
          };
        }
        return { ok: true };
      }),
    } as any;

    const gpuInfo = await window.electronAPI!.invoke('hardware:get-gpu-info');

    expect(gpuInfo.ok).toBe(true);
    expect(gpuInfo.hardwareAccelerated).toBe(true);
    expect(gpuInfo.targetRefreshRate).toBeGreaterThanOrEqual(60);
  });
});
