import React, { useState, useRef, useCallback, useEffect } from 'react';
import './SplitView.css';

/**
 * SplitView — Faz 23: Bölünmüş ekran (Dikey yan yana / Yatay alt alta).
 *
 * Scrivener'ın imza özelliği: bir tarafta taslak yazarken diğer tarafta
 * araştırma notu / karakter kartı / mantar pano eşzamanlı görüntülenir.
 *
 * Özellikler:
 *  - Pürüzsüz sürükleme tutamacı (splitter handle) ile yeniden boyutlandırma.
 *  - Oran localStorage'da kalıcı; pointer capture ile akıcı drag.
 *  - Klavye: ok tuşları ±%1 (handle odaklandığında), Enter yön değiştirir.
 *  - ARIA separator + resizer; prefers-reduced-motion desteği.
 *
 * props:
 *   orientation?: 'vertical' | 'horizontal' — başlangıç yönü (kontrolsüz iç state)
 *   onOrientationChange?: (o) => void
 *   minRatio?: number (0..1), maxRatio?: number — sol/üst panel oran sınırları
 *   initialRatio?: number — varsayılan %50
 *   storageKey?: string — oranı kalıcı yapmak için localStorage anahtarı
 *   primary: ReactNode — birinci panel içeriği
 *   secondary: ReactNode — ikinci panel içeriği
 *   primaryLabel?: string, secondaryLabel?: string — erişilebilirlik etiketleri
 *
 * @param {Object} props
 * @param {'vertical'|'horizontal'|string} [props.orientation]
 * @param {((o: string) => void)} [props.onOrientationChange]
 * @param {number} [props.minRatio]
 * @param {number} [props.maxRatio]
 * @param {number} [props.initialRatio]
 * @param {string} [props.storageKey]
 * @param {any} [props.primary]
 * @param {any} [props.secondary]
 * @param {string} [props.primaryLabel]
 * @param {string} [props.secondaryLabel]
 */

const RATIO_STORE_KEY_DEFAULT = 'openscriv-split-ratio-v1';

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

export default function SplitView({
  orientation: orientationProp,
  onOrientationChange,
  minRatio = 0.2,
  maxRatio = 0.8,
  initialRatio = 0.5,
  storageKey = RATIO_STORE_KEY_DEFAULT,
  primary,
  secondary,
  primaryLabel = 'Birinci panel',
  secondaryLabel = 'İkinci panel',
}) {
  const [innerOrientation, setInnerOrientation] = useState(
    orientationProp ?? 'vertical'
  );
  const orientation = orientationProp ?? innerOrientation;

  const [ratio, setRatio] = useState(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      const parsed = raw == null ? NaN : Number(raw);
      if (Number.isFinite(parsed)) return clamp(parsed, minRatio, maxRatio);
    } catch {
      /* storage kapalı olabilir */
    }
    return clamp(initialRatio, minRatio, maxRatio);
  });

  const containerRef = useRef(null);
  const draggingRef = useRef(false);
  const startDataRef = useRef({ pos: 0, ratio: 0.5 });

  // Oranı kalıcı yap
  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, String(ratio));
    } catch {
      /* yok say */
    }
  }, [ratio, storageKey]);

  /** Pointer hareketinden yeni oran hesapla. */
  const computeRatio = useCallback(
    (clientPos) => {
      const el = containerRef.current;
      if (!el) return ratio;
      const rect = el.getBoundingClientRect();
      const size = orientation === 'vertical' ? rect.width : rect.height;
      if (size <= 0) return ratio;
      const offset = clientPos - rect.left - (orientation === 'horizontal' ? rect.top : 0);
      return clamp(offset / size, minRatio, maxRatio);
    },
    [minRatio, maxRatio, orientation, ratio]
  );

  const onPointerDown = useCallback((e) => {
    e.preventDefault();
    draggingRef.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const isVertical = orientation === 'vertical';
    startDataRef.current = {
      pos: isVertical ? e.clientX : e.clientY,
      ratio,
    };
    document.body.classList.add('splitview-dragging');
  }, [orientation, ratio]);

  const onPointerMove = useCallback(
    (e) => {
      if (!draggingRef.current) return;
      const isVertical = orientation === 'vertical';
      setRatio(computeRatio(isVertical ? e.clientX : e.clientY));
    },
    [computeRatio, orientation]
  );

  const endDrag = useCallback((e) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    document.body.classList.remove('splitview-dragging');
  }, []);

  const onKeyDown = useCallback(
    (e) => {
      const step = 0.01;
      let handled = true;
      switch (e.key) {
        case 'ArrowLeft':
          if (orientation === 'vertical') setRatio((r) => clamp(r - step, minRatio, maxRatio));
          break;
        case 'ArrowRight':
          if (orientation === 'vertical') setRatio((r) => clamp(r + step, minRatio, maxRatio));
          break;
        case 'ArrowUp':
          if (orientation === 'horizontal') setRatio((r) => clamp(r - step, minRatio, maxRatio));
          break;
        case 'ArrowDown':
          if (orientation === 'horizontal') setRatio((r) => clamp(r + step, minRatio, maxRatio));
          break;
        case 'Enter': {
          const next = orientation === 'vertical' ? 'horizontal' : 'vertical';
          if (orientationProp == null) setInnerOrientation(next);
          if (typeof onOrientationChange === 'function') onOrientationChange(next);
          break;
        }
        default:
          handled = false;
      }
      if (handled) e.preventDefault();
    },
    [maxRatio, minRatio, onOrientationChange, orientation, orientationProp]
  );

  const pct = `${(ratio * 100).toFixed(1)}%`;

  return (
    <div
      ref={containerRef}
      className={`split split--${orientation}`}
      data-orienting={draggingRef.current ? 'true' : undefined}
    >
      <section className="split__pane split__pane--primary" style={{ flexBasis: pct }} aria-label={primaryLabel}>
        {primary}
      </section>

      <div
        className="split__handle"
        role="separator"
        aria-orientation={orientation === 'vertical' ? 'vertical' : 'horizontal'}
        aria-label="Panelleri yeniden boyutlandır"
        aria-valuenow={Math.round(ratio * 100)}
        aria-valuemin={Math.round(minRatio * 100)}
        aria-valuemax={Math.round(maxRatio * 100)}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
      >
        <span className="split__grip" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </div>

      <section className="split__pane split__pane--secondary" aria-label={secondaryLabel}>
        {secondary}
      </section>
    </div>
  );
}
