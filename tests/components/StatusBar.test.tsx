import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
// @ts-ignore
import StatusBar from '../../src/components/StatusBar.jsx';

describe('StatusBar with True Save Contract (Faz 3)', () => {
  it('renders word count, character count and reading time', () => {
    render(
      <StatusBar
        content="Bir varmış bir yokmuş. Sisli bir sabah atölyede eski bir masa duruyordu."
        wordsToday={12}
        wordTarget={1000}
      />
    );

    expect(screen.getAllByText('12').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('kelime')).toBeInTheDocument();
    expect(screen.getByText('karakter')).toBeInTheDocument();
  });

  it('renders "Kaydediliyor..." when saveStatus is saving', () => {
    render(
      <StatusBar
        content="Örnek içerik"
        saveStatus="saving"
      />
    );

    expect(screen.getByText('Kaydediliyor...')).toBeInTheDocument();
  });

  it('renders "Değişiklikler var..." when saveStatus is dirty', () => {
    render(
      <StatusBar
        content="Örnek içerik"
        saveStatus="dirty"
      />
    );

    expect(screen.getByText('Değişiklikler var...')).toBeInTheDocument();
  });

  it('renders "Kayıt Hatası" and calls onRetrySave when retry button is clicked in error state', () => {
    const onRetry = vi.fn();
    render(
      <StatusBar
        content="Örnek içerik"
        saveStatus="error"
        onRetrySave={onRetry}
      />
    );

    expect(screen.getByText('Kayıt Hatası')).toBeInTheDocument();
    const retryBtn = screen.getByText('Tekrar Dene');
    expect(retryBtn).toBeInTheDocument();

    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders "az önce kaydedildi" when saveStatus is saved and recent timestamp is given', () => {
    render(
      <StatusBar
        content="Örnek içerik"
        saveStatus="saved"
        lastSavedAt={new Date().toISOString()}
      />
    );

    expect(screen.getByText('az önce kaydedildi')).toBeInTheDocument();
  });
});
