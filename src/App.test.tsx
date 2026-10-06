import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    act(() => {
      render(<App />);
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('Brand', () => {
    it('should render the brand name "OpenScriv"', () => {
      const brandElement = screen.getByText('OpenScriv');
      expect(brandElement).toBeTruthy();
    });

    it('should render a header element', () => {
      const header = document.querySelector('header');
      expect(header).toBeTruthy();
    });
  });

  describe('Editor', () => {
    it('should render the editor textarea', () => {
      const textarea = document.querySelector('textarea');
      expect(textarea).toBeTruthy();
    });

    it('should render the editor with aria-label="Manuscript editor"', () => {
      const editor = document.querySelector('textarea[aria-label="Manuscript editor"]');
      expect(editor).toBeTruthy();
    });

    it('should render the editor with visible "Editör" text', () => {
      const editorLabel = screen.getByText('Editör');
      expect(editorLabel).toBeTruthy();
    });

    it('should render a main content area', () => {
      const main = document.querySelector('main');
      expect(main).toBeTruthy();
    });
  });

  describe('Binder', () => {
    it('should render the Binder sidebar with aria-label', () => {
      const binder = document.querySelector('aside.sidebar[aria-label="Binder"]');
      expect(binder).toBeTruthy();
      expect(binder?.tagName).toBe('ASIDE');
      expect(binder?.getAttribute('aria-label')).toBe('Binder');
    });
  });

  describe('Inspector', () => {
    it('should render the Inspector panel with aria-label', () => {
      const inspector = document.querySelector('aside[aria-label="Inspector"]');
      expect(inspector).toBeTruthy();
    });
  });

  describe('Search', () => {
    it('should render the Search input with aria-label="Arama Yap"', () => {
      const searchInput = screen.getByLabelText('Arama Yap');
      expect(searchInput).toBeTruthy();
      expect(searchInput.tagName).toBe('INPUT');
    });

    it('should render the Search input with role="button"', () => {
      const searchInput = screen.getByLabelText('Arama Yap');
      expect(searchInput.getAttribute('role')).toBe('button');
    });
  });

  describe('Compile', () => {
    it('should render the Compile window trigger', () => {
      const compileBtn = screen.getByLabelText('Toggle Compile Window');
      expect(compileBtn).toBeTruthy();
    });
  });
});
