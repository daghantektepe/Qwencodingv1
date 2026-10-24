/**
 * Stylus Pen & Multi-Touch Gesture Adapter
 * Phase 118: Stylus Kalem, Dokunmatik & Jestler
 */

export interface StylusPoint {
  x: number;
  y: number;
  pressure: number;
  tiltX?: number;
  tiltY?: number;
  timestamp: number;
}

export interface StylusStroke {
  id: string;
  color: string;
  width: number;
  points: StylusPoint[];
}

export class StylusGestureAdapter {
  static parsePointerEvent(e: React.PointerEvent | PointerEvent): StylusPoint {
    // Pointer Events API: pressure 0.0 - 1.0 aralığındadır.
    // Fare veya basınçsız cihazlarda 0.5 varsayılır.
    let pressure = typeof e.pressure === 'number' && e.pressure > 0 ? e.pressure : 0.5;

    return {
      x: e.clientX,
      y: e.clientY,
      pressure,
      tiltX: e.tiltX,
      tiltY: e.tiltY,
      timestamp: Date.now(),
    };
  }

  static isStylusPen(e: React.PointerEvent | PointerEvent): boolean {
    return e.pointerType === 'pen';
  }

  static isTouchGesture(e: React.PointerEvent | PointerEvent): boolean {
    return e.pointerType === 'touch';
  }

  static calculatePinchDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static pointsToSvgPath(points: StylusPoint[]): string {
    if (points.length === 0) return '';
    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;
    }

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      d += ` L ${p.x} ${p.y}`;
    }
    return d;
  }
}
