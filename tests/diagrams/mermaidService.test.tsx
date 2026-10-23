import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { mermaidService } from '../../src/services/diagrams/mermaidService';
import { MermaidRenderer } from '../../src/components/Diagrams/MermaidRenderer';

describe('MermaidService (Faz 77)', () => {
  it('diyagram türlerini doğru tespit eder', () => {
    expect(mermaidService.detectType('graph TD\n A --> B')).toBe('flowchart');
    expect(mermaidService.detectType('flowchart LR\n A --> B')).toBe('flowchart');
    expect(mermaidService.detectType('sequenceDiagram\n A->>B: Selam')).toBe('sequence');
    expect(mermaidService.detectType('pie title "Oranlar"\n "A": 50')).toBe('pie');
    expect(mermaidService.detectType('bilinmeyenkod')).toBe('unknown');
  });

  it('boş veya geçersiz kodlarda sözdizimi hatası verir', () => {
    const emptyRes = mermaidService.validateSyntax('');
    expect(emptyRes.isValid).toBe(false);
    expect(emptyRes.error).toContain('boş olamaz');

    const invalidType = mermaidService.validateSyntax('rastgele yazi');
    expect(invalidType.isValid).toBe(false);
    expect(invalidType.error).toContain('Geçersiz veya desteklenmeyen');

    const unclosedBracket = mermaidService.validateSyntax('graph TD\n A[Başlangıç --> B');
    expect(unclosedBracket.isValid).toBe(false);
    expect(unclosedBracket.error).toContain('köşeli parantez');
  });

  it('geçerli akış şemasından SVG üretir', () => {
    const code = `
      graph TD
      A[Olayın Başlangıcı] --> B(Kritik Karar)
      B --> C{Dönüm Noktası}
    `;

    const svg = mermaidService.renderSvg(code);
    expect(svg).toContain('<svg');
    expect(svg).toContain('class="mermaid-svg');
    expect(svg).toContain('Olayın Başlangıcı');
    expect(svg).toContain('Kritik Karar');
    expect(svg).toContain('Dönüm Noktası');
  });

  it('sequence diyagramından katılımcılar ve mesaj çizgileri üretir', () => {
    const code = `
      sequenceDiagram
      participant Yazar
      participant Dedektif
      Yazar->>Dedektif: İpucunu açıkla
    `;

    const svg = mermaidService.renderSvg(code);
    expect(svg).toContain('<svg');
    expect(svg).toContain('Yazar');
    expect(svg).toContain('Dedektif');
    expect(svg).toContain('İpucunu açıkla');
  });

  it('pie diyagramından pasta dilimleri ve başlık üretir', () => {
    const code = `
      pie title "Bölüm Uzunlukları"
      "Giriş": 20
      "Gelişme": 60
      "Sonuç": 20
    `;

    const svg = mermaidService.renderSvg(code);
    expect(svg).toContain('Bölüm Uzunlukları');
    expect(svg).toContain('Giriş');
    expect(svg).toContain('Gelişme');
  });

  it('markdown metnindeki ```mermaid bloklarını ayıklar', () => {
    const md = 'Burada bir metin var:\n```mermaid\ngraph TD\nA --> B\n```\nSonrası.';
    const blocks = mermaidService.extractMermaidBlocks(md);
    expect(blocks.length).toBe(1);
    expect(blocks[0].code).toContain('graph TD');
  });
});

describe('MermaidRenderer Component', () => {
  it('geçerli kod verildiğinde SVG render eder', () => {
    const validCode = 'graph TD\n  Start[Başla] --> End[Bitir]';
    render(<MermaidRenderer code={validCode} />);

    expect(screen.getByTestId('mermaid-svg-container')).toBeDefined();
    expect(screen.getByText('Önizleme')).toBeDefined();
  });

  it('geçersiz sözdiziminde hata bildirimini gösterir', () => {
    const invalidCode = 'graph TD\n  Start[Bozuk Kod';
    render(<MermaidRenderer code={invalidCode} />);

    expect(screen.getByTestId('mermaid-error')).toBeDefined();
    expect(screen.getByText(/köşeli parantez/i)).toBeDefined();
  });

  it('şablon butonuna basıldığında kodu günceller ve onCodeChange tetikler', () => {
    const onCodeChange = vi.fn();
    render(<MermaidRenderer code="graph TD\n A --> B" onCodeChange={onCodeChange} />);

    const seqBtn = screen.getByRole('button', { name: /Diyalog \/ Sekans/i });
    fireEvent.click(seqBtn);

    expect(onCodeChange).toHaveBeenCalled();
    expect(onCodeChange.mock.calls[0][0]).toContain('sequenceDiagram');
  });

  it('SVG ve PNG dışa aktarma butonları mevcuttur', () => {
    render(<MermaidRenderer code="graph TD\n A --> B" />);
    expect(screen.getByTestId('export-svg-btn')).toBeDefined();
    expect(screen.getByTestId('export-png-btn')).toBeDefined();
  });
});
