import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import {
  batchExporterService,
  BatchExportConfig
} from '../../src/services/publish/batchExporter';
import { BatchExportModal } from '../../src/components/Publish/BatchExportModal';

describe('Phase 97: Batch Multi-Format Exporter & Distribution Kit', () => {
  const sampleDocs = [
    { id: 'ch-1', title: 'Bölüm 1 - Başlangıç', content: 'Karanlık ormanda bir ışık parıldadı.' },
    { id: 'ch-2', title: 'Bölüm 2 - Dağ Yolu', content: 'Sisler dağılırken vadi göründü.' }
  ];

  const sampleConfig: BatchExportConfig = {
    formats: ['pdf', 'epub', 'docx', 'markdown', 'html', 'txt'],
    splitByChapter: false,
    includeCoverPage: true,
    includeTableOfContents: true,
    projectName: 'Eldoria',
    authorName: 'Daghan'
  };

  describe('BatchExporterService Core Logic', () => {
    it('should export all 6 formats simultaneously in unified file mode', async () => {
      const progressSteps: number[] = [];
      const result = await batchExporterService.exportAll(
        sampleDocs,
        sampleConfig,
        (pct) => progressSteps.push(pct)
      );

      expect(result.totalFiles).toBe(6);
      expect(result.files.length).toBe(6);
      expect(result.zipFilename).toContain('eldoria_dagitim_kiti');
      expect(progressSteps).toContain(100);

      // Verify each format file exists
      const formatsFound = result.files.map((f) => f.format);
      expect(formatsFound).toContain('pdf');
      expect(formatsFound).toContain('epub');
      expect(formatsFound).toContain('docx');
      expect(formatsFound).toContain('markdown');
      expect(formatsFound).toContain('html');
      expect(formatsFound).toContain('txt');

      // Verify HTML content structure
      const htmlFile = result.files.find((f) => f.format === 'html')!;
      expect(htmlFile.content).toContain('<!DOCTYPE html>');
      expect(htmlFile.content).toContain('Bölüm 1 - Başlangıç');
    });

    it('should split into separate files per chapter when splitByChapter is true', async () => {
      const splitConfig: BatchExportConfig = {
        ...sampleConfig,
        formats: ['markdown', 'txt'],
        splitByChapter: true
      };

      const result = await batchExporterService.exportAll(sampleDocs, splitConfig);

      // 2 docs * 2 formats = 4 files
      expect(result.totalFiles).toBe(4);
      expect(result.files.some((f) => f.filename.includes('ch01'))).toBe(true);
      expect(result.files.some((f) => f.filename.includes('ch02'))).toBe(true);
    });
  });

  describe('BatchExportModal UI Component', () => {
    it('should render format options and allow toggling formats', () => {
      render(<BatchExportModal documents={sampleDocs} projectName="Eldoria" />);

      expect(screen.getByText('Toplu Dışa Aktarma ve Dağıtım Kiti Sihirbazı')).toBeDefined();
      expect(screen.getByText('Baskı PDF')).toBeDefined();
      expect(screen.getByText('EPUB 3 E-Kitap')).toBeDefined();
      expect(screen.getByText('Microsoft Word')).toBeDefined();

      // Click to toggle Word format off
      const docxBox = screen.getByText('Microsoft Word');
      fireEvent.click(docxBox);
      expect(screen.getByText(/5 seçili/i)).toBeDefined();
    });

    it('should execute export and display success kit download button', async () => {
      render(<BatchExportModal documents={sampleDocs} projectName="Eldoria" />);

      const exportBtn = screen.getByRole('button', { name: /Tüm Formatlarda Dışa Aktar/i });
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(screen.getByText(/Dağıtım Kiti Hazır!/i)).toBeDefined();
        expect(screen.getByText('İndir')).toBeDefined();
      });
    });
  });
});
