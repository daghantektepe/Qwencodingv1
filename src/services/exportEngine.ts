/**
 * Export Engine - Ana Derleme ve Dışa Aktarma Motoru
 * Tüm export formatlarını yönetir ve koordine eder
 */

import { compileToMarkdown, compileToHTML, type CompileOptions, type DocumentNode } from './markdownCompiler';
import { exportToPDF, downloadPDF, type PDFOptions } from './pdfExporter';
import { exportToEPUB, downloadEPUB, type EPUBOptions } from './epubGenerator';

export type ExportFormat = 'txt' | 'md' | 'html' | 'pdf' | 'epub';

export interface ExportRequest {
  documents: DocumentNode[];
  format: ExportFormat;
  title: string;
  author?: string;
  includeTitlePage?: boolean;
  includeTOC?: boolean;
  cssTemplate?: string;
  // PDF-specific
  pageSize?: 'a4' | 'letter' | 'a5';
  orientation?: 'portrait' | 'landscape';
  // EPUB-specific
  language?: string;
  publisher?: string;
  description?: string;
}

export interface ExportResult {
  success: boolean;
  blob?: Blob;
  filename?: string;
  error?: string;
  format: ExportFormat;
}

export interface ExportProgress {
  stage: string;
  percent: number;
}

const STORAGE_KEY = 'scrivener_export_settings';

/**
 * Export ayarlarını localStorage'a kaydeder
 */
export function saveExportSettings(settings: Partial<ExportRequest>): void {
  try {
    const existing = loadExportSettings();
    const merged = { ...existing, ...settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (e) {
    console.warn('[ExportEngine] Failed to save settings:', e);
  }
}

/**
 * Kaydedilmiş export ayarlarını yükler
 */
export function loadExportSettings(): Partial<ExportRequest> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('[ExportEngine] Failed to load settings:', e);
  }
  return {};
}

/**
 * Ana export fonksiyonu - format'a göre uygun servisi çağırır
 */
export async function exportDocuments(
  request: ExportRequest,
  onProgress?: (progress: ExportProgress) => void
): Promise<ExportResult> {
  try {
    onProgress?.({ stage: 'Hazırlanıyor...', percent: 0 });

    // Ayarları kaydet
    saveExportSettings(request);

    const baseOptions: CompileOptions = {
      title: request.title,
      author: request.author,
      includeTitlePage: request.includeTitlePage ?? true,
      includeTOC: request.includeTOC ?? true,
      format: request.format as CompileOptions['format'],
      cssTemplate: request.cssTemplate,
    };

    let blob: Blob;
    let filename: string;
    const safeTitle = request.title.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s-]/g, '').trim() || 'export';

    switch (request.format) {
      case 'txt': {
        onProgress?.({ stage: 'Metin derleniyor...', percent: 20 });
        const md = compileToMarkdown(request.documents, baseOptions);
        // Markdown işaretlerini kaldır (düz metin)
        const plainText = md
          .replace(/^#+\s/gm, '')
          .replace(/\*\*(.+?)\*\*/g, '$1')
          .replace(/\*(.+?)\*/g, '$1')
          .replace(/---/g, '')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
        blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
        filename = `${safeTitle}.txt`;
        onProgress?.({ stage: 'Tamamlandı', percent: 100 });
        break;
      }

      case 'md': {
        onProgress?.({ stage: 'Markdown derleniyor...', percent: 20 });
        const markdown = compileToMarkdown(request.documents, baseOptions);
        blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        filename = `${safeTitle}.md`;
        onProgress?.({ stage: 'Tamamlandı', percent: 100 });
        break;
      }

      case 'html': {
        onProgress?.({ stage: 'HTML derleniyor...', percent: 20 });
        const html = compileToHTML(request.documents, baseOptions);
        blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        filename = `${safeTitle}.html`;
        onProgress?.({ stage: 'Tamamlandı', percent: 100 });
        break;
      }

      case 'pdf': {
        onProgress?.({ stage: 'PDF oluşturuluyor...', percent: 10 });
        const pdfOptions: PDFOptions = {
          ...baseOptions,
          pageSize: request.pageSize || 'a4',
          orientation: request.orientation || 'portrait',
        };
        blob = await exportToPDF(request.documents, pdfOptions, (p) => {
          onProgress?.({ stage: 'PDF oluşturuluyor...', percent: p });
        });
        filename = `${safeTitle}.pdf`;
        onProgress?.({ stage: 'Tamamlandı', percent: 100 });
        break;
      }

      case 'epub': {
        onProgress?.({ stage: 'EPUB oluşturuluyor...', percent: 10 });
        const epubOptions: EPUBOptions = {
          ...baseOptions,
          language: request.language || 'tr',
          publisher: request.publisher,
          description: request.description,
        };
        blob = await exportToEPUB(request.documents, epubOptions, (p) => {
          onProgress?.({ stage: 'EPUB oluşturuluyor...', percent: p });
        });
        filename = `${safeTitle}.epub`;
        onProgress?.({ stage: 'Tamamlandı', percent: 100 });
        break;
      }

      default:
        throw new Error(`Desteklenmeyen format: ${request.format}`);
    }

    return {
      success: true,
      blob,
      filename,
      format: request.format,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
    console.error('[ExportEngine] Export failed:', error);
    return {
      success: false,
      error: message,
      format: request.format,
    };
  }
}

/**
 * Export sonucunu dosya olarak indirir
 */
export function downloadExport(result: ExportResult): void {
  if (!result.success || !result.blob || !result.filename) {
    console.error('[ExportEngine] Cannot download: invalid result', result);
    return;
  }

  switch (result.format) {
    case 'pdf':
      downloadPDF(result.blob, result.filename);
      break;
    case 'epub':
      downloadEPUB(result.blob, result.filename);
      break;
    default: {
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      break;
    }
  }
}

/**
 * Desteklenen format listesini döndürür
 */
export function getSupportedFormats(): { value: ExportFormat; label: string; mime: string }[] {
  return [
    { value: 'pdf', label: 'PDF Belgesi', mime: 'application/pdf' },
    { value: 'epub', label: 'EPUB (e-Kitap)', mime: 'application/epub+zip' },
    { value: 'html', label: 'HTML Web Sayfası', mime: 'text/html' },
    { value: 'md', label: 'Markdown (.md)', mime: 'text/markdown' },
    { value: 'txt', label: 'Düz Metin (.txt)', mime: 'text/plain' },
  ];
}
