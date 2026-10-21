import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { searchIndexEngine } from '../../src/workers/searchIndexWorker';
import { performanceMonitor } from '../../src/services/performanceMonitor';
import VirtualScrivenings, { ScriveningsDocument } from '../../src/components/Virtual/VirtualScrivenings';

describe('Performance Benchmarks & Scaling', () => {
  beforeEach(() => {
    searchIndexEngine.clear();
    performanceMonitor.reset();
  });

  describe('SearchIndexEngine Inverted Index Benchmark', () => {
    it('indexes 500 documents rapidly and handles instant querying', () => {
      const mockDocs: Array<{ id: string; title: string; content: string }> = [];

      for (let i = 1; i <= 500; i++) {
        mockDocs.push({
          id: `doc-${i}`,
          title: `Bölüm ${i}: Fantastik Evrende Macera`,
          content: `Bu bir test metnidir. Karakter ${i} şehre vardı ve ejderha ile konuştu. Kitap boyunca önemli ipucu ${i * 42} saklandı.`,
        });
      }

      // Indexing duration
      const duration = searchIndexEngine.indexBulk(mockDocs);
      expect(duration).toBeLessThan(500); // Indexing 500 documents under 500ms
      expect(searchIndexEngine.getDocumentCount()).toBe(500);
      expect(searchIndexEngine.getTermCount()).toBeGreaterThan(20);

      // Search query benchmark
      const queryStart = performance.now();
      const results = searchIndexEngine.search('ejderha', 10);
      const queryDuration = performance.now() - queryStart;

      expect(queryDuration).toBeLessThan(20); // Sub-20ms search response
      expect(results.length).toBe(10);
      expect(results[0].snippet).toContain('ejderha');
    });

    it('ranks exact and frequent matches higher', () => {
      searchIndexEngine.indexDocument({
        id: 'doc-rare',
        title: 'Sıradan Gün',
        content: 'Burada sadece bir kez büyü kelimesi geçiyor.',
      });

      searchIndexEngine.indexDocument({
        id: 'doc-frequent',
        title: 'Büyücü Akademisi',
        content: 'Büyü yapmak zorlu bir sanattır. Antik büyü ritüelleri büyü gücünü artırır.',
      });

      const results = searchIndexEngine.search('büyü');
      expect(results.length).toBe(2);
      expect(results[0].docId).toBe('doc-frequent');
      expect(results[0].score).toBeGreaterThan(results[1].score);
    });
  });

  describe('PerformanceMonitor', () => {
    it('measures synchronous and calculates average/min/max metrics', () => {
      for (let i = 0; i < 5; i++) {
        performanceMonitor.measure('test-loop', () => {
          let sum = 0;
          for (let j = 0; j < 1000; j++) sum += j;
          return sum;
        });
      }

      const metric = performanceMonitor.getMetric('test-loop');
      expect(metric).toBeDefined();
      expect(metric?.count).toBe(5);
      expect(metric?.averageDurationMs).toBeGreaterThanOrEqual(0);
      expect(metric?.totalDurationMs).toBeGreaterThanOrEqual(0);
    });

    it('supports startTimer and endTimer', () => {
      performanceMonitor.startTimer('manual-op');
      const elapsed = performanceMonitor.endTimer('manual-op');
      expect(elapsed).toBeGreaterThanOrEqual(0);

      const metric = performanceMonitor.getMetric('manual-op');
      expect(metric?.count).toBe(1);
    });
  });

  describe('VirtualScrivenings DOM Virtualization', () => {
    it('renders only viewport slice when given 100 massive documents', () => {
      const docs: ScriveningsDocument[] = [];
      for (let i = 1; i <= 100; i++) {
        docs.push({
          id: `scriv-${i}`,
          title: `Bölüm ${i}: Destansı Roman Parçası`,
          content: `Paragraf 1 metni. `.repeat(50),
          wordCount: 150,
        });
      }

      render(
        React.createElement(VirtualScrivenings, {
          documents: docs,
          height: 600,
          estimatedDocHeight: 300,
          overscan: 1,
        })
      );

      // Height 600 / 300 = 2 documents visible + overscan (1 above, 1 below) -> around 4 items rendered
      // Absolutely should NOT render all 100 documents in the DOM!
      const renderedTextareas = screen.getAllByRole('textbox');
      expect(renderedTextareas.length).toBeLessThan(10);
      expect(renderedTextareas.length).toBeGreaterThanOrEqual(2);
    });
  });
});
