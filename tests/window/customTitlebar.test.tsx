/**
 * Tests for Custom Frameless Titlebar & Window Controls
 * Phase 103: Çerçevesiz Özel Başlık Çubuğu ve Pencere Kontrolleri
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomTitlebar } from '../../src/components/Window/CustomTitlebar';

describe('Phase 103: Custom Frameless Titlebar & Drag HUD', () => {
  beforeEach(() => {
    window.electronAPI = {
      invoke: vi.fn(async (channel: string) => {
        if (channel === 'window:get-platform') return { platform: 'win32' };
        if (channel === 'window:is-maximized') return { isMaximized: false };
        if (channel === 'window:toggle-maximize') return { ok: true, isMaximized: true };
        return { ok: true };
      }),
    } as any;
  });

  it('renders titlebar with project name and brand', () => {
    render(<CustomTitlebar projectName="Benim Şaheser Romanım" />);

    expect(screen.getByTestId('custom-titlebar')).toBeInTheDocument();
    expect(screen.getByText('Benim Şaheser Romanım')).toBeInTheDocument();
  });

  it('renders active document badge when provided', () => {
    render(<CustomTitlebar activeDocTitle="Bölüm 3: Keşif" />);

    expect(screen.getByTestId('titlebar-doc-badge')).toBeInTheDocument();
    expect(screen.getByText(/Bölüm 3: Keşif/)).toBeInTheDocument();
  });

  it('displays dirty indicator dot when changes are unsaved', () => {
    const { rerender } = render(<CustomTitlebar isDirty={false} />);
    expect(screen.queryByTestId('titlebar-dirty-dot')).not.toBeInTheDocument();

    rerender(<CustomTitlebar isDirty={true} />);
    expect(screen.getByTestId('titlebar-dirty-dot')).toBeInTheDocument();
  });

  it('handles window minimize click', () => {
    const onMinimizeMock = vi.fn();
    render(<CustomTitlebar onMinimize={onMinimizeMock} />);

    const minBtn = screen.getByTestId('titlebar-btn-minimize');
    fireEvent.click(minBtn);

    expect(onMinimizeMock).toHaveBeenCalledTimes(1);
  });

  it('handles window toggle maximize click and double click on drag region', () => {
    const onMaxMock = vi.fn();
    render(<CustomTitlebar onMaximize={onMaxMock} />);

    const maxBtn = screen.getByTestId('titlebar-btn-maximize');
    fireEvent.click(maxBtn);
    expect(onMaxMock).toHaveBeenCalledTimes(1);

    const dragRegion = screen.getByTestId('titlebar-drag-region');
    fireEvent.doubleClick(dragRegion);
    expect(onMaxMock).toHaveBeenCalledTimes(2);
  });

  it('handles window close click', () => {
    const onCloseMock = vi.fn();
    render(<CustomTitlebar onClose={onCloseMock} />);

    const closeBtn = screen.getByTestId('titlebar-btn-close');
    fireEvent.click(closeBtn);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('adapts to macOS appearance with traffic lights when platform is darwin', () => {
    render(<CustomTitlebar overridePlatform="darwin" />);

    expect(screen.getByTestId('mac-traffic-lights')).toBeInTheDocument();
    expect(screen.queryByTestId('titlebar-controls')).not.toBeInTheDocument();
  });
});
