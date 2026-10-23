import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  typographyEngine,
  DEFAULT_TYPOGRAPHY_OPTIONS,
} from '../../src/services/typography/smartPunctuation';
import { TypographySettingsModal } from '../../src/components/Typography/TypographySettingsModal';

describe('TypographyEngine (Faz 75)', () => {
  beforeEach(() => {
    typographyEngine.updateSettings({ ...DEFAULT_TYPOGRAPHY_OPTIONS });
  });

  it('düz tırnakları Türkçe/İngilizce kıvrık tırnaklara (“ ”) dönüştürür', () => {
    const input = '"Bu bir alıntıdır" dedi yazar.';
    const output = typographyEngine.formatPunctuation(input);
    expect(output).toBe('“Bu bir alıntıdır” dedi yazar.');
  });

  it('guillemets (« ») stili seçildiğinde köşeli tırnaklara dönüştürür', () => {
    typographyEngine.updateSettings({ quoteStyle: 'guillemets' });
    const input = '"Fransızca tırnak" örneği.';
    const output = typographyEngine.formatPunctuation(input);
    expect(output).toBe('«Fransızca tırnak» örneği.');
  });

  it('Almanca stili („ “) seçildiğinde alttan tırnaklara dönüştürür', () => {
    typographyEngine.updateSettings({ quoteStyle: 'german' });
    const input = '"Almanca tırnak" örneği.';
    const output = typographyEngine.formatPunctuation(input);
    expect(output).toBe('„Almanca tırnak“ örneği.');
  });

  it('kelime içi kesme işaretini ve çift tireyi doğru dönüştürür', () => {
    const input = "Ali'nin kitabı -- çok ilginçti.";
    const output = typographyEngine.formatPunctuation(input);
    expect(output).toContain('Ali’nin');
    expect(output).toContain('—');
  });

  it('üç nokta ve kesirleri sembol karakterlerine dönüştürür', () => {
    const input = 'Bekliyorum... 1/2 bardak su ve 3/4 ölçek un.';
    const output = typographyEngine.formatPunctuation(input);
    expect(output).toContain('Bekliyorum…');
    expect(output).toContain('½');
    expect(output).toContain('¾');
  });

  it('motor devre dışıyken metne dokunmaz', () => {
    typographyEngine.updateSettings({ enabled: false });
    const input = '"Düz tırnak" ve ... ve -- tire';
    const output = typographyEngine.formatPunctuation(input);
    expect(output).toBe(input);
  });

  describe('handleInputTransform (Canlı Tuş Vuruşu)', () => {
    it('başlangıçta veya boşluktan sonra tırnak yazıldığında açılış tırnağı verir', () => {
      const res = typographyEngine.handleInputTransform('Cümle ', '"');
      expect(res).not.toBeNull();
      expect(res?.transformedChar).toBe('“');
      expect(res?.charsToDeleteCount).toBe(0);
    });

    it('harften sonra tırnak yazıldığında kapanış tırnağı verir', () => {
      const res = typographyEngine.handleInputTransform('Kelime', '"');
      expect(res).not.toBeNull();
      expect(res?.transformedChar).toBe('”');
    });

    it('iki nokta ardına üçüncü nokta yazıldığında elipsis karakterine dönüştürür', () => {
      const res = typographyEngine.handleInputTransform('Cümle sonu..', '.');
      expect(res).not.toBeNull();
      expect(res?.transformedChar).toBe('…');
      expect(res?.charsToDeleteCount).toBe(2);
    });

    it('tire ardına ikinci tire yazıldığında em-dash karakterine dönüştürür', () => {
      const res = typographyEngine.handleInputTransform('Ara söz -', '-');
      expect(res).not.toBeNull();
      expect(res?.transformedChar).toBe('—');
      expect(res?.charsToDeleteCount).toBe(1);
    });
  });

  describe('standardizeProjectTypography', () => {
    it('proje düğümlerindeki tipografiyi toplu dönüştürür', () => {
      const nodes = [
        { id: 'n1', content: '"Birinci metin..."' },
        { id: 'n2', content: 'Zaten temiz metin' },
        { id: 'n3', content: 'Ahmet\'in notu -- mühim' },
      ];

      const results = typographyEngine.standardizeProjectTypography(nodes);
      expect(results.length).toBe(3);
      expect(results[0].newContent).toBe('“Birinci metin…”');
      expect(results[0].changesCount).toBe(1);

      expect(results[1].changesCount).toBe(0);

      expect(results[2].newContent).toContain('Ahmet’in');
      expect(results[2].newContent).toContain('—');
      expect(results[2].changesCount).toBe(1);
    });
  });
});

describe('TypographySettingsModal Component', () => {
  it('isOpen false iken hiçbir şey render etmez', () => {
    const { container } = render(
      <TypographySettingsModal isOpen={false} onClose={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('modal açıldığında stil seçeneklerini ve önizlemeyi sunar', () => {
    const onClose = vi.fn();
    const onStandardize = vi.fn();

    render(
      <TypographySettingsModal
        isOpen={true}
        onClose={onClose}
        onStandardizeProject={onStandardize}
      />
    );

    expect(screen.getByText('Tipografi ve Akıllı Noktalama')).toBeDefined();
    expect(screen.getByText('«Köşeli»')).toBeDefined();
    expect(screen.getByText('„Alttan“')).toBeDefined();

    // Tüm projeyi standartlaştır butonu
    const standardizeBtn = screen.getByRole('button', {
      name: /Tüm Proje Metinlerini Standartlaştır/i,
    });
    fireEvent.click(standardizeBtn);
    expect(onStandardize).toHaveBeenCalled();

    // Tamam butonu
    const closeBtn = screen.getByRole('button', { name: /Tamam/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
