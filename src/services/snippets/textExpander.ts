import { useSyncExternalStore } from 'react';

export interface SnippetItem {
  id: string;
  trigger: string; // e.g. ';eren' or '/bio'
  expansion: string; // e.g. 'Eren Yılmaz (32 yaşında, dedektif)'
  description: string;
  category: 'character' | 'world' | 'macro' | 'general';
  isBuiltIn?: boolean;
}

export interface MacroContext {
  docTitle?: string;
  author?: string;
  date?: string;
  time?: string;
}

const STORAGE_KEY = 'openscriv_text_snippets_data';

export const BUILTIN_SNIPPETS: SnippetItem[] = [
  {
    id: 'snip_date',
    trigger: ';tarih',
    expansion: '{date}',
    description: 'Güncel bugünün tarihini ekler.',
    category: 'macro',
    isBuiltIn: true
  },
  {
    id: 'snip_time',
    trigger: ';saat',
    expansion: '{time}',
    description: 'Güncel saati ekler.',
    category: 'macro',
    isBuiltIn: true
  },
  {
    id: 'snip_note',
    trigger: ';not',
    expansion: '📌 [YAZAR NOTU ({date}): ]',
    description: 'Tarihli yazar notu kutusu ekler.',
    category: 'macro',
    isBuiltIn: true
  },
  {
    id: 'snip_scene_break',
    trigger: ';bolum',
    expansion: '\n\n* * *\n\n',
    description: 'Standart edebi sahne sonu ayırıcısı (* * *).',
    category: 'general',
    isBuiltIn: true
  }
];

