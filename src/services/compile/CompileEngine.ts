/**
 * CompileEngine - Ana Derleme Motoru
 * Worker thread benzeri async processing ile UI kilitlemeden çalışır
 * Hata durumunda cleanup yapar ve net hata mesajı verir
 */

import { compileToMarkdown, compileToHTML, type CompileOptions as BaseCompileOptions, type DocumentNode } from '../markdownCompiler';
import { exportToPDF, downloadPDF, type PDFOptions } from './exporters/pdfExporter';
import { exportToEPUB, downloadEPUB, type EPUBOptions } from './exporters/epubExporter';
import { DEFAULT_CSS } from './templates/default.css';
import type {
  CompileRequest,
  CompileResult,
  CompileProgress,
  ProgressCallback,
  CompileSettings,
  FormatInfo,
  ExportFormat,
  ICompileEngine,
} from '../../types/compile';
import { SUPPORTED_FORMATS } from '../../types/compile';

// Re-export types for consumers
export type {
  CompileRequest,
  CompileResult,
  CompileProgress,
  ProgressCallback,
  CompileSettings,
  FormatInfo,
  ExportFormat,
  ICompileEngine,
};
export type CompileFormat = ExportFormat;

const STORAGE_KEY = 'scrivener_compile_settings';

/**
 * Chunked async processing - UI'ı kilitlemeden çalışır
 */
async function processChunked<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  onProgress?: (current: number, total: number) => void,
  chunkSize: number = 5
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map((item, idx) => processor(item, i + idx))
    );
    results.push(...chunkResults);
    
    onProgress?.(Math.min(i + chunkSize, items.length), items.length);
    
    // Yield to main thread
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  return results;
}

/**
 * Ana derleme fonksiyonu - async worker benzeri çalışır
 */
export async function compileDocuments(
  request: CompileRequest,
  onProgress?: ProgressCallback
): Promise<CompileResult> {
  const startTime = performance.now();
  let tempBlob: Blob | null = null;

  try {
    onProgress?.({ stage: 'Hazırlanıyor...', percent: 0 });

    // Ayarları kaydet
    saveCompileSettings(request);

    // Validate input
    if (!request.documents || request.documents.length === 0) {
      throw new Error('Derlenecek belge bulunamadı');
    }

    if (!request.title || request.title.trim() === '') {
      throw new Error('Belge başlık bilgisi boş olamaz');
    }

    // Yield to main thread before starting heavy work
    await new Promise(resolve => setTimeout(resolve, 0));

    const baseOptions: BaseCompileOptions = {
      title: request.title,
      author: request.author,
      includeTitlePage: request.includeTitlePage ?? true,
      includeTOC: request.includeTOC ?? true,
      format: request.format as BaseCompileOptions['format'],
      cssTemplate: request.cssTemplate || DEFAULT_CSS,
    };

    let blob: Blob;
    let filename: string;
    const safeTitle = sanitizeFilename(request.title);

    onProgress?.({ stage: 'Derleme başlatılıyor...', percent: 5 });

    switch (request.format) {
      case 'txt': {
        onProgress?.({ stage: 'Metin derleniyor...', percent: 10 });
        
        const processedDocs = await processChunked(
          request.documents,
          async (doc, index) => {
            onProgress?.({
              stage: `Belge ${index + 1}/${request.documents.length} işleniyor...`,
              percent: 10 + (index / request.documents.length) * 70,
              currentDoc: index + 1,
              totalDocs: request.documents.length,
            });
            return doc;
          },
          undefined,
          3
        );

        const md = compileToMarkdown(processedDocs, baseOptions);
        const plainText = stripMarkdown(md);
        blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
        filename = `${safeTitle}.txt`;
        break;
      }

      case 'md': {
        onProgress?.({ stage: 'Markdown derleniyor...', percent: 10 });
        
        const processedDocs = await processChunked(
          request.documents,
          async (doc, index) => {
            onProgress?.({
              stage: `Belge ${index + 1}/${request.documents.length} işleniyor...`,
              percent: 10 + (index / request.documents.length) * 70,
              currentDoc: index + 1,
              totalDocs: request.documents.length,
            });
            return doc;
          },
          undefined,
          3
        );

        const markdown = compileToMarkdown(processedDocs, baseOptions);
        blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        filename = `${safeTitle}.md`;
        break;
      }

      case 'html': {
        onProgress?.({ stage: 'HTML derleniyor...', percent: 10 });
        
        const processedDocs = await processChunked(
          request.documents,
          async (doc, index) => {
            onProgress?.({
              stage: `Belge ${index + 1}/${request.documents.length} işleniyor...`,
              percent: 10 + (index / request.documents.length) * 70,
              currentDoc: index + 1,
              totalDocs: request.documents.length,
            });
            return doc;
          },
          undefined,
          3
        );

        const html = compileToHTML(processedDocs, baseOptions);
        blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        filename = `${safeTitle}.html`;
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
          onProgress?.({
            stage: 'PDF oluşturuluyor...',
            percent: 10 + (p / 100) * 80,
          });
        });
        
        tempBlob = blob;
        filename = `${safeTitle}.pdf`;
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
          onProgress?.({
            stage: 'EPUB oluşturuluyor...',
            percent: 10 + (p / 100) * 80,
          });
        });
        
        tempBlob = blob;
        filename = `${safeTitle}.epub`;
        break;
      }

      default:
        throw new Error(`Desteklenmeyen format: ${request.format}`);
    }

    onProgress?.({ stage: 'Tamamlandı', percent: 100 });

    const duration = performance.now() - startTime;

    return {
      success: true,
      blob,
      filename,
      format: request.format,
      duration,
    };
  } catch (error) {
    // Cleanup on error - discard partial blob
    if (tempBlob) {
      tempBlob = null;
    }

    const message = error instanceof Error ? error.message : 'Bilinmeyen derleme hatası';
    console.error('[CompileEngine] Compilation failed:', error);
    
    return {
      success: false,
      error: message,
      format: request.format,
      duration: performance.now() - startTime,
    };
  }
}

/**
 * Derleme sonucunu dosya olarak indirir
 */
export function downloadCompileResult(result: CompileResult): void {
  if (!result.success || !result.blob || !result.filename) {
    console.error('[CompileEngine] Cannot download: invalid result', result);
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
      
      // Cleanup URL after download
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      break;
    }
  }
}

/**
 * Derleme ayarlarını localStorage'a kaydeder
 */
export function saveCompileSettings(settings: Partial<CompileRequest>): void {
  try {
    const existing = loadCompileSettings();
    const merged = { ...existing, ...settings };
    // Don't save documents, only settings
    const { documents, ...settingsOnly } = merged;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsOnly));
  } catch (e) {
    console.warn('[CompileEngine] Failed to save settings:', e);
  }
}

/**
 * Kaydedilmiş derleme ayarlarını yükler
 */
export function loadCompileSettings(): Partial<CompileSettings> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('[CompileEngine] Failed to load settings:', e);
  }
  return {};
}

/**
 * Desteklenen format listesini döndürür
 */
export function getSupportedFormats(): FormatInfo[] {
  return SUPPORTED_FORMATS;
}

/**
 * Dosya adını güvenli hale getirir
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s-_]/g, '')
    .replace(/\s+/g, '_')
    .trim() || 'export';
}

/**
 * Markdown işaretlerini kaldırır (düz metin için)
 */
function stripMarkdown(md: string): string {
  return md
    .replace(/^#+\s/gm, '')
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/---/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');
}

export { DEFAULT_CSS };
