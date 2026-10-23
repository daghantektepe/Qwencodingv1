import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { mapStore, DEFAULT_MAP } from '../../src/services/map/mapStore';
import { InteractiveMapViewer } from '../../src/components/Map/InteractiveMapViewer';

describe('Phase 92: Interactive World Map & Location Pins', () => {
  beforeEach(() => {
    mapStore.resetToDefault();
  });

  describe('MapStore Core Logic', () => {
    it('should initialize with default Eldoria map and pins', () => {
      const activeMap = mapStore.getActiveMap();
      expect(activeMap).toBeDefined();
      expect(activeMap?.name).toBe('Eldoria Krallık Haritası');
      expect(activeMap?.pins.length).toBeGreaterThanOrEqual(2);
    });

    it('should add pin with clamped percentage coordinates', () => {
      const activeMap = mapStore.getActiveMap()!;
      const pin = mapStore.addPin(activeMap.id, {
        title: 'Ejderha Tepesi',
        description: 'Tehlikeli volkanik bölge',
        xPercent: 120, // Should clamp to 100
        yPercent: -15, // Should clamp to 0
        iconType: 'mountain',
        relatedSceneIds: []
      });

      expect(pin.id).toBeDefined();
      expect(pin.xPercent).toBe(100);
      expect(pin.yPercent).toBe(0);

      const refreshed = mapStore.getActiveMap()!;
      expect(refreshed.pins.some((p) => p.id === pin.id)).toBe(true);
    });

    it('should link and unlink scenes to location pin', () => {
      const activeMap = mapStore.getActiveMap()!;
      const pin = activeMap.pins[0];

      mapStore.linkSceneToPin(activeMap.id, pin.id, 'scene-123');
      const updated = mapStore.getActiveMap()!.pins.find((p) => p.id === pin.id)!;
      expect(updated.relatedSceneIds).toContain('scene-123');

      mapStore.unlinkSceneFromPin(activeMap.id, pin.id, 'scene-123');
      const finalPin = mapStore.getActiveMap()!.pins.find((p) => p.id === pin.id)!;
      expect(finalPin.relatedSceneIds).not.toContain('scene-123');
    });

    it('should export and import maps JSON successfully', () => {
      const json = mapStore.exportToJson();
      expect(json).toContain('Eldoria Krallık Haritası');

      const importedCount = mapStore.importFromJson(json);
      expect(importedCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('InteractiveMapViewer UI Component', () => {
    it('should render map toolbar, map title and zoom controls', () => {
      render(<InteractiveMapViewer />);

      expect(screen.getByText('Dünya & Mekan Haritası')).toBeDefined();
      expect(screen.getByText('%100')).toBeDefined();

      // Zoom in
      const zoomInBtn = screen.getByTitle('Yakınlaş');
      fireEvent.click(zoomInBtn);
      expect(screen.getByText('%120')).toBeDefined();
    });

    it('should display pin details panel when clicking a pin', () => {
      const onSelectScene = vi.fn();
      render(
        <InteractiveMapViewer
          onSelectScene={onSelectScene}
          documentTitleLookup={(id) => `Özel Belge: ${id}`}
        />
      );

      // Pins are rendered as pin icons with hover titles
      expect(screen.getByText('Başkent Valenor')).toBeDefined();

      // Click the pin
      fireEvent.click(screen.getByText('Başkent Valenor'));

      // Floating details card should now be visible
      expect(screen.getByText('Kraliyet sarayı ve büyük kütüphanenin bulunduğu kadim şehir.')).toBeDefined();
      expect(screen.getByText('Özel Belge: doc-1')).toBeDefined();

      // Click "Aç" button
      const openBtn = screen.getByText('Aç');
      fireEvent.click(openBtn);
      expect(onSelectScene).toHaveBeenCalledWith('doc-1');
    });
  });
});
