import React, { createContext, useContext, useEffect, useCallback, useMemo } from 'react';
import './Layout.css';

/**
 * Layout — Faz 13: Panel düzeni + dağıtım-disi mod + klavye kısayolları.
 *
 * Üç sütunlu Scrivener benzeri düzen:
 *   [ Binder | Editor (children) | Inspector ]
 * + üst toolbar, + alt statusbar. Paneller useTheme().panels ile açılıp kapanır.
 *
 * Odak (distraction-free) modda: toolbar, binder, inspector gizlenir; editör
 * genişler ve ortalanmış okuma/genişleme alanı alır. Esc ile odak moddan çıkılır.
 *
 * Temel kısayollar (bu bileşen kaydeder):
 *   Ctrl/Cmd+Shift+F → odak modu aç/kapa
 *   Ctrl/Cmd+Shift+D → tema aç/kapa (light/dark)
 *   Ctrl/Cmd+B       → Binder aç/kapa
 *   Ctrl/Cmd+I       → Inspector aç/kapa
 *   Ctrl/Cmd+K       → arama panelini aç/kapa (onSearchToggle verilirse)
 *   F8               → durum çubuğunu aç/kapa
 *   Esc              → odak modundaysa çık
 *
 * props:
 *   appearance: useTheme()/useAppearance() dönüş nesnesi
 *   onSearchToggle?: () => void
 *   children: editör içeriği
 */

const LayoutContext = createContext(null);

export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error('useLayout must be used within <Layout>');
  return ctx;
}

function isTypingTarget(e) {
  const el = e.target;
  if (!el) return false;
  const tag = (el.tagName || '').toLowerCase();
  return tag === 'input' || tag === 'textarea' || el.isContentEditable === true;
}

export default function Layout({ appearance, onSearchToggle, children }) {
  const {
    focusMode,
    panels,
    toggleFocusMode,
    setFocusMode,
    toggleTheme,
    togglePanel,
  } = appearance;

  // --- Klavye kısayolları ---
  const handleKeyDown = useCallback(
    (e) => {
      const mod = e.ctrlKey || e.metaKey;

      // Esc: yalnızca odak modundayken ve input içinde değilken çıkış
      if (e.key === 'Escape') {
        if (focusMode && !isTypingTarget(e)) {
          e.preventDefault();
          setFocusMode(false);
        }
        return;
      }

      // F8: durum çubuğu (input'ta değilken de çalışsın diye fonksiyon tuşu serbest)
      if (e.key === 'F8') {
        e.preventDefault();
        togglePanel('statusbar');
        return;
      }

      if (!mod) return;

      const key = e.key.toLowerCase();

      // Ctrl/Cmd+Shift+F: odak modu
      if (e.shiftKey && key === 'f') {
        e.preventDefault();
        toggleFocusMode();
        return;
      }
      // Ctrl/Cmd+Shift+D: tema değiştir
      if (e.shiftKey && key === 'd') {
        e.preventDefault();
        toggleTheme();
        return;
      }
      // Ctrl/Cmd+B: Binder
      if (!e.shiftKey && key === 'b') {
        e.preventDefault();
        togglePanel('binder');
        return;
      }
      // Ctrl/Cmd+I: Inspector
      if (!e.shiftKey && key === 'i') {
        e.preventDefault();
        togglePanel('inspector');
        return;
      }
      // Ctrl/Cmd+K: arama
      if (!e.shiftKey && key === 'k' && typeof onSearchToggle === 'function') {
        e.preventDefault();
        onSearchToggle();
        return;
      }
    },
    [focusMode, setFocusMode, toggleFocusMode, toggleTheme, togglePanel, onSearchToggle]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const value = useMemo(
    () => ({ focusMode, panels }),
    [focusMode, panels]
  );

  return (
    <LayoutContext.Provider value={value}>
      <div className={`layout${focusMode ? ' layout--focus' : ''}`} data-testid="layout-root">
        {/* Üst araç çubuğu */}
        {!focusMode && (
          <header className="layout-toolbar" role="toolbar" aria-label="Ana araç çubuğu">
            <span className="layout-toolbar__brand">OpenScriv</span>
            <div className="layout-toolbar__spacer" />
            <button
              type="button"
              className="layout-tool-btn"
              onClick={() => togglePanel('binder')}
              title="Binder'ı aç/kapat (Ctrl+B)"
              aria-pressed={panels.binder}
            >
              📚 Binder
            </button>
            <button
              type="button"
              className="layout-tool-btn"
              onClick={() => togglePanel('inspector')}
              title="Inspector'ı aç/kapat (Ctrl+I)"
              aria-pressed={panels.inspector}
            >
              ℹ️ Inspector
            </button>
            {typeof onSearchToggle === 'function' && (
              <button
                type="button"
                className="layout-tool-btn"
                onClick={onSearchToggle}
                title="Ara (Ctrl+K)"
              >
                🔍 Ara
              </button>
            )}
            <button
              type="button"
              className="layout-tool-btn"
              onClick={toggleTheme}
              title="Tema değiştir (Ctrl+Shift+D)"
            >
              🌓 Tema
            </button>
            <button
              type="button"
              className="layout-tool-btn layout-tool-btn--accent"
              onClick={toggleFocusMode}
              title="Dağıtım-disi mod (Ctrl+Shift+F)"
              aria-pressed={focusMode}
            >
              🎯 Odak
            </button>
          </header>
        )}

        {/* Orta alan: Binder | Editör | Inspector */}
        <div className="layout-main">
          {!focusMode && panels.binder && (
            <nav className="layout-pane layout-pane--binder" aria-label="Binder paneli">
              {appearance.renderBinder ? appearance.renderBinder() : null}
            </nav>
          )}

          <main className="layout-editor" aria-label="Doküman editörü">
            {children}
            {focusMode && (
              <button
                type="button"
                className="layout-exit-focus"
                onClick={() => setFocusMode(false)}
                title="Odak modundan çık (Esc)"
                aria-label="Odak modundan çık"
              >
                ✕ Odak modundan çık
              </button>
            )}
          </main>

          {!focusMode && panels.inspector && (
            <aside className="layout-pane layout-pane--inspector" aria-label="Inspector paneli">
              {appearance.renderInspector ? appearance.renderInspector() : null}
            </aside>
          )}
        </div>

        {/* Alt durum çubuğu */}
        {!focusMode && panels.statusbar && (
          <footer className="layout-statusbar" aria-label="Durum çubuğu">
            {appearance.renderStatusbar ? appearance.renderStatusbar() : (
              <span className="layout-statusbar__hint">Hazır</span>
            )}
          </footer>
        )}
      </div>
    </LayoutContext.Provider>
  );
}