export const resolveMacros = (template: string, ctx?: MacroContext): string => {
  const now = new Date();
  const dateStr =
    ctx?.date ??
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
  const timeStr =
    ctx?.time ??
    `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const docTitleStr = ctx?.docTitle ?? 'Başlıksız Sahne';
  const authorStr = ctx?.author ?? 'Yazar';

  return template
    .replace(/{date}/g, dateStr)
    .replace(/{time}/g, timeStr)
    .replace(/{doc_title}/g, docTitleStr)
    .replace(/{author}/g, authorStr);
};

export class TextExpanderService {
  private snippets: SnippetItem[] = [];
  private cachedSnapshot: SnippetItem[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
    this.updateSnapshot();
  }

  private loadFromStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const userSnippets = JSON.parse(raw);
          if (Array.isArray(userSnippets)) {
            this.snippets = [...BUILTIN_SNIPPETS, ...userSnippets];
            return;
          }
        }
      }
    } catch {
      // Ignore
    }
    this.snippets = [...BUILTIN_SNIPPETS];
  }

  private saveToStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const userOnly = this.snippets.filter((s) => !s.isBuiltIn);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userOnly));
      }
    } catch {
      // Ignore
    }
    this.updateSnapshot();
    this.notify();
  }

  private updateSnapshot() {
    this.cachedSnapshot = [...this.snippets];
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  public getSnapshot = (): SnippetItem[] => {
    return this.cachedSnapshot;
  };

  public getState() {
    return {
      snippets: this.getSnapshot(),
      addSnippet: this.addSnippet.bind(this),
      updateSnippet: this.updateSnippet.bind(this),
      deleteSnippet: this.deleteSnippet.bind(this),
      expandText: this.expandText.bind(this),
      findMatchingSnippet: this.findMatchingSnippet.bind(this),
      exportToJson: this.exportToJson.bind(this),
      importFromJson: this.importFromJson.bind(this),
      resetToDefault: this.resetToDefault.bind(this)
    };
  }

  public addSnippet(snippet: Omit<SnippetItem, 'id' | 'isBuiltIn'>): SnippetItem {
    const trigger = snippet.trigger.trim();
    if (!trigger) throw new Error('Snippet kısayolu boş olamaz.');

    // Ensure trigger does not duplicate
    if (this.snippets.some((s) => s.trigger.toLowerCase() === trigger.toLowerCase())) {
      throw new Error(`'${trigger}' kısayolu zaten mevcut.`);
    }

    const newSnippet: SnippetItem = {
      ...snippet,
      id: `snip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      trigger,
      isBuiltIn: false
    };

    this.snippets.push(newSnippet);
    this.saveToStorage();
    return newSnippet;
  }

  public updateSnippet(id: string, partial: Partial<Omit<SnippetItem, 'id' | 'isBuiltIn'>>) {
    const idx = this.snippets.findIndex((s) => s.id === id);
    if (idx === -1) return;

    if (partial.trigger) {
      const newTrigger = partial.trigger.trim().toLowerCase();
      const duplicate = this.snippets.some(
        (s) => s.id !== id && s.trigger.toLowerCase() === newTrigger
      );
      if (duplicate) {
        throw new Error(`'${partial.trigger}' kısayolu başka bir snippet tarafından kullanılıyor.`);
      }
    }

    this.snippets[idx] = {
      ...this.snippets[idx],
      ...partial,
      trigger: partial.trigger ? partial.trigger.trim() : this.snippets[idx].trigger
    };

    this.saveToStorage();
  }

  public deleteSnippet(id: string): boolean {
    const initial = this.snippets.length;
    this.snippets = this.snippets.filter((s) => s.id !== id);
    const removed = this.snippets.length < initial;
    if (removed) this.saveToStorage();
    return removed;
  }

  /**
   * Checks if input text ends with any registered trigger.
   * If yes, returns the trigger, replacement text (macros resolved), and range info.
   */
  public findMatchingSnippet(
    textBuffer: string,
    ctx?: MacroContext
  ): { trigger: string; expandedText: string; startIndex: number } | null {
    if (!textBuffer) return null;

    for (const item of this.snippets) {
      if (textBuffer.endsWith(item.trigger)) {
        const expanded = resolveMacros(item.expansion, ctx);
        return {
          trigger: item.trigger,
          expandedText: expanded,
          startIndex: textBuffer.length - item.trigger.length
        };
      }
    }

    return null;
  }

  /**
   * Replaces all occurrences of triggers in a whole text block.
   */
  public expandText(content: string, ctx?: MacroContext): string {
    let result = content;
    for (const item of this.snippets) {
      if (result.includes(item.trigger)) {
        const expanded = resolveMacros(item.expansion, ctx);
        result = result.replaceAll(item.trigger, expanded);
      }
    }
    return result;
  }

  public exportToJson(): string {
    const userOnly = this.snippets.filter((s) => !s.isBuiltIn);
    return JSON.stringify(userOnly, null, 2);
  }

  public importFromJson(jsonString: string): number {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) return 0;
      let count = 0;
      for (const item of parsed) {
        if (item.trigger && item.expansion) {
          const trigger = item.trigger.trim();
          if (!this.snippets.some((s) => s.trigger.toLowerCase() === trigger.toLowerCase())) {
            this.snippets.push({
              id: `snip_imp_${Date.now()}_${count}`,
              trigger,
              expansion: item.expansion,
              description: item.description || '',
              category: item.category || 'general',
              isBuiltIn: false
            });
            count++;
          }
        }
      }
      if (count > 0) this.saveToStorage();
      return count;
    } catch {
      return 0;
    }
  }

  public resetToDefault() {
    this.snippets = [...BUILTIN_SNIPPETS];
    this.saveToStorage();
  }
}

export const textExpanderService = new TextExpanderService();

export function useSnippetStore() {
  const snippets = useSyncExternalStore(
    textExpanderService.subscribe,
    textExpanderService.getSnapshot,
    textExpanderService.getSnapshot
  );

  return {
    snippets,
    addSnippet: textExpanderService.addSnippet.bind(textExpanderService),
    updateSnippet: textExpanderService.updateSnippet.bind(textExpanderService),
    deleteSnippet: textExpanderService.deleteSnippet.bind(textExpanderService),
    expandText: textExpanderService.expandText.bind(textExpanderService),
    findMatchingSnippet: textExpanderService.findMatchingSnippet.bind(textExpanderService),
    exportToJson: textExpanderService.exportToJson.bind(textExpanderService),
    importFromJson: textExpanderService.importFromJson.bind(textExpanderService),
    resetToDefault: textExpanderService.resetToDefault.bind(textExpanderService)
  };
}

useSnippetStore.getState = () => textExpanderService.getState();
