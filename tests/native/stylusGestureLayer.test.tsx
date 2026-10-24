import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StylusGestureAdapter } from '../../src/services/native/stylusGestureAdapter';
import { StylusDrawingLayer } from '../../src/components/Canvas/StylusDrawingLayer';

describe('Phase 118: Stylus Pen & Multi-Touch Gestures', () => {
  it('PointerEvent içindeki kalem basıncı ve koordinatları doğru ayrıştırır', () => {
    const fakeEvent = {
      clientX: 150,
      clientY: 280,
      pressure: 0.85,
      tiltX: 12,
      tiltY: -8,
      pointerType: 'pen',
    } as any;

    const pt = StylusGestureAdapter.parsePointerEvent(fakeEvent);
    expect(pt.x).toBe(150);
    expect(pt.y).toBe(280);
    expect(pt.pressure).toBe(0.85);
    expect(pt.tiltX).toBe(12);

    expect(StylusGestureAdapter.isStylusPen(fakeEvent)).toBe(true);
    expect(StylusGestureAdapter.isTouchGesture(fakeEvent)).toBe(false);
  });

  it('Pinch zoom parmak mesafesini doğru hesaplar', () => {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 30, y: 40 };
    const dist = StylusGestureAdapter.calculatePinchDistance(p1, p2);
    expect(dist).toBe(50); // 3-4-5 üçgeni
  });

  it('Stylus noktalarını SVG M/L path formatına dönüştürür', () => {
    const points = [
      { x: 10, y: 20, pressure: 0.5, timestamp: 1 },
      { x: 15, y: 25, pressure: 0.6, timestamp: 2 },
      { x: 20, y: 30, pressure: 0.7, timestamp: 3 },
    ];

    const d = StylusGestureAdapter.pointsToSvgPath(points);
    expect(d).toBe('M 10 20 L 15 25 L 20 30');
  });

  it('StylusDrawingLayer çizim hareketini algılar ve strokeComplete callbackini çağırır', () => {
    const onStrokeComplete = vi.fn();

    render(
      <StylusDrawingLayer
        enabled={true}
        color="#3b82f6"
        baseWidth={4}
        onStrokeComplete={onStrokeComplete}
      />
    );

    const svg = screen.getByTestId('stylus-drawing-svg');

    // Çizime başla
    fireEvent.pointerDown(svg, { clientX: 10, clientY: 20, pointerId: 1, pressure: 0.8 });
    // Hareket ettir
    fireEvent.pointerMove(svg, { clientX: 25, clientY: 35, pointerId: 1, pressure: 0.9 });
    // Çizimi bitir
    fireEvent.pointerUp(svg, { clientX: 25, clientY: 35, pointerId: 1 });

    expect(onStrokeComplete).toHaveBeenCalledTimes(1);
    const stroke = onStrokeComplete.mock.calls[0][0];
    expect(stroke.color).toBe('#3b82f6');
    expect(stroke.points.length).toBeGreaterThanOrEqual(2);

    // Temizle butonunu test et
    const clearBtn = screen.getByTestId('stylus-clear-btn');
    fireEvent.click(clearBtn);
    expect(screen.queryByTestId('stylus-active-stroke')).toBeNull();
  });
});
