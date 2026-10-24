export type BatchFormat = 'pdf' | 'epub' | 'docx' | 'markdown' | 'html' | 'txt';

export interface BatchExportConfig {
  formats: BatchFormat[];
  splitByChapter: boolean; // separate files per chapter vs single unified file
  includeCoverPage: boolean;
  includeTableOfContents: boolean;
  projectName: string;
  authorName: string;
}

export interface GeneratedBatchFile {
  format: BatchFormat;
  filename: string;
  content: string; // Text / markup / simulated binary
  sizeBytes: number;
}

export interface BatchExportResult {
  totalFiles: number;
  totalSizeBytes: number;
  files: GeneratedBatchFile[];
  zipFilename: string;
  timestamp: string;
}

export const ALL_BATCH_FORMATS: { id: BatchFormat; label: string; ext: string; desc: string }[] = [
  { id: 'pdf', label: 'Baskı PDF', ext: '.pdf', desc: 'Matbaa standardında mizanpajlı PDF çıktısı' },
  { id: 'epub', label: 'EPUB 3 E-Kitap', ext: '.epub', desc: 'Apple Books, Kobo ve Kindle uyumlu e-kitap' },
  { id: 'docx', label: 'Microsoft Word', ext: '.docx', desc: 'Yayınevleri ve editörler için standart Word belgesi' },
  { id: 'markdown', label: 'Markdown (.md)', ext: '.md', desc: 'Temiz, taşınabilir ve versiyonlanabilir saf Markdown' },
  { id: 'html', label: 'Web Yayını (HTML)', ext: '.html', desc: 'Kendi kendine yeten interaktif web kitapçığı' },
  { id: 'txt', label: 'Düz Metin (.txt)', ext: '.txt', desc: 'Evrensel salt metin çıktısı' }
];

export class BatchExporterService {
  /**
   * Generates single unified document content from chapters
   */
  private generateUnifiedText(
    documents: { title: string; content?: string }[],
    format: BatchFormat,
    cfg: BatchExportConfig
  ): string {
    const header = `# ${cfg.projectName}\nYazar: ${cfg.authorName}\n\n`;

    if (format === 'html') {
      let body = `<!DOCTYPE html>\n<html lang="tr">\n<head><meta charset="utf-8"><title>${cfg.projectName}</title><style>body{font-family:serif;max-width:750px;margin:40px auto;line-height:1.6;}</style></head>\n<body>\n<h1>${cfg.projectName}</h1>\n<p><em>${cfg.authorName}</em></p>\n<hr/>\n`;
      documents.forEach((d) => {
        body += `<section>\n<h2>${d.title}</h2>\n<p>${(d.content || '').replace(/\n\n/g, '</p><p>')}</p>\n</section>\n`;
      });
      body += `</body></html>`;
      return body;
    }

    if (format === 'markdown' || format === 'docx' || format === 'pdf') {
      let md = header;
      if (cfg.includeTableOfContents) {
        md += `## İçindekiler\n`;
        documents.forEach((d, i) => {
          md += `${i + 1}. ${d.title}\n`;
        });
        md += `\n---\n\n`;
      }
      documents.forEach((d) => {
        md += `## ${d.title}\n\n${d.content || ''}\n\n* * *\n\n`;
      });
      return md;
    }

    // Default TXT
    let txt = `${cfg.projectName.toUpperCase()}\nYazar: ${cfg.authorName}\n=========================================\n\n`;
    documents.forEach((d) => {
      txt += `\n[ ${d.title} ]\n-----------------------------------------\n${d.content || ''}\n\n`;
    });
    return txt;
  }

  /**
   * Executes batch export across all chosen formats.
   */
  public async exportAll(
    documents: { id: string; title: string; content?: string }[],
    config: BatchExportConfig,
    onProgress?: (progressPercent: number, currentFormat: BatchFormat) => void
  ): Promise<BatchExportResult> {
    const files: GeneratedBatchFile[] = [];
    const formats: BatchFormat[] = config.formats.length > 0
      ? config.formats
      : ['pdf', 'epub', 'docx', 'markdown', 'html', 'txt'];
    const totalFormats = formats.length;

    const baseName = config.projectName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');

    for (let i = 0; i < totalFormats; i++) {
      const fmt = formats[i];
      const percent = Math.round(((i + 1) / totalFormats) * 100);

      if (onProgress) {
        onProgress(percent, fmt);
      }

      if (config.splitByChapter) {
        // Individual files per chapter
        documents.forEach((doc, docIdx) => {
          const chapterNum = String(docIdx + 1).padStart(2, '0');
          const cleanTitle = doc.title.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
          const filename = `${baseName}_ch${chapterNum}_${cleanTitle}.${fmt}`;
          const content = this.generateUnifiedText([doc], fmt, config);
          files.push({
            format: fmt,
            filename,
            content,
            sizeBytes: content.length
          });
        });
      } else {
        // Single unified file
        const filename = `${baseName}_tam_metin.${fmt}`;
        const content = this.generateUnifiedText(documents, fmt, config);
        files.push({
          format: fmt,
          filename,
          content,
          sizeBytes: content.length
        });
      }
    }

    const totalSizeBytes = files.reduce((acc, f) => acc + f.sizeBytes, 0);
    const dateStr = new Date().toISOString().slice(0, 10);
    const zipFilename = `${baseName}_dagitim_kiti_${dateStr}.zip`;

    return {
      totalFiles: files.length,
      totalSizeBytes,
      files,
      zipFilename,
      timestamp: new Date().toISOString()
    };
  }
}

export const batchExporterService = new BatchExporterService();
