import React, { useState, useRef } from 'react';
import { StylusGestureAdapter, StylusStroke, StylusPoint } from '../../services/native/stylusGestureAdapter';

interface StylusDrawingLayerProps {
  enabled?: boolean;
  color?: string;
  baseWidth?: number;
  onStrokeComplete?: (stroke: StylusStroke) => void;
}

export const StylusDrawingLayer: React.FC<StylusDrawingLayerProps> = ({
  enabled = true,
  color = '#ef4444',
  baseWidth = 3,
  onStrokeComplete,
}) => {
  const [strokes, setStrokes] = useState<StylusStroke[]>([]);
  const [currentPoints, setCurrentPoints] = useState<StylusPoint[]>([]);
  const isDrawing = useRef(false);

  if (!enabled) return null;

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    isDrawing.current = true;
    const pt = StylusGestureAdapter.parsePointerEvent(e);
    setCurrentPoints([pt]);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawing.current) return;
    const pt = StylusGestureAdapter.parsePointerEvent(e);
    setCurrentPoints((prev) => [...prev, pt]);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    if (currentPoints.length > 0) {
      const newStroke: StylusStroke = {
        id: `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        color,
        width: baseWidth,
        points: currentPoints,
      };

      setStrokes((prev) => [...prev, newStroke]);
      onStrokeComplete?.(newStroke);
    }
    setCurrentPoints([]);
  };

  const handleClear = () => {
    setStrokes([]);
    setCurrentPoints([]);
  };

  return (
    <div
      data-testid="stylus-layer-container"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        pointerEvents: enabled ? 'auto' : 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 60,
          display: 'flex',
          gap: 6,
        }}
      >
        <button
          data-testid="stylus-clear-btn"
          onClick={handleClear}
          style={{
            padding: '4px 10px',
            backgroundColor: 'rgba(40, 35, 30, 0.85)',
            color: '#f5f2ea',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          🧹 Çizimleri Temizle
        </button>
      </div>

      <svg
        data-testid="stylus-drawing-svg"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          width: '100%',
          height: '100%',
          touchAction: 'none',
          cursor: 'crosshair',
        }}
      >
        {strokes.map((stroke) => (
          <path
            key={stroke.id}
            d={StylusGestureAdapter.pointsToSvgPath(stroke.points)}
            stroke={stroke.color}
            strokeWidth={stroke.width}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {currentPoints.length > 0 && (
          <path
            data-testid="stylus-active-stroke"
            d={StylusGestureAdapter.pointsToSvgPath(currentPoints)}
            stroke={color}
            strokeWidth={baseWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </div>
  );
};
