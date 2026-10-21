import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import JSZip from 'jszip';
import {
  escapeXml,
  generateContainerXml,
  generatePackageOpf,
  generateNavXhtml,
  generateChapterXhtml,
  EpubMetadata,
  EpubChapter,
} from '../../src/services/publish/epubMetadata';
import epubBuilder from '../../src/services/publish/epubBuilder';
import EpubSettingsModal from '../../src/components/Publish/EpubSettingsModal';

describe('Phase 51: EPUB 3 Publishing & Kindle Pipeline', () => {
  const mockMetadata: EpubMetadata = {
    title: 'Karanlık Kütüphane & Ejderha',
    author: 'Elif Şafak & Ahmet Ümit',
    language: 'tr',
    publisher: 'Bağımsız Yayınevi',
    isbn: '978-605-1234-56-7',
    description: 'Büyülü bir kütüphanede geçen sürükleyici bir macera.',
  };

  const mockChapters: EpubChapter[] = [
    {
      id: 'ch-1',
      title: '1. Bölüm: Tozlu Raflar',
      content: 'Giriş paragrafı burada başlıyor.\n\nİkinci paragraf gizemli bir sesle devam ediyor.',
      order: 1,
    },
    {
      id: 'ch-2',
      title: '2. Bölüm: Fısıldayan Cilt',
      content: 'Gece yarısı fısıltılar yükseldi.',
      order: 2,
    },
  ];

  describe('XML and XHTML Generators', () => {
    it('escapes XML special characters properly', () => {
      const dangerous = 'Rock & Roll <music> "great" \'hit\'';
      const escaped = escapeXml(dangerous);
      expect(escaped).toBe('Rock &amp; Roll &lt;music&gt; &quot;great&quot; &apos;hit&apos;');
    });

    it('generates a valid container.xml pointing to OEBPS/content.opf', () => {
      const xml = generateContainerXml();
      expect(xml).toContain('full-path="OEBPS/content.opf"');
      expect(xml).toContain('media-type="application/oebps-package+xml"');
    });

    it('generates standard package.opf with metadata, manifest, and spine', () => {
      const opf = generatePackageOpf(mockMetadata, mockChapters);
      expect(opf).toContain('<dc:title>Karanlık Kütüphane &amp; Ejderha</dc:title>');
      expect(opf).toContain('<dc:creator>Elif Şafak &amp; Ahmet Ümit</dc:creator>');
      expect(opf).toContain('<dc:language>tr</dc:language>');
      expect(opf).toContain('<item id="nav" href="nav.xhtml"');
      expect(opf).toContain('<item id="chapter_1" href="chapters/chapter_1.xhtml"');
      expect(opf).toContain('<itemref idref="chapter_1"/>');
      expect(opf).toContain('<itemref idref="chapter_2"/>');
    });

    it('generates EPUB 3 nav.xhtml Table of Contents', () => {
      const nav = generateNavXhtml(mockMetadata, mockChapters);
      expect(nav).toContain('<nav epub:type="toc" id="toc">');
      expect(nav).toContain('href="chapters/chapter_1.xhtml"');
      expect(nav).toContain('1. Bölüm: Tozlu Raflar');
      expect(nav).toContain('2. Bölüm: Fısıldayan Cilt');
    });

    it('generates valid chapter XHTML with first-para class for drop caps', () => {
      const chapterXhtml = generateChapterXhtml(mockChapters[0], 'tr');
      expect(chapterXhtml).toContain('<h2>1. Bölüm: Tozlu Raflar</h2>');
      expect(chapterXhtml).toContain('<p class="first-para">Giriş paragrafı burada başlıyor.</p>');
      expect(chapterXhtml).toContain('<p>İkinci paragraf gizemli bir sesle devam ediyor.</p>');
    });
  });

  describe('EpubBuilderService ZIP Packaging', () => {
    it('rejects empty title or chapters with helpful error', async () => {
      const resultNoTitle = await epubBuilder.buildEpub({ title: '', author: 'A' }, mockChapters);
      expect(resultNoTitle.success).toBe(false);
      expect(resultNoTitle.error).toContain('Kitap başlığı boş olamaz');

      const resultNoChapters = await epubBuilder.buildEpub(mockMetadata, []);
      expect(resultNoChapters.success).toBe(false);
      expect(resultNoChapters.error).toContain('en az bir bölüm bulunmalıdır');
    });

    it('builds a compliant EPUB archive containing all required files', async () => {
      const buildResult = await epubBuilder.buildEpub(mockMetadata, mockChapters);

      expect(buildResult.success).toBe(true);
      expect(buildResult.filename).toContain('.epub');
      expect(buildResult.uint8Array).toBeDefined();

      // Read back the generated zip archive and verify its internal structure
      const zip = await JSZip.loadAsync(buildResult.uint8Array!);

      // 1. mimetype check
      const mimetypeFile = zip.file('mimetype');
      expect(mimetypeFile).not.toBeNull();
      const mimetypeText = await mimetypeFile?.async('string');
      expect(mimetypeText?.trim()).toBe('application/epub+zip');

      // 2. container.xml check
      const containerFile = zip.file('META-INF/container.xml');
      expect(containerFile).not.toBeNull();

      // 3. content.opf & nav.xhtml check
      expect(zip.file('OEBPS/content.opf')).not.toBeNull();
      expect(zip.file('OEBPS/nav.xhtml')).not.toBeNull();
      expect(zip.file('OEBPS/style.css')).not.toBeNull();

      // 4. Chapters check
      expect(zip.file('OEBPS/chapters/chapter_1.xhtml')).not.toBeNull();
      expect(zip.file('OEBPS/chapters/chapter_2.xhtml')).not.toBeNull();
    });
  });

  describe('EpubSettingsModal UI', () => {
    it('renders modal dialog and handles export trigger', async () => {
      const handleClose = vi.fn();
      const handleSuccess = vi.fn();

      render(
        React.createElement(EpubSettingsModal, {
          isOpen: true,
          onClose: handleClose,
          chapters: mockChapters,
          onExportSuccess: handleSuccess,
        })
      );

      const titleInput = screen.getByLabelText(/Kitap Başlığı/i) || screen.getByDisplayValue('Yeni E-Kitap');
      expect(titleInput).toBeDefined();

      const submitBtn = screen.getByText(/Standart EPUB 3 Üret/i);
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(handleSuccess).toHaveBeenCalled();
        expect(handleClose).toHaveBeenCalled();
      });
    });
  });
});
