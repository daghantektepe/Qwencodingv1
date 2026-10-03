/**
 * themes.ts — Faz 26: Lüks Tema Motoru.
 *
 * Dört imza palet:
 *  - oxford-sepia   : Parşömen + kehribar, klasik yazıhane
 *  - midnight-velvet: Kadife gece, yumuşak altın vurgular
 *  - nordic-minimal : Buz beyazı + gri mavi, İskandinav sadeliği
 *  - emerald-scholar: Koyu yeşil ilim ruhu, pirinç detaylar
 *
 * p26-s5 düzeltmesi: FONT_CHOICES dizisinin tipi ThemeCustomizer.tsx'in
 * beklediği `FontChoiceData[]` ile birebir eşleşir (`id: string`). Böylece
 * App.tsx → ThemeCustomizer akışında `never[]` / assignability hatası kalmaz.
 */

export type ThemeName = 'oxford-sepia' | 'midnight-velvet' | 'nordic-minimal' | 'emerald-scholar';

export type FontFamilyChoice = 'serif' | 'sans' | 'mono';

export interface ThemeTokens {
  '--bg-app': string;
  '--bg-panel': string;
  '--bg-elevated': string;
  '--bg-header': string;
  '--bg-hover': string;
  '--bg-selected': string;
  '--text-primary': string;
  '--text-secondary': string;
  '--text-muted': string;
  '--border': string;
  '--border-strong': string;
  '--border-focus': string;
  '--accent': string;
  '--accent-hover': string;
  '--accent-soft': string;
  '--success': string;
  '--success-soft': string;
  '--warning': string;
  '--warning-soft': string;
  '--danger': string;
  '--danger-soft': string;
  '--shadow-color': string;
}

export interface ThemeDef {
  name: ThemeName;
  label: string;
  desc: string;
  swatch: [string, string, string];
  tokens: ThemeTokens;
}

