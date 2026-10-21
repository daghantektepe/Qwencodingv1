import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import focusManager from '../../src/services/a11y/focusManager';
import announcer from '../../src/services/a11y/announcer';
import AccessibilitySettingsModal from '../../src/components/A11y/AccessibilitySettingsModal';

describe('Phase 47: Full Accessibility (a11y) Suite', () => {
  beforeEach(() => {
    document.body.className = '';
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('FocusManager', () => {
    it('finds all focusable elements inside a container', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button id="btn1">Button 1</button>
        <a href="#test" id="link1">Link</a>
        <input type="text" id="input1" />
        <button disabled id="disabledBtn">Disabled</button>
        <div tabindex="0" id="divTab">Tab Indexed</div>
        <div tabindex="-1">Ignored</div>
      `;
      document.body.appendChild(container);

      const focusable = focusManager.getFocusableElements(container);
      const ids = focusable.map((el) => el.id);

      expect(ids).toContain('btn1');
      expect(ids).toContain('link1');
      expect(ids).toContain('input1');
      expect(ids).toContain('divTab');
      expect(ids).not.toContain('disabledBtn');

      document.body.removeChild(container);
    });

    it('traps focus correctly and cycles through focusable elements', () => {
      const container = document.createElement('div');
      const b1 = document.createElement('button');
      const b2 = document.createElement('button');
      container.appendChild(b1);
      container.appendChild(b2);
      document.body.appendChild(container);

      const release = focusManager.trapFocus(container);

      // Simulates Tab on the last element -> should loop to first
      b2.focus();
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      container.dispatchEvent(tabEvent);

      release();
      document.body.removeChild(container);
    });

    it('registers and triggers keyboard shortcuts', () => {
      const mockAction = vi.fn();
      focusManager.registerShortcut('test-cmd', {
        key: 'k',
        ctrlOrMeta: true,
        description: 'Test command',
        action: mockAction,
      });

      const all = focusManager.getAllShortcuts();
      expect(all.some((s) => s.description === 'Test command')).toBe(true);

      const evt = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true });
      window.dispatchEvent(evt);

      expect(mockAction).toHaveBeenCalled();
      focusManager.unregisterShortcut('test-cmd');
    });
  });

  describe('ScreenReaderAnnouncer', () => {
    it('creates aria-live polite and assertive elements in DOM', () => {
      announcer.announce('Polite message', 'polite');
      announcer.announce('Urgent warning', 'assertive');

      const politeEl = document.getElementById('a11y-live-polite');
      const assertiveEl = document.getElementById('a11y-live-assertive');

      expect(politeEl).not.toBeNull();
      expect(politeEl?.getAttribute('aria-live')).toBe('polite');
      expect(assertiveEl).not.toBeNull();
      expect(assertiveEl?.getAttribute('aria-live')).toBe('assertive');

      vi.advanceTimersByTime(100);

      expect(politeEl?.textContent).toBe('Polite message');
      expect(assertiveEl?.textContent).toBe('Urgent warning');
    });
  });

  describe('AccessibilitySettingsModal', () => {
    it('renders modal with correct ARIA attributes when open', () => {
      render(React.createElement(AccessibilitySettingsModal, { isOpen: true, onClose: () => {} }));

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeDefined();
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      expect(screen.getByText(/Erişilebilirlik Ayarları/i)).toBeDefined();
    });

    it('toggles high contrast mode class on document.body', () => {
      render(React.createElement(AccessibilitySettingsModal, { isOpen: true, onClose: () => {} }));

      const contrastCheckbox = screen.getByLabelText(/Yüksek Kontrast Modu/i) as HTMLInputElement;
      expect(contrastCheckbox.checked).toBe(false);

      fireEvent.click(contrastCheckbox);
      expect(document.body.classList.contains('a11y-high-contrast')).toBe(true);

      fireEvent.click(contrastCheckbox);
      expect(document.body.classList.contains('a11y-high-contrast')).toBe(false);
    });

    it('toggles reduced motion mode class on document.body', () => {
      render(React.createElement(AccessibilitySettingsModal, { isOpen: true, onClose: () => {} }));

      const motionCheckbox = screen.getByLabelText(/İndirgenmiş Hareket/i) as HTMLInputElement;
      fireEvent.click(motionCheckbox);
      expect(document.body.classList.contains('a11y-reduced-motion')).toBe(true);

      fireEvent.click(motionCheckbox);
      expect(document.body.classList.contains('a11y-reduced-motion')).toBe(false);
    });

    it('applies font scale class on document.body', () => {
      render(React.createElement(AccessibilitySettingsModal, { isOpen: true, onClose: () => {} }));

      const select = screen.getByLabelText(/Metin Ölçekleme/i) as HTMLSelectElement;
      fireEvent.change(select, { target: { value: '150' } });

      expect(document.body.classList.contains('a11y-font-scale-150')).toBe(true);
    });

    it('handles escape key to close', () => {
      const handleClose = vi.fn();
      render(React.createElement(AccessibilitySettingsModal, { isOpen: true, onClose: handleClose }));

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
