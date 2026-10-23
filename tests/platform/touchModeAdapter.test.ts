import { describe, it, expect, beforeEach } from 'vitest';
import { touchModeAdapter } from '../../src/services/platform/touchModeAdapter';
import nativeMenu from '../../src/electron/nativeMenu.cjs';

describe('Phase 98: Cross-Platform & Touch Mode Suite', () => {
  beforeEach(() => {
    touchModeAdapter.setTouchMode(false);
  });

  describe('nativeMenu.cjs (Electron Native Application Menu)', () => {
    it('should generate cross-platform menu template with File, Edit, View, Help', () => {
      const template = nativeMenu.buildNativeAppMenu();
      expect(Array.isArray(template)).toBe(true);

      const labels = template.map((m: any) => m.label);
      expect(labels).toContain('Dosya');
      expect(labels).toContain('Düzen');
      expect(labels).toContain('Görünüm');
      expect(labels).toContain('Yardım');

      // Check View menu includes Touch Mode HUD
      const viewMenu = template.find((m: any) => m.label === 'Görünüm');
      const touchItem = viewMenu.submenu.find((item: any) => item.label === 'Dokunmatik Mod HUD');
      expect(touchItem).toBeDefined();
      expect(touchItem.accelerator).toBe('F10');
    });

    it('should setup native menu without errors', () => {
      const menu = nativeMenu.setupNativeMenu();
      expect(menu).toBeDefined();
    });
  });

  describe('TouchModeAdapter Service', () => {
    it('should toggle touch mode and update document.body class', () => {
      expect(touchModeAdapter.getSnapshot().touchModeEnabled).toBe(false);
      expect(document.body.classList.contains('touch-mode-active')).toBe(false);

      // Enable touch mode
      touchModeAdapter.setTouchMode(true);
      expect(touchModeAdapter.getSnapshot().touchModeEnabled).toBe(true);
      expect(document.body.classList.contains('touch-mode-active')).toBe(true);

      // Toggle off
      touchModeAdapter.toggleTouchMode();
      expect(touchModeAdapter.getSnapshot().touchModeEnabled).toBe(false);
      expect(document.body.classList.contains('touch-mode-active')).toBe(false);
    });

    it('should provide operating system detection property', () => {
      const state = touchModeAdapter.getSnapshot();
      expect(['windows', 'macos', 'linux', 'unknown']).toContain(state.operatingSystem);
      expect(typeof state.isTouchHardwareDetected).toBe('boolean');
    });
  });
});
