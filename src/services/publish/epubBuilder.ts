/**
 * epubBuilder.ts — Faz 51: EPUB 3 Standartlarına Uygun E-Kitap Derleyici
 */

import JSZip from 'jszip';
import {
  EpubMetadata,
  EpubChapter,
  generateContainerXml,
  generatePackageOpf,
  generateNavXhtml,
  generateChapterXhtml,
  generateEpubCss,
} from './epubMetadata';

export interface EpubBuildResult {
  success: boolean;
  filename: string;
  blob?: Blob;
  uint8Array?: Uint8Array;
  error?: string;
}

export class EpubBuilderService {
  /**
   * Standartlara uygun EPUB 3 zip paketini oluşturur.
   */
  public async buildEpub(
    metadata: EpubMetadata,
    chapters: EpubChapter[]
  ): Promise<EpubBuildResult> {
    if (!metadata.title || !metadata.title.trim()) {
      return { success: false, filename: '', error: 'Kitap başlığı boş olamaz.' };
    }
    if (!chapters || chapters.length === 0) {
      return { success: false, filename: '', error: 'Derlenecek en az bir bölüm bulunmalıdır.' };
    }

    try {
      const zip = new JSZip();

      // 1. mimetype (EPUB standardı gereği SIKILMASIZ / STORE ve paketin İLK dosyası olmalı)
      zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

      // 2. META-INF/container.xml
      zip.folder('META-INF')?.file('container.xml', generateContainerXml());

      // 3. OEBPS klasörü
      const oebps = zip.folder('OEBPS');
      if (!oebps) {
        throw new Error('OEBPS dizini oluşturulamadı.');
      }

      // 3.1 content.opf
      oebps.file('content.opf', generatePackageOpf(metadata, chapters));

      // 3.2 nav.xhtml (EPUB 3 Table of Contents)
      oebps.file('nav.xhtml', generateNavXhtml(metadata, chapters));

      // 3.3 style.css
      oebps.file('style.css', generateEpubCss());

      // 3.4 Bölümler (OEBPS/chapters/)
      const chaptersFolder = oebps.folder('chapters');
      chapters.forEach((ch, idx) => {
        const chapterXhtml = generateChapterXhtml(ch, metadata.language || 'tr');
        chaptersFolder?.file(`chapter_${idx + 1}.xhtml`, chapterXhtml);
      });

      // 4. Binary blob ve uint8Array üretimi
      const safeTitle = metadata.title.replace(/[^a-zA-Z0-9_\-\u00C0-\u017F]/g, '_').toLowerCase();
      const filename = `${safeTitle || 'kitap'}.epub`;

      let blob: Blob | undefined;
      let uint8Array: Uint8Array | undefined;

      if (typeof Blob !== 'undefined') {
        blob = await zip.generateAsync({
          type: 'blob',
          mimeType: 'application/epub+zip',
          compression: 'DEFLATE',
          compressionOptions: { level: 9 },
        });
      }

      uint8Array = await zip.generateAsync({
        type: 'uint8array',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 },
      });

      return {
        success: true,
        filename,
        blob,
        uint8Array,
      };
    } catch (err: any) {
      return {
        success: false,
        filename: '',
        error: err?.message || 'EPUB oluşturulurken bilinmeyen hata oluştu.',
      };
    }
  }
}

export const epubBuilder = new EpubBuilderService();
export default epubBuilder;
