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
  'oxford-sepia': {
    '--bg-app': '#f4f2ed',
    '--bg-panel': '#faf9f5',
    '--bg-elevated': '#ffffff',
    '--bg-hover': '#efeadf',
    '--bg-selected': '#e4ddcb',
    '--bg-header': '#ece8dd',
    '--bg-cork': '#b8926a',
    '--text-primary': '#2f2b24',
    '--text-secondary': '#6b6455',
    '--text-muted': '#948b78',
    '--text-on-accent': '#ffffff',
    '--border': '#ddd6c8',
    '--border-strong': '#c4bba6',
    '--accent': '#7a6c4f',
    '--accent-hover': '#655a42',
    '--success': '#2e6b3e',
    '--danger': '#9c3a3a',
    '--focus-ring': 'rgba(122, 108, 79, 0.35)',
    '--shadow': 'rgba(0, 0, 0, 0.12)',
  },
  'midnight-velvet': {
    '--bg-app': '#161821',
    '--bg-panel': '#1c1f2b',
    '--bg-elevated': '#232736',
    '--bg-hover': '#2a2f40',
    '--bg-selected': '#333a50',
    '--bg-header': '#191c27',
    '--bg-cork': '#5a4632',
    '--text-primary': '#e8e6df',
    '--text-secondary': '#a9a79d',
    '--text-muted': '#6f7180',
    '--text-on-accent': '#161821',
    '--border': '#2e3345',
    '--border-strong': '#3d4258',
    '--accent': '#c9a86a',
    '--accent-hover': '#b8955a',
    '--success': '#6fbf85',
    '--danger': '#e07a7a',
    '--focus-ring': 'rgba(201, 168, 106, 0.45)',
    '--shadow': 'rgba(0, 0, 0, 0.55)',
  },
  'nordic-minimal': {
    '--bg-app': '#f7f8fa',
    '--bg-panel': '#fdfdfe',
    '--bg-elevated': '#ffffff',
    '--bg-hover': '#e8edf3',
    '--bg-selected': '#dbe6f2',
    '--bg-header': '#eef1f5',
    '--bg-cork': '#b8926a',
    '--text-primary': '#22303e',
    '--text-secondary': '#55636f',
    '--text-muted': '#8d99a6',
    '--text-on-accent': '#ffffff',
    '--border': '#dde3ea',
    '--border-strong': '#c3ccd6',
    '--accent': '#4a6fa5',
    '--accent-hover': '#3d5d8c',
    '--success': '#3d8f5f',
    '--danger': '#b04a4a',
    '--focus-ring': 'rgba(74, 111, 165, 0.35)',
    '--shadow': 'rgba(0, 0, 0, 0.1)',
  },
  'emerald-scholar': {
    '--bg-app': '#101c17',
    '--bg-panel': '#152420',
    '--bg-elevated': '#1b2e28',
    '--bg-hover': '#213830',
    '--bg-selected': '#294439',
    '--bg-header': '#12211b',
    '--bg-cork': '#5a4632',
    '--text-primary': '#e4e9e2',
    '--text-secondary': '#a3b2a8',
    '--text-muted': '#6c7f74',
    '--text-on-accent': '#101c17',
    '--border': '#24382f',
    '--border-strong': '#315043',
    '--accent': '#2e7d5b',
    '--accent-hover': '#256749',
    '--success': '#5fbf8a',
    '--danger': '#d97b7b',
    '--focus-ring': 'rgba(46, 125, 91, 0.45)',
    '--shadow': 'rgba(0, 0, 0, 0.55)',
  },
};

export const THEME_IDS = Object.keys(THEMES);

export const THEME_CARDS = [
  {
    name: 'oxford-sepia',
    label: 'Oxford Sepia',
    desc: 'Parşömen kağıt, kehribar vurgu — klasik yazıhane.',
    swatch: ['#f4f2ed', '#7a6c4f', '#c98a2d'],
  },
  {
    name: 'midnight-velvet',
    label: 'Midnight Velvet',
    desc: 'Kadife gece, yumuşak altın — geç saat ilhamı.',
    swatch: ['#161821', '#c9a86a', '#3d4258'],
  },
  {
    name: 'nordic-minimal',
    label: 'Nordic Minimal',
    desc: 'Buz beyazı ve gri-mavi — ferah, sade kuzey ışığı.',
    swatch: ['#f7f8fa', '#4a6fa5', '#cfd6df'],
  },
  {
    name: 'emerald-scholar',
    label: 'Emerald Scholar',
    desc: 'Koyu zümrüt ve pirinç — akademisyen çalışma odası.',
    swatch: ['#101c17', '#2e7d5b', '#c8b26b'],
  },
  {
    name: 'light',
    label: 'Klasik Açık',
    desc: 'Fildişi ve sıcak kahverengi tonları.',
    swatch: ['#f5f2ea', '#7a6c4f', '#dfd8c6'],
  },
  {
    name: 'dark',
    label: 'Klasik Koyu',
    desc: 'Sıcak kömür grisi ve altın tonları.',
    swatch: ['#1e1c18', '#c0a875', '#3b3830'],
  },
];

