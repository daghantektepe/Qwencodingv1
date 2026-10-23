import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { katexRenderer } from '../../src/services/math/katexRenderer';
import { MathBlockExtension } from '../../src/components/Math/MathBlockExtension';
import { FormulaEditorModal } from '../../src/components/Math/FormulaEditorModal';

describe('KatexRenderer (Faz 76)', () => {
  it('inline matematik formülünü HTML ve üst simge ile derler', () => {
    const html = katexRenderer.renderToHtml('E = mc^2', false);
    expect(html).toContain('katex-formula-inline');
    expect(html).toContain('<sup>2</sup>');
    expect(html).toContain('data-latex="E%20%3D%20mc%5E2"');
  });

  it('blok matematik formülünde kesirleri (\\frac) ve karekökü (\\sqrt) doğru derler', () => {
    const html = katexRenderer.renderToHtml('\\frac{x + 1}{\\sqrt{y}}', true);
    expect(html).toContain('katex-formula-block');
    expect(html).toContain('katex-frac');
    expect(html).toContain('katex-num');
    expect(html).toContain('x + 1');
    expect(html).toContain('katex-sqrt');
  });

  it('Yunan harflerini ve matematik operatörlerini dönüştürür', () => {
    const html = katexRenderer.renderToHtml('\\alpha + \\beta \\pm \\infty', false);
    expect(html).toContain('α + β ± ∞');
  });

  it('semantik MathML çıktısını eksiksiz üretir', () => {
    const mathML = katexRenderer.renderToMathML('\\frac{a}{b}', true);
    expect(mathML).toContain('<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">');
    expect(mathML).toContain('<mfrac>');
    expect(mathML).toContain('<mrow>a</mrow>');
    expect(mathML).toContain('<mrow>b</mrow>');
  });

  it('metindeki $...$ inline ve $$...$$ blok formüllerini ayrıştırır', () => {
    const doc = 'Metin içinde $a + b$ inline formül ve altta:\n$$\\int_{0}^{1} x dx$$\nblok formülü vardır.';
    const extracted = katexRenderer.extractFormulas(doc);
    expect(extracted.length).toBe(2);

    expect(extracted[0].isBlock).toBe(false);
    expect(extracted[0].latex).toBe('a + b');

    expect(extracted[1].isBlock).toBe(true);
    expect(extracted[1].latex).toContain('\\int_{0}^{1} x dx');
  });

  it('renderDocumentMath tüm dokümandaki formülleri derler', () => {
    const doc = 'Einstein formülü $E = mc^2$ olarak bilinir.';
    const rendered = katexRenderer.renderDocumentMath(doc);
    expect(rendered).toContain('katex-formula-inline');
    expect(rendered).toContain('<sup>2</sup>');
    expect(rendered).toContain('olarak bilinir.');
  });
});


describe('MathBlockExtension (TipTap Node)', () => {
  it('TipTap extension doğru tanımlanmıştır', () => {
    expect(MathBlockExtension.name).toBe('mathBlock');
    expect(MathBlockExtension.type).toBe('node');
  });
});

describe('FormulaEditorModal Component', () => {
  it('isOpen false olduğunda render etmez', () => {
    const { container } = render(
      <FormulaEditorModal
        isOpen={false}
        onSave={() => {}}
        onClose={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('modal açıldığında hızlı sembol butonları ve formül kaydetme çalışır', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(
      <FormulaEditorModal
        isOpen={true}
        initialLatex="x = 5"
        initialIsBlock={true}
        onSave={onSave}
        onClose={onClose}
      />
    );

    expect(screen.getByText('LaTeX / KaTeX Matematik Formülü')).toBeDefined();

    // Hızlı sembol butonuna tıkla (örn: a/b)
    const fracBtn = screen.getByRole('button', { name: 'a/b' });
    fireEvent.click(fracBtn);

    // Kaydet butonuna tıkla
    const submitBtn = screen.getByRole('button', { name: /Formülü Ekle/i });
    fireEvent.click(submitBtn);

    expect(onSave).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
