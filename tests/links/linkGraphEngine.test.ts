import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import linkGraphEngine from '../../src/services/links/linkGraphEngine';
import BacklinksPanel from '../../src/components/Links/BacklinksPanel';
import LinkHoverCard from '../../src/components/Links/LinkHoverCard';

describe('Phase 55: Wiki-Style Cross-References & Link Graph Engine', () => {
  beforeEach(() => {
    linkGraphEngine.clear();
  });

  describe('Wiki Link Parser', () => {
    it('parses standard wiki links and aliased links from text', () => {
      const text =
        'Kahraman gizlice [[Kütüphane Mahzeni]]ne indi ve [[Eski Günlük|Büyükbabanın Notları]]nı buldu. ' +
        'Orada [[Ahmet]] ile karşılaştı.';

      const links = linkGraphEngine.parseLinks(text, 'doc-1', 'Bölüm 1');

      expect(links.length).toBe(3);
      expect(links[0].target).toBe('Kütüphane Mahzeni');
      expect(links[0].alias).toBeUndefined();

      expect(links[1].target).toBe('Eski Günlük');
      expect(links[1].alias).toBe('Büyükbabanın Notları');

      expect(links[2].target).toBe('Ahmet');
      expect(links[0].contextSnippet).toContain('Kütüphane Mahzeni');
    });
  });

  describe('Link Graph & Backlinks Retrieval', () => {
    it('indexes documents and returns incoming backlinks', () => {
      // Doc 1 mentions "Karakter: Elif" and "Bölüm 2"
      linkGraphEngine.updateDocument(
        'doc-1',
        'Bölüm 1: Giriş',
        'Bu sahnede [[Karakter: Elif]] belirir ve [[Bölüm 2]]ye giden yol açılır.'
      );

      // Doc 3 also mentions "Karakter: Elif"
      linkGraphEngine.updateDocument(
        'doc-3',
        'Bölüm 3: Zirve',
        'Son anda [[Karakter: Elif]] yardıma koşar.'
      );

      const backlinksForElif = linkGraphEngine.getBacklinks('Karakter: Elif');
      expect(backlinksForElif.length).toBe(2);

      const sources = backlinksForElif.map((b) => b.sourceDocTitle);
      expect(sources).toContain('Bölüm 1: Giriş');
      expect(sources).toContain('Bölüm 3: Zirve');
    });
  });

  describe('Automatic Title Refactoring (Renaming sync)', () => {
    it('renames links across documents while preserving aliases', () => {
      const docs = [
        { id: '1', content: 'Giriş: [[Karanlık Kule]] yaklaştı.' },
        { id: '2', content: 'Not: [[Karanlık Kule|Uğursuz Tepe]] burasıdır.' },
        { id: '3', content: 'Bu belgede başka bir [[Orman]] var.' },
      ];

      const refactored = linkGraphEngine.refactorLinkTitles('Karanlık Kule', 'Aydınlık Şato', docs);

      expect(refactored[0].content).toBe('Giriş: [[Aydınlık Şato]] yaklaştı.');
      expect(refactored[0].updated).toBe(true);

      expect(refactored[1].content).toBe('Not: [[Aydınlık Şato|Uğursuz Tepe]] burasıdır.');
      expect(refactored[1].updated).toBe(true);

      expect(refactored[2].content).toBe('Bu belgede başka bir [[Orman]] var.');
      expect(refactored[2].updated).toBe(false);
    });
  });

  describe('BacklinksPanel UI Component', () => {
    it('renders list of backlinks and triggers navigation callback', () => {
      linkGraphEngine.updateDocument(
        'doc-source',
        'Kaynak Sahne',
        'Burada [[Hedef Doküman]] bağlantısı var.'
      );

      const onNavigate = vi.fn();
      render(
        React.createElement(BacklinksPanel, {
          currentDocId: 'doc-target',
          currentDocTitle: 'Hedef Doküman',
          onNavigateToDocument: onNavigate,
        })
      );

      expect(screen.getByText('Kaynak Sahne')).toBeDefined();
      const jumpBtn = screen.getByText('Git ↗');
      fireEvent.click(jumpBtn);

      expect(onNavigate).toHaveBeenCalledWith('doc-source');
    });
  });

  describe('LinkHoverCard UI Component', () => {
    it('renders preview card when visible', () => {
      render(
        React.createElement(LinkHoverCard, {
          targetTitle: 'Karanlık Orman',
          excerpt: 'Ağaçların arasından fısıltılar yükseliyordu.',
          wordCount: 1250,
          visible: true,
          position: { x: 100, y: 150 },
        })
      );

      expect(screen.getByText(/Karanlık Orman/)).toBeDefined();
      expect(screen.getByText(/1250 kelime/)).toBeDefined();
      expect(screen.getByText(/Ağaçların arasından/)).toBeDefined();
    });

    it('returns null when visible is false', () => {
      const { container } = render(
        React.createElement(LinkHoverCard, {
          targetTitle: 'Gizli Belge',
          visible: false,
        })
      );
      expect(container.firstChild).toBeNull();
    });
  });
});