export const FONT_STACKS = {
  serif: "'Lora', Georgia, 'Times New Roman', 'Noto Serif TR', serif",
  sans: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace",
};

export const FONT_CHOICES = [
  { id: 'serif', label: 'Serif (Klasik Roman)' },
  { id: 'sans', label: 'Sans (Modern Minimal)' },
  { id: 'mono', label: 'Mono (Daktilo / Kod)' },
];

export const LINE_HEIGHT_OPTIONS = [1.5, 1.7, 1.9, 2.1];
export const FONT_SIZE_RANGE = { min: 14, max: 24, step: 1 };

export const DEFAULT_TYPOGRAPHY = {
  fontFamily: 'serif',
  fontSize: 18,
  lineHeight: 1.9,
};

const TYPO_KEY = 'openscriv:typography:v1';

export function loadTypography() {
  try {
    const raw = window.localStorage.getItem(TYPO_KEY);
    if (!raw) return DEFAULT_TYPOGRAPHY;
    return { ...DEFAULT_TYPOGRAPHY, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_TYPOGRAPHY;
  }
}

export function saveTypography(typo) {
  try {
    window.localStorage.setItem(TYPO_KEY, JSON.stringify(typo));
  } catch {}
}

export function applyTypography(typo) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const stack = FONT_STACKS[typo.fontFamily] || FONT_STACKS.serif;
  root.style.setProperty('--font-serif', stack);
  root.style.setProperty('--editor-font-size', `${typo.fontSize}px`);
  root.style.setProperty('--editor-line-height', String(typo.lineHeight));
}

// ---------------------------------------------------------------------------
// Tercih yükleme / kaydetme (tamamen yerel)
// ---------------------------------------------------------------------------

export function loadAppearance() {
  const fallback = { theme: 'oxford-sepia', focusMode: false, panels: { binder: true, inspector: true, statusbar: true } };
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
  const tokens = THEMES[themeId] || THEMES['oxford-sepia'] || THEMES.light;
  const root = document.documentElement;
  for (const [name, value] of Object.entries(tokens)) {
    root.style.setProperty(name, value);
  }
  root.setAttribute('data-theme', themeId);
  root.toggleAttribute('data-focus-mode', Boolean(focusMode));
  // Electron pencere başlığı/arka planı için meta ipucu
  const isDark = themeId === 'dark' || themeId === 'midnight-velvet' || themeId === 'emerald-scholar';
  root.style.colorScheme = isDark ? 'dark' : 'light';
}

// ---------------------------------------------------------------------------
// React hook: tema + odak modu + panel düzeni + tipografi
// ---------------------------------------------------------------------------

export function useTheme({ watchSystem = false } = {}) {
  const [prefs, setPrefs] = useState(loadAppearance);
  const [typography, setTypographyState] = useState(loadTypography);

  // Her değişimde DOM'a uygula ve kalıcı yap
  useEffect(() => {
    applyTheme(prefs.theme, { focusMode: prefs.focusMode });
    saveAppearance(prefs);
  }, [prefs]);

  useEffect(() => {
    applyTypography(typography);
    saveTypography(typography);
  }, [typography]);

  // Sistem temasını izle (tercih manuel seçilmediyse ilk değer olarak)
  useEffect(() => {
    if (!watchSystem || typeof window.matchMedia !== 'function') return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => {
      // Yalnızca kullanıcı hiç seçim yapmadıysa sistemi takip et
      if (!window.localStorage.getItem(STORAGE_KEY)) {
        setPrefs((p) => ({ ...p, theme: e.matches ? 'midnight-velvet' : 'oxford-sepia' }));
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
    setPrefs((p) => {
      const isDarkTheme = p.theme === 'dark' || p.theme === 'midnight-velvet' || p.theme === 'emerald-scholar';
      return { ...p, theme: isDarkTheme ? 'oxford-sepia' : 'midnight-velvet' };
    });
  }, []);

  const setTypography = useCallback((patch) => {
    setTypographyState((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }));
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
    isDark: prefs.theme === 'dark' || prefs.theme === 'midnight-velvet' || prefs.theme === 'emerald-scholar',
    focusMode: prefs.focusMode,
    panels: effectivePanels,
    rawPanels: prefs.panels,
    typography,
    setTheme,
    toggleTheme,
    setTypography,
    setFocusMode,
    toggleFocusMode,
    setPanelVisible,
    togglePanel,
  };
}

export default useTheme;
