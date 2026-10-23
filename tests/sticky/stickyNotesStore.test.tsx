import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  stickyNotesStore,
  useStickyNotesStore
} from '../../src/services/sticky/stickyNotesStore';
import { FloatingStickyNote } from '../../src/components/Sticky/FloatingStickyNote';

describe('Phase 96: Pinboard Scratchpad & Sticky Notes Layer', () => {
  beforeEach(() => {
    stickyNotesStore.resetToDefault();
  });

  describe('StickyNotesStore Core Logic', () => {
    it('should initialize with default welcome note', () => {
      const notes = stickyNotesStore.getSnapshot().notes;
      expect(notes.length).toBeGreaterThanOrEqual(1);
      expect(notes[0].title).toBe('Yazar Karalama Notu');
    });

    it('should create note with custom coordinates and clamp opacity', () => {
      const note = stickyNotesStore.createNote({
        title: 'Önemli Fikir',
        content: 'Dedektif ipucunu aynada buluyor.',
        opacity: 150 // Should clamp to 100
      });

      expect(note.id).toBeDefined();
      expect(note.title).toBe('Önemli Fikir');

      stickyNotesStore.updateNote(note.id, { opacity: 15 }); // Should clamp to 30
      const updated = stickyNotesStore.getSnapshot().notes.find((n) => n.id === note.id)!;
      expect(updated.opacity).toBe(30);
    });

    it('should bring note to front with highest zIndex', () => {
      const n1 = stickyNotesStore.createNote({ title: 'Not 1' });
      const n2 = stickyNotesStore.createNote({ title: 'Not 2' });

      stickyNotesStore.bringToFront(n1.id);
      const updatedN1 = stickyNotesStore.getSnapshot().notes.find((n) => n.id === n1.id)!;
      const updatedN2 = stickyNotesStore.getSnapshot().notes.find((n) => n.id === n2.id)!;

      expect(updatedN1.zIndex).toBeGreaterThan(updatedN2.zIndex);
    });

    it('should toggle global visibility and handle export/import', () => {
      expect(stickyNotesStore.getSnapshot().isVisible).toBe(true);
      stickyNotesStore.toggleVisibility();
      expect(stickyNotesStore.getSnapshot().isVisible).toBe(false);

      const json = stickyNotesStore.exportToJson();
      expect(json).toContain('Yazar Karalama Notu');

      const count = stickyNotesStore.importFromJson(json);
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });

  describe('FloatingStickyNote UI Component', () => {
    it('should render note title and textarea content', () => {
      const note = stickyNotesStore.getSnapshot().notes[0];
      render(<FloatingStickyNote note={note} />);

      expect(screen.getByDisplayValue('Yazar Karalama Notu')).toBeDefined();
      expect(screen.getByPlaceholderText('Düşüncelerinizi buraya not edin...')).toBeDefined();
    });

    it('should trigger onInsertIntoDraft callback when clicking Taslağa Ekle', () => {
      const onInsert = vi.fn();
      const note = stickyNotesStore.getSnapshot().notes[0];

      render(<FloatingStickyNote note={note} onInsertIntoDraft={onInsert} />);

      const insertBtn = screen.getByText('Taslağa Ekle');
      fireEvent.click(insertBtn);

      expect(onInsert).toHaveBeenCalledWith(note.content);
    });

    it('should open settings and allow color changing', () => {
      const note = stickyNotesStore.getSnapshot().notes[0];
      render(<FloatingStickyNote note={note} />);

      const settingsBtn = screen.getByTitle('Görünüm Ayarları');
      fireEvent.click(settingsBtn);

      expect(screen.getByText(/Opaklık: %/i)).toBeDefined();
      expect(screen.getByText('Renk:')).toBeDefined();
    });
  });
});
