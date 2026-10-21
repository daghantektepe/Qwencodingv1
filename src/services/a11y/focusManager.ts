/**
 * focusManager.ts — Faz 47: Odak Yönetimi, Focus Trap ve Klavye Navigasyonu
 */

export interface KeyboardShortcut {
  key: string;
  ctrlOrMeta?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

class FocusManager {
  private activeTrapContainer: HTMLElement | null = null;
  private previouslyFocusedElement: HTMLElement | null = null;
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private isListening = false;

  /**
   * Modallar ve diyaloglar için focus trap (odağı modal içinde tutma) kurar.
   */
  public trapFocus(container: HTMLElement): () => void {
    this.releaseFocusTrap();

    this.activeTrapContainer = container;
    this.previouslyFocusedElement = document.activeElement as HTMLElement;

    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !this.activeTrapContainer) return;

      const elements = this.getFocusableElements(this.activeTrapContainer);
      if (elements.length === 0) {
        e.preventDefault();
        return;
      }

      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      this.releaseFocusTrap();
    };
  }

  public releaseFocusTrap(): void {
    if (this.previouslyFocusedElement && typeof this.previouslyFocusedElement.focus === 'function') {
      try {
        this.previouslyFocusedElement.focus();
      } catch {
        // Fallback if element was detached
      }
    }
    this.activeTrapContainer = null;
    this.previouslyFocusedElement = null;
  }

  public getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const nodes = Array.from(container.querySelectorAll<HTMLElement>(selector));
    return nodes.filter((el) => {
      if (el.getAttribute('aria-hidden') === 'true') return false;
      if (el.style.display === 'none' || el.style.visibility === 'hidden') return false;
      return true;
    });
  }

  /**
   * Global klavye kısayolu kaydeder.
   */
  public registerShortcut(id: string, shortcut: KeyboardShortcut): void {
    this.shortcuts.set(id, shortcut);
    this.ensureGlobalListener();
  }

  public unregisterShortcut(id: string): void {
    this.shortcuts.delete(id);
  }

  public getAllShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  private ensureGlobalListener(): void {
    if (this.isListening || typeof window === 'undefined') return;

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      for (const [, sc] of this.shortcuts.entries()) {
        const matchesKey = e.key.toLowerCase() === sc.key.toLowerCase();
        const matchesCtrl = sc.ctrlOrMeta ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const matchesShift = Boolean(sc.shift) === e.shiftKey;
        const matchesAlt = Boolean(sc.alt) === e.altKey;

        if (matchesKey && matchesCtrl && matchesShift && matchesAlt) {
          e.preventDefault();
          sc.action();
          break;
        }
      }
    });

    this.isListening = true;
  }
}

export const focusManager = new FocusManager();
export default focusManager;
