import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  toRoman,
  formatPageNumber,
  calculatePagination,
  PAGE_SIZES,
  PrintChapterInput,
} from '../../src/services/publish/paginationLayout';
import pdfPrintEngine from '../../src/services/publish/pdfPrintEngine';
import PdfPrintPreview from '../../src/components/Publish/PdfPrintPreview';

describe('Phase 52: Print-Ready PDF Engine & Pagination Suite', () => {
  const sampleChapters: PrintChapterInput[] = [
    {
      id: 'ch-1',
      title: 'Bölüm 1: Sisli Liman',
      content:
        'Denizin kokusu geceye karışıyordu. Eski taş iskelenin ucunda duran fener, ' +
        'dalgaların ritmiyle bir yanıp bir sönüyordu. Limandaki balıkçı tekneleri gıcırtılı ' +
        'seslerle birbirine çarpıyor, yaklaşan fırtınanın ilk habercisi rüzgar sokak aralarında uğulduyordu.\n\n' +
        'Kaptan yavaş adımlarla yürüyordu. Paltosunun yakasını kaldırmış, piposundan yükselen dumanı rüzgara bırakmıştı.',
    },
    {
      id: 'ch-2',
      title: 'Bölüm 2: Kırmızı Fener',
      content: 'Fenerin ışığı ansızın kızıla büründü. Ufukta beliren silüet artık gizlenemezdi.',
    },
  ];

  describe('Roman Numeral & Page Number Formatting', () => {
    it('converts numbers to lowercase and uppercase Roman numerals accurately', () => {
      expect(toRoman(1, false)).toBe('i');
      expect(toRoman(4, false)).toBe('iv');
      expect(toRoman(9, false)).toBe('ix');
      expect(toRoman(14, true)).toBe('XIV');
      expect(toRoman(40, true)).toBe('XL');
    });

    it('formats page numbers based on selected style', () => {
      expect(formatPageNumber(5, 'arabic')).toBe('5');
      expect(formatPageNumber(5, 'roman-lower')).toBe('v');
      expect(formatPageNumber(5, 'roman-upper')).toBe('V');
    });
  });

  describe('Pagination & Running Headers Layout Calculation', () => {
    it('calculates page distribution and alternate left/right page structure', () => {
      const pages = calculatePagination(sampleChapters, {
        bookTitle: 'Sisli Liman Günlükleri',
        authorName: 'Deniz Gezgin',
        wordsPerPage: 30, // Small page threshold for testing multi-page flow
      });

      expect(pages.length).toBeGreaterThanOrEqual(2);
      expect(pages[0].isChapterStart).toBe(true);
      expect(pages[0].chapterTitle).toBe('Bölüm 1: Sisli Liman');

      // Check running headers: left page should show author, right page should show book title
      pages.forEach((p) => {
        if (!p.isChapterStart && p.headerText) {
          if (p.isLeftPage) {
            expect(p.headerText).toBe('Deniz Gezgin');
          } else {
            expect(p.headerText).toBe('Sisli Liman Günlükleri');
          }
        }
      });
    });

    it('exposes standard print dimensions (Trade PB, Pocket, A5)', () => {
      expect(PAGE_SIZES['trade-pb'].widthMm).toBe(152.4);
      expect(PAGE_SIZES['pocket'].widthMm).toBe(127.0);
      expect(PAGE_SIZES['a5'].widthMm).toBe(148.0);
    });
  });

  describe('PdfPrintEngine PDF Document Generation', () => {
    it('returns error when chapters array is empty', async () => {
      const res = await pdfPrintEngine.generatePrintPdf([]);
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    });

    it('generates a multi-page print-ready jsPDF document successfully', async () => {
      const res = await pdfPrintEngine.generatePrintPdf(sampleChapters, {
        format: 'trade-pb',
        bookTitle: 'Sisli Liman',
        authorName: 'Yazar',
        wordsPerPage: 20,
      });

      expect(res.success).toBe(true);
      expect(res.pageCount).toBeGreaterThanOrEqual(2);
      expect(res.filename).toContain('.pdf');
      expect(res.pdfDoc).toBeDefined();
    });
  });

  describe('PdfPrintPreview Dual-Page Spread UI', () => {
    it('renders two pages side-by-side (Verso and Recto)', () => {
      const handleClose = vi.fn();

      render(
        React.createElement(PdfPrintPreview, {
          isOpen: true,
          onClose: handleClose,
          chapters: sampleChapters,
          initialOptions: { wordsPerPage: 20 },
        })
      );

      expect(screen.getByText(/Çift Sayfa Matbaa Önizleme/i)).toBeDefined();
      expect(screen.getByText(/Sonraki Çift Sayfa/i)).toBeDefined();
      expect(screen.getByText(/Önceki Çift Sayfa/i)).toBeDefined();

      const nextBtn = screen.getByText(/Sonraki Çift Sayfa/i);
      fireEvent.click(nextBtn);

      const closeBtn = screen.getByLabelText('Kapat');
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
