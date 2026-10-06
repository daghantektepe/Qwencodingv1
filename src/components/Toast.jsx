import React, { useState, useEffect, useCallback } from 'react';
import './Toast.css';

/**
 * Toast — Faz 31: Bağımsız bildirim sistemi (hata/dayanıklılık uyarıları).
 *
 * window üzerinden mini olay yoluyla da tetiklenebilir:
 *   window.dispatchEvent(new CustomEvent('app:toast', { detail: { kind, message } }))
 * Böylece hook'lar (useAutosave) bileşen ağacına props dolaştırmadan uyarabilir.
 *
 * props:
 *   maxVisible: number  — eşzamanlı en fazla toast (vars. 4)
 */

let seq = 0;

export function pushToast(kind, message) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('app:toast', { detail: { id: ++seq, kind, message } })
  );
}

const KIND_META = {
  error: { icon: '⚠️', cls: 'toast--error', ttl: 6000 },
  warn: { icon: '⏳', cls: 'toast--warn', ttl: 4000 },
  info: { icon: 'ℹ️', cls: 'toast--info', ttl: 3200 },
  success: { icon: '✓', cls: 'toast--success', ttl: 2600 },
};

export default function Toast({ maxVisible = 4 }) {
  const [items, setItems] = useState([]);

  const dismiss = useCallback((id) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const onToast = (e) => {
      const detail = e.detail || {};
      const kind = KIND_META[detail.kind] ? detail.kind : 'info';
      const item = {
        id: detail.id || ++seq,
        kind,
        message: String(detail.message || ''),
      };
      setItems((prev) => [...prev.slice(-(maxVisible - 1)), item]);
      const ttl = KIND_META[kind].ttl;
      setTimeout(() => dismiss(item.id), ttl);
    };
    window.addEventListener('app:toast', onToast);
    return () => window.removeEventListener('app:toast', onToast);
  }, [dismiss, maxVisible]);

  if (items.length === 0) return null;

  return (
    <div className="toast-stack" role="region" aria-label="Bildirimler">
      {items.map((t) => (
        <div
          key={t.id}
          className={`toast ${KIND_META[t.kind].cls}`}
          data-testid={`toast-${t.kind}`}
          role={t.kind === 'error' ? 'alert' : 'status'}
        >
          <span className="toast__icon" aria-hidden="true">
            {KIND_META[t.kind].icon}
          </span>
          <span className="toast__msg">{t.message}</span>
          <button
            type="button"
            className="toast__close"
            onClick={() => dismiss(t.id)}
            aria-label="Kapat"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
