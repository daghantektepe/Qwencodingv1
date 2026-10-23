import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  nightFilterService,
  useNightFilterStore
} from '../../src/services/theme/nightFilterService';
import { NightFilterSettings } from '../../src/components/Theme/NightFilterSettings';

describe('Phase 90: OLED Black, Blue Light Filter & Amber Glow', () => {
  beforeEach(() => {
    nightFilterService.reset();
  });

  describe('NightFilterService Logic', () => {
    it('should set modes and generate appropriate CSS filter strings', () => {
      // Normal mode has no filter
      expect(nightFilterService.getFilterStyleString()).toBe('none');

      // Amber mode
      nightFilterService.setMode('amber');
      nightFilterService.setIntensity(80);
      const amberStyle = nightFilterService.getFilterStyleString();
      expect(amberStyle).toContain('sepia');
      expect(amberStyle).toContain('hue-rotate');

      // OLED mode
      nightFilterService.setMode('oled');
      const oledStyle = nightFilterService.getFilterStyleString();
      expect(oledStyle).toContain('contrast');

      // Paper dim mode
      nightFilterService.setMode('paper_dim');
      const paperStyle = nightFilterService.getFilterStyleString();
      expect(paperStyle).toContain('sepia');
    });

    it('should clamp intensity and contrast values', () => {
      nightFilterService.setIntensity(150);
      expect(nightFilterService.getSnapshot().intensity).toBe(100);

      nightFilterService.setIntensity(-20);
      expect(nightFilterService.getSnapshot().intensity).toBe(0);

      nightFilterService.setContrastBoost(100);
      expect(nightFilterService.getSnapshot().contrastBoost).toBe(50);
    });

    it('should calculate night hours correctly over midnight', () => {
      nightFilterService.setScheduleHours(20, 7); // 20:00 to 07:00

      expect(nightFilterService.isNightTimeNow(22)).toBe(true);
      expect(nightFilterService.isNightTimeNow(3)).toBe(true);
      expect(nightFilterService.isNightTimeNow(14)).toBe(false);
    });

    it('should automatically switch modes when checkSchedule is triggered', () => {
      nightFilterService.setAutoSchedule(true);
      nightFilterService.setScheduleHours(20, 7);
      nightFilterService.setMode('normal');

      // Check during night (23:00)
      const changed = nightFilterService.checkSchedule(23);
      expect(changed).toBe(true);
      expect(nightFilterService.getSnapshot().mode).toBe('amber');

      // Check during day (12:00)
      const dayChanged = nightFilterService.checkSchedule(12);
      expect(dayChanged).toBe(true);
      expect(nightFilterService.getSnapshot().mode).toBe('normal');
    });
  });

  describe('NightFilterSettings UI Component', () => {
    it('should render mode options and allow selecting Amber and OLED', () => {
      render(<NightFilterSettings />);

      expect(screen.getByText('Gece Aydınlatma Laboratuvarı & OLED')).toBeDefined();
      expect(screen.getByText('Kehribar Sarı Işık')).toBeDefined();
      expect(screen.getByText('Saf Siyah OLED')).toBeDefined();

      // Click Amber mode
      fireEvent.click(screen.getByText('Kehribar Sarı Işık'));
      expect(nightFilterService.getSnapshot().mode).toBe('amber');

      // Click OLED mode
      fireEvent.click(screen.getByText('Saf Siyah OLED'));
      expect(nightFilterService.getSnapshot().mode).toBe('oled');
    });

    it('should toggle auto schedule checkbox', () => {
      render(<NightFilterSettings />);

      const autoCheckbox = screen.getByRole('checkbox');
      expect((autoCheckbox as HTMLInputElement).checked).toBe(false);

      fireEvent.click(autoCheckbox);
      expect(nightFilterService.getSnapshot().autoSchedule).toBe(true);
    });
  });
});
