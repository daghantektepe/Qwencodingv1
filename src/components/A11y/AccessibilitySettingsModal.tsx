import React, { useState, useEffect, useRef } from 'react';
import focusManager from '../../services/a11y/focusManager';
import announcer from '../../services/a11y/announcer';

export interface AccessibilitySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilitySettingsModal: React.FC<AccessibilitySettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const [highContrast, setHighContrast] = useState(() => {
    return typeof document !== 'undefined'
      ? document.body.classList.contains('a11y-high-contrast')
      : false;
  });

  const [reducedMotion, setReducedMotion] = useState(() => {
    return typeof document !== 'undefined'
      ? document.body.classList.contains('a11y-reduced-motion')
      : false;
  });

  const [fontScale, setFontScale] = useState<string>('100');

  // Focus Trap and Escape key handling
  useEffect(() => {
    if (!isOpen) return;

    let cleanupTrap: (() => void) | undefined;
    if (modalRef.current) {
      cleanupTrap = focusManager.trapFocus(modalRef.current);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        announcer.announce('Erişilebilirlik ayarları penceresi kapatıldı.', 'polite');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    announcer.announce('Erişilebilirlik ayarları penceresi açıldı.', 'polite');

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (cleanupTrap) cleanupTrap();
    };
  }, [isOpen, onClose]);

  // High Contrast sync
  const toggleHighContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    if (typeof document !== 'undefined') {
      if (next) {
        document.body.classList.add('a11y-high-contrast');
        announcer.announce('Yüksek kontrast modu etkinleştirildi.', 'assertive');
      } else {
        document.body.classList.remove('a11y-high-contrast');
        announcer.announce('Yüksek kontrast modu kapatıldı.', 'polite');
      }
    }
  };

  // Reduced Motion sync
  const toggleReducedMotion = () => {
    const next = !reducedMotion;
    setReducedMotion(next);
    if (typeof document !== 'undefined') {
      if (next) {
        document.body.classList.add('a11y-reduced-motion');
        announcer.announce('İndirgenmiş animasyon modu etkinleştirildi.', 'polite');
      } else {
        document.body.classList.remove('a11y-reduced-motion');
        announcer.announce('Animasyonlar varsayılan moda döndürüldü.', 'polite');
      }
    }
  };

  // Font Scale sync
  const handleScaleChange = (scale: string) => {
    setFontScale(scale);
    if (typeof document !== 'undefined') {
      document.body.classList.remove('a11y-font-scale-125', 'a11y-font-scale-150', 'a11y-font-scale-200');
      if (scale !== '100') {
        document.body.classList.add(`a11y-font-scale-${scale}`);
      }
      announcer.announce(`Yazı boyutu %${scale} olarak ayarlandı.`, 'polite');
    }
  };

  if (!isOpen) return null;

  const shortcuts = focusManager.getAllShortcuts();

  return (
    <div
      className="a11y-modal-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="a11y-modal-title"
        style={{
          backgroundColor: '#1e1e1e',
          color: '#ffffff',
          borderRadius: '8px',
          padding: '24px',
          width: '540px',
          maxWidth: '90vw',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          border: '1px solid #333333',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 id="a11y-modal-title" style={{ margin: 0, fontSize: '1.4rem' }}>
            ♿ Erişilebilirlik Ayarları (WCAG 2.1 AAA)
          </h2>
          <button
            onClick={onClose}
            aria-label="Ayarları Kapat"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#cccccc',
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        <section style={{ marginBottom: '24px' }} aria-labelledby="visual-heading">
          <h3 id="visual-heading" style={{ fontSize: '1.1rem', borderBottom: '1px solid #444', paddingBottom: '6px' }}>
            Görsel Tercihler
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
            <label htmlFor="toggle-high-contrast" style={{ cursor: 'pointer' }}>
              <strong>Yüksek Kontrast Modu (7:1 AAA)</strong>
              <div style={{ fontSize: '0.85rem', color: '#aaaaaa' }}>Görsel öğeleri siyah-beyaz ve belirgin vurgularla gösterir.</div>
            </label>
            <input
              id="toggle-high-contrast"
              type="checkbox"
              checked={highContrast}
              onChange={toggleHighContrast}
              aria-checked={highContrast}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
            <label htmlFor="toggle-reduced-motion" style={{ cursor: 'pointer' }}>
              <strong>İndirgenmiş Hareket</strong>
              <div style={{ fontSize: '0.85rem', color: '#aaaaaa' }}>Animasyonları ve ani geçişleri durdurur.</div>
            </label>
            <input
              id="toggle-reduced-motion"
              type="checkbox"
              checked={reducedMotion}
              onChange={toggleReducedMotion}
              aria-checked={reducedMotion}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </div>

          <div style={{ marginTop: '16px' }}>
            <label htmlFor="font-scale-select" style={{ display: 'block', marginBottom: '6px' }}>
              <strong>Metin Ölçekleme</strong>
            </label>
            <select
              id="font-scale-select"
              value={fontScale}
              onChange={(e) => handleScaleChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                backgroundColor: '#2a2a2a',
                color: '#ffffff',
                border: '1px solid #555555',
              }}
            >
              <option value="100">%100 (Varsayılan)</option>
              <option value="125">%125 (Büyük)</option>
              <option value="150">%150 (Daha Büyük)</option>
              <option value="200">%200 (Ekstra Büyük / Az Görenler İçin)</option>
            </select>
          </div>
        </section>

        <section style={{ marginBottom: '24px' }} aria-labelledby="shortcuts-heading">
          <h3 id="shortcuts-heading" style={{ fontSize: '1.1rem', borderBottom: '1px solid #444', paddingBottom: '6px' }}>
            Klavye Kısayolları Rehberi
          </h3>
          {shortcuts.length === 0 ? (
            <p style={{ fontSize: '0.9rem', color: '#888888' }}>
              Sistemde tanımlı kısayollar: <kbd>Tab</kbd> ile gezinme, <kbd>Enter</kbd> ile seçim, <kbd>Esc</kbd> ile kapatma.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0', maxHeight: '150px', overflowY: 'auto' }}>
              {shortcuts.map((sc, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    borderBottom: '1px solid #2d2d2d',
                    fontSize: '0.9rem',
                  }}
                >
                  <span>{sc.description}</span>
                  <code>
                    {sc.ctrlOrMeta ? 'Ctrl+' : ''}
                    {sc.shift ? 'Shift+' : ''}
                    {sc.alt ? 'Alt+' : ''}
                    {sc.key.toUpperCase()}
                  </code>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={() => {
              announcer.announce('Ekran okuyucu testi başarılı. Sesli bildirim sistemi aktif.', 'assertive');
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#374151',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            🔊 Ekran Okuyucu Testi
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessibilitySettingsModal;
