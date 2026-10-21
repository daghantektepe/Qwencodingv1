/**
 * vimModeExtension.ts — Faz 70: Vim Modal Düzenleme Motoru
 */

export type VimMode = 'normal' | 'insert' | 'visual';

export interface VimState {
  isEnabled: boolean;
  mode: VimMode;
  cursorOffset: number;
}

export class VimModeExtension {
  private isEnabled: boolean = false;
  private mode: VimMode = 'normal';
  private cursorOffset: number = 0;
  private listeners = new Set<(state: VimState) => void>();

  public subscribe(listener: (state: VimState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.mode = 'normal';
    this.notify();
  }

  public getState(): VimState {
    return {
      isEnabled: this.isEnabled,
      mode: this.mode,
      cursorOffset: this.cursorOffset,
    };
  }

  public setMode(mode: VimMode): void {
    this.mode = mode;
    this.notify();
  }

  public handleKey(key: string, text: string): { newText: string; newCursor: number; handled: boolean } {
    if (!this.isEnabled) {
      return { newText: text, newCursor: this.cursorOffset, handled: false };
    }

    // Esc tuşu her zaman normal moda döndürür
    if (key === 'Escape') {
      this.mode = 'normal';
      this.notify();
      return { newText: text, newCursor: this.cursorOffset, handled: true };
    }

    if (this.mode === 'insert') {
      // Insert modunda standart yazmaya izin ver
      return { newText: text, newCursor: this.cursorOffset, handled: false };
    }

    // Normal Mod Tuş Eylemleri
    let newCursor = this.cursorOffset;
    let newText = text;

    switch (key) {
      case 'i':
        this.mode = 'insert';
        this.notify();
        return { newText, newCursor, handled: true };

      case 'a':
        this.mode = 'insert';
        newCursor = Math.min(text.length, newCursor + 1);
        this.cursorOffset = newCursor;
        this.notify();
        return { newText, newCursor, handled: true };

      case 'h': // Sol
        newCursor = Math.max(0, newCursor - 1);
        break;

      case 'l': // Sağ
        newCursor = Math.min(text.length, newCursor + 1);
        break;

      case 'w': { // Sonraki kelime
        const rest = text.slice(newCursor);
        const match = rest.match(/^\s*\S+\s*/);
        if (match) newCursor += match[0].length;
        else newCursor = text.length;
        break;
      }

      case 'b': { // Önceki kelime
        const prev = text.slice(0, newCursor);
        const match = prev.match(/\s*\S+\s*$/);
        if (match) newCursor = Math.max(0, newCursor - match[0].length);
        else newCursor = 0;
        break;
      }

      case '0': { // Satır başı
        const lineStart = text.lastIndexOf('\n', Math.max(0, newCursor - 1));
        newCursor = lineStart === -1 ? 0 : lineStart + 1;
        break;
      }

      case '$': { // Satır sonu
        const lineEnd = text.indexOf('\n', newCursor);
        newCursor = lineEnd === -1 ? text.length : lineEnd;
        break;
      }

      case 'x': { // Karakter sil
        if (newCursor < text.length) {
          newText = text.slice(0, newCursor) + text.slice(newCursor + 1);
        }
        break;
      }

      case 'v':
        this.mode = 'visual';
        this.notify();
        return { newText, newCursor, handled: true };

      default:
        return { newText, newCursor, handled: true };
    }

    this.cursorOffset = newCursor;
    this.notify();
    return { newText, newCursor, handled: true };
  }

  public setCursor(offset: number): void {
    this.cursorOffset = offset;
    this.notify();
  }
}

export const vimModeExtension = new VimModeExtension();
export default vimModeExtension;
