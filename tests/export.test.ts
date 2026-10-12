import { describe, it, expect, vi, beforeEach } from 'vitest';
import { compileToMarkdown, compileToHTML, markdownToHTML, type DocumentNode, type CompileOptions } from '../src/services/markdownCompiler';
import { compileDocuments, getSupportedFormats, saveCompileSettings, loadCompileSettings, type CompileRequest } from '../src/services/compile/CompileEngine';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const sampleDocs: DocumentNode[] = [
  { docId: 'ch1', title: 'Bölüm 1', content: 'İlk bölüm içeriği.', level: 1 },
  { docId: 'ch2', title: 'Bölüm 2', content: 'İkinci bölüm içeriği.', level: 1 },
];

const baseOptions: CompileOptions = {
  title: 'Test Kitabı',
  author: 'Test Yazar',
  includeTitlePage: true,
  includeTOC: true,
  format: 'html',
};

describe('markdownCompiler', () => {
  describe('compileToMarkdown', () => {
    it('should compile documents to markdown format', () => {
      const result = compileToMarkdown(sampleDocs, baseOptions);
      
      expect(result).toContain('# Test Kitabı');
      expect(result).toContain('*Test Yazar*');
      expect(result).toContain('## İçindekiler');
      expect(result).toContain('## Bölüm 1');
      expect(result).toContain('## Bölüm 2');
      expect(result).toContain('İlk bölüm içeriği.');
    });

    it('should exclude title page when option is false', () => {
      const result = compileToMarkdown(sampleDocs, { ...baseOptions, includeTitlePage: false });
      expect(result).not.toContain('# Test Kitabı');
    });

    it('should exclude TOC when option is false', () => {
      const result = compileToMarkdown(sampleDocs, { ...baseOptions, includeTOC: false });
      expect(result).not.toContain('İçindekiler');
    });
  });

  describe('compileToHTML', () => {
    it('should compile documents to HTML format', () => {
      const result = compileToHTML(sampleDocs, baseOptions);
      
      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('Test Kitabı');
      expect(result).toContain('Test Yazar');
      expect(result).toContain('Bölüm 1');
      expect(result).toContain('Bölüm 2');
    });

    it('should include CSS styles', () => {
      const result = compileToHTML(sampleDocs, baseOptions);
      expect(result).toContain('<style>');
      expect(result).toContain('font-family');
    });
  });

  describe('markdownToHTML', () => {
    it('should convert headings', () => {
      expect(markdownToHTML('# Başlık')).toContain('<h1>Başlık</h1>');
      expect(markdownToHTML('## Alt Başlık')).toContain('<h2>Alt Başlık</h2>');
    });

    it('should convert bold text', () => {
      expect(markdownToHTML('**kalın**')).toContain('<strong>kalın</strong>');
    });

    it('should convert italic text', () => {
      expect(markdownToHTML('*italik*')).toContain('<em>italik</em>');
    });
  });
});

describe('CompileEngine', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('getSupportedFormats', () => {
    it('should return all supported formats', () => {
      const formats = getSupportedFormats();
      
      expect(formats.length).toBe(5);
      expect(formats.map(f => f.value)).toContain('pdf');
      expect(formats.map(f => f.value)).toContain('epub');
      expect(formats.map(f => f.value)).toContain('html');
      expect(formats.map(f => f.value)).toContain('md');
      expect(formats.map(f => f.value)).toContain('txt');
    });

    it('should include icons for each format', () => {
      const formats = getSupportedFormats();
      formats.forEach(f => {
        expect(f.icon).toBeTruthy();
      });
    });
  });

  describe('saveCompileSettings / loadCompileSettings', () => {
    it('should save and load settings', () => {
      const settings = { title: 'My Book', format: 'pdf' as const };
      saveCompileSettings(settings);
      
      const loaded = loadCompileSettings();
      expect(loaded.title).toBe('My Book');
      expect(loaded.format).toBe('pdf');
    });

    it('should not save documents in settings', () => {
      const settings = { 
        title: 'My Book', 
        format: 'pdf' as const,
        documents: sampleDocs 
      };
      saveCompileSettings(settings);
      
      const loaded = loadCompileSettings();
      expect(loaded.documents).toBeUndefined();
    });
  });

  describe('compileDocuments', () => {
    it('should compile to TXT format', async () => {
      const request: CompileRequest = {
        documents: sampleDocs,
        format: 'txt',
        title: 'Test',
      };

      const result = await compileDocuments(request);
      
      expect(result.success).toBe(true);
      expect(result.format).toBe('txt');
      expect(result.blob).toBeTruthy();
      expect(result.filename).toContain('.txt');
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should compile to Markdown format', async () => {
      const request: CompileRequest = {
        documents: sampleDocs,
        format: 'md',
        title: 'Test',
      };

      const result = await compileDocuments(request);
      
      expect(result.success).toBe(true);
      expect(result.format).toBe('md');
      expect(result.blob).toBeTruthy();
      expect(result.filename).toContain('.md');
    });

    it('should compile to HTML format', async () => {
      const request: CompileRequest = {
        documents: sampleDocs,
        format: 'html',
        title: 'Test',
      };

      const result = await compileDocuments(request);
      
      expect(result.success).toBe(true);
      expect(result.format).toBe('html');
      expect(result.blob).toBeTruthy();
      expect(result.filename).toContain('.html');
    });

    it('should call progress callback', async () => {
      const onProgress = vi.fn();
      const request: CompileRequest = {
        documents: sampleDocs,
        format: 'txt',
        title: 'Test',
      };

      await compileDocuments(request, onProgress);
      
      expect(onProgress).toHaveBeenCalled();
      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({ 
          stage: expect.any(String),
          percent: expect.any(Number) 
        })
      );
    });

    it('should handle empty documents with error', async () => {
      const request: CompileRequest = {
        documents: [],
        format: 'txt',
        title: 'Empty',
      };

      const result = await compileDocuments(request);
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should handle empty title with error', async () => {
      const request: CompileRequest = {
        documents: sampleDocs,
        format: 'txt',
        title: '',
      };

      const result = await compileDocuments(request);
      expect(result.success).toBe(false);
      expect(result.error).toContain('başlık');
    });

    it('should report document-level progress', async () => {
      const onProgress = vi.fn();
      const request: CompileRequest = {
        documents: sampleDocs,
        format: 'md',
        title: 'Test',
      };

      await compileDocuments(request, onProgress);
      
      // Check that progress includes document info
      const callsWithDocInfo = onProgress.mock.calls.filter(
        (call) => call[0].currentDoc !== undefined
      );
      expect(callsWithDocInfo.length).toBeGreaterThan(0);
    });

    it('should sanitize filename correctly', async () => {
      const request: CompileRequest = {
        documents: sampleDocs,
        format: 'txt',
        title: 'Test Kitabı! @#$%',
      };

      const result = await compileDocuments(request);
      expect(result.filename).not.toContain('!');
      expect(result.filename).not.toContain('@');
      expect(result.filename).not.toContain('#');
    });
  });
});
