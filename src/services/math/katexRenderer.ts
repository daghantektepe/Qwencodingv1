/**
 * katexRenderer.ts — Faz 76: Metin İçi Matematik ve Formül Desteği (LaTeX / KaTeX Math Typesetting)
 */

export interface MathFormula {
  id: string;
  latex: string;
  isBlock: boolean;
  renderedHtml: string;
  mathMl: string;
}

export class KatexRenderer {
  private greekMap: Record<string, string> = {
    '\\alpha': 'α',
    '\\beta': 'β',
    '\\gamma': 'γ',
    '\\delta': 'δ',
    '\\epsilon': 'ε',
    '\\theta': 'θ',
    '\\lambda': 'λ',
    '\\mu': 'μ',
    '\\pi': 'π',
    '\\sigma': 'σ',
    '\\omega': 'ω',
    '\\Delta': 'Δ',
    '\\Sigma': 'Σ',
    '\\Omega': 'Ω',
  };

  private symbolMap: Record<string, string> = {
    '\\pm': '±',
    '\\times': '×',
    '\\div': '÷',
    '\\neq': '≠',
    '\\leq': '≤',
    '\\geq': '≥',
    '\\approx': '≈',
    '\\infty': '∞',
    '\\sum': '∑',
    '\\int': '∫',
    '\\cdot': '·',
    '\\to': '→',
    '\\leftarrow': '←',
    '\\Rightarrow': '⇒',
  };

  /**
   * LaTeX kodunu temizler ve güvenli hale getirir
   */
  public sanitizeLatex(latex: string): string {
    return latex.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /**
   * LaTeX ifadesini semantik MathML formatına derler
   */
  public renderToMathML(latex: string, isBlock = false): string {
    let clean = latex.trim();

    // Yunan harfleri ve semboller
    for (const [cmd, sym] of Object.entries(this.greekMap)) {
      clean = clean.split(cmd).join(`<mi>${sym}</mi>`);
    }
    for (const [cmd, sym] of Object.entries(this.symbolMap)) {
      clean = clean.split(cmd).join(`<mo>${sym}</mo>`);
    }

    // Karekök: \sqrt{x}
    clean = clean.replace(/\\sqrt\{([^}]+)\}/g, '<msqrt><mrow>$1</mrow></msqrt>');

    // Kesirler: \frac{a}{b}
    clean = clean.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<mfrac><mrow>$1</mrow><mrow>$2</mrow></mfrac>');

    // Üs: x^{2} veya x^2
    clean = clean.replace(/([a-zA-Z0-9\)])\^\{([^}]+)\}/g, '<msup><mi>$1</mi><mrow>$2</mrow></msup>');
    clean = clean.replace(/([a-zA-Z0-9\)])\^([a-zA-Z0-9])/g, '<msup><mi>$1</mi><mn>$2</mn></msup>');

    // Alt indis: x_{i} veya x_i
    clean = clean.replace(/([a-zA-Z0-9\)])_\{([^}]+)\}/g, '<msub><mi>$1</mi><mrow>$2</mrow></msub>');
    clean = clean.replace(/([a-zA-Z0-9\)])_([a-zA-Z0-9])/g, '<msub><mi>$1</mi><mn>$2</mn></msub>');

    const displayAttr = isBlock ? ' display="block"' : ' display="inline"';
    return `<math xmlns="http://www.w3.org/1998/Math/MathML"${displayAttr}>${clean}</math>`;
  }

  /**
   * LaTeX ifadesini görsel HTML ve CSS ile render edilecek öğeye dönüştürür.
   */
  public renderToHtml(latex: string, isBlock = false): string {
    let rendered = latex.trim();

    // Karekök: \sqrt{x}
    rendered = rendered.replace(
      /\\sqrt\{([^}]+)\}/g,
      '<span class="katex-sqrt"><span class="katex-sqrt-sign">√</span><span class="katex-sqrt-content">$1</span></span>'
    );

    // \frac{a}{b} -> HTML kesir yapısı
    rendered = rendered.replace(
      /\\frac\{([^}]+)\}\{([^}]+)\}/g,
      '<span class="katex-frac"><span class="katex-num">$1</span><span class="katex-denom">$2</span></span>'
    );

    // Semboller
    for (const [cmd, sym] of Object.entries(this.greekMap)) {
      rendered = rendered.split(cmd).join(sym);
    }
    for (const [cmd, sym] of Object.entries(this.symbolMap)) {
      rendered = rendered.split(cmd).join(sym);
    }

    // Üsler: x^2 veya x^{2a}
    rendered = rendered.replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>');
    rendered = rendered.replace(/\^([a-zA-Z0-9])/g, '<sup>$1</sup>');

    // Alt indisler: x_1 veya x_{min}
    rendered = rendered.replace(/_\{([^}]+)\}/g, '<sub>$1</sub>');
    rendered = rendered.replace(/_([a-zA-Z0-9])/g, '<sub>$1</sub>');

    const wrapperClass = isBlock
      ? 'katex-formula-block my-3 p-3 bg-slate-950/80 border border-cyan-800/60 rounded-xl text-center text-cyan-200 font-serif text-sm shadow-inner'
      : 'katex-formula-inline px-1.5 py-0.5 bg-slate-800/80 border border-slate-700/80 rounded text-cyan-300 font-serif text-xs inline-block align-baseline';

    return `<span class="${wrapperClass}" data-latex="${encodeURIComponent(latex)}" data-block="${isBlock}">${rendered}</span>`;
  }

  /**
   * Metindeki $...$ (inline) ve $$...$$ (block) formüllerini tespit eder
   */
  public extractFormulas(text: string): Array<{
    raw: string;
    latex: string;
    isBlock: boolean;
    startIndex: number;
    endIndex: number;
  }> {
    const results: Array<{
      raw: string;
      latex: string;
      isBlock: boolean;
      startIndex: number;
      endIndex: number;
    }> = [];

    // Önce blok formülleri tara ($$ ... $$)
    const blockRegex = /\$\$([\s\S]*?)\$\$/g;
    let match: RegExpExecArray | null;

    const blockIndices: Array<[number, number]> = [];

    while ((match = blockRegex.exec(text)) !== null) {
      results.push({
        raw: match[0],
        latex: match[1].trim(),
        isBlock: true,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
      blockIndices.push([match.index, match.index + match[0].length]);
    }

    // Ardından inline formülleri tara ($ ... $) - blokların içinde olmayanlar
    const inlineRegex = /\$([^$\n]+?)\$/g;
    while ((match = inlineRegex.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      // Blok içinde mi kontrol et
      const inBlock = blockIndices.some(([bStart, bEnd]) => start >= bStart && end <= bEnd);
      if (!inBlock) {
        results.push({
          raw: match[0],
          latex: match[1].trim(),
          isBlock: false,
          startIndex: start,
          endIndex: end,
        });
      }
    }

    return results.sort((a, b) => a.startIndex - b.startIndex);
  }

  /**
   * Tüm metindeki matematik ifadelerini derleyip HTML çıktısını üretir
   */
  public renderDocumentMath(text: string): string {
    const formulas = this.extractFormulas(text);
    if (formulas.length === 0) return text;

    let res = text;
    // Ters sırada yerleştir ki index kayması olmasın
    const sortedDesc = [...formulas].sort((a, b) => b.startIndex - a.startIndex);
    for (const f of sortedDesc) {
      const html = this.renderToHtml(f.latex, f.isBlock);
      res = res.slice(0, f.startIndex) + html + res.slice(f.endIndex);
    }
    return res;
  }
}

export const katexRenderer = new KatexRenderer();
export default katexRenderer;
