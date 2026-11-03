import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TopNavigation } from '../../src/components/Navigation/TopNavigation';

describe('TopNavigation (Faz 1)', () => {
  const defaultProps = {
    projectName: 'Gizemli Ada',
    viewMode: 'editor' as const,
    onViewModeChange: vi.fn(),
    binderVisible: true,
    onToggleBinder: vi.fn(),
    inspectorVisible: true,
    onToggleInspector: vi.fn(),
    onOpenWelcomeHub: vi.fn(),
    onOpenCompile: vi.fn(),
    onOpenFocusMode: vi.fn(),
    onOpenPalette: vi.fn(),
    onOpenScratchpad: vi.fn(),
    onOpenToolsDrawer: vi.fn(),
    onOpenThemeCustomizer: vi.fn(),
    onOpenHelp: vi.fn(),
    soundEnabled: false,
    onToggleSound: vi.fn(),
    wordCount: 1450,
    splitMode: 'off' as const,
    onToggleSplit: vi.fn(),
  };

  it('renders project name and primary navigation tabs', () => {
    render(<TopNavigation {...defaultProps} />);

    expect(screen.getByText('Gizemli Ada')).toBeInTheDocument();
    expect(screen.getByText('Editör')).toBeInTheDocument();
    expect(screen.getByText('Mantar Pano')).toBeInTheDocument();
    expect(screen.getByText('Outliner')).toBeInTheDocument();
    expect(screen.getByText('Derle')).toBeInTheDocument();
    expect(screen.getByText('1450 words')).toBeInTheDocument();
  });

  it('calls onViewModeChange when clicking Editör tab', () => {
    const onViewModeChange = vi.fn();
    render(<TopNavigation {...defaultProps} viewMode="corkboard" onViewModeChange={onViewModeChange} />);

    fireEvent.click(screen.getByText('Editör'));
    expect(onViewModeChange).toHaveBeenCalledWith('editor');
  });

  it('opens Evren & Plan dropdown and allows selecting Codex', () => {
    const onViewModeChange = vi.fn();
    render(<TopNavigation {...defaultProps} onViewModeChange={onViewModeChange} />);

    fireEvent.click(screen.getByText('Evren & Plan'));
    expect(screen.getByText('Karakterler & Dünya (Codex)')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Karakterler & Dünya (Codex)'));
    expect(onViewModeChange).toHaveBeenCalledWith('codex');
  });

  it('toggles Binder and Inspector', () => {
    const onToggleBinder = vi.fn();
    const onToggleInspector = vi.fn();

    render(
      <TopNavigation
        {...defaultProps}
        onToggleBinder={onToggleBinder}
        onToggleInspector={onToggleInspector}
      />
    );

    fireEvent.click(screen.getByTitle('Sol Paneli Gizle (Ctrl+Alt+B)'));
    expect(onToggleBinder).toHaveBeenCalled();

    fireEvent.click(screen.getByTitle('Sağ Paneli Gizle'));
    expect(onToggleInspector).toHaveBeenCalled();
  });

  it('triggers compile and welcome hub modals', () => {
    const onOpenCompile = vi.fn();
    const onOpenWelcomeHub = vi.fn();

    render(
      <TopNavigation
        {...defaultProps}
        onOpenCompile={onOpenCompile}
        onOpenWelcomeHub={onOpenWelcomeHub}
      />
    );

    fireEvent.click(screen.getByText('Derle'));
    expect(onOpenCompile).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Gizemli Ada'));
    expect(onOpenWelcomeHub).toHaveBeenCalled();
  });
});
