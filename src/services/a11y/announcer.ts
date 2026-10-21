/**
 * announcer.ts — Faz 47: Ekran Okuyucu (Screen Reader) Live Region Anons Motoru
 *
 * NVDA, JAWS, VoiceOver ve Windows Narrator için aria-live bildirimleri sağlar.
 */

export type AnnouncePriority = 'polite' | 'assertive';

class ScreenReaderAnnouncer {
  private politeRegion: HTMLElement | null = null;
  private assertiveRegion: HTMLElement | null = null;

  constructor() {
    if (typeof document !== 'undefined') {
      this.initRegions();
    }
  }

  private initRegions(): void {
    if (this.politeRegion && this.assertiveRegion) return;

    this.politeRegion = document.getElementById('a11y-live-polite');
    if (!this.politeRegion) {
      this.politeRegion = document.createElement('div');
      this.politeRegion.id = 'a11y-live-polite';
      this.politeRegion.setAttribute('aria-live', 'polite');
      this.politeRegion.setAttribute('aria-atomic', 'true');
      this.applyOffscreenStyles(this.politeRegion);
      document.body.appendChild(this.politeRegion);
    }

    this.assertiveRegion = document.getElementById('a11y-live-assertive');
    if (!this.assertiveRegion) {
      this.assertiveRegion = document.createElement('div');
      this.assertiveRegion.id = 'a11y-live-assertive';
      this.assertiveRegion.setAttribute('aria-live', 'assertive');
      this.assertiveRegion.setAttribute('aria-atomic', 'true');
      this.applyOffscreenStyles(this.assertiveRegion);
      document.body.appendChild(this.assertiveRegion);
    }
  }

  private applyOffscreenStyles(el: HTMLElement): void {
    el.style.position = 'absolute';
    el.style.width = '1px';
    el.style.height = '1px';
    el.style.padding = '0';
    el.style.margin = '-1px';
    el.style.overflow = 'hidden';
    el.style.clip = 'rect(0, 0, 0, 0)';
    el.style.whiteSpace = 'nowrap';
    el.style.border = '0';
  }

  /**
   * Ekran okuyucuya anlık sesli anons gönderir.
   */
  public announce(message: string, priority: AnnouncePriority = 'polite'): void {
    if (!message.trim() || typeof document === 'undefined') return;
    this.initRegions();

    const target = priority === 'assertive' ? this.assertiveRegion : this.politeRegion;
    if (!target) return;

    // Önceki metni temizleyip küçük gecikmeyle eklemek ekran okuyucunun tetiklenmesini garanti eder
    target.textContent = '';
    setTimeout(() => {
      if (target) {
        target.textContent = message;
      }
    }, 50);
  }

  public getPoliteElement(): HTMLElement | null {
    this.initRegions();
    return this.politeRegion;
  }

  public getAssertiveElement(): HTMLElement | null {
    this.initRegions();
    return this.assertiveRegion;
  }
}

export const announcer = new ScreenReaderAnnouncer();
export default announcer;
