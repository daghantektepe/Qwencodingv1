import React from 'react';
import './ThemePanel.css';

/**
 * ThemePanel — Faz 26: Tema & Tipografi özelleştirme paneli.
 *
 * Modal olarak açılır; tema kartları (swatch önizlemeli), font ailesi seçimi,
 * punto slider'ı ve satır aralığı segment kontrolü içerir. Tüm değişiklikler
 * anında uygulanır (App'deki effect üstünden) ve localStorage'a yazılır.
 *
 * props:
 *   open: boolean
 *   onClose: () => void
 *   themeName: string
 *   themes: Array<{ name, label, desc, swatch:[c1,c2,c3] }>
 *   onThemeChange: (name) => void
 *   typography: { fontFamily, fontSize, lineHeight }
 *   fontChoices: Array<{ id, label }>
 *   lineHeightOptions: number[]
 *   fontSizeRange: { min, max, step }
 *   onTypographyChange: (patch) => void
 */

export default function ThemePanel({
  open,
  onClose,
  themeName,
  themes = [],
  onThemeChange,
  typography = { fontFamily: 'serif', fontSize: 18, lineHeight: 1.9 },
  fontChoices = [],
  lineHeightOptions = [1.5, 1.7, 1.9, 2.1],
  fontSizeRange = { min: 14, max: 24, step: 1 },
  onTypographyChange,
}) {
  React.useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="theme-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="theme-panel" role="dialog" aria-modal="true" aria-label="Tema ve tipografi">
        <header className="theme-panel__head">
          <h2>Görünüm</h2>
          <button type="button" className="theme-panel__close" onClick={onClose} aria-label="Kapat">
            ×
          </button>
        </header>

        <div className="theme-panel__body">
          {/* --- Tema kartları --- */}
          <section className="theme-section">
            <h3 className="theme-section__title">Palet</h3>
            <div className="theme-cards">
              {themes.map((t) => (
                <label
                  key={t.name}
                  className={`theme-card${themeName === t.name ? ' is-active' : ''}`}
                >
                  <input
                    type="radio"
                    name="theme"
                    value={t.name}
                    checked={themeName === t.name}
                    onChange={() => onThemeChange(t.name)}
                  />
                  <span className="theme-card__swatch" aria-hidden="true">
                    {t.swatch.map((c, i) => (
                      <i key={i} style={{ background: c }} />
                    ))}
                  </span>
                  <span className="theme-card__label">{t.label}</span>
                  <span className="theme-card__desc">{t.desc}</span>
                </label>
              ))}
            </div>
          </section>

          {/* --- Yazı tipi --- */}
          <section className="theme-section">
            <h3 className="theme-section__title">Yazı ailesi</h3>
            <div className="seg-control" role="radiogroup" aria-label="Yazı ailesi">
              {fontChoices.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="radio"
                  aria-checked={typography.fontFamily === f.id}
                  className={`seg-btn${typography.fontFamily === f.id ? ' is-active' : ''}`}
                  onClick={() => onTypographyChange({ fontFamily: f.id })}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </section>

          {/* --- Punto --- */}
          <section className="theme-section">
            <h3 className="theme-section__title">
              Punto{' '}
              <span className="theme-section__value">{typography.fontSize}px</span>
            </h3>
            <input
              type="range"
              className="theme-range"
              min={fontSizeRange.min}
              max={fontSizeRange.max}
              step={fontSizeRange.step}
              value={typography.fontSize}
              onChange={(e) => onTypographyChange({ fontSize: Number(e.target.value) })}
              aria-label="Punto boyutu"
            />
          </section>

          {/* --- Satır aralığı --- */}
          <section className="theme-section">
            <h3 className="theme-section__title">Satır aralığı</h3>
            <div className="seg-control" role="radiogroup" aria-label="Satır aralığı">
              {lineHeightOptions.map((lh) => (
                <button
                  key={lh}
                  type="button"
                  role="radio"
                  aria-checked={typography.lineHeight === lh}
                  className={`seg-btn${typography.lineHeight === lh ? ' is-active' : ''}`}
                  onClick={() => onTypographyChange({ lineHeight: lh })}
                >
                  {lh.toFixed(1)}×
                </button>
              ))}
            </div>
          </section>

          {/* --- Önizleme --- */}
          <section className="theme-section">
            <h3 className="theme-section__title">Önizleme</h3>
            <div className="type-preview">
              <p>
                Hızlı kahverengi tilki tembel köpeğin üzerinden atlar — tüm Türkçe
                karakterler: ç ğ ı ö ş ü Ç Ğ İ Ö Ş Ü 1234567890.
              </p>
            </div>
          </section>
        </div>

        <footer className="theme-panel__foot">
          <button type="button" className="btn btn--primary" onClick={onClose}>
            Tamam
          </button>
        </footer>
      </div>
    </div>
  );
}