export const THEMES: Record<ThemeName, ThemeDef> = {
  'oxford-sepia': {
    name: 'oxford-sepia',
    label: 'Oxford Sepia',
    desc: 'Parşömen kağıt, kehribar vurgu — klasik yazıhane.',
    swatch: ['#f4f2ed', '#7a6c4f', '#c98a2d'],
    tokens: {
      '--bg-app': '#f4f2ed',
      '--bg-panel': '#faf9f5',
      '--bg-elevated': '#ffffff',
      '--bg-header': '#ece8dd',
      '--bg-hover': '#efeadf',
      '--bg-selected': '#e4ddcb',
      '--text-primary': '#2f2b24',
      '--text-secondary': '#6b6455',
      '--text-muted': '#948b78',
      '--border': '#ddd6c8',
      '--border-strong': '#c4bba6',
      '--border-focus': '#8a7f66',
      '--accent': '#7a6c4f',
      '--accent-hover': '#655a42',
      '--accent-soft': 'rgba(122, 108, 79, 0.12)',
      '--success': '#2e6b3e',
      '--success-soft': '#e5f3e8',
      '--warning': '#c98a2d',
      '--warning-soft': '#f7ecc8',
      '--danger': '#9c3a3a',
      '--danger-soft': '#fbeaea',
      '--shadow-color': '31, 26, 16',
    },
  },
  'midnight-velvet': {
    name: 'midnight-velvet',
    label: 'Midnight Velvet',
    desc: 'Kadife gece, yumuşak altın — geç saat ilhamı.',
    swatch: ['#161821', '#c9a86a', '#3d4258'],
    tokens: {
      '--bg-app': '#161821',
      '--bg-panel': '#1c1f2b',
      '--bg-elevated': '#232736',
      '--bg-header': '#191c27',
      '--bg-hover': '#2a2f40',
      '--bg-selected': '#333a50',
      '--text-primary': '#e8e6df',
      '--text-secondary': '#a9a79d',
      '--text-muted': '#6f7180',
      '--border': '#2e3345',
      '--border-strong': '#3d4258',
      '--border-focus': '#5a6180',
      '--accent': '#c9a86a',
      '--accent-hover': '#b8955a',
      '--accent-soft': 'rgba(201, 168, 106, 0.16)',
      '--success': '#6fbf85',
      '--success-soft': 'rgba(111, 191, 133, 0.14)',
      '--warning': '#e0b34f',
      '--warning-soft': 'rgba(224, 179, 79, 0.16)',
      '--danger': '#e07a7a',
      '--danger-soft': 'rgba(224, 122, 122, 0.14)',
      '--shadow-color': '5, 6, 12',
    },
  },
  'nordic-minimal': {
    name: 'nordic-minimal',
    label: 'Nordic Minimal',
    desc: 'Buz beyazı ve gri-mavi — ferih, sade kuzey ışığı.',
    swatch: ['#f7f8fa', '#4a6fa5', '#cfd6df'],
    tokens: {
      '--bg-app': '#f7f8fa',
      '--bg-panel': '#fdfdfe',
      '--bg-elevated': '#ffffff',
      '--bg-header': '#eef1f5',
      '--bg-hover': '#e8edf3',
      '--bg-selected': '#dbe6f2',
      '--text-primary': '#22303e',
      '--text-secondary': '#55636f',
      '--text-muted': '#8d99a6',
      '--border': '#dde3ea',
      '--border-strong': '#c3ccd6',
      '--border-focus': '#8fa5bd',
      '--accent': '#4a6fa5',
      '--accent-hover': '#3d5d8c',
      '--accent-soft': 'rgba(74, 111, 165, 0.12)',
      '--success': '#3d8f5f',
      '--success-soft': '#e2f2e8',
      '--warning': '#b98a2e',
      '--warning-soft': '#f6eeda',
      '--danger': '#b04a4a',
      '--danger-soft': '#fae9e9',
      '--shadow-color': '34, 48, 62',
    },
  },
  'emerald-scholar': {
    name: 'emerald-scholar',
    label: 'Emerald Scholar',
    desc: 'Koyu zümrüt ve pirinç — akademisyen çalışma odası.',
    swatch: ['#101c17', '#2e7d5b', '#c8b26b'],
    tokens: {
      '--bg-app': '#101c17',
      '--bg-panel': '#152420',
      '--bg-elevated': '#1b2e28',
      '--bg-header': '#12211b',
      '--bg-hover': '#213830',
      '--bg-selected': '#294439',
      '--text-primary': '#e4e9e2',
      '--text-secondary': '#a3b2a8',
      '--text-muted': '#6c7f74',
      '--border': '#24382f',
      '--border-strong': '#315043',
      '--border-focus': '#4a7a63',
      '--accent': '#2e7d5b',
      '--accent-hover': '#256749',
      '--accent-soft': 'rgba(46, 125, 91, 0.18)',
      '--success': '#5fbf8a',
      '--success-soft': 'rgba(95, 191, 138, 0.14)',
      '--warning': '#c8b26b',
      '--warning-soft': 'rgba(200, 178, 107, 0.16)',
      '--danger': '#d97b7b',
      '--danger-soft': 'rgba(217, 123, 123, 0.14)',
      '--shadow-color': '4, 10, 8',
    },
  },
};

export const THEME_ORDER: ThemeName[] = [
  'oxford-sepia',
  'midnight-velvet',
  'nordic-minimal',
  'emerald-scholar',
];

/* --- Tipografi seçenekleri --- */

export const FONT_STACKS: Record<FontFamilyChoice, string> = {
  serif: "'Lora', Georgia, 'Times New Roman', 'Noto Serif TR', serif",
  sans: "'Inter', 'Segoe UI', system-ui, -apple-system, 'Noto Sans TR', sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace",
};

/**
 * p26-s5: `id` alanı bilerek geniş `string` tipindedir; ThemeCustomizer.tsx
 * içindeki FontChoiceData arayüzüyle birebir aynı şekildedir. Yapısal tip
 * sistemde `string[]` hedefine `{ id: FontFamilyChoice }[]` ataması sorunlu
 * senaryolara yol açabildiği için burada literal daraltma YAPILMAZ.
 */
