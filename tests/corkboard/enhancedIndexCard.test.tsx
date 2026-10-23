import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  EnhancedIndexCard,
  IndexCardData,
} from '../../src/components/Corkboard/EnhancedIndexCard';
import { PinboardGrid } from '../../src/components/Corkboard/PinboardGrid';

describe('EnhancedIndexCard Component (Faz 83)', () => {
  const sampleCard: IndexCardData = {
    id: 'card-1',
    title: 'Giriş Sahnesi',
    synopsis: 'Yağmurlu bir gecede cinayet işlenir.',
    wordCount: 450,
    color: 'yellow',
    pinStyle: 'pushpin-red',
    order: 1,
  };

  it('kart başlığını, özetini ve kelime sayısını doğru render eder', () => {
    render(<EnhancedIndexCard card={sampleCard} />);

    expect(screen.getByDisplayValue('Giriş Sahnesi')).toBeDefined();
    expect(screen.getByDisplayValue('Yağmurlu bir gecede cinayet işlenir.')).toBeDefined();
    expect(screen.getByText('450 kelime')).toBeDefined();
    expect(screen.getByTitle('Kırmızı Raptiye')).toBeDefined();
  });

  it('başlık ve özet değiştiğinde onCardChange callback çağrılır', () => {
    const onCardChange = vi.fn();
    render(<EnhancedIndexCard card={sampleCard} onCardChange={onCardChange} />);

    const titleInput = screen.getByDisplayValue('Giriş Sahnesi');
    fireEvent.change(titleInput, { target: { value: 'Revize Sahne' } });

    expect(onCardChange).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Revize Sahne' })
    );

    const synopsisArea = screen.getByDisplayValue('Yağmurlu bir gecede cinayet işlenir.');
    fireEvent.change(synopsisArea, { target: { value: 'Yeni özet' } });

    expect(onCardChange).toHaveBeenCalledWith(
      expect.objectContaining({ synopsis: 'Yeni özet' })
    );
  });

  it('tıklandığında onSelect callback tetiklenir', () => {
    const onSelect = vi.fn();
    render(<EnhancedIndexCard card={sampleCard} onSelect={onSelect} />);

    const cardEl = screen.getByTestId('index-card-card-1');
    fireEvent.click(cardEl);

    expect(onSelect).toHaveBeenCalledWith(sampleCard);
  });
});

describe('PinboardGrid Component', () => {
  const sampleCards: IndexCardData[] = [
    {
      id: 'c1',
      title: 'Sarı Kart',
      synopsis: 'Sarı özet',
      color: 'yellow',
      pinStyle: 'pushpin-red',
      order: 1,
    },
    {
      id: 'c2',
      title: 'Mavi Kart',
      synopsis: 'Mavi özet',
      color: 'blue',
      pinStyle: 'star',
      order: 2,
    },
    {
      id: 'c3',
      title: 'Pembe Kart',
      synopsis: 'Pembe özet',
      color: 'pink',
      pinStyle: 'warning',
      order: 3,
    },
  ];

  it('tüm kartları listeler', () => {
    render(<PinboardGrid cards={sampleCards} />);

    expect(screen.getByDisplayValue('Sarı Kart')).toBeDefined();
    expect(screen.getByDisplayValue('Mavi Kart')).toBeDefined();
    expect(screen.getByDisplayValue('Pembe Kart')).toBeDefined();
  });

  it('renk filtresi uygulandığında yalnızca eşleşen kartları gösterir', () => {
    render(<PinboardGrid cards={sampleCards} />);

    // Mavi filtre butonuna tıkla
    const blueFilterBtn = screen.getByTitle('Mavi Filtresi');
    fireEvent.click(blueFilterBtn);

    expect(screen.getByDisplayValue('Mavi Kart')).toBeDefined();
    expect(screen.queryByDisplayValue('Sarı Kart')).toBeNull();
    expect(screen.queryByDisplayValue('Pembe Kart')).toBeNull();
  });

  it('pin stili filtresi (Yıldızlılar) uygulandığında yalnızca yıldızlı kartları gösterir', () => {
    render(<PinboardGrid cards={sampleCards} />);

    const starFilterBtn = screen.getByRole('button', { name: /⭐ Yıldızlılar/i });
    fireEvent.click(starFilterBtn);

    expect(screen.getByDisplayValue('Mavi Kart')).toBeDefined();
    expect(screen.queryByDisplayValue('Sarı Kart')).toBeNull();
  });

  it('yeni kart ekle butonuna basıldığında onCardsChange yeni kartla çağrılır', () => {
    const onCardsChange = vi.fn();
    render(<PinboardGrid cards={sampleCards} onCardsChange={onCardsChange} />);

    const addBtn = screen.getByRole('button', { name: /Yeni İndeks Kartı/i });
    fireEvent.click(addBtn);

    expect(onCardsChange).toHaveBeenCalled();
    const updatedCards = onCardsChange.mock.calls[0][0];
    expect(updatedCards.length).toBe(4);
    expect(updatedCards[3].title).toContain('Yeni Kart 4');
  });
});
