import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  extractHeadings,
  DocumentOutlineHUD,
} from '../../src/components/Navigation/DocumentOutlineHUD';
import { EditorMiniMap } from '../../src/components/Navigation/EditorMiniMap';

describe('DocumentOutlineHUD (Faz 82)', () => {
  const sampleMarkdown = `
# Bölüm 1: Londra'da Bir Gece
Giriş paragrafı burada başlıyor.

## Dedektifin Ofisi
Dedektif masasında oturuyordu.

### İpucu A
Masanın üstünde bir mektup vardı.

# Bölüm 2: Kovalamaca
Tren garına doğru koştular.
  `.trim();

  it('markdown başlıklarını doğru hiyerarşi ve satır numaralarıyla ayıklar', () => {
    const headings = extractHeadings(sampleMarkdown);
    expect(headings.length).toBe(4);

    expect(headings[0].text).toBe("Bölüm 1: Londra'da Bir Gece");
    expect(headings[0].level).toBe(1);
    expect(headings[0].line).toBe(1);

    expect(headings[1].text).toBe('Dedektifin Ofisi');
    expect(headings[1].level).toBe(2);

    expect(headings[2].text).toBe('İpucu A');
    expect(headings[2].level).toBe(3);

    expect(headings[3].text).toBe('Bölüm 2: Kovalamaca');
    expect(headings[3].level).toBe(1);
  });

  it('HTML başlık etiketlerini (<h1>, <h2>) de ayıklar', () => {
    const htmlContent = '<h1>Kitap Başlığı</h1>\n<p>Metin</p>\n<h2>Alt Başlık</h2>';
    const headings = extractHeadings(htmlContent);
    expect(headings.length).toBe(2);
    expect(headings[0].text).toBe('Kitap Başlığı');
    expect(headings[0].level).toBe(1);
    expect(headings[1].text).toBe('Alt Başlık');
    expect(headings[1].level).toBe(2);
  });

  it('DocumentOutlineHUD bileşeni başlıkları listeler ve tıklandığında navigasyonu tetikler', () => {
    const onNavigate = vi.fn();
    render(
      <DocumentOutlineHUD
        content={sampleMarkdown}
        onNavigateToHeading={onNavigate}
      />
    );

    expect(screen.getByText('İçindekiler Haritası')).toBeDefined();
    expect(screen.getByText("Bölüm 1: Londra'da Bir Gece")).toBeDefined();
    expect(screen.getByText('Dedektifin Ofisi')).toBeDefined();

    const headingBtn = screen.getByText('Dedektifin Ofisi');
    fireEvent.click(headingBtn);

    expect(onNavigate).toHaveBeenCalled();
    expect(onNavigate.mock.calls[0][0].text).toBe('Dedektifin Ofisi');
  });

  it('daraltma (collapse) ve genişletme butonları çalışır', () => {
    render(<DocumentOutlineHUD content={sampleMarkdown} />);

    const collapseBtn = screen.getByTitle('Daralt');
    fireEvent.click(collapseBtn);

    // Daraltılmış ikon butonu belirir
    const expandBtn = screen.getByTitle('Başlık Haritasını Genişlet');
    expect(expandBtn).toBeDefined();

    fireEvent.click(expandBtn);
    expect(screen.getByText('İçindekiler Haritası')).toBeDefined();
  });
});

describe('EditorMiniMap Component', () => {
  it('EditorMiniMap doğru satır sayısını ve lens overlayini gösterir', () => {
    const onScrollChange = vi.fn();
    const text = 'Satır 1\nSatır 2\n# Başlık\nSatır 4\nSatır 5';

    render(
      <EditorMiniMap
        text={text}
        currentLine={3}
        scrollPercent={40}
        onScrollChange={onScrollChange}
      />
    );

    const minimap = screen.getByTestId('editor-minimap');
    expect(minimap).toBeDefined();
    expect(screen.getByTestId('minimap-viewport-lens')).toBeDefined();
    expect(screen.getByTestId('minimap-cursor-indicator')).toBeDefined();
    expect(screen.getByText('5s')).toBeDefined();

    // Tıklayarak kaydırma
    fireEvent.click(minimap);
    expect(onScrollChange).toHaveBeenCalled();
  });
});
