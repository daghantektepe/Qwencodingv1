/**
 * smartPunctuation.ts — Faz 75: Tipografik Düzeltmeler ve Akıllı Tırnak Motoru
 */

export type QuoteStyle = 'curly' | 'guillemets' | 'german' | 'turkish';

export interface TypographyOptions {
  enabled: boolean;
  quoteStyle: QuoteStyle;
  smartQuotes: boolean;
  smartDashes: boolean;
  smartEllipses: boolean;
  smartApostrophes: boolean;
  smartFractions: boolean;
}

export const DEFAULT_TYPOGRAPHY_OPTIONS: TypographyOptions = {
  enabled: true,
  quoteStyle: 'turkish',
  smartQuotes: true,
  smartDashes: true,
  smartEllipses: true,
  smartApostrophes: true,
  smartFractions: true,
};

const STORAGE_KEY = 'openscriv_typography_settings';

export class TypographyEngine {
  private options: TypographyOptions;
  private listeners = new Set<(opts: TypographyOptions) => void>();

  constructor() {
    this.options = this.loadSettings();
  }

  private loadSettings(): TypographyOptions {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          return { ...DEFAULT_TYPOGRAPHY_OPTIONS, ...JSON.parse(saved) };
        }
      }
    } catch {
      // Fallback
    }
    return { ...DEFAULT_TYPOGRAPHY_OPTIONS };
  }

  public getSettings(): TypographyOptions {
    return { ...this.options };
  }

  public updateSettings(partial: Partial<TypographyOptions>): void {
    this.options = { ...this.options, ...partial };
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.options));
      }
    } catch {
      // Ignore
    }
    this.listeners.forEach((l) => l(this.options));
  }

  public subscribe(listener: (opts: TypographyOptions) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Tırnak stiline göre açma ve kapama çift tırnaklarını verir.
   */
  public getQuoteChars(style: QuoteStyle): { open: string; close: string } {
    switch (style) {
      case 'guillemets':
        return { open: '«', close: '»' };
      case 'german':
        return { open: '„', close: '“' };
      case 'turkish':
      case 'curly':
      default:
        return { open: '“', close: '”' };
    }
  }

  /**
   * Tekil kesme/tırnak stili
   */
  public getSingleQuoteChars(style: QuoteStyle): { open: string; close: string } {
    switch (style) {
      case 'german':
        return { open: '‚', close: '‘' };
      default:
        return { open: '‘', close: '’' };
    }
  }

  /**
   * Yazım anındaki tuş vuruşunu değerlendirir (canlı editör için).
   * Eğer dönüşüm gerekiyorsa yerine geçecek karakteri ve geriye doğru silinecek karakter sayısını döner.
   */
  public handleInputTransform(
    textBeforeCursor: string,
    insertedChar: string,
    overrideOpts?: Partial<TypographyOptions>
  ): { transformedChar: string; charsToDeleteCount: number } | null {
    const opts = { ...this.options, ...overrideOpts };
    if (!opts.enabled) return null;

    const { open: openQuote, close: closeQuote } = this.getQuoteChars(opts.quoteStyle);
    const { open: openSingle, close: closeSingle } = this.getSingleQuoteChars(opts.quoteStyle);

    // 1. Çift Tırnak Dönüşümü
    if (opts.smartQuotes && insertedChar === '"') {
      const prevChar = textBeforeCursor.slice(-1);
      const isStart = !prevChar || /\s|[\(\[\{<]/.test(prevChar);
      return {
        transformedChar: isStart ? openQuote : closeQuote,
        charsToDeleteCount: 0,
      };
    }

    // 2. Tek Tırnak / Kesme İşareti Dönüşümü
    if (opts.smartApostrophes && insertedChar === "'") {
      const prevChar = textBeforeCursor.slice(-1);
      const isStart = !prevChar || /\s|[\(\[\{<]/.test(prevChar);
      return {
        transformedChar: isStart ? openSingle : closeSingle,
        charsToDeleteCount: 0,
      };
    }

    // 3. Üç Nokta (Elipsis) Dönüşümü (.. + . -> …)
    if (opts.smartEllipses && insertedChar === '.') {
      if (textBeforeCursor.endsWith('..')) {
        return {
          transformedChar: '…',
          charsToDeleteCount: 2, // '..' silinip yerine '…' konur
        };
      }
    }

    // 4. Uzun Tire (Em-dash) Dönüşümü (- + - -> —)
    if (opts.smartDashes && insertedChar === '-') {
      if (textBeforeCursor.endsWith('-')) {
        return {
          transformedChar: '—',
          charsToDeleteCount: 1, // Önceki '-' silinip yerine '—' konur
        };
      }
    }

    // 5. Kesirler
    if (opts.smartFractions && insertedChar === '/') {
      // Beklemede, tam sayı girildiğinde batch formatlanır
    }

    return null;
  }

  /**
   * Tüm metni baştan sona tipografik kurallara göre standartlaştırır.
   */
  public formatPunctuation(text: string, overrideOpts?: Partial<TypographyOptions>): string {
    const opts = { ...this.options, ...overrideOpts };
    if (!opts.enabled || !text) return text;

    let res = text;
    const { open: openQuote, close: closeQuote } = this.getQuoteChars(opts.quoteStyle);
    const { open: openSingle, close: closeSingle } = this.getSingleQuoteChars(opts.quoteStyle);

    // Elipsis: 3 veya daha fazla noktayı tek karaktere dönüştür
    if (opts.smartEllipses) {
      res = res.replace(/\.{3,}/g, '…');
    }

    // Uzun tire (em-dash): --- veya -- veya iki boşluk arasındaki tire
    if (opts.smartDashes) {
      res = res.replace(/---/g, '—');
      res = res.replace(/--/g, '—');
    }

    // Kesirler (1/2 -> ½ vb.)
    if (opts.smartFractions) {
      res = res.replace(/\b1\/2\b/g, '½');
      res = res.replace(/\b1\/4\b/g, '¼');
      res = res.replace(/\b3\/4\b/g, '¾');
      res = res.replace(/\b1\/3\b/g, '⅓');
      res = res.replace(/\b2\/3\b/g, '⅔');
    }

    // Akıllı Tırnaklar: Çift tırnaklar
    if (opts.smartQuotes) {
      // Açılış tırnağı: başlangıçta veya boşluk/parantez sonrasında gelen "
      res = res.replace(/(^|[\s\(\[\{<])"/g, `$1${openQuote}`);
      // Kapanış tırnağı: geriye kalan düz çift tırnaklar
      res = res.replace(/"/g, closeQuote);
    }

    // Akıllı Kesme / Tek Tırnak:
    if (opts.smartApostrophes) {
      // Kelime ortası kesme işaretleri (örn: Ali'nin -> Ali’nin, isn't -> isn’t)
      res = res.replace(/(\w)'(\w)/g, `$1’$2`);
      // Açılış tek tırnağı
      res = res.replace(/(^|[\s\(\[\{<])'/g, `$1${openSingle}`);
      // Kapanış tek tırnağı
      res = res.replace(/'/g, closeSingle);
    }

    return res;
  }

  /**
   * Tüm projedeki veya seçili dokümanlardaki tipografiyi tek seferde standartlaştırır.
   */
  public standardizeProjectTypography(
    nodes: Array<{ id: string; content?: string }>
  ): Array<{ id: string; newContent: string; changesCount: number }> {
    return nodes.map((node) => {
      const original = node.content || '';
      const formatted = this.formatPunctuation(original);
      const changesCount = original !== formatted ? 1 : 0;
      return {
        id: node.id,
        newContent: formatted,
        changesCount,
      };
    });
  }
}

export const typographyEngine = new TypographyEngine();
export default typographyEngine;
