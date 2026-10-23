import { describe, it, expect } from 'vitest';
import {
  ShowInvisiblesExtension,
  formatInvisibleCharacters,
} from '../../src/components/Editor/extensions/ShowInvisiblesExtension';
import { PageBreakExtension } from '../../src/components/Editor/extensions/PageBreakExtension';
import {
  AutoCapitalizeExtension,
  capitalizeSentences,
} from '../../src/components/Editor/extensions/AutoCapitalizeExtension';

describe('Rich Prose Extensions (Faz 86)', () => {
  describe('ShowInvisiblesExtension', () => {
    it('boşlukları nokta (·) ve satır sonlarını paragraf (¶) simgesiyle formatlar', () => {
      const input = 'Bu bir deneme metnidir.\nİkinci paragraf.';
      const output = formatInvisibleCharacters(input);

      expect(output).toContain('Bu·bir·deneme·metnidir.¶\nİkinci·paragraf.');
    });

    it('devre dışıyken metne dokunmaz', () => {
      const input = 'Düz metin boşluklu';
      const output = formatInvisibleCharacters(input, { enabled: false });
      expect(output).toBe(input);
    });

    it('TipTap extension doğru tanımlanmıştır', () => {
      expect(ShowInvisiblesExtension.name).toBe('showInvisibles');
      expect(ShowInvisiblesExtension.type).toBe('extension');
    });
  });

  describe('PageBreakExtension', () => {
    it('TipTap PageBreak node doğru yapılandırılmıştır', () => {
      expect(PageBreakExtension.name).toBe('pageBreak');
      expect(PageBreakExtension.type).toBe('node');
    });

    it('HTML etiket eşlemesi ve Mod-Enter kısayolu mevcuttur', () => {
      const shortcuts = PageBreakExtension.config.addKeyboardShortcuts?.call({} as any);
      expect(shortcuts).toBeDefined();
      expect(shortcuts?.['Mod-Enter']).toBeDefined();
    });
  });

  describe('AutoCapitalizeExtension', () => {
    it('cümle başlarını otomatik büyük harfe dönüştürür', () => {
      const input = 'merhaba dünya. burası ikinci cümle! peki ya bu? evet bu da.';
      const output = capitalizeSentences(input);

      expect(output).toBe('Merhaba dünya. Burası ikinci cümle! Peki ya bu? Evet bu da.');
    });

    it('Türkçe i ve ı harflerini kuralına uygun (İ / I) büyütür', () => {
      const input = 'istanbul çok güzel. ılık bir rüzgar esiyor.';
      const output = capitalizeSentences(input);

      expect(output).toBe('İstanbul çok güzel. Ilık bir rüzgar esiyor.');
    });

    it('yeni satır başlarındaki ilk harfleri büyütür', () => {
      const input = 'ilk paragraf.\nikinci satır burada.';
      const output = capitalizeSentences(input);

      expect(output).toBe('İlk paragraf.\nİkinci satır burada.');
    });

    it('TipTap extension doğru tanımlanmıştır', () => {
      expect(AutoCapitalizeExtension.name).toBe('autoCapitalize');
      expect(AutoCapitalizeExtension.type).toBe('extension');
    });
  });
});
