import { describe, it, expect } from 'vitest';
import { ProjectHealthAuditor } from '../../src/services/audit/projectHealthAuditor';
import { batchExporterService } from '../../src/services/publish/batchExporter';

describe('Phase 99: Large Project Scaling Stress Suite (10,000 Documents)', () => {
  it('should generate and index 10,000 document nodes under 2 seconds', () => {
    const start = performance.now();

    const massiveDocuments: { id: string; title: string; content: string; wordCount: number; synopsis: string }[] = [];
    for (let i = 0; i < 10000; i++) {
      massiveDocuments.push({
        id: `doc_${i}`,
        title: `Sahne ${i} - Büyük Kütüphane`,
        content: `Bu doküman devasa proje stres testinin ${i}. düğümüdür. Kurgu hızla ilerliyor.`,
        wordCount: 11,
        synopsis: `Sahne ${i} özeti.`
      });
    }

    const loadDuration = performance.now() - start;

    expect(massiveDocuments.length).toBe(10000);
    expect(loadDuration).toBeLessThan(2000); // Strict requirement: Under 2 seconds

    // Quick full project health audit over 10,000 documents
    const auditStart = performance.now();
    const auditReport = ProjectHealthAuditor.audit(massiveDocuments, []);
    const auditDuration = performance.now() - auditStart;

    expect(auditReport.documentCount).toBe(10000);
    expect(auditReport.wordCountTotal).toBe(110000);
    expect(auditDuration).toBeLessThan(1500); // 10,000 docs audited in sub-1.5s
  });

  it('should batch export large multi-chapter document sets without OOM or freezing', async () => {
    const chapters = Array.from({ length: 50 }, (_, i) => ({
      id: `ch_${i}`,
      title: `Bölüm ${i + 1}`,
      content: `Bölüm ${i + 1} edebi içeriği. `.repeat(30)
    }));

    const start = performance.now();
    const result = await batchExporterService.exportAll(chapters, {
      formats: ['markdown', 'txt'],
      splitByChapter: true,
      includeCoverPage: true,
      includeTableOfContents: true,
      projectName: 'Devasa Roman',
      authorName: 'Daghan'
    });
    const duration = performance.now() - start;

    expect(result.totalFiles).toBe(100); // 50 * 2 = 100 files
    expect(duration).toBeLessThan(1000); // Sub-1 second
  });
});
