import React, { useState, useRef, useCallback, useEffect } from 'react';
import './TabBar.css';

/**
 * TabBar — Faz 22: Sekmeli çalışma alanı (doküman sekmeleri + hızlı geçiş).
 *
 * Özellikler:
 *  - Modern, zarif doküman sekmeleri; aktif sekmede kehribar vurgu çizgisi.
 *  - Sekme kapatma (×) butonu; kapanan sekmenin sağındaki/solundaki sekme aktifleşir.
 *  - Taşan sekmeler için yatay kaydırma + kenar gradyan maskeleri.
 *  - Aktif sekmeyi görünürde tutma (scrollIntoView).
 *  - Orta tık ile kapatma, Ctrl+PageUp/PageDown önerileri üst bileşende kalır.
 *
 * props:
 *   tabs: { id, title, dirty? }[] — açık doküman sekmeleri (sıra korunur)
 *   activeId: string | null
 *   onSelect: (id) => void
 *   onClose: (id) => void
 *
 * @param {Object} props
 * @param {Array<any>} [props.tabs]
 * @param {string|null} [props.activeId]
 * @param {((id: string) => void)} [props.onSelect]
 * @param {((id: string) => void)} [props.onClose]
 */

export default function TabBar({ tabs = [], activeId = null, onSelect, onClose }) {
  const scrollerRef = useRef(null);
  const [edgeState, setEdgeState] = useState({ left: false, right: false });

  /** Kenar taşma durumunu güncelle (gradyan maskeleri için) */
  const updateEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const left = el.scrollLeft > 2;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    setEdgeState((prev) =>
      prev.left === left && prev.right === right ? prev : { left, right }
    );
  }, []);

  useEffect(() => {
    updateEdges();
    const el = scrollerRef.current;
    if (!el) return undefined;
    el.addEventListener('scroll', updateEdges, { passive: true });
    window.addEventListener('resize', updateEdges);
    return () => {
      el.removeEventListener('scroll', updateEdges);
      window.removeEventListener('resize', updateEdges);
    };
  }, [updateEdges]);

  // Aktif sekme değişince görünür yap
  useEffect(() => {
    if (!activeId || !scrollerRef.current) return;
    const el = scrollerRef.current.querySelector(`[data-tab-id="${CSS.escape(activeId)}"]`);
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    }
  }, [activeId, tabs.length]);

  const handleClose = useCallback(
    (e, id) => {
      e.stopPropagation();
      if (typeof onClose === 'function') onClose(id);
    },
    [onClose]
  );

  if (tabs.length === 0) return null;

  return (
    <div
      className={`tabbar${edgeState.left ? ' has-overflow-left' : ''}${
        edgeState.right ? ' has-overflow-right' : ''
      }`}
      role="tablist"
      aria-label="Açık doküman sekmeleri"
    >
      <div className="tabbar__scroller" ref={scrollerRef}>
        {tabs.map((t) => {
          const isActive = t.id === activeId;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              data-tab-id={t.id}
              aria-selected={isActive}
              className={`tab${isActive ? ' is-active' : ''}`}
              title={t.title}
              onClick={() => typeof onSelect === 'function' && onSelect(t.id)}
              onAuxClick={(e) => {
                if (e.button === 1) handleClose(e, t.id);
              }}
            >
              {t.dirty && <span className="tab__dirty" aria-label="Kaydedilmemiş değişiklik" />}
              <span className="tab__label">{t.title}</span>
              <span
                className="tab__close"
                role="button"
                tabIndex={-1}
                aria-label={`${t.title} sekmesini kapat`}
                onClick={(e) => handleClose(e, t.id)}
              >
                ×
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
