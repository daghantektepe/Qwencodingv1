/**
 * pdfPrintEngine.ts — Faz 52: Profesyonel Matbaa ve Dizgi PDF Motoru
 */

import { jsPDF } from 'jspdf';
import {
  calculatePagination,
  PaginationOptions,
  PrintChapterInput,
  PAGE_SIZES,
  PageFormat,
  PrintPage,
} from './paginationLayout';

export interface PdfPrintResult {
  success: boolean;
  filename: string;
  pageCount: number;
  pdfDoc?: jsPDF;
  blob?: Blob;
  error?: string;
}

export class PdfPrintEngine {
  /**
   * Standartlara uygun çift sayfa dizgi PDF belgesi üretir.
   */
  public async generatePrintPdf(
    chapters: PrintChapterInput[],
    options: PaginationOptions = {}
  ): Promise<PdfPrintResult> {
    if (!chapters || chapters.length === 0) {
      return { success: false, filename: '', pageCount: 0, error: 'Dizgi yapılacak bölüm bulunamadı.' };
    }

    try {
      const format: PageFormat = options.format || 'trade-pb';
      const dimensions = PAGE_SIZES[format] || PAGE_SIZES['trade-pb'];
      const pages = calculatePagination(chapters, options);

      const insideMarginMm = options.margins?.insideMm ?? 22; // Cilt payı (Gutter)
      const outsideMarginMm = options.margins?.outsideMm ?? 18;
      const topMarginMm = options.margins?.topMm ?? 20;
      const bottomMarginMm = options.margins?.bottomMm ?? 22;

      const doc = new jsPDF({
        unit: 'mm',
        format: [dimensions.widthMm, dimensions.heightMm],
        orientation: 'portrait',
      });

      pages.forEach((page, index) => {
        if (index > 0) {
          doc.addPage([dimensions.widthMm, dimensions.heightMm], 'portrait');
        }

        // Boş geçiş sayfası kontrolü
        if (page.paragraphs.length === 0 && !page.headerText) {
          return;
        }

        // Ayna kenar boşluğu hesabı:
        // Sol sayfa (Verso, çift no): Cilt sağdadır -> Sol = Outside, Sağ = Inside
        // Sağ sayfa (Recto, tek no): Cilt soldadır -> Sol = Inside, Sağ = Outside
        const leftMargin = page.isLeftPage ? outsideMarginMm : insideMarginMm;
        const textWidth = dimensions.widthMm - (insideMarginMm + outsideMarginMm);

        // 1. Üstbilgi (Running Header) — Bölümün ilk sayfasında üstbilgi basılmaz
        if (!page.isChapterStart && page.headerText) {
          doc.setFont('times', 'italic');
          doc.setFontSize(9);
          doc.setTextColor(80, 80, 80);

          if (page.isLeftPage) {
            // Sol sayfa: Başlık sola veya merkeze
            doc.text(page.headerText, dimensions.widthMm / 2, topMarginMm - 6, { align: 'center' });
          } else {
            // Sağ sayfa: Başlık merkeze
            doc.text(page.headerText, dimensions.widthMm / 2, topMarginMm - 6, { align: 'center' });
          }
        }

        // 2. Sayfa Numarası (Altbilgi)
        if (page.pageNumberFormatted) {
          doc.setFont('times', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(60, 60, 60);

          if (page.isLeftPage) {
            doc.text(page.pageNumberFormatted, leftMargin, dimensions.heightMm - bottomMarginMm + 8);
          } else {
            doc.text(page.pageNumberFormatted, dimensions.widthMm - outsideMarginMm, dimensions.heightMm - bottomMarginMm + 8, {
              align: 'right',
            });
          }
        }

        // 3. Bölüm Başlığı (Chapter Title)
        let currentY = topMarginMm;
        if (page.isChapterStart && page.chapterTitle) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(16);
          doc.setTextColor(20, 20, 20);
          currentY += 12;
          doc.text(page.chapterTitle, dimensions.widthMm / 2, currentY, { align: 'center' });
          currentY += 14;
        }

        // 4. Paragraf Metinleri
        doc.setFont('times', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(20, 20, 20);

        page.paragraphs.forEach((para) => {
          const lines = doc.splitTextToSize(para, textWidth);
          doc.text(lines, leftMargin, currentY);
          currentY += lines.length * 5.2 + 2.5; // Satır aralığı + paragraf boşluğu
        });
      });

      const safeTitle = (options.bookTitle || 'dizgi_kitap')
        .replace(/[^a-zA-Z0-9_\-\u00C0-\u017F]/g, '_')
        .toLowerCase();
      const filename = `${safeTitle}.pdf`;

      let blob: Blob | undefined;
      if (typeof Blob !== 'undefined') {
        blob = doc.output('blob');
      }

      return {
        success: true,
        filename,
        pageCount: pages.length,
        pdfDoc: doc,
        blob,
      };
    } catch (err: any) {
      return {
        success: false,
        filename: '',
        pageCount: 0,
        error: err?.message || 'PDF dizgi motoru hatası',
      };
    }
  }
}

export const pdfPrintEngine = new PdfPrintEngine();
export default pdfPrintEngine;
