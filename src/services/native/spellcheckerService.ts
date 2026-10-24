/**
 * Spellchecker & Custom Dictionary Service
 * Phase 115: Yerel İmla Denetimi ve Edebi Sözlük
 */

export interface SpellCheckResult {
  word: string;
  isCorrect: boolean;
  suggestions: string[];
}

export class SpellcheckerService {
  private static customWords: Set<string> = new Set();

  static isElectron(): boolean {
    return typeof window !== 'undefined' && !!(window as any).electronBridge?.isDesktop;
  }

  static async checkWord(word: string): Promise<SpellCheckResult> {
    if (this.isElectron()) {
      try {
        return await (window as any).electronBridge.invoke('spellchecker:check-word', { word });
      } catch (err) {
        console.warn('[SpellcheckerService] IPC hata:', err);
      }
    }

    // Web Fallback
    const clean = (word || '').trim().toLowerCase();
    const isCustom = this.customWords.has(clean);
    return {
      word,
      isCorrect: isCustom || clean.length < 3,
      suggestions: isCustom ? [] : [clean + 'lar', clean + 'de'],
    };
  }

  static async addCustomWord(word: string): Promise<boolean> {
    const clean = (word || '').trim().toLowerCase();
    if (!clean) return false;

    this.customWords.add(clean);

    if (this.isElectron()) {
      try {
        await (window as any).electronBridge.invoke('spellchecker:add-word', { word: clean });
      } catch {
        // ignore
      }
    }
    return true;
  }

  static getCustomWords(): string[] {
    return Array.from(this.customWords);
  }
}
