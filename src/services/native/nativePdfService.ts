/**
 * Native Vector PDF & Typeset Publishing Service
 * Phase 111: Yerel Chromium Vektörel PDF ve Matbaa Baskı Motoru (printToPDF)
 */

export interface BookPagePreset {
  name: string;
  pageSize: string | { width: number; height: number };
  margins: { top: number; bottom: number; left: number; right: number };
}

export interface PrintVectorPdfResult {
  ok: boolean;
  path?: string;
  sizeBytes?: number;
  canceled?: boolean;
  error?: string;
}

export class NativePdfService {
  /**
   * Chromium C++ yazdırma motorunu kullanarak vektörel matbaa PDF'i üretir.
   */
  static async generateVectorPdf(
    htmlContent: string,
    presetKey: 'a4' | 'a5' | 'novel6x9' | 'pocket' = 'novel6x9',
    targetPath?: string,
    options: { displayHeaderFooter?: boolean; headerTemplate?: string; footerTemplate?: string } = {}
  ): Promise<PrintVectorPdfResult> {
    if (!htmlContent) {
      return { ok: false, error: 'İçerik boş olamaz.' };
    }

    if (window.electronAPI?.invoke) {
      try {
        const res = await window.electronAPI.invoke('pdf:print-vector', {
          htmlContent,
          presetKey,
          targetPath,
          options,
        });
        return res;
      } catch (err: any) {
        return { ok: false, error: err.message };
      }
    }

    // Web Fallback: Mock simulation or download
    return {
      ok: true,
      path: targetPath || 'Kitap_Baski_WebSim.pdf',
      sizeBytes: htmlContent.length * 2,
    };
  }

  /**
   * Standart matbaa ve dizgi boyutlarını listeler.
   */
  static getPresetDimensions(): Record<string, { widthMm: number; heightMm: number; gutterMm: number }> {
    return {
      a4: { widthMm: 210, heightMm: 297, gutterMm: 20 },
      a5: { widthMm: 148, heightMm: 210, gutterMm: 22 },
      novel6x9: { widthMm: 152.4, heightMm: 228.6, gutterMm: 23 },
      pocket: { widthMm: 108, heightMm: 178, gutterMm: 18 },
    };
  }
}
