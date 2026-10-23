import { describe, it, expect, beforeEach } from 'vitest';
import {
  styleHeatmapEngine,
  DEFAULT_THRESHOLDS
} from '../../src/services/style/styleHeatmapEngine';
import { StyleHeatmapExtension } from '../../src/components/Editor/extensions/StyleHeatmapExtension';

describe('Phase 95: Readability & Style Heatmap Overlay', () => {
  beforeEach(() => {
    styleHeatmapEngine.resetThresholds();
  });

  describe('StyleHeatmapEngine Core Logic', () => {
    it('should classify short concise sentence as normal', () => {
      const text = 'Hava serindi. Rüzgar hafifçe esiyordu.';
      const result = styleHeatmapEngine.analyze(text);

      expect(result.totalSentences).toBe(2);
      expect(result.lengthyCount).toBe(0);
      expect(result.veryComplexCount).toBe(0);
      expect(result.readabilityScore).toBe(100);
      expect(result.sentences[0].level).toBe('normal');
    });

    it('should classify 22+ word sentence as lengthy (yellow)', () => {
      // 24 words
      const lengthyText =
        'Güneş ufukta yavaşça kaybolurken vadinin derinliklerinden yükselen sis bulutları kadim kalenin yüksek surlarını bir hayalet gibi sararak tüm manzarayı tamamen görünmez kılıyordu.';
      const result = styleHeatmapEngine.analyze(lengthyText);

      expect(result.totalSentences).toBe(1);
      expect(result.lengthyCount).toBe(1);
      expect(result.sentences[0].level).toBe('lengthy');
      expect(result.sentences[0].reason).toContain('Uzun cümle');
    });

    it('should classify 32+ word sentence as very complex (red)', () => {
      // 34 words
      const complexText =
        'Karanlık odada tek başına kalan yaşlı büyücü, asırlar önce unutulmuş olan o gizemli parşömeni açtı ve içindeki tılsımlı sözleri fısıldayarak rüzgarın fısıltılarını dinlemeye başladı, çünkü biliyordu ki yaklaşan tehlike tüm krallığı sonsuza dek yok edebilirdi.';
      const result = styleHeatmapEngine.analyze(complexText);

      expect(result.totalSentences).toBe(1);
      expect(result.veryComplexCount).toBe(1);
      expect(result.sentences[0].level).toBe('very_complex');
      expect(result.sentences[0].reason).toContain('Aşırı karmaşık');
    });

    it('should detect passive voice constructions in Turkish (purple)', () => {
      const passiveText = 'Bu önemli karar dün gece mecliste alındı.';
      const isPassive = styleHeatmapEngine.isPassiveVoice(passiveText);
      expect(isPassive).toBe(true);

      const result = styleHeatmapEngine.analyze(passiveText);
      expect(result.passiveCount).toBe(1);
      expect(result.sentences[0].level).toBe('passive');
    });

    it('should adjust thresholds dynamically', () => {
      styleHeatmapEngine.setThresholds({ lengthyThreshold: 10 });
      const text = 'Bu on iki kelimelik bir test cümlesidir ve eşiği geçmelidir.';
      const result = styleHeatmapEngine.analyze(text);

      expect(result.lengthyCount).toBe(1);
      expect(result.sentences[0].level).toBe('lengthy');
    });
  });

  describe('StyleHeatmapExtension TipTap Extension', () => {
    it('should define extension name and ProseMirror plugins', () => {
      expect(StyleHeatmapExtension.name).toBe('styleHeatmap');
      const extInstance = StyleHeatmapExtension.configure({
        enabled: true,
        thresholds: DEFAULT_THRESHOLDS
      });
      expect(extInstance).toBeDefined();
    });
  });
});
