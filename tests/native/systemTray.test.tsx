/**
 * Tests for System Tray & Global Quick Note Shortcut
 * Phase 106: Sistem Tepsisi (System Tray) ve Global Hızlı Not Alma Kısayolu
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuickNotePopup } from '../../src/components/Tray/QuickNotePopup';
import { WindowBridge } from '../../src/services/native/windowBridge';

describe('Phase 106: System Tray & Quick Note Engine', () => {
  beforeEach(() => {
    window.electronAPI = {
      invoke: vi.fn(async (channel: string) => {
        if (channel === 'tray:hide-quick-note') return { ok: true };
        return { ok: true };
      }),
    } as any;
  });

  it('renders quick note popup with title, categories, and textarea', () => {
    render(<QuickNotePopup />);

    expect(screen.getByTestId('quick-note-popup')).toBeInTheDocument();
    expect(screen.getByText(/Hızlı Not/)).toBeInTheDocument();
    expect(screen.getByTestId('quick-note-textarea')).toBeInTheDocument();
    expect(screen.getByTestId('quick-note-cat-Fikir')).toBeInTheDocument();
    expect(screen.getByTestId('quick-note-cat-Diyalog')).toBeInTheDocument();
  });

  it('updates word count and character count dynamically as user types', () => {
    render(<QuickNotePopup />);

    const textarea = screen.getByTestId('quick-note-textarea');
    fireEvent.change(textarea, { target: { value: 'Karanlık sokakta bir gölge belirdi.' } });

    expect(screen.getByTestId('quick-note-wordcount')).toHaveTextContent('5 kelime');
    expect(screen.getByTestId('quick-note-wordcount')).toHaveTextContent('35 karakter');
  });

  it('changes active category when clicked', () => {
    render(<QuickNotePopup />);

    const diyalogBtn = screen.getByTestId('quick-note-cat-Diyalog');
    fireEvent.click(diyalogBtn);

    expect(diyalogBtn).toHaveStyle({ backgroundColor: 'rgb(122, 92, 62)' });
  });

  it('saves note and broadcasts event via WindowBridge when save button clicked', () => {
    const onSaveMock = vi.fn();
    const onCloseMock = vi.fn();
    const broadcastSpy = vi.spyOn(WindowBridge, 'broadcast');

    render(<QuickNotePopup onSave={onSaveMock} onClose={onCloseMock} />);

    const textarea = screen.getByTestId('quick-note-textarea');
    fireEvent.change(textarea, { target: { value: 'Ana karakter anahtarı kaybetti.' } });

    const saveBtn = screen.getByTestId('quick-note-save-btn');
    fireEvent.click(saveBtn);

    expect(onSaveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Ana karakter anahtarı kaybetti.',
        category: 'Fikir',
      })
    );
    expect(broadcastSpy).toHaveBeenCalledWith('quick-note:created', expect.any(Object));
    expect(onCloseMock).toHaveBeenCalledTimes(1);

    broadcastSpy.mockRestore();
  });

  it('triggers cancel on Escape key or cancel button', () => {
    const onCloseMock = vi.fn();
    render(<QuickNotePopup onClose={onCloseMock} />);

    const cancelBtn = screen.getByTestId('quick-note-cancel-btn');
    fireEvent.click(cancelBtn);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
