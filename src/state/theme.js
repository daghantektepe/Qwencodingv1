/**
 * OpenScriv - Faz 13: Görünüm ve UX state katmanı
 *
 * useProjectState'ten bağımsız, salt görünümle ilgili kalıcı tercihleri tutar:
 *   theme: 'light' | 'dark'
 *   focusMode: boolean (dagitim-disi / distraction-free)
 *   panels: { binder: bool, inspector: bool, statusbar: bool, } → panel düzeni
 *
 * Tercihler localStorage'da saklanır (tamamen yerel). DOM'a <html> uzerindeki
 * data-theme / data-focus attribute'leriyle yansir; stiller themes.css'tedir.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'openscriv:appearance:v1';

export const THEMES = ['light', 'dark'];

const DEFAULTS = {
  theme: 'light',
  focusMode: false,
  panels: {
    binder: true,
    inspector: true,
    statusbar: true,
  },
};

function loadPrefs() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return {
      theme: THEMES.includes(parsed.theme) ? parsed.theme : DEFAULTS.theme,
      focusMode: Boolean(parsed.focusMode),
      panels: { ...DEFAULTS.panels, ...(parsed.panels || {}) },
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function savePrefs(prefs) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* gizli mod / kota hatasi: sessizce gec */
  }
}

/**
 * Tercihleri <html> attribute'lerine uygular.
 */
function applyToDom({ theme, focusMode }) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.toggleAttribute('data-focus-mode', focusMode);
}

export function useAppearance() {
  const [prefs, setPrefs] = useState(loadPrefs);

  // Her degisiklikte DOM'a uygula + kalici yap
  useEffect(() => {
    applyToDom(prefs);
    savePrefs(prefs);
  }, [prefs]);

  const setTheme = useCallback((theme) => {
    if (!THEMES.includes(theme)) return;
    setPrefs((p) => ({ ...p, theme }));
  }, []);

  const toggleTheme = useCallback(() => {
    setPrefs((p) => ({ ...p, theme: p.theme === 'light' ? 'dark' : 'light' }));
  }, []);

  const setFocusMode = useCallback((on) => {
    setPrefs((p) => ({ ...p, focusMode: Boolean(on) }));
  }, []);

  const toggleFocusMode = useCallback(() => {
    setPrefs((p) => ({ ...p, focusMode: !p.focusMode }));
  }, []);

  const setPanelVisible = useCallback((panelId, visible) => {
    setPrefs((p) => ({
      ...p,
      panels: { ...p.panels, [panelId]: Boolean(visible) },
    }));
  }, []);

  const togglePanel = useCallback((panelId) => {
    setPrefs((p) => ({
      ...p,
      panels: { ...p.panels, [panelId]: !p.panels[panelId] },
    }));
  }, []);

  // Odak modunda paneller gecici olarak kapali gorunur (state korunur)
  const effectivePanels = useMemo(() => {
    if (!prefs.focusMode) return prefs.panels;
    return { binder: false, inspector: false, statusbar: true };
  }, [prefs.focusMode, prefs.panels]);

  return {
    theme: prefs.theme,
    isDark: prefs.theme === 'dark',
    focusMode: prefs.focusMode,
    panels: effectivePanels,
    rawPanels: prefs.panels,
    setTheme,
    toggleTheme,
    setFocusMode,
    toggleFocusMode,
    setPanelVisible,
    togglePanel,
  };
}
