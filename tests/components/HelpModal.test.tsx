import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HelpModal } from '../../src/components/Help/HelpModal';

describe('HelpModal (Faz 7)', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <HelpModal isOpen={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders user guide modal with tabs when open', () => {
    render(
      <HelpModal isOpen={true} onClose={vi.fn()} />
    );

    expect(screen.getByText('OpenScriv Kullanıcı Rehberi & Destek')).toBeInTheDocument();
    expect(screen.getByText('Hızlı Başlangıç')).toBeInTheDocument();
    expect(screen.getByText('Kısayollar')).toBeInTheDocument();
    expect(screen.getByText('Veri & Güvenlik')).toBeInTheDocument();
    expect(screen.getByText('Hakkında')).toBeInTheDocument();
  });

  it('navigates between tabs to display shortcuts and storage details', () => {
    render(
      <HelpModal isOpen={true} onClose={vi.fn()} />
    );

    // Kısayollar sekmesine geç
    fireEvent.click(screen.getByText('Kısayollar'));
    expect(screen.getByText('Ctrl + S')).toBeInTheDocument();
    expect(screen.getByText('F11 / Ctrl + Shift + F')).toBeInTheDocument();

    // Veri & Güvenlik sekmesine geç
    fireEvent.click(screen.getByText('Veri & Güvenlik'));
    expect(screen.getByText(/%100 Yerel ve Güvenli Veri Saklama/)).toBeInTheDocument();
    expect(screen.getByText(/Atomik Yazma Koruması/)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <HelpModal isOpen={true} onClose={onClose} />
    );

    fireEvent.click(screen.getByText('Anladım, Yazmaya Başla'));
    expect(onClose).toHaveBeenCalled();
  });
});
