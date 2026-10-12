/**
 * PDF Exporter Service
 * HTML içeriğini PDF formatına dönüştürür
 */

import { jsPDF } from 'jspdf';
import { compileToHTML, type CompileOptions, type DocumentNode } from '../../markdownCompiler';

export interface PDFOptions extends CompileOptions {
  pageSize?: 'a4' | 'letter' | 'a5';
  orientation?: 'portrait' | 'landscape';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  fontSize?: number;
  fontFamily?: string;
}

const DEFAULT_PDF_OPTIONS: Partial<PDFOptions> = {
  pageSize: 'a4',
  orientation: 'portrait',
  margins: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  },
  fontSize: 12,
  fontFamily: 'times',
};

/**
 * Document'leri PDF formatında dışa aktarır
 */
export async function exportToPDF(
  documents: DocumentNode[],
  options: PDFOptions,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const mergedOptions = { ...DEFAULT_PDF_OPTIONS, ...options };
  
  onProgress?.(10);

  // HTML oluştur
  const html = compileToHTML(documents, mergedOptions);
  
  onProgress?.(30);

  // PDF oluştur
  const pdf = new jsPDF({
    orientation: mergedOptions.orientation || 'portrait',
    unit: 'mm',
    format: mergedOptions.pageSize || 'a4',
  });

  onProgress?.(50);

  // Sayfa boyutları
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margins = mergedOptions.margins || DEFAULT_PDF_OPTIONS.margins!;
  
  const contentWidth = pageWidth - margins.left - margins.right;
  const contentHeight = pageHeight - margins.top - margins.bottom;

  // Document'leri sayfala
  let currentY = margins.top;
  let currentPage = 1;

  // Başlık sayfası
  if (mergedOptions.includeTitlePage) {
    pdf.setFontSize(28);
    pdf.setFont('times', 'bold');
    
    const titleLines = pdf.splitTextToSize(options.title, contentWidth);
    const titleHeight = titleLines.length * 12;
    
    const titleY = (pageHeight / 2) - (titleHeight / 2);
    pdf.text(titleLines, pageWidth / 2, titleY, { align: 'center' });
    
    if (options.author) {
      pdf.setFontSize(16);
      pdf.setFont('times', 'italic');
      pdf.text(options.author, pageWidth / 2, titleY + titleHeight + 10, { align: 'center' });
    }
    
    pdf.addPage();
    currentY = margins.top;
    currentPage++;
  }

  onProgress?.(60);

  // İçindekiler
  if (mergedOptions.includeTOC) {
    pdf.setFontSize(20);
    pdf.setFont('times', 'bold');
    pdf.text('İçindekiler', margins.left, currentY);
    currentY += 15;
    
    pdf.setFontSize(12);
    pdf.setFont('times', 'normal');
    
    documents.forEach((doc, index) => {
      if (currentY > pageHeight - margins.bottom) {
        pdf.addPage();
        currentY = margins.top;
        currentPage++;
      }
      
      const tocText = `${index + 1}. ${doc.title}`;
      pdf.text(tocText, margins.left, currentY);
      currentY += 8;
    });
    
    pdf.addPage();
    currentY = margins.top;
    currentPage++;
  }

  onProgress?.(70);

  // Document içerikleri
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    const progress = 70 + (i / documents.length) * 25;
    onProgress?.(progress);
    
    // Yeni sayfa
    if (i > 0) {
      pdf.addPage();
      currentY = margins.top;
      currentPage++;
    }
    
    // Başlık
    const level = doc.level || 1;
    const fontSize = level === 1 ? 24 : level === 2 ? 20 : 16;
    
    pdf.setFontSize(fontSize);
    pdf.setFont('times', 'bold');
    
    const titleLines = pdf.splitTextToSize(doc.title, contentWidth);
    
    // Sayfa kontrolü
    if (currentY + titleLines.length * (fontSize / 2) > pageHeight - margins.bottom) {
      pdf.addPage();
      currentY = margins.top;
      currentPage++;
    }
    
    pdf.text(titleLines, margins.left, currentY);
    currentY += titleLines.length * (fontSize / 2) + 5;
    
    // İçerik
    pdf.setFontSize(mergedOptions.fontSize || 12);
    pdf.setFont('times', 'normal');
    
    const contentLines = pdf.splitTextToSize(doc.content, contentWidth);
    
    for (const line of contentLines) {
      if (currentY > pageHeight - margins.bottom) {
        pdf.addPage();
        currentY = margins.top;
        currentPage++;
      }
      
      pdf.text(line, margins.left, currentY);
      currentY += 6;
    }
    
    currentY += 10;
  }

  onProgress?.(95);

  // Sayfa numaraları ekle
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(10);
    pdf.setFont('times', 'normal');
    pdf.text(
      `Sayfa ${i} / ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  onProgress?.(100);

  // Blob olarak döndür
  return pdf.output('blob');
}

/**
 * PDF'i dosya olarak indirir
 */
export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