export interface FontChoice {
  id: string;
  label: string;
}

export const FONT_CHOICES: FontChoice[] = [
  { id: 'serif', label: 'Serif (klasik)' },
  { id: 'sans', label: 'Sans (modern)' },
  { id: 'mono', label: 'Mono (makine)' },
];

export const LINE_HEIGHT_OPTIONS: number[] = [1.5, 1.7, 1.9, 2.1];

export interface FontSizeRange {
  min: number;
  max: number;
  step: number;
}

export const FONT_SIZE_RANGE: FontSizeRange = { min: 14, max: 24, step: 1 };

/* --- Tema uygulama motoru --- */

const THEME_STORAGE_KEY = 'openscriv-theme-v2';
const TYPO_STORAGE_KEY = 'openscriv-typography-v2';

export interface TypographyPrefs {
  fontFamily: string;
  fontSize: number; // px
  lineHeight: number;
}

export const DEFAULT_TYPOGRAPHY: TypographyPrefs = {
  fontFamily: 'serif',
  fontSize: 18,
  lineHeight: 1.9,
};

function isValidTheme(v: unknown): v is ThemeName {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(THEMES, v);
}

export function loadStoredTheme(): ThemeName {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return 'oxford-sepia';
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isValidTheme(raw) ? raw : 'oxford-sepia';
  } catch {
    return 'oxford-sepia';
  }
}

export function loadStoredTypography(): TypographyPrefs {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return DEFAULT_TYPOGRAPHY;
    const raw = window.localStorage.getItem(TYPO_STORAGE_KEY);
    if (!raw) return DEFAULT_TYPOGRAPHY;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_TYPOGRAPHY;
    const p = parsed as Partial<TypographyPrefs>;
    return {
      fontFamily:
        p.fontFamily === 'serif' || p.fontFamily === 'sans' || p.fontFamily === 'mono'
          ? p.fontFamily
          : DEFAULT_TYPOGRAPHY.fontFamily,
      fontSize:
        typeof p.fontSize === 'number' &&
        p.fontSize >= FONT_SIZE_RANGE.min &&
        p.fontSize <= FONT_SIZE_RANGE.max
          ? p.fontSize
          : DEFAULT_TYPOGRAPHY.fontSize,
      lineHeight:
        typeof p.lineHeight === 'number' && p.lineHeight >= 1 && p.lineHeight <= 3
          ? p.lineHeight
          : DEFAULT_TYPOGRAPHY.lineHeight,
    };
  } catch {
    return DEFAULT_TYPOGRAPHY;
  }
}

/** Tema token'larını ve tipografiyi CSS değişkeni olarak kök elemana yazar. */
export function applyThemeToDocument(themeName: ThemeName, typo: TypographyPrefs): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const def = THEMES[themeName];
  if (!def) return;

  (Object.keys(def.tokens) as Array<keyof ThemeTokens>).forEach((k) => {
    root.style.setProperty(k, def.tokens[k]);
  });

  root.setAttribute('data-theme', themeName);

  const stack =
    typo.fontFamily === 'sans'
      ? FONT_STACKS.sans
      : typo.fontFamily === 'mono'
        ? FONT_STACKS.mono
        : FONT_STACKS.serif;

  root.style.setProperty('--font-serif', stack);
  root.style.setProperty('--editor-font-size', `${typo.fontSize}px`);
  root.style.setProperty('--editor-line-height', String(typo.lineHeight));
  root.style.colorScheme =
    themeName === 'midnight-velvet' || themeName === 'emerald-scholar' ? 'dark' : 'light';
}

export function storeTheme(name: ThemeName): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(THEME_STORAGE_KEY, name);
    }
  } catch {
    /* sessiz */
  }
}

export function storeTypography(t: TypographyPrefs): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(TYPO_STORAGE_KEY, JSON.stringify(t));
    }
  } catch {
    /* sessiz */
  }
}
