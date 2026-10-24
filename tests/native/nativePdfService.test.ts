/**
 * Tests for Native Chromium Vector PDF & Typeset Printing
 * Phase 111: Yerel Chromium Vektörel PDF ve Matbaa Baskı Motoru (printToPDF)
 */

import { describe, it, expect, vi } from 'vitest';
import { NativePdfService } from '../../src/services/native/nativePdfService';

const { BOOK_PAGE_PRESETS } = require('../../electron/pdfPrinter.cjs');

describe('Phase 111: Native Chromium Vector PDF & Print Engine', () => {
  it('provides standard trade paperback and literary page presets', () => {
    expect(BOOK_PAGE_PRESETS.novel6x9).toBeDefined();
    expect(BOOK_PAGE_PRESETS.novel6x9.pageSize).toEqual({ width: 6.0, height: 9.0 });
    // İç kenar boşluğu (Gutter margin) en az 0.85" olmalı (cilt dikişi için)
    expect(BOOK_PAGE_PRESETS.novel6x9.margins.left).toBeGreaterThanOrEqual(0.85);

    expect(BOOK_PAGE_PRESETS.a5).toBeDefined();
    expect(BOOK_PAGE_PRESETS.a4).toBeDefined();
  });

  it('calculates physical dimensions in millimeters for print shop layout', () => {
    const dims = NativePdfService.getPresetDimensions();
    expect(dims.novel6x9.widthMm).toBe(152.4);
    expect(dims.novel6x9.heightMm).toBe(228.6);
    expect(dims.novel6x9.gutterMm).toBeGreaterThanOrEqual(20);
  });

  it('rejects empty HTML content with clear error', async () => {
    const res = await NativePdfService.generateVectorPdf('');
    expect(res.ok).toBe(false);
    expect(res.error).toBe('İçerik boş olamaz.');
  });

  it('generates vector PDF via IPC contract with file path and size', async () => {
    window.electronAPI = {
      invoke: vi.fn(async (channel: string, payload: any) => {
        if (channel === 'pdf:print-vector') {
          return {
            ok: true,
            path: payload.targetPath || 'D:/Kitap.pdf',
            sizeBytes: 154200,
          };
        }
        return { ok: true };
      }),
    } as any;

    const res = await NativePdfService.generateVectorPdf(
      '<h1>Bölüm 1</h1><p>Metin gövdesi...</p>',
      'novel6x9',
      'D:/Roman_Baski.pdf'
    );

    expect(res.ok).toBe(true);
    expect(res.path).toBe('D:/Roman_Baski.pdf');
    expect(res.sizeBytes).toBeGreaterThan(1000);
  });
});
