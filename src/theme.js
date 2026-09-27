/**
 * OpenScriv - Faz 13: Tema motoru (açık/koyu) + görünüm tercihleri
 *
 * Tek dosyalık, bağımlılıksız tema katmanı:
 *   - THEMES: açık/koyu renk token setleri (CSS custom property olarak uygulanır)
 *   - applyTheme(theme): <html> elementine data-theme + inline CSS değişkenlerini yazar
 *   - useTheme(): React hook — localStorage'dan kalıcı tercih, toggle, sistem takibi
 *   - FOCUS_MODE niteliği: dağıtım-disi mod DOM attribute'ü ile stilleri tetikler
 *
 * Tamamen yerel: hiçbir şey ağa gitmez; tercih localStorage'da tutulur.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'openscriv:appearance:v1';

// ---------------------------------------------------------------------------
// Renk token'ları
// ---------------------------------------------------------------------------

export const THEMES = {
  light: {
    '--bg-app': '#f5f2ea',
    '--bg-panel': '#fbfaf7',
    '--bg-elevated': '#ffffff',
    '--bg-hover': '#f2eee3',
    '--bg-selected': '#dfd8c6',
    '--bg-header': '#efece4',
    '--bg-cork': '#b8926a',
    '--text-primary': '#3c382e',
    '--text-secondary': '#6b6455',
    '--text-muted': '#8a7f66',
    '--text-on-accent': '#ffffff',
    '--border': '#d9d4c8',
    '--border-strong': '#b9b09c',
    '--accent': '#7a6c4f',
    '--accent-hover': '#655a42',
    '--success': '#2e6b3e',
    '--danger': '#9c3a3a',
    '--focus-ring': 'rgba(138, 127, 102, 0.35)',
    '--shadow': 'rgba(0, 0, 0, 0.15)',
  },
  dark: {
    '--bg-app': '#1e1c18',
    '--bg-panel': '#26241f',
    '--bg-elevated': '#2e2b25',
    '--bg-hover': '#35322b',
    '--bg-selected': '#4a453a',
    '--bg-header': '#2a2822',
    '--bg-cork': '#5a4632',
    '--text-primary': '#e8e4da',
    '--text-secondary': '#b8b1a2',
    '--text-muted': '#8a8375',
    '--text-on-accent': '#1e1c18',
    '--border': '#3b3830',
    '--border-strong': '#555147',
    '--accent': '#c0a875',
    '--accent-hover': '#d4bc8a',
    '--success': '#6fc085',
    '--danger': '#e07c7c',
    '--focus-ring': 'rgba(192, 168, 117, 0.45)',
    '--shadow': 'rgba(0, 0, 0, 0.5)',
  },
};

export const THEME_IDS = Object.keys(THEMES);

// ---------------------------------------------------------------------------
// Tercih yükleme / kaydetme (tamamen yerel)
// ---------------------------------------------------------------------------

export function loadAppearance() {
  const fallback = { theme: 'light', focusMode: false, panels: { binder: true, inspector: true, statusbar: true } };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      theme: THEME_IDS.includes(parsed.theme) ? parsed.theme : fallback.theme,
      focusMode: Boolean(parsed.focusMode),
      panels: { ...fallback.panels, ...(parsed.panels || {}) },
    };
  } catch {
    return fallback;
  }
}

export function saveAppearance(prefs) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* kota/gizli mod: sessizce geç */
  }
}

// ---------------------------------------------------------------------------
// DOM'a uygulama
// ---------------------------------------------------------------------------

/**
 * Seçili temanın token'larını <html> üzerine CSS custom property olarak yazar
 * ve data-theme / data-focus-mode niteliklerini günceller.
 */
export function applyTheme(themeId, { focusMode = false } = {}) {
  const tokens = THEMES[themeId] || THEMES.light;
  const root = document.documentElement;
  for (const [name, value] of Object.entries(tokens)) {
    root.style.setProperty(name, value);
  }
  root.setAttribute('data-theme', themeId);
  root.toggleAttribute('data-focus-mode', Boolean(focusMode));
  // Electron pencere başlığı/arka planı için meta ipucu
  root.style.colorScheme = themeId === 'dark' ? 'dark' : 'light';
}

// ---------------------------------------------------------------------------
// React hook: tema + odak modu + panel düzeni
// ---------------------------------------------------------------------------

export function useTheme({ watchSystem = false } = {}) {
  const [prefs, setPrefs] = useState(loadAppearance);

  // Her değişimde DOM'a uygula ve kalıcı yap
  useEffect(() => {
    applyTheme(prefs.theme, { focusMode: prefs.focusMode });
    saveAppearance(prefs);
  }, [prefs]);

  // Sistem temasını izle (tercih manuel seçilmediyse ilk değer olarak)
  useEffect(() => {
    if (!watchSystem || typeof window.matchMedia !== 'function') return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => {
      // Yalnızca kullanıcı hiç seçim yapmadıysa sistemi takip et
      if (!window.localStorage.getItem(STORAGE_KEY)) {
        setPrefs((p) => ({ ...p, theme: e.matches ? 'dark' : 'light' }));
      }
    };
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [watchSystem]);

  const setTheme = useCallback((themeId) => {
    if (!THEME_IDS.includes(themeId)) return;
    setPrefs((p) => ({ ...p, theme: themeId }));
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
    setPrefs((p) => ({ ...p, panels: { ...p.panels, [panelId]: Boolean(visible) } }));
  }, []);

  const togglePanel = useCallback((panelId) => {
    setPrefs((p) => ({ ...p, panels: { ...p.panels, [panelId]: !p.panels[panelId] } }));
  }, []);

  // Odak modunda kenar paneller geçici kapalı görünür (kullanıcı tercihi bozulmaz)
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

export default useTheme;
